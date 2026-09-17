// 导航验收（照 ReactBits 的 shrink-on-scroll + mobile-menu）：
//   未滚动：贴顶通栏（padding-top 0、1280 宽、64 高、无圆角、透明）
//   滚动后：下沉 16px 收成胶囊（1120 宽、52 高、圆角 999px、玻璃底 + 模糊 + 阴影）
//   移动端：汉堡按钮 + 顶部下拉玻璃菜单（淡入 + 下移）
// 用法：node scripts/verify-nav-shrink.mjs [baseUrl]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const p = new Map(); const errs = [];
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push((((m.params.exceptionDetails.exception || {}).description) || '').slice(0, 110));
  if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
};
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };
const waitFor = async (x, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(400); } return false; };

const cap = () => ev(`(()=>{const h=document.querySelector('.site-header'), d=document.querySelector('.header-container');
  const cs=getComputedStyle(d), hs=getComputedStyle(h), b=d.getBoundingClientRect();
  const nav=document.querySelector('.nav-links a'), nl=document.querySelector('.nav-links');
  const gh=document.querySelector('.btn-github');
  return {外层paddingTop:hs.paddingTop, 宽:Math.round(b.width), 高:Math.round(b.height),
   圆角:cs.borderTopLeftRadius, 背景:cs.backgroundColor, 模糊:cs.backdropFilter||cs.webkitBackdropFilter,
   阴影:cs.boxShadow, 内边距:cs.paddingLeft,
   链接字号:nav?getComputedStyle(nav).fontSize:null,
   链接组gap:nl?getComputedStyle(nl).gap:null,
   控件高:gh?Math.round(gh.getBoundingClientRect().height):null,
   溢出:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   scrolled:document.documentElement.dataset.scrolled};})()`);

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await s('Page.navigate', { url: BASE + '/works/' });
await waitFor(`!!document.querySelector('.header-container')`);
await sleep(2200);
// 每次导航后先把滚动位置复位（history 恢复可能带回上一次的滚动位置，
// 那样 data-scrolled 会是 1，导致"未滚动"态断言整片假失败）
await ev(`window.scrollTo(0, 0)`);
await sleep(900);

console.log('=== 未滚动：贴顶通栏 ===');
const top = await cap();
console.log('  ' + JSON.stringify(top));
check('外层 padding-top = 0', top.外层paddingTop === '0px', top.外层paddingTop);
check('容器宽 1280', top.宽 === 1280, String(top.宽));
check('容器高 64', top.高 === 64, String(top.高));
check('无圆角（贴顶通栏）', parseFloat(top.圆角) === 0, top.圆角);
check('背景透明', /rgba\(0, 0, 0, 0\)|transparent/.test(top.背景), top.背景);
check('无模糊 / 无阴影', String(top.模糊) === 'none' && /none/.test(top.阴影), `${top.模糊} | ${top.阴影}`);
check('左右内边距 32px', top.内边距 === '32px', top.内边距);

console.log('\n=== 滚动 >80px：收成胶囊 ===');
await ev(`window.scrollTo(0, 300)`);
await sleep(1300);
const sc = await cap();
console.log('  ' + JSON.stringify(sc));
check('外层下沉 16px', sc.外层paddingTop === '16px', sc.外层paddingTop);
check('容器宽收到 1120', sc.宽 === 1120, String(sc.宽));
check('容器高收到 56（参考实测值）', sc.高 === 56, String(sc.高));
check('圆角 999px', parseFloat(sc.圆角) >= 900, sc.圆角);
check('玻璃底 + 模糊', /rgba\(10, 10, 15, 0\.7\)/.test(sc.背景) && /blur\(12px\)/.test(String(sc.模糊)), `${sc.背景} | ${sc.模糊}`);
check('有阴影', !/none/.test(sc.阴影), sc.阴影.slice(0, 40));
check('左右内边距收到 24px（参考实测值）', sc.内边距 === '24px', sc.内边距);
check('链接字号保持 14px（参考滚动前后同号）', sc.链接字号 === '14px', String(sc.链接字号));
check('链接组间距 32→24（参考实测值）', sc.链接组gap === '24px', String(sc.链接组gap));
check('顶栏控件 32（参考滚动后值）', sc.控件高 === 32, String(sc.控件高));

console.log('\n=== 回顶恢复 ===');
await ev(`window.scrollTo(0, 0)`);
await sleep(1300);
const back = await cap();
check('恢复 1280/64/无圆角/透明', back.宽 === 1280 && back.高 === 64 && parseFloat(back.圆角) === 0 && /rgba\(0, 0, 0, 0\)/.test(back.背景),
  `${back.宽}/${back.高}/${back.圆角}/${back.背景}`);
check('桌面无横向溢出', back.溢出 === 0, String(back.溢出));

console.log('\n=== 形态说明（改版后不再下滑收起）===');
// 参考的导航只做"贴顶通栏 ↔ 滚动胶囊"，没有下滑隐藏这回事。
await ev(`window.scrollTo(0, 600)`);
await sleep(900);
const hidden = await ev(`(()=>{const h=document.querySelector('.site-header');
  const b=h.getBoundingClientRect(); const c=getComputedStyle(h);
  return {顶:Math.round(b.top), 隐藏类:h.classList.contains('hd-hidden'), 透明度:c.opacity};})()`);
