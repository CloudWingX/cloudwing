# -*- coding: utf-8 -*-
# 一次性：两个新图集入库
#   壁纸  <- D:/Download/WeiXin            (wp-001..N, 竖图为主, 长边<=1920)
#   AI生成 <- D:/Download/Chatgpt Stickers (ai-001..N, ~390px 方形 PNG, 保留 alpha)
# aspect 取 |w/h - 枚举比| 最小者（竖图自然落 1:1）
from PIL import Image
from pathlib import Path
from datetime import datetime

JOBS = [
    ('壁纸',   'wp', Path(r'D:/Download/WeiXin'),
     Path(r'D:/deep seek workplace/endfield-blog/public/shots/wp')),
    ('AI生成', 'ai', Path(r'D:/Download/Chatgpt Stickers'),
     Path(r'D:/deep seek workplace/endfield-blog/public/shots/ai')),
]
RATIOS = [('16:9', 16/9), ('4:3', 4/3), ('3:2', 3/2), ('1:1', 1.0)]
report = []

for game, prefix, src, dst in JOBS:
    dst.mkdir(parents=True, exist_ok=True)
    files = sorted(p for p in src.iterdir()
                   if p.is_file() and p.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp'))
    for i, p in enumerate(files):
        out = dst / ('%s-%03d.webp' % (prefix, i + 1))
        im = Image.open(p)
        has_alpha = im.mode in ('RGBA', 'LA', 'P')
        im = im.convert('RGBA' if has_alpha else 'RGB')
        w, h = im.size
        long_edge = max(w, h)
        if long_edge > 1920:
            if w >= h:
                im = im.resize((1920, round(h * 1920 / w)), Image.LANCZOS)
            else:
                im = im.resize((round(w * 1920 / h), 1920), Image.LANCZOS)
            w, h = im.size
        im.save(str(out), 'WEBP', quality=80, method=6)
        ratio = w / h
        aspect = min(RATIOS, key=lambda r: abs(ratio - r[1]))[0]
        mtime = datetime.fromtimestamp(p.stat().st_mtime)
        report.append((game, out.name, p.name, mtime.strftime('%Y-%m-%d'), aspect,
                       '%dx%d' % (w, h), round(out.stat().st_size / 1024)))
        print(out.name, '<-', p.name[:20], '%dx%d' % (w, h), aspect,
              str(round(out.stat().st_size / 1024)) + 'KB')

Path(r'D:/deep seek workplace/endfield-blog/_shots/wp-ai-map.txt').write_text(
    '\n'.join('|'.join(map(str, r)) for r in report), encoding='utf-8')
print('MAP_WRITTEN', len(report), 'items')
