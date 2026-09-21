# probe-music-meta.py — 读取四首 FLAC 的时长/标题/艺术家/专辑/歌词 tag
import json, subprocess, os

FFPROBE = r"C:\Users\24645\.workbuddy\binaries\python\envs\default\Lib\site-packages\static_ffmpeg\bin\win32\ffprobe.exe"
SRC = r"D:\Download\music"
OUT = r"D:\deep seek workplace\endfield-blog\_shots\music-meta.json"

rows = []
for name in sorted(os.listdir(SRC)):
    if not name.lower().endswith(".flac"):
        continue
    full = os.path.join(SRC, name)
    p = subprocess.run(
        [FFPROBE, "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", full],
        capture_output=True, text=True, encoding="utf-8", errors="replace")
    d = json.loads(p.stdout or "{}")
    fmt = d.get("format", {})
    tags = fmt.get("tags", {}) or {}
    # 流级 tags 也可能有歌词
    for st in d.get("streams", []):
        for k, v in (st.get("tags") or {}).items():
            tags.setdefault(k, v)
    lyric_keys = [k for k in tags if "lyric" in k.lower()]
    rows.append({
        "file": name,
        "size_mb": round(float(fmt.get("size", 0) or 0) / 1048576, 2),
        "duration_sec": round(float(fmt.get("duration", 0) or 0), 1),
        "bitrate_kbps": round(int(fmt.get("bit_rate", 0) or 0) / 1000),
        "title": tags.get("TITLE") or tags.get("title"),
        "artist": tags.get("ARTIST") or tags.get("artist"),
        "album": tags.get("ALBUM") or tags.get("album"),
        "date": tags.get("DATE") or tags.get("date"),
        "has_lyrics_tag": bool(lyric_keys),
        "lyrics_tag_keys": lyric_keys,
        "lyrics_preview": (tags[lyric_keys[0]][:120] if lyric_keys else None),
    })

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(rows, f, ensure_ascii=False, indent=2)
print("WROTE " + OUT + " rows=" + str(len(rows)))
