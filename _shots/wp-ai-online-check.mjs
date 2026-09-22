// §74 线上验证：gallery 页包含 壁纸/AI生成 文件夹 + 图片可达
const BASE = 'https://cloudwing.pages.dev';
const probes = [
  { name: 'gallery page', url: BASE + '/gallery/', need: ['壁纸', 'AI生成'] },
];
let allOk = true;

for (const p of probes) {
  const res = await fetch(p.url);
  const html = await res.text();
  const found = p.need.map(k => [k, html.includes(k)]);
  console.log(`${p.name}: HTTP ${res.status}`);
  for (const [k, ok] of found) { console.log(`  contains "${k}": ${ok}`); if (!ok) allOk = false; }
  // 统计条目数（搜索页/数据层会带 shot 路径）
  const wpCount = (html.match(/shots\/wp\/wp-\d+\.webp/g) || []).length;
  const aiCount = (html.match(/shots\/ai\/ai-\d+\.webp/g) || []).length;
  console.log(`  wp refs: ${wpCount}, ai refs: ${aiCount}`);
}

// 探针图（每组最后一张）
for (const u of [BASE + '/shots/wp/wp-014.webp', BASE + '/shots/ai/ai-009.webp']) {
  const res = await fetch(u, { method: 'GET' });
  const buf = await res.arrayBuffer();
  const ok = res.status === 200 && buf.byteLength > 1000;
  console.log(`${u}: HTTP ${res.status}, ${buf.byteLength} bytes -> ${ok ? 'OK' : 'FAIL'}`);
  if (!ok) allOk = false;
}

console.log('ONLINE_CHECK=' + (allOk ? 'PASS' : 'FAIL'));
