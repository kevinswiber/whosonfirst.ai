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

The recording is heard by a speech recogniser, which says when each word
starts. Its words are matched to the film's own, in order, so a word it heard
wrongly still has a place. That finds each line. It does not say where a line
ends: a recogniser's time for the end of a word is early, before the last
sound of it and the breath after it. So between two lines the recording
itself is measured, and it is cut in the middle of the longest quiet there.
Nothing is said by this script, and nothing is changed in the recording but
where it is cut.

It needs `ffmpeg` on the path, and a Python with `faster-whisper`, which is
not part of this repository's own dependencies:

    ~/.venvs/kokoro/bin/pip install faster-whisper

The recogniser is fetched from Hugging Face the first time, about 150 MB.
"""
import json
import re
import subprocess
import sys
import wave
from difflib import SequenceMatcher

import numpy as np
from faster_whisper import WhisperModel

RATE = 48000
# How much of the quiet around a line is kept with it, at the most: a little
# before its first sound, and more after its last, where a breath goes.
BEFORE = 0.15
AFTER = 0.5
# A line fades in and out over this long, so that a cut is never heard.
FADE_IN = 0.008
FADE_OUT = 0.04


def plain(word: str) -> str:
    return re.sub(r"[^a-z0-9]", "", word.lower())


def samples(reading: str, rate: int) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", reading, "-ac", "1", "-ar", str(rate), "-f", "f32le", "-"],
        check=True,
        capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def heard(reading: str) -> list[dict]:
    """Each word the recogniser hears, with the seconds it starts and ends."""
    model = WhisperModel("base.en", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(samples(reading, 16000), language="en", word_timestamps=True)
    words = []
    for segment in segments:
        for word in segment.words or []:
            # one heard word can be two of ours: "first.ai" is "first dot AI"
            for part in re.findall(r"[A-Za-z0-9']+", word.word) or [word.word]:
                words.append({"text": part, "start": word.start, "end": word.end})
    return words


def loudness(audio: np.ndarray) -> np.ndarray:
    """How loud the recording is, every hundredth of a second."""
    frame = RATE // 100
    count = len(audio) // frame
    return np.sqrt(np.mean(audio[: count * frame].reshape(count, frame) ** 2, axis=1) + 1e-12)


def quiet(level: np.ndarray, speech: float, t0: float, t1: float) -> tuple[float, float]:
    """
    The longest quiet between seconds t0 and t1: when it starts and when it
    ends. Quiet is far under the level of speech. If nothing that quiet lasts
    a tenth of a second, what counts as quiet is raised until something does.
    """
    a, b = int(t0 * 100), max(int(t1 * 100), int(t0 * 100) + 1)
    part = level[a:b]
    limit = speech * 0.02
    best = (0, 0)
    while limit < speech * 0.4:
        start = None
        best = (0, 0)
        for i, under in enumerate(np.append(part < limit, False)):
            if under and start is None:
                start = i
            elif not under and start is not None:
                if i - start > best[1] - best[0]:
                    best = (start, i)
                start = None
        if best[1] - best[0] >= 10:
            break
        limit *= 1.5
    if best == (0, 0):
        middle = (t0 + t1) / 2
        return middle, middle
    return (a + best[0]) / 100, (a + best[1]) / 100


def main() -> None:
    job = json.load(open(sys.argv[1], encoding="utf-8"))
    said = heard(job["reading"])
    audio = samples(job["reading"], RATE)
    length = len(audio) / RATE
    level = loudness(audio)
    speech = float(np.percentile(level, 95))

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
            ours[a + k]["heard"] = True
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
    # The quiet between each line and the next. It is looked for from where
    # the line's last word starts, which a recogniser gets right, to a moment
    # into the next line's first word. Only a word that was heard as written
    # is trusted for this: one that was placed between its neighbours may be
    # placed in the quiet itself.
    def sure(words: list[dict], last: bool) -> float:
        order = reversed(words) if last else words
        return next((w for w in order if w.get("heard")), words[-1 if last else 0])["start"]

    gaps = [
        quiet(level, speech, sure(lines[i], True), sure(lines[i + 1], False) + 0.05)
        for i in range(len(lines) - 1)
    ]
    for i, (line, words) in enumerate(zip(job["lines"], lines)):
        # from the middle of the quiet before it, or a little before its
        # first sound if that is later
        if i:
            begin = max(sum(gaps[i - 1]) / 2, gaps[i - 1][1] - BEFORE)
        else:
            begin = max(0.0, words[0]["start"] - BEFORE - 0.1)
        # to the middle of the quiet after it, or a while after its last
        # sound if that is sooner
        if i + 1 < len(lines):
            end = min(sum(gaps[i]) / 2, gaps[i][0] + AFTER)
        else:
            end = length
        clip = audio[int(begin * RATE) : int(end * RATE)].copy()
        rise, fall = int(FADE_IN * RATE), int(FADE_OUT * RATE)
        clip[:rise] *= np.linspace(0, 1, rise)
        clip[-fall:] *= np.linspace(1, 0, fall)
        with wave.open(line["wav"], "wb") as out:
            out.setnchannels(1)
            out.setsampwidth(2)
            out.setframerate(RATE)
            out.writeframes((np.clip(clip, -1, 1) * 32767).astype("<i2").tobytes())
        with open(line["json"], "w", encoding="utf-8") as out:
            json.dump(
                {
                    "duration": len(clip) / RATE,
                    "words": [
                        {"text": w["text"], "start": max(0.0, w["start"] - begin)}
                        for w in words
                    ],
                },
                out,
            )
        pause = gaps[i][1] - gaps[i][0] if i + 1 < len(lines) else 0.0
        print(f"{begin:7.2f} {end - begin:5.2f}s  then {pause:4.2f}s of quiet  {line['text'][:58]}")
    print(f"{found} of {len(ours)} words were heard as written; the rest were placed between them.")


if __name__ == "__main__":
    main()
