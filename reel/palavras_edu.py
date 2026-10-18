import json
from faster_whisper import WhisperModel
m = WhisperModel("medium", device="cpu", compute_type="int8")
segs, info = m.transcribe("reel/edu.m4a", language="pt", word_timestamps=True, vad_filter=False, initial_prompt="Jornada, astrologia, mitologia e filosofia, jornada.eusouodu.com, Pix, Áries, trânsitos, Ascendente")
out = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump(out, open("reel/palavras_edu.json", "w"), ensure_ascii=False, indent=0)
print(len(out))
