#!/usr/bin/env python3
"""
Says a film's lines with Kokoro, an open text-to-speech model that runs on a
processor, and says when each word starts.

    python scripts/film-voice.py lines.json

`lines.json` is a list of {"text": ..., "wav": ..., "json": ...}. Each line is
written to its `wav`, at 24 kHz, and its length and the second each word
starts to its `json`. scripts/flow-film.mjs writes the list and reads the
answers: it is not run by hand.

It needs a Python with `kokoro` and `soundfile` installed, which is not part
of this repository's own dependencies:

    python3.12 -m venv ~/.venvs/kokoro
    ~/.venvs/kokoro/bin/pip install --index-url https://download.pytorch.org/whl/cpu torch
    ~/.venvs/kokoro/bin/pip install "kokoro>=0.9.4" soundfile

The model and its voices are fetched from Hugging Face the first time, about
350 MB. Both are under Apache-2.0: https://huggingface.co/hexgrad/Kokoro-82M
"""
import json
import sys

import numpy as np
import soundfile as sf
from kokoro import KPipeline

RATE = 24000


def main() -> None:
    job = json.load(open(sys.argv[1], encoding="utf-8"))
    pipeline = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
    for line in job["lines"]:
        chunks, words, offset = [], [], 0.0
        for part in pipeline(line["text"], voice=job["voice"], speed=job["speed"]):
            audio = np.asarray(part.audio)
            for token in part.tokens or []:
                if token.start_ts is not None:
                    words.append({"text": token.text, "start": round(offset + token.start_ts, 3)})
            chunks.append(audio)
            offset += len(audio) / RATE
        audio = np.concatenate(chunks)
        sf.write(line["wav"], audio, RATE)
        with open(line["json"], "w", encoding="utf-8") as out:
            json.dump({"duration": round(len(audio) / RATE, 3), "words": words}, out)
        print(f'{len(audio) / RATE:5.1f}s  {line["text"]}', file=sys.stderr)


main()
