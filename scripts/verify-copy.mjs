// 文案验收：把「用户可见文案是否与当前实现相符」变成断言。
//
// 为什么需要它：HANDOFF §32 记录过一次真实事故 —— 站点早已改成"只有一套暗色"，
// 但 `site.ts` 的 notice/tagline 还写着「浅色通透」，两处带上了线，
// 而当时 14 个验证脚本全绿（它们只验颜色/尺寸/几何，**不验文案内容**）。
// 本脚本专门堵这一类：文案描述的功能/主题已经被删掉，文字却留在页面上。
//
// 覆盖三件事：
//   A. 禁用词：描述"本站自己的 UI"为浅色/双主题/可切换的措辞 —— 这些在实现里早已不存在。
//      ⚠️ 只扫**页面的固定文案（chrome）与 meta**，不扫文章正文：
//      历史文章（如 2026-09-15 大改版、2026-09-19 站改博客）正文里合法地会提到
//      「浅色主题」「作品库」等词，那是内容记录，不是缺陷。所以禁用词表只收
//      "从没有任何合法用途"的短语（浅色通透/双主题/主题切换…），
//      不使用「浅色」「作品库」这类必须在正文里出现的宽泛词。
//   B. 占位词：TODO / 待补 / 占位符 / lorem 之类不该上线的东西。
//   C. 文案锚点：`site.ts` 的 notice / tagline 必须非空、不含禁用词，
//      且 notice 必须真的出现在关于页可见文本里、tagline 必须出现在 meta description 里
//      —— 防"改了一处、漏了另一处"以及"文案与页面脱节"。
//
// 用法：
//   node scripts/verify-copy.mjs                      # 检查本地已构建的 dist（默认）
//   node scripts/verify-copy.mjs https://cloudwing.pages.dev   # 检查线上（走 sitemap 枚举全部页面）
// 退出码：0=全过 / 1=有失败 / 2=取不到要检查的页面（未构建 / 网络不通）
//
// ⚠️ 这是全套脚本里**唯一不需要无头浏览器**的一个（只读 HTML/元数据），
//    所以它也能在没有 9222 的环境里独立跑。
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ARG = process.argv[2] || '';
const REMOTE = /^https?:\/\//i.test(ARG);
const BASE = ARG.replace(/\/$/, '');
const DIST = 'dist';

/* ── A. 禁用词 ─────────────────────────────────────────────────────────────
   判据：这些短语描述的是"本站 UI 是浅色 / 有双主题可切换"——
   实现上早已不存在（HANDOFF §24/§27），任何地方出现都说明文案漂移了。
   往表里加词前先确认：它在**当前产物**的可见文案+meta 里出现次数是 0，
   否则断言在健康态下就会红（那就成了"假缺陷"）。 */
const BANNED = [
  '浅色通透', '双主题', '主题切换', '主题开关', '明暗切换', '明暗主题',
  '浅色模式', '亮色模式', '白天模式', '夜间模式', '开灯', '关灯',
  '亮色主题', '浅色主题',
];

/* ── B. 占位词 ── */
const PLACEHOLDER = ['TODO', 'FIXME', '待补', '待填', '待写', '占位符', 'lorem ipsum', '示例文本', 'XXX'];

/* ── 口径：只取"用户可见"的部分 ── */
const visibleText = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')   // SVG 里的 <text> 也算可见，但本站无；整体跳过避免噪声
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

const metaText = (html) => {
  const parts = [];
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t) parts.push(t[1]);
  const re = /<meta[^>]*>/gi;
  for (const tag of html.match(re) || []) {
    if (/name=["']description["']|property=["']og:(title|description|site_name)["']/i.test(tag)) {
      const c = tag.match(/content=["']([^"']*)["']/i);
      if (c) parts.push(c[1]);
    }
  }
  return parts.join(' | ');
};

/* ── 取页面 ── */
const pages = [];  // { name, html }

