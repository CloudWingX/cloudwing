// 首页重构验收：四层结构、图片策略、防 CLS、SEO（title/description）、移动端。
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const p = new Map(); const errs = [];
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push((((m.params.exceptionDetails.exception || {}).description) || '').slice(0, 90));
  if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
};
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };
const waitFor = async (x, ms = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(400); } return false; };

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await s('Page.navigate', { url: BASE + '/' });
await waitFor(`!!document.querySelector('.hero-title')`);
await sleep(2500);

console.log('=== ① Hero（2026-09-18 照 reference 复刻；细测见 verify-hero.mjs）===');
const hero = await ev(`(()=>{const t=s=>document.querySelector(s);
  const prune=(s)=>String(s||'').replace(/[\\s\\u00A0]+/g,' ').trim();
  return {
    标题:prune(t('.hero-title')?.textContent),
    副标题:prune(t('.hero-subtitle')?.textContent),
    徽标:prune(t('.hero-badge')?.textContent),
    统计:document.querySelectorAll('.feature-item').length,
    标签:document.querySelectorAll('.component-tags .tag').length,
    卡片:!!t('.code-card'),
    渐变行:!!t('.ht-l2'),
    旧结构:document.querySelectorAll('.hero-eyebrow,.hero-inner,.hero-cta,.ht-line,.stroke-text__svg,.typed-hero').length};})()`);
console.log('  ' + JSON.stringify(hero));
check('Hero 版式四块齐全（徽标/标题/统计/标签）',
  hero.徽标.length > 0 && hero.标题.length > 4 && hero.统计 === 2 && hero.标签 >= 4,
  `${hero.统计} 统计 / ${hero.标签} 标签`);
check('副标题文案正确', hero.副标题 === '记录我的学习，折腾和胡思乱想', hero.副标题);
check('标题第二行走渐变', hero.渐变行 === true);
check('右侧展示卡片存在（参考的 code-card 位）', hero.卡片 === true);
check('旧 Hero 结构已清干净', hero.旧结构 === 0, String(hero.旧结构));

console.log('\n=== ②③④ 结构与规范 ===');
const st = await ev(`(()=>{
  const secs=[...document.querySelectorAll('.sec')];
  const pad=secs.map(s=>parseFloat(getComputedStyle(s).paddingTop));
  const imgs=[...document.querySelectorAll('img')];
  const cards=[...document.querySelectorAll('.wc')];
  const cover=document.querySelector('.wc-cover');
  return {作品卡:cards.length, 影像:document.querySelectorAll('.shot').length,
    关于段:document.querySelectorAll('.about-card p').length,
    关于入口:document.querySelector('.about-card .cta')?.getAttribute('href'),
    区块padding:pad, 区块数:secs.length,
    旧入口:document.querySelectorAll('.door-row,.home-block,.wb-grid').length,
    图片:imgs.length, eager:imgs.filter(i=>i.loading==='eager').length, lazy:imgs.filter(i=>i.loading==='lazy').length,
    缺alt:imgs.filter(i=>!i.getAttribute('alt')).length,
    比例容器:document.querySelectorAll('.wc-cover,.shot-frame').length,
    卡片阴影:getComputedStyle(cards[0]).boxShadow,
    溢出:document.documentElement.scrollWidth-document.documentElement.clientWidth};})()`);
console.log('  ' + JSON.stringify({ ...st, 卡片阴影: st.卡片阴影.slice(0, 70) }));
check('最新博客 3 篇', st.作品卡 === 3, String(st.作品卡));
check('精选影像 6 张', st.影像 === 6, String(st.影像));
check('关于预览 2–3 句 + 入口', st.关于段 >= 2 && st.关于段 <= 3 && st.关于入口 === '/about/', `${st.关于段} 句`);
check('每个区块 padding ≥80px', st.区块padding.every((v) => v >= 80), JSON.stringify(st.区块padding));
check('旧编号入口卡片已删除', st.旧入口 === 0, String(st.旧入口));
check('图片 alt 齐全', st.缺alt === 0, `缺 ${st.缺alt}`);
check('首屏图 eager、其余 lazy', st.eager >= 1 && st.lazy >= 1, `eager=${st.eager} lazy=${st.lazy}`);
/* 每张图片都必须包在固定宽高比容器里（.wc-cover / .shot-frame）—— 防止 CLS */
check('图片都有固定宽高比容器（防 CLS）',
  st.图片 > 0 && (await ev(`[...document.querySelectorAll('img')].every((i) => i.closest('.wc-cover,.shot-frame'))`)) === true,
  `${st.比例容器}/${st.图片}`);
check('卡片阴影符合规范', /0px 1px 3px/.test(st.卡片阴影) && /0px 8px 24px/.test(st.卡片阴影), st.卡片阴影.slice(0, 60));
check('无横向溢出', st.溢出 === 0, String(st.溢出));

console.log('\n=== SEO ===');
for (const path of ['/', '/posts/', '/blog/', '/log/', '/gallery/', '/nav/', '/about/']) {
  await s('Page.navigate', { url: BASE + path });
  await waitFor(`!!document.querySelector('title')`);
  await sleep(900);
  const meta = await ev(`(()=>({t:document.title, d:document.querySelector('meta[name=description]')?.content||''}))()`);
  const ok = meta.t.length > 0 && meta.d.length >= 20;
  check(`${path} 有独立 title/description`, ok, `${meta.t} | ${meta.d.slice(0, 34)}…`);
}

console.log('\n=== 移动端 ===');
await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await s('Page.navigate', { url: BASE + '/' });
await waitFor(`!!document.querySelector('.hero-title')`);
await sleep(2500);
const mob = await ev(`(()=>({
  作品列:getComputedStyle(document.querySelector('.work-cards')).gridTemplateColumns,
  影像列:getComputedStyle(document.querySelector('.shot-grid')).gridTemplateColumns,
  影像元信息常显:getComputedStyle(document.querySelector('.shot-meta')).opacity,
  溢出:document.documentElement.scrollWidth-document.documentElement.clientWidth,
  标题字号:getComputedStyle(document.querySelector('.hero-title')).fontSize}))()`);
console.log('  ' + JSON.stringify(mob));
check('移动端作品单列 + 影像两列（§82 手机排版优化，2026-09-25）', mob.作品列.split(' ').length === 1 && mob.影像列.split(' ').length === 2, `作品=${mob.作品列} 影像=${mob.影像列}`);
check('移动端影像元信息常显（不靠悬停）', mob.影像元信息常显 === '1', mob.影像元信息常显);
check('移动端无横向溢出', mob.溢出 === 0, String(mob.溢出));
check('无 JS 异常', errs.length === 0, errs[0] || '');

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