console.log('  ' + JSON.stringify(hidden));
check('下滑后导航仍在视口内（参考不做下滑收起）', hidden.顶 >= 0 && !hidden.隐藏类 && hidden.透明度 === '1', JSON.stringify(hidden));
check('已无遗留的顶部指示线（参考导航没有）', (await ev(`document.querySelectorAll('.nav-ind').length`)) === 0);

console.log('\n=== 移动端：汉堡 + 顶部下拉菜单 ===');
await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await s('Page.navigate', { url: BASE + '/works/' });
await waitFor(`!!document.querySelector('[data-mnav-toggle]')`);
await sleep(2200);
const m0 = await ev(`(()=>({
  汉堡显示:getComputedStyle(document.querySelector('[data-mnav-toggle]')).display,
  链接组:getComputedStyle(document.querySelector('.nav-links')).display,
  菜单初始隐藏:document.querySelector('[data-mnav-panel]').hidden,
  溢出:document.documentElement.scrollWidth-document.documentElement.clientWidth}))()`);
console.log('  ' + JSON.stringify(m0));
check('移动端显示汉堡', m0.汉堡显示 === 'flex', m0.汉堡显示);
check('移动端隐藏链接组', m0.链接组 === 'none', m0.链接组);
check('菜单初始隐藏', m0.菜单初始隐藏 === true);
check('移动端无横向溢出', m0.溢出 === 0, String(m0.溢出));

await ev(`document.querySelector('[data-mnav-toggle]').click()`);
await waitFor(`document.querySelector('[data-mnav-panel]').classList.contains('is-open')`);
await sleep(700);
const m1 = await ev(`(()=>{const p=document.querySelector('[data-mnav-panel]'); const c=getComputedStyle(p);
  const b=p.getBoundingClientRect();
  return {打开:!p.hidden, 类:c.getPropertyValue('transform'), 透明度:c.opacity, 背景:c.backgroundColor,
    模糊:c.backdropFilter||c.webkitBackdropFilter, 顶部:Math.round(b.top), 宽:Math.round(b.width),
    链接数:p.querySelectorAll('a').length, 汉堡叉号:document.querySelector('[data-nav]').classList.contains('mnav-open'),
    aria:document.querySelector('[data-mnav-toggle]').getAttribute('aria-expanded')};})()`);
console.log('  ' + JSON.stringify(m1));
check('菜单已打开', m1.打开 === true);
check('已到终态（opacity 1 / 无位移）', m1.透明度 === '1' && (m1.类 === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(m1.类)), `${m1.透明度} ${m1.类}`);
check('玻璃底 + 模糊', /rgba\(10, 10, 15, 0\.95\)/.test(m1.背景) && /blur\(20px\)/.test(String(m1.模糊)), `${m1.背景} | ${m1.模糊}`);
check('贴在导航下方', m1.顶部 >= 60, String(m1.顶部));
check('菜单占满宽度', m1.宽 === 390, String(m1.宽));
// 5 个主导航 + 分类 chips + 底部动作按钮
check('含导航链接与分类入口', m1.链接数 >= 5, String(m1.链接数));
check('汉堡变叉号（mnav-open）', m1.汉堡叉号 === true);
check('aria-expanded=true', m1.aria === 'true');

await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
await sleep(600);
check('Esc 可关闭菜单', (await ev(`document.querySelector('[data-mnav-panel]').hidden`)) === true);

// 移动端滚动后菜单仍不被胶囊压住
// 注意：滚动会让 autoHideHeader 收起导航；这里滚回接近顶部，保证两者都在视口内再量。
await ev(`document.querySelector('[data-mnav-toggle]').click()`);
await waitFor(`document.querySelector('[data-mnav-panel]').classList.contains('is-open')`);
await ev(`window.scrollTo(0, 300)`);
await sleep(700);
await ev(`window.scrollTo(0, 140)`);
await sleep(1200);
const m2 = await ev(`(()=>{const p=document.querySelector('[data-mnav-panel]').getBoundingClientRect();
  const h=document.querySelector('.header-container').getBoundingClientRect();
  return {菜单顶:Math.round(p.top), 胶囊底:Math.round(h.bottom), 胶囊高:Math.round(h.height),
    视口:innerHeight};})()`);
console.log('  ' + JSON.stringify(m2));
check('滚动后菜单仍在胶囊下方（几何有效）',
  m2.胶囊高 > 0 && m2.菜单顶 >= m2.胶囊底 - 2 && m2.菜单顶 < m2.视口,
  JSON.stringify(m2));

check('全程无 JS 异常', errs.length === 0, errs[0] || '');

await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Page.navigate', { url: BASE + '/works/' });
await sleep(3000);
// 顶部形态截图
let shot = await s('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) writeFileSync('D:\\deep seek workplace\\_shots\\nav-flush.png', Buffer.from(shot.result.data, 'base64'));
// 滚动形态截图：滚下去让胶囊成型，再上滑一点让 autoHideHeader 把导航滑回来
await ev(`window.scrollTo(0, 400)`);
await sleep(900);
await ev(`window.scrollTo(0, 340)`);
await sleep(1400);
shot = await s('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) writeFileSync('D:\\deep seek workplace\\_shots\\nav-shrink.png', Buffer.from(shot.result.data, 'base64'));

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
