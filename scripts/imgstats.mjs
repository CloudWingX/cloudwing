// 图片亮度取证：读 PNG，输出亮度分位数 / 直方图 / 过曝占比，用来判断"刺眼"。
// 用法：node scripts/imgstats.mjs <a.png> [b.png ...]
// 依赖本地 node_modules/sharp（项目已有）。
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('用法：node scripts/imgstats.mjs <图片...>');
  process.exit(2);
}

const hex = (r, g, b) => '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

for (const f of files) {
  let buf;
  try { buf = readFileSync(f); } catch { console.error(`✗ 读不到 ${f}`); continue; }
  const img = sharp(buf);
  const meta = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const total = info.width * info.height;

  const lum = new Float64Array(total);
  let sr = 0, sg = 0, sb = 0;
  const hist = new Array(16).fill(0);
  let over = 0, under = 0;
  for (let i = 0, p = 0; i < data.length; i += ch, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    sr += r; sg += g; sb += b;
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    lum[p] = l;
    hist[Math.min(15, Math.floor(l * 16))]++;
    if (l >= 0.98) over++;
    if (l <= 0.04) under++;
  }
  const sorted = Float64Array.from(lum).sort();
  const pct = (q) => sorted[Math.min(total - 1, Math.floor(q * total))];
  const mean = sorted.reduce((a, b) => a + b, 0) / total;

  console.log(`\n=== ${f} ===`);
  console.log(`  尺寸 ${info.width}×${info.height}  平均 rgb(${(sr / total) | 0},${(sg / total) | 0},${(sb / total) | 0}) ${hex((sr / total) | 0, (sg / total) | 0, (sb / total) | 0)}`);
  console.log(`  亮度 均值=${mean.toFixed(3)}  p05=${pct(0.05).toFixed(3)} p50=${pct(0.5).toFixed(3)} p95=${pct(0.95).toFixed(3)} p99=${pct(0.99).toFixed(3)}`);
  console.log(`  过曝(亮度≥0.98)=${(over / total * 100).toFixed(1)}%   近黑(≤0.04)=${(under / total * 100).toFixed(2)}%`);
  const bars = hist.map((c, i) => `    ${(i / 16).toFixed(2)}-${((i + 1) / 16).toFixed(2)}  ${String((c / total * 100).toFixed(1)).padStart(5)}%  ${'█'.repeat(Math.round(c / total * 60))}`).join('\n');
  console.log(bars);
}