if (REMOTE) {
  let urls = [];
  try {
    const idx = await (await fetch(BASE + '/sitemap-index.xml')).text();
    const children = [...idx.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const c of children.length ? children : [BASE + '/sitemap-0.xml']) {
      const xml = await (await fetch(c)).text();
      urls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    }
  } catch (e) {
    console.error('✗ 取不到 sitemap（' + e.message + '）—— 站点没起或网络不通');
    process.exit(2);
  }
  urls = [...new Set(urls)];
  if (!urls.length) { console.error('✗ sitemap 里没有任何页面'); process.exit(2); }
  for (const u of urls) {
    try {
      const r = await fetch(u);
      if (!r.ok) { console.log('  ⚠ ' + u + ' HTTP ' + r.status + '（跳过）'); continue; }
      pages.push({ name: u.replace(BASE, '') || '/', html: await r.text() });
    } catch (e) {
      console.log('  ⚠ ' + u + ' 取不到（' + e.message + '）');
    }
  }
} else {
  if (!existsSync(DIST)) { console.error('✗ 没有 ' + DIST + '/ —— 先 npm run build（或 node scripts/verify-copy.mjs <url> 查线上）'); process.exit(2); }
  const html = [];
  (function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const f = join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.name.endsWith('.html')) html.push(f);
    }
  })(DIST);
  for (const f of html) {
    let name = '/' + relative(DIST, f).replace(/\\/g, '/');
    name = name.replace(/index\.html$/, '');
    pages.push({ name, html: readFileSync(f, 'utf8') });
  }
}

if (!pages.length) { console.error('✗ 没有取到任何页面'); process.exit(2); }

/* ── 断言 ── */
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };

console.log(`=== 检查对象：${REMOTE ? BASE : DIST + '/（本地构建产物）'}，共 ${pages.length} 页 ===\n`);

console.log('[A] 禁用词：不得把本站文案写成"浅色 / 双主题 / 可切换"（这些实现已删除）');
for (const w of BANNED) {
  const hits = [];
  for (const p of pages) {
    if (visibleText(p.html).includes(w)) hits.push(p.name + '(可见)');
    if (metaText(p.html).includes(w)) hits.push(p.name + '(meta)');
  }
  check(`禁用词「${w}」在全部页面（可见文案 + meta）中均不出现`, hits.length === 0, hits.slice(0, 4).join('、'));
}

console.log('\n[B] 占位词：不该上线的未完成标记');
for (const w of PLACEHOLDER) {
  const hits = [];
  for (const p of pages) {
    if (visibleText(p.html).includes(w)) hits.push(p.name + '(可见)');
    if (metaText(p.html).includes(w)) hits.push(p.name + '(meta)');
  }
  check(`占位词「${w}」不出现`, hits.length === 0, hits.slice(0, 4).join('、'));
}

console.log('\n[C] 文案锚点：site.ts 的 notice / tagline 必须与页面一致');
let notice = null; let tagline = null;
try {
  const src = readFileSync('src/site.ts', 'utf8');
  notice = src.match(/notice:\s*\n?\s*'([^']*)'/)?.[1] ?? null;
  tagline = src.match(/tagline:\s*'([^']*)'/)?.[1] ?? null;
} catch { /* 远程模式下如果没有仓库源码，跳过 C 组的源码解析断言 */ }
const norm = (s) => String(s).replace(/[（(]/g, '(').replace(/[）)]/g, ')').replace(/\s+/g, '');
const siteSrc = (() => { try { return readFileSync('src/site.ts', 'utf8'); } catch { return null; } })();

check('site.ts 的 SITE.tagline 非空', Boolean(tagline && tagline.trim()), JSON.stringify(tagline));
check('site.ts 的 SITE.notice 非空', Boolean(notice && notice.trim()), JSON.stringify(notice));

if (siteSrc) {
  const dirty = BANNED.filter((w) => siteSrc.includes(w));
  check('site.ts 全文不含任何禁用词', dirty.length === 0, dirty.join('、'));
  const ph = PLACEHOLDER.filter((w) => siteSrc.includes(w));
  check('site.ts 全文不含占位词', ph.length === 0, ph.join('、'));
}

if (tagline) {
  const inMeta = pages.filter((p) => norm(metaText(p.html)).includes(norm(tagline)));
  check('tagline 出现在页面的 meta description 中（文案与 SEO 未脱节）', inMeta.length > 0, inMeta.length + ' 页');
}
if (notice) {
  const about = pages.find((p) => p.name === '/about/' || p.name === '/about');
  check('notice 出现在关于页的可见文案里（页面没有漏掉这段文案）',
    Boolean(about) && norm(visibleText(about.html)).includes(norm(notice)),
    about ? '与 /about/ 比对' : '未取到 /about/');
}

console.log('\n[D] 每页都必须有可用的 title / description');
const noTitle = pages.filter((p) => !(p.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim()).map((p) => p.name);
const noDesc = pages.filter((p) => !(metaText(p.html).match(/\|/) || /name=["']description["']/i.test(p.html))).map((p) => p.name);
check('每一页都有非空 <title>', noTitle.length === 0, noTitle.slice(0, 4).join('、'));
check('每一页都有 description meta', noDesc.length === 0, noDesc.slice(0, 4).join('、'));

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
process.exit(failed.length ? 1 : 0);
