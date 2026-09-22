# -*- coding: utf-8 -*-
# 一次性：黑暗之魂2 Steam 截图 (1920x1080 JPG) -> webp q80，编号 ds2-001..006
from PIL import Image
from pathlib import Path
from datetime import datetime

SRC = Path(r'D:/steam/userdata/1276179490/760/remote/335300/screenshots')
DST = Path(r'D:/deep seek workplace/endfield-blog/public/shots/ds2')
DST.mkdir(parents=True, exist_ok=True)

files = ['20250628173740_1.jpg', '20250629153418_1.jpg', '20250629153445_1.jpg',
         '20250629153458_1.jpg', '20250629153710_1.jpg', '20250629153955_1.jpg']
lines = []
for i, name in enumerate(files):
    p = SRC / name
    out = DST / ('ds2-%03d.webp' % (i + 1))
    im = Image.open(p).convert('RGB')
    im.save(str(out), 'WEBP', quality=80, method=6)
    mtime = datetime.fromtimestamp(p.stat().st_mtime)
    lines.append('%s|%s|%s' % (out.name, name, mtime.strftime('%Y-%m-%d')))
    print(out.name, '<-', name, (out.stat().st_size / 1024).toFixed(0) if False else round(out.stat().st_size / 1024), 'KB')

Path(r'D:/deep seek workplace/endfield-blog/_shots/ds2-transcode-map.txt').write_text(
    '\n'.join(lines), encoding='utf-8')
print('MAP_WRITTEN')
