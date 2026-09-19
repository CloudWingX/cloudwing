// 导航图标验收：堵住"卡片图标区域空着"这一类问题。
//
// 为什么需要它（2026-09-19）：首字圆牌原本兼作"图标加载失败的兜底"，
// 但它与真实图标**同时渲染**会导致两者重叠（有透明区域的 logo 会透出首字）。
// 已改为**互斥**：填了 `icon` 就完全不渲染首字。
// 代价是：**icon 路径写错 / 文件没提交 → 卡片图标区会空着**（以前会露出首字兜底）。
// 本脚本把这件事变成断言，让"路径与文件对不上"在上线前就红。
//
// 检查四件事：
//   A. src/site.ts 的 SITE_NAV 里每个 `icon` 路径，在 public/ 下**真实存在**
//   B. public/nav/ 里**没有未被子引用的孤儿文件**（防早期按完整 host 命名的旧副本残留）
//   C. 已构建时：dist/nav/ 里每个 icon 都存在，且 dist 的 /nav/ 页引用的集合与声明**完全一致**
//   D. 已构建时：带 --ico 的图标位**不含任何文本**（即首字确实没再渲染 → 不会重叠）
//
// 用法：
//   node scripts/verify-nav-icons.mjs          # 检查源码 + 已构建的 dist/
//   （没有 dist/ 时只做 A/B 两项）
// 退出码：0=全过 / 1=有失败 / 2=找不到 src/site.ts
//
// ⚠️ 与其它脚本不同，这个**不需要无头浏览器**（只读源码 / 文件系统 / dist 的 HTML），
//    因此它也能进 CI（和 verify-copy.mjs 一样）。
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = 'src/site.ts';
const PUB = 'public';
const DIST = 'dist';

if (!existsSync(SRC)) {
  console.error(`✗ 找不到 ${SRC} —— 请在仓库根目录运行`);
  process.exit(2);
}

/* ── 解析 SITE_NAV：只取 name / icon，够用且不依赖 TS 运行时 ── */
const src = readFileSync(SRC, 'utf8');
const navStart = src.indexOf('export const SITE_NAV');
const navBlock = navStart >= 0 ? src.slice(navStart, src.indexOf('\n];', navStart) + 3) : '';
if (!navBlock) {
  console.error('✗ 在 src/site.ts 里找不到 SITE_NAV 块');
  process.exit(2);
}

// 逐条目解析：每个 { ... } 对象里取 name 与可选 icon
const items = [];
const itemRe = /\{[^{}]*?name:\s*'([^']+)'[^{}]*?\}/g;
for (const m of navBlock.matchAll(itemRe)) {
  const body = m[0];
  const icon = body.match(/icon:\s*'([^']+)'/)?.[1] ?? null;
  items.push({ name: m[1], icon });
}
const withIcon = items.filter((it) => it.icon);
const fallback = items.filter((it) => !it.icon);

