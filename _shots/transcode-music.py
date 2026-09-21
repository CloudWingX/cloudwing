# transcode-music.py — FLAC → 320kbps MP3（保留元数据）+ 提取专辑封面
import os, subprocess, json

FF = r"C:\Users\24645\.workbuddy\binaries\python\envs\default\Lib\site-packages\static_ffmpeg\bin\win32\ffmpeg.exe"
SRC = r"D:\Download\music"
OUT = r"D:\deep seek workplace\endfield-blog\public\music"
COV = os.path.join(OUT, "covers")
os.makedirs(OUT, exist_ok=True)
os.makedirs(COV, exist_ok=True)

# (源文件, 输出 id, 标题, 艺术家, 专辑)
TRACKS = [
    ("Evolution Era - 日本群星.flac", "evolution-era", "Evolution Era", "V.K克", "『Deemo』Song Collection"),
    ("Into the Sky _modv_ - SawanoHiroyuki[nZk]、Tielle.flac", "into-the-sky", "Into the Sky <MODv>", "SawanoHiroyuki[nZk]", "Avid / Hands Up to the Sky"),
    ("Wings of Piano - 日本群星.flac", "wings-of-piano", "Wings of Piano", "V.K克", "『Deemo』Song Collection"),
    ("星が瞬くこんな夜に (ゲームVer.) - supercell.flac", "starry-night", "星が瞬くこんな夜に", "supercell", "魔法使いの夜 オリジナルサウンドトラック"),
]

report = []
for src_name, sid, title, artist, album in TRACKS:
    src = os.path.join(SRC, src_name)
    dst = os.path.join(OUT, sid + ".mp3")
    # 320kbps MP3，保留源元数据并强制规范化 title/artist/album
    r = subprocess.run([
        FF, "-y", "-i", src,
        "-map", "0:a", "-codec:a", "libmp3lame", "-b:a", "320k",
        "-id3v2_version", "3",
        "-metadata", "title=" + title,
        "-metadata", "artist=" + artist,
        "-metadata", "album=" + album,
        dst,
    ], capture_output=True, text=True, encoding="utf-8", errors="replace")
    mp3_ok = r.returncode == 0 and os.path.exists(dst)
    mp3_mb = round(os.path.getsize(dst) / 1048576, 2) if mp3_ok else 0

    # 提取封面（FLAC 内嵌 picture → jpg）
    cov = os.path.join(COV, sid + ".jpg")
    r2 = subprocess.run([
        FF, "-y", "-i", src, "-an", "-map", "0:v:0", "-frames:v", "1",
        "-q:v", "3", cov,
    ], capture_output=True, text=True, encoding="utf-8", errors="replace")
    cov_ok = r2.returncode == 0 and os.path.exists(cov)
    cov_kb = round(os.path.getsize(cov) / 1024) if cov_ok else 0
    if not cov_ok and os.path.exists(cov):
        os.remove(cov)

    report.append({"id": sid, "mp3_ok": mp3_ok, "mp3_mb": mp3_mb, "cover_ok": cov_ok, "cover_kb": cov_kb})
    print(sid + " mp3=" + str(mp3_ok) + " " + str(mp3_mb) + "MB cover=" + str(cov_ok) + " " + str(cov_kb) + "KB")

with open(r"D:\deep seek workplace\endfield-blog\_shots\transcode-report.json", "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=2)
print("DONE")
