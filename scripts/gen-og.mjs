// 生成社交分享图（OG image, 1200×630 PNG）：
//   public/og/default.png     ← public/og/default.svg（站点默认分享图）
//   public/og/<work-id>.png   ← 该作品 cover 指向的 SVG（每篇作品专属分享图）
//
// 用法：npm run og        （新增作品/换封面后跑一次）
// 依赖：sharp（Astro 已带）；<slug>.astro 会自动检测 /og/<id>.png 是否存在并回退默认图。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OG_DIR = path.join(ROOT, 'public/og');
const WORKS = path.join(ROOT, 'src/content/works');

const W = 1200;
const H = 630;

async function main() {
  fs.mkdirSync(OG_DIR, { recursive: true });
  let made = 0;

  // 1) 默认分享图
  const defSrc = path.join(OG_DIR, 'default.svg');
  if (fs.existsSync(defSrc)) {
    await sharp(defSrc, { density: 200 })
      .resize(W, H, { fit: 'fill' })
      .png({ quality: 90 })
      .toFile(path.join(OG_DIR, 'default.png'));
    console.log('✓ default.png');
    made++;
  } else {
    console.log('! 缺少 public/og/default.svg，跳过默认图');
  }

  // 2) 每篇作品（封面为 SVG 时生成专属分享图）
  for (const file of fs.readdirSync(WORKS).filter((f) => f.endsWith('.md'))) {
    const id = file.replace(/\.md$/, '');
    const text = fs.readFileSync(path.join(WORKS, file), 'utf8');
    const m = text.match(/^cover:\s*(\S+)\s*$/m);
    if (!m) continue;
    const coverRel = m[1].trim();
    const coverPath = path.join(ROOT, 'public', coverRel.replace(/^\//, ''));
    if (!fs.existsSync(coverPath)) {
      console.log(`- ${id}: 封面不存在（${coverRel}），跳过`);
      continue;
    }
    await sharp(coverPath, { density: 200 })
      .resize(W, H, { fit: 'cover', position: 'centre' })
      .png({ quality: 90 })
      .toFile(path.join(OG_DIR, `${id}.png`));
    console.log(`✓ ${id}.png  ← ${coverRel}`);
    made++;
  }

  console.log(`完成：生成 ${made} 张分享图`);
}

main().catch((e) => {
  console.error('生成失败：', e.message);
  process.exit(1);
});