const results = [];
const check = (n, ok, d = '') => {
  results.push({ n, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`);
};

console.log(`=== 导航图标验收 ===`);
console.log(`条目 ${items.length} 个：带 icon ${withIcon.length} / 首字圆牌 ${fallback.length}` +
  (fallback.length ? `（${fallback.map((f) => f.name).join('、')}）` : '') + '\n');

/* ── A. 声明的 icon 必须真实存在 ── */
console.log('[A] 声明的图标路径在 public/ 下必须存在');
const missing = [];
for (const it of withIcon) {
  const fp = join(PUB, it.icon.replace(/^\//, ''));
  if (!existsSync(fp)) missing.push(`${it.icon}（${it.name}）`);
}
check(`全部 ${withIcon.length} 个 icon 路径都能解析到文件`, missing.length === 0, missing.slice(0, 6).join('、'));

// icon 必须落在 nav/ 下且是 .png/.svg（防手写路径混入其它目录）
const badPath = withIcon.filter((it) => !/^\/nav\/[\w.-]+\.(png|svg)$/i.test(it.icon)).map((it) => it.icon);
check('icon 路径形如 /nav/<slug>.png|svg', badPath.length === 0, badPath.slice(0, 6).join('、'));

/* ── B. public/nav/ 里不该有孤儿文件 ── */
console.log('\n[B] public/nav/ 不应残留未被引用的文件');
const navDir = join(PUB, 'nav');
if (existsSync(navDir)) {
  const used = new Set(withIcon.map((it) => it.icon.replace(/^\/nav\//, '')));
  const orphans = readdirSync(navDir).filter((f) => statSync(join(navDir, f)).isFile() && !used.has(f));
  check('没有孤儿图标文件（按完整 host 命名的旧副本等）', orphans.length === 0, orphans.join('、'));
} else {
  check('public/nav/ 存在', false, '目录不存在');
}

/* ── C/D. 已构建时的产物断言 ── */
if (existsSync(DIST)) {
  console.log('\n[C] dist/nav/ 产物与声明一致');
  const dNav = join(DIST, 'nav');
  const dFiles = existsSync(dNav) ? readdirSync(dNav).filter((f) => f !== 'index.html') : [];
  const want = withIcon.map((it) => it.icon.replace(/^\/nav\//, ''));
  const notInDist = want.filter((w) => !dFiles.includes(w));
  check('每个声明的图标都被拷进 dist/nav/', notInDist.length === 0, notInDist.join('、'));

  const pagePath = join(dNav, 'index.html');
  if (!existsSync(pagePath)) {
    check('dist/nav/index.html 存在', false);
  } else {
    const html = readFileSync(pagePath, 'utf8');
    // 属性里的引号被转义成 &quot;
    const refs = [...html.matchAll(/--ico:url\(&quot;([^&]+)&quot;\)/g)].map((m) => m[1]);
    const refSet = new Set(refs);
    const sameSet = refSet.size === new Set(want).size && [...refSet].every((r) => want.includes(r.replace(/^\/nav\//, '')));
    check(`页面引用集合与声明一致（${refs.length} 条引用 / ${withIcon.length} 条声明）`, sameSet,
      sameSet ? '' : `引用=${[...refSet].join('、')}`);
    check('页面条目总数与 SITE_NAV 一致', refs.length === withIcon.length, `${refs.length} vs ${withIcon.length}`);

    /* D. 带 --ico 的图标位里不能有文本（否则首字与图标重叠） */
    console.log('\n[D] 带图标的图标位必须是空的（不与首字圆牌重叠）');
    const spans = [...html.matchAll(/<span class="nvc-ico"[^>]*>([\s\S]*?)<\/span>/g)];
    const dirty = spans
      .map((m) => ({ m, inner: m[1].replace(/<[^>]*>/g, '').trim() }))
      .filter((s) => /--ico/.test(s.m[0]) && s.inner !== '');
    check('所有带 --ico 的图标位内无文本', dirty.length === 0,
      dirty.map((d) => JSON.stringify(d.inner)).slice(0, 6).join('、'));

    const letterSpans = spans
      .filter((m) => !/--ico/.test(m[0]))
      .map((m) => m[1].replace(/<[^>]*>/g, '').trim());
    check('未带 icon 的条目仍保留首字圆牌', letterSpans.length === fallback.length,
      `${letterSpans.length} 个：${letterSpans.join(' ')}`);
  }
} else {
  console.log('\n[C][D] 跳过：没有 dist/（先 npm run build）');
}

/* ── E. SVG 图标的"暗底可读性"下限 ──
   动机（HANDOFF §48.3）：换图标时抓到过一张**近黑的咖啡杯**当 yuushya 的 logo，
   在深色卡上几乎不可见 —— 当时是靠"亮度量化"才发现的。
   本站图标位底色是深色，所以"近黑 fill" = 等于没画。
   判据：SVG 里所有硬编码 fill 中**最亮的那个**，相对亮度必须 ≥ 0.12。
   （参考：既有的 apinebula 0.24 / deepseek 0.19；#181717 只有 0.0086 → 必红）
   ⚠️ 只查 .svg：PNG 需要解码像素才能算亮度（§48 的抓取脚本里有个一次性 DIB 解码器），
      这里不重复实现，留作已知盲区（PNG 的亮度靠换图时的深浅底对照截图核验）。 */
console.log('\n[E] SVG 图标在深色卡上必须可见（最亮 fill 的相对亮度 ≥ 0.12）');
const relLum = (r, g, b) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const dimIcons = [];
for (const it of withIcon.filter((i) => /\.svg$/i.test(i.icon))) {
  const s = readFileSync(join(PUB, it.icon.replace(/^\//, '')), 'utf8');
  const cols = [...s.matchAll(/fill="(#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3}))"/g)].map((m) => m[1]);
  if (!cols.length) { dimIcons.push(`${it.icon}（无硬编码 fill，用 currentColor → 跳过）`); continue; }
  const L = cols.map((c) => {
    let x = c.slice(1);
    if (x.length === 3) x = x.split('').map((ch) => ch + ch).join('');
    return relLum(parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16));
  });
  if (Math.max(...L) < 0.12) dimIcons.push(`${it.icon}（最亮 ${Math.max(...L).toFixed(4)}）`);
}
const dim = dimIcons.filter((d) => !d.includes('跳过'));
check('所有 SVG 图标都有足够亮的填充色', dim.length === 0, dim.join('、'));

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
if (failed.length) failed.forEach((f) => console.log('  ❌ ' + f.n));
process.exit(failed.length ? 1 : 0);
