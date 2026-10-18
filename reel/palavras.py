import json
from faster_whisper import WhisperModel
m = WhisperModel("small", device="cpu", compute_type="int8")
segs, info = m.transcribe("reel/narracao.mp3", language="pt", word_timestamps=True, vad_filter=False)
out = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump(out, open("reel/palavras.json", "w"), ensure_ascii=False, indent=0)
print(len(out), "palavras")
