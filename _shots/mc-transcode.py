# -*- coding: utf-8 -*-
# 一次性：MC 截图 PNG(2560x1440) -> webp(1920 宽, q80)，编号接续 mc-041
# 用 Anaconda3 python 运行（托管 3.13 无 Pillow）
from PIL import Image
from pathlib import Path
from datetime import datetime

SRC = Path(r'F:/MC/.minecraft/versions/乌托邦探险之旅/screenshots')
DST = Path(r'D:/deep seek workplace/endfield-blog/public/shots/mc')
START = 41

files = sorted(p for p in SRC.iterdir() if p.suffix.lower() == '.png')
print('total', len(files))
lines = []
for i, p in enumerate(files):
    out = DST / ('mc-%03d.webp' % (START + i))
    im = Image.open(p).convert('RGB')
    w, h = im.size
    if w > 1920:
        im = im.resize((1920, round(h * 1920 / w)), Image.LANCZOS)
    im.save(str(out), 'WEBP', quality=80, method=6)
    mtime = datetime.fromtimestamp(p.stat().st_mtime)
    lines.append('%s|%s|%s' % (out.name, p.name, mtime.strftime('%Y-%m-%d')))
    print(out.name, '<-', p.name, mtime.strftime('%Y-%m-%d'))

Path(r'D:/deep seek workplace/endfield-blog/_shots/mc-transcode-map.txt').write_text(
    '\n'.join(lines), encoding='utf-8')
print('MAP_WRITTEN')
