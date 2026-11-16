#!/usr/bin/env python3
"""
Takes one recording of a whole film's narration, by a person or by a voice
made somewhere else, and cuts it into the film's lines, saying when each word
of each line starts.

    python scripts/film-voice-import.py job.json

`job.json` is {"reading": ..., "lines": [{"text": ..., "wav": ..., "json": ...}]}:
the recording, and the film's lines in the order they are said. Each line is
written to its `wav`, and its length and the second each word starts to its
`json`, as scripts/film-voice.py does for Kokoro. scripts/flow-film.mjs
writes the job and reads the answers: it is not run by hand.

The recording is heard by a speech recogniser, which says when each word was
said. Its words are matched to the film's own, in order, so a word it heard
wrongly still has a place, and a line is cut in the quiet on either side of
it. Nothing is said by this script, and nothing is changed in the recording
but where it is cut.

It needs `ffmpeg` on the path, and a Python with `faster-whisper`, which is
not part of this repository's own dependencies:

    ~/.venvs/kokoro/bin/pip install faster-whisper

The recogniser is fetched from Hugging Face the first time, about 150 MB.
"""
import json
import re
import subprocess
import sys
from difflib import SequenceMatcher

import numpy as np
from faster_whisper import WhisperModel

# How much of the quiet before and after a line is kept with it.
BEFORE = 0.12
AFTER = 0.3


def plain(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())


def heard(reading: str) -> tuple[list[dict], float]:
    """Each word the recogniser hears, with the seconds it starts and ends, and how long the recording is."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", reading, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
        check=True,
        capture_output=True,
    ).stdout
    audio = np.frombuffer(raw, dtype=np.float32)
    model = WhisperModel("base.en", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(audio, language="en", word_timestamps=True)
    words = []
    for segment in segments:
        for word in segment.words or []:
            # one heard word can be two of ours: "first.ai" is "first dot AI"
            for part in re.findall(r"[A-Za-z0-9']+", word.word) or [word.word]:
                words.append({"text": part, "start": word.start, "end": word.end})
    return words, len(audio) / 16000


def main() -> None:
    job = json.load(open(sys.argv[1], encoding="utf-8"))
    said, length = heard(job["reading"])

    # the film's own words, in order, each knowing its line
    ours = [
        {"line": i, "text": word}
        for i, line in enumerate(job["lines"])
        for word in line["text"].split()
    ]
    match = SequenceMatcher(
        None,
        [plain(w["text"]) for w in ours],
        [plain(w["text"]) for w in said],
        autojunk=False,
    )
    for a, b, size in match.get_matching_blocks():
        for k in range(size):
            ours[a + k]["start"] = said[b + k]["start"]
            ours[a + k]["end"] = said[b + k]["end"]
    found = sum(1 for w in ours if "start" in w)

    # a word that was not matched is put evenly between its neighbours that were
    known = [i for i, w in enumerate(ours) if "start" in w]
    if not known:
        sys.exit("None of the film's words were heard in the recording.")
    for i, word in enumerate(ours):
        if "start" in word:
            continue
        before = max((k for k in known if k < i), default=None)
        after = min((k for k in known if k > i), default=None)
        t0 = ours[before]["end"] if before is not None else 0.0
        t1 = ours[after]["start"] if after is not None else length
        gap = (after if after is not None else len(ours)) - (before if before is not None else -1)
        step = (t1 - t0) / gap
        offset = i - (before if before is not None else -1)
        word["start"] = t0 + step * (offset - 0.5)
        word["end"] = word["start"] + step * 0.5

    lines = [[w for w in ours if w["line"] == i] for i in range(len(job["lines"]))]
    for i, (line, words) in enumerate(zip(job["lines"], lines)):
        first, last = words[0]["start"], words[-1]["end"]
        # a line is cut no further than half way to the lines on either side
        earliest = (lines[i - 1][-1]["end"] + first) / 2 if i else 0.0
        latest = (last + lines[i + 1][0]["start"]) / 2 if i + 1 < len(lines) else length
        begin = max(earliest, first - BEFORE)
        end = min(latest, last + AFTER)
        subprocess.run(
            [
                "ffmpeg", "-v", "error", "-y",
                "-ss", f"{begin:.3f}", "-to", f"{end:.3f}", "-i", job["reading"],
                "-ac", "1", "-ar", "48000", line["wav"],
            ],
            check=True,
        )
        with open(line["json"], "w", encoding="utf-8") as out:
            json.dump(
                {
                    "duration": end - begin,
                    "words": [
                        {"text": w["text"], "start": max(0.0, w["start"] - begin)}
                        for w in words
                    ],
                },
                out,
            )
        print(f"{begin:7.2f} {end - begin:5.2f}s  {line['text'][:70]}")
    print(f"{found} of {len(ours)} words were heard as written; the rest were placed between them.")


if __name__ == "__main__":
    main()
