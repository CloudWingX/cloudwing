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

console.log('=== ① Hero ===');
const hero = await ev(`(()=>{const t=s=>document.querySelector(s);
  return {行:[...document.querySelectorAll('.ht-line')].map(e=>e.textContent.trim()),
    强调色:getComputedStyle(t('.ht-accent')).color,
    on色:getComputedStyle(t('.ht-dim')).color,
    定位语:t('.hero-tagline').textContent.trim(),
    胶囊:[...document.querySelectorAll('.hero-pills li')].map(e=>e.textContent.trim()),
    CTA:[...document.querySelectorAll('.hero-cta .cta')].map(e=>e.textContent.trim()+'→'+e.getAttribute('href')),
    描边残留:document.querySelectorAll('.stroke-text__svg').length};})()`);
console.log('  ' + JSON.stringify(hero));
check('标题两行正确', hero.行[0] === 'code on clouds,' && hero.行[1] === 'life on wings.', hero.行.join(' / '));
check('clouds/wings 用雾蓝 #9FD3E8', hero.强调色 === 'rgb(159, 211, 232)', hero.强调色);
check('on 为半透明', /\/\s*0?\.\d+/.test(hero.on色), hero.on色);
check('描边动画已移除', hero.描边残留 === 0, String(hero.描边残留));
check('定位语正确', hero.定位语 === 'Java 后端 & 质量保障方向', hero.定位语);
check('三个技术胶囊', hero.胶囊.join(',') === 'Java,质量保障,前端开发', hero.胶囊.join(','));
check('两个 CTA 指向 /works/ 与 /about/', hero.CTA[0].endsWith('/works/') && hero.CTA[1].endsWith('/about/'), hero.CTA.join(' '));

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
check('最新作品 3 张', st.作品卡 === 3, String(st.作品卡));
check('精选影像 6 张', st.影像 === 6, String(st.影像));
check('关于预览 2–3 句 + 入口', st.关于段 >= 2 && st.关于段 <= 3 && st.关于入口 === '/about/', `${st.关于段} 句`);
check('每个区块 padding ≥80px', st.区块padding.every((v) => v >= 80), JSON.stringify(st.区块padding));
check('旧编号入口卡片已删除', st.旧入口 === 0, String(st.旧入口));
check('图片 alt 齐全', st.缺alt === 0, `缺 ${st.缺alt}`);
check('首屏图 eager、其余 lazy', st.eager >= 1 && st.lazy >= 1, `eager=${st.eager} lazy=${st.lazy}`);
check('图片都有固定宽高比容器（防 CLS）', st.比例容器 === st.图片, `${st.比例容器}/${st.图片}`);
check('卡片阴影符合规范', /0px 1px 3px/.test(st.卡片阴影) && /0px 8px 24px/.test(st.卡片阴影), st.卡片阴影.slice(0, 60));
check('无横向溢出', st.溢出 === 0, String(st.溢出));

console.log('\n=== SEO ===');
for (const path of ['/', '/works/', '/gallery/', '/about/']) {
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
check('移动端单列堆叠', mob.作品列.split(' ').length === 1 && mob.影像列.split(' ').length === 1, `作品=${mob.作品列}`);
check('移动端影像元信息常显（不靠悬停）', mob.影像元信息常显 === '1', mob.影像元信息常显);
check('移动端无横向溢出', mob.溢出 === 0, String(mob.溢出));
check('无 JS 异常', errs.length === 0, errs[0] || '');

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
