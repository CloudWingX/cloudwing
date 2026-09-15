import sharp from 'sharp';
const files = process.argv.slice(2);
for (const f of files) {
  const { data, info } = await sharp(f).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const at = (x, y) => { const i = (y * info.width + x) * ch; return [data[i], data[i + 1], data[i + 2]]; };
  const fmt = (p) => `rgb(${p.join(',')})`;
  console.log(`\n${f}`);
  console.log(`  四角/中心采样：`);
  for (const [label, x, y] of [['左上(2,2)', 2, 2], ['右上', info.width - 3, 2], ['左下', 2, info.height - 3], ['右下', info.width - 3, info.height - 3], ['中心', info.width >> 1, info.height >> 1], ['左中(边缘留白)', 8, info.height >> 1]]) {
    console.log(`    ${label.padEnd(18)} ${fmt(at(x, y))}`);
  }
}
