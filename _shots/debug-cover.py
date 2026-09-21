# debug-cover.py — 排查 FLAC 内嵌封面提取失败原因
import subprocess, json, os

FFPROBE = r"C:\Users\24645\.workbuddy\binaries\python\envs\default\Lib\site-packages\static_ffmpeg\bin\win32\ffprobe.exe"
FF = r"C:\Users\24645\.workbuddy\binaries\python\envs\default\Lib\site-packages\static_ffmpeg\bin\win32\ffmpeg.exe"
SRC = r"D:\Download\music"
OUT = r"D:\deep seek workplace\endfield-blog\_shots"
LOG = os.path.join(OUT, "cover-debug.log")

lines = []
src = os.path.join(SRC, "Evolution Era - 日本群星.flac")

# 1) 流布局
p = subprocess.run([FFPROBE, "-v", "quiet", "-print_format", "json", "-show_streams", src],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
info = json.loads(p.stdout or "{}")
for s in info.get("streams", []):
    lines.append(f"stream idx={s.get('index')} type={s.get('codec_type')} codec={s.get('codec_name')} dispositions={list(k for k,v in (s.get('disposition') or {}).items() if v)}")

# 2) 直接跑提取命令并抓 stderr
cov = os.path.join(OUT, "cover-test.jpg")
r = subprocess.run([FF, "-y", "-i", src, "-an", "-map", "0:v:0", "-frames:v", "1", "-q:v", "3", cov],
                   capture_output=True, text=True, encoding="utf-8", errors="replace")
lines.append(f"extract returncode={r.returncode} exists={os.path.exists(cov)}")
tail = (r.stderr or "").strip().splitlines()[-15:]
lines.extend("STDERR| " + l for l in tail)

with open(LOG, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print("WROTE", LOG)
