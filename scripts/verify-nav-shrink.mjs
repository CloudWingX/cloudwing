// 导航验收（照 ReactBits 的 shrink-on-scroll + mobile-menu）：
//   未滚动：贴顶通栏（padding-top 0、1600 宽、64 高、无圆角、透明）
//   滚动后：下沉 16px 收成胶囊（1440 宽、56 高、圆角 999px、玻璃底 + 模糊 + 阴影）
//   移动端：StaggeredMenu 抽屉（右侧滑入 + 前导层/条目错峰，2026-09-23 改版）
// ⚠️ 1600 = global.css 的 --w-max（主内容容器盒宽，header/main/footer 一致；
//    2026-09-22 晚从 1300 放宽）；
//    滚动后的 1440 = 1600 − 160，保持与上一版（1300 → 1140）相同的收缩幅度。
// 用法：node scripts/verify-nav-shrink.mjs [baseUrl]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
// ⚠️ 必须用 ws 包（全局 WebSocket 在本机对 Edge 153 只 open 不回包，2026-09-23 实测）
import WebSocket from 'file:///C:/Users/24645/.workbuddy/binaries/node/workspace/node_modules/ws/index.js';
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.on('open', r); ws.on('error', j); });
let id = 0; const p = new Map(); const errs = [];
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.on('message', (e) => {
  const m = JSON.parse(e);
  if (m.method === 'Runtime.exceptionThrown') errs.push((((m.params.exceptionDetails.exception || {}).description) || '').slice(0, 110));
  if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
});
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
// 2026-09-22：容器 --w-max 1300 → 1600，视口须 > 1600 才能看到"容器 1600"上限
// （1440 视口下容器满宽 1430，1600/1440 两条断言必挂 —— 实测踩过）。
await s('Emulation.setDeviceMetricsOverride', { width: 1920, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await s('Page.navigate', { url: BASE + '/blog/' });
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
check('容器宽 1600（= --w-max，与主内容容器同宽）', top.宽 === 1600, String(top.宽));
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
check('容器宽收到 1440（= 1600 − 160 收缩差）', sc.宽 === 1440, String(sc.宽));
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
check('恢复 1600/64/无圆角/透明', back.宽 === 1600 && back.高 === 64 && parseFloat(back.圆角) === 0 && /rgba\(0, 0, 0, 0\)/.test(back.背景),
  `${back.宽}/${back.高}/${back.圆角}/${back.背景}`);
check('桌面无横向溢出', back.溢出 === 0, String(back.溢出));
/* 2026-09-18 二轮：导航容器必须与主内容容器"同宽 + 同左缘 + 各自居中"，
   否则导航内容左缘会比正文左缘多出 ~54px（改宽度前实测）。
   注意比的是**容器盒**左缘，不是内容左缘：导航内边距 32、.wrap 内边距 52，
   两者内边距本来就不同（参考也是"同容器宽、内容各自内缩"）。
   ⚠️ 不能用 `.shell .wrap` 取样：三栏壳层里的 .wrap 被 shell.css 改成
   `max-width:none`（宽度交给栅格列），量出来的不是主容器宽（踩过）。 */
const navAlign = JSON.parse(await ev(`(function(){
  var h=document.querySelector('.header-container');
  var w=null, all=document.querySelectorAll('.wrap');
  for (var i=0;i<all.length;i++){ if (getComputedStyle(all[i]).maxWidth!=='none'){ w=all[i]; break; } }
  var vw=document.documentElement.clientWidth;
  var hb=h.getBoundingClientRect();
  /* 2026-09-19：/blog/ 已改为 shell 三栏页（.shell .wrap 特意 max-width:none，
     宽度交给栅格列），找不到标准 wrap 时退化为只校验导航自身水平居中。 */
  if(!h) return JSON.stringify({ok:false, hasNav:false, mode:'none'});
  if(!w) return JSON.stringify({ok:true, mode:'shell',
    导航居中差:Math.round((hb.left-(vw-hb.width)/2)*10)/10,
    导航宽:Math.round(hb.width)});
  return JSON.stringify({ok:true, mode:'wrap',
    宽差:Math.round((hb.width-wb.width)*10)/10,
    左缘差:Math.round((hb.left-wb.left)*10)/10,
    导航居中差:Math.round((hb.left-(vw-hb.width)/2)*10)/10});})()`));
if (navAlign.mode === 'shell') {
  check('导航容器自身水平居中（shell 页无标准 wrap，退化为居中校验）', Math.abs(navAlign.导航居中差) <= 1.5,
    `居中差 ${navAlign.导航居中差} / 导航宽 ${navAlign.导航宽}`);
} else {
check('导航容器与主内容容器同宽（都用 1600）', navAlign.ok && Math.abs(navAlign.宽差) <= 1.5,
  navAlign.ok ? `宽差 ${navAlign.宽差}` : JSON.stringify(navAlign));
check('导航容器与主内容容器同左缘', navAlign.ok && Math.abs(navAlign.左缘差) <= 1.5,
  navAlign.ok ? `左缘差 ${navAlign.左缘差}` : JSON.stringify(navAlign));
check('导航容器自身水平居中', navAlign.ok && Math.abs(navAlign.导航居中差) <= 1.5,
  navAlign.ok ? `居中差 ${navAlign.导航居中差}` : JSON.stringify(navAlign));
}

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

console.log('\n=== 移动端：StaggeredMenu 抽屉（2026-09-23 改版）===');
await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await s('Page.navigate', { url: BASE + '/blog/' });
await waitFor(`!!document.querySelector('[data-mnav-toggle]')`);
await sleep(2200);
const m0 = await ev(`(()=>({
  开关显示:getComputedStyle(document.querySelector('[data-mnav-toggle]')).display,
  链接组:getComputedStyle(document.querySelector('.nav-links')).display,
  菜单初始隐藏:document.querySelector('[data-mnav-panel]').hidden,
  溢出:document.documentElement.scrollWidth-document.documentElement.clientWidth}))()`);
console.log('  ' + JSON.stringify(m0));
check('移动端显示 StaggeredMenu 开关', m0.开关显示 === 'flex', m0.开关显示);
check('移动端隐藏链接组', m0.链接组 === 'none', m0.链接组);
check('抽屉初始隐藏', m0.菜单初始隐藏 === true);
check('移动端无横向溢出', m0.溢出 === 0, String(m0.溢出));

await ev(`document.querySelector('[data-mnav-toggle]').click()`);
await waitFor(`document.querySelector('[data-mnav-panel]').classList.contains('is-open')`);
await sleep(1400); // 等开场时间线走完（前导层 0.07 错峰 + 面板 0.65 + 条目入场）
const m1 = await ev(`(()=>{const p=document.querySelector('[data-mnav-panel]'); const c=getComputedStyle(p);
  const inner=p.querySelector('.sm-panel'); const ci=getComputedStyle(inner); const b=inner.getBoundingClientRect();
  const layers=[...p.querySelectorAll('.sm-prelayer')];
  const firstLink=inner.querySelector('.sm-link');
  return {打开:!p.hidden, 类:c.getPropertyValue('transform'), 透明度:c.opacity,
    面板变换:ci.getPropertyValue('transform'), 背景:ci.backgroundColor, 模糊:ci.backdropFilter||ci.webkitBackdropFilter,
    顶部:Math.round(b.top), 高:Math.round(b.height), 右缘:Math.round(window.innerWidth-b.right), 宽:Math.round(b.width),
    前导层:layers.length, 前导层就位:layers.every(l=>Math.round(l.getBoundingClientRect().right)===Math.round(window.innerWidth)),
    链接数:inner.querySelectorAll('a').length,
    一级链接数:inner.querySelectorAll('.sm-link').length,
    子链接数:inner.querySelectorAll('.sm-sub a').length,
    编号内容:firstLink?getComputedStyle(firstLink,'::after').content:'(none)',
    编号可见:firstLink?parseFloat(getComputedStyle(firstLink,'::after').opacity):0,
    开关态:document.querySelector('[data-nav]').classList.contains('mnav-open'),
    aria:document.querySelector('[data-mnav-toggle]').getAttribute('aria-expanded')};})()`);
console.log('  ' + JSON.stringify(m1));
check('抽屉已打开', m1.打开 === true);
check('面板已到终态（xPercent 0 / opacity 1）', m1.透明度 === '1' && /matrix\(1, 0, 0, 1, 0, 0\)/.test(m1.面板变换), `${m1.透明度} ${m1.面板变换}`);
check('玻璃底 + 模糊', /rgba\(10, 10, 15, 0\.96\)/.test(m1.背景) && /blur\(20px\)/.test(String(m1.模糊)), `${m1.背景} | ${m1.模糊}`);
check('右侧全高贴边（top 0 / 高=视口 / 右缘 0）',
  m1.顶部 === 0 && Math.abs(m1.高 - 844) <= 1 && m1.右缘 === 0, `顶=${m1.顶部} 高=${m1.高} 右=${m1.右缘}`);
check('抽屉宽度 = clamp(280px, 84vw, 400px)',
  Math.abs(m1.宽 - Math.round(Math.min(400, Math.max(280, 390 * 0.84)))) <= 1.5, `宽=${m1.宽}`);
check('2 层前导层已滑入到位', m1.前导层 === 2 && m1.前导层就位 === true, `层=${m1.前导层}`);
check('一级链接 7 个（含可点的「记录」父项）+ 组内 4 个（共 11 个）',
  m1.一级链接数 === 7 && m1.子链接数 === 4 && m1.链接数 === 11, `一级=${m1.一级链接数} 子=${m1.子链接数} 总=${m1.链接数}`);
check('条目编号已渲染（::after 计数器存在，opacity 1）',
  String(m1.编号内容) !== 'none' && String(m1.编号内容).includes('counter') && m1.编号可见 === 1, `${m1.编号内容} op=${m1.编号可见}`);
check('mnav-open 态 + aria-expanded=true', m1.开关态 === true && m1.aria === 'true');

await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
await sleep(700);
check('Esc 可关闭抽屉', (await ev(`document.querySelector('[data-mnav-panel]').hidden`)) === true);

// 抽屉 fixed 全高：滚动页面后依旧盖满视口（几何不随滚动漂移）
await ev(`document.querySelector('[data-mnav-toggle]').click()`);
await waitFor(`document.querySelector('[data-mnav-panel]').classList.contains('is-open')`);
await ev(`window.scrollTo(0, 300)`);
await sleep(900);
const m2 = await ev(`(()=>{const b=document.querySelector('.sm-panel').getBoundingClientRect();
  return {顶:Math.round(b.top), 右缘:Math.round(window.innerWidth-b.right), 视口:innerHeight};})()`);
console.log('  ' + JSON.stringify(m2));
check('滚动后抽屉仍满屏贴右（fixed 几何稳定）', m2.顶 === 0 && m2.右缘 === 0, JSON.stringify(m2));

check('全程无 JS 异常', errs.length === 0, errs[0] || '');

await s('Emulation.setDeviceMetricsOverride', { width: 1920, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Page.navigate', { url: BASE + '/blog/' });
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
await fetch(`${CDP}/json/close/${tab.id}`).catch(() => {}); // 收尾：关掉测试 tab，别留播放态页面
ws.close();
process.exit(failed.length ? 1 : 0);
