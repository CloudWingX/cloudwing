// 导航验收（照 ReactBits 的 shrink-on-scroll + mobile-menu）：
//   未滚动：贴顶通栏（padding-top 0、1300 宽、64 高、无圆角、透明）
//   滚动后：下沉 16px 收成胶囊（1140 宽、56 高、圆角 999px、玻璃底 + 模糊 + 阴影）
//   移动端：汉堡按钮 + 顶部下拉玻璃菜单（淡入 + 下移）
// ⚠️ 1300 = global.css 的 --w-max（主内容容器盒宽，header/main/footer 一致）；
//    滚动后的 1140 = 1300 − 160，保持与上一版（1280 → 1120）相同的收缩幅度。
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
check('容器宽 1300（= --w-max，与主内容容器同宽）', top.宽 === 1300, String(top.宽));
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
check('容器宽收到 1140', sc.宽 === 1140, String(sc.宽));
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
check('恢复 1300/64/无圆角/透明', back.宽 === 1300 && back.高 === 64 && parseFloat(back.圆角) === 0 && /rgba\(0, 0, 0, 0\)/.test(back.背景),
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
check('导航容器与主内容容器同宽（都用 1300）', navAlign.ok && Math.abs(navAlign.宽差) <= 1.5,
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

console.log('\n=== 移动端：汉堡 + 顶部下拉菜单 ===');
await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await s('Page.navigate', { url: BASE + '/blog/' });
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
    左:Math.round(b.left), 右:Math.round(window.innerWidth - b.right),
    圆角四角:[c.borderTopLeftRadius,c.borderTopRightRadius,c.borderBottomRightRadius,c.borderBottomLeftRadius].join('/'),
    链接数:p.querySelectorAll('a').length,
    一级链接数:p.querySelectorAll(':scope > a').length,
    分类组数:p.querySelectorAll('.mm-group').length,
    分类链接数:p.querySelectorAll('a[href*="?tag="], a[href*="?game="]').length,
    外链组数:p.querySelectorAll('.mm-actions').length,
    外链数:p.querySelectorAll('a[href^="http"], a[href="/rss.xml"]').length,
    汉堡叉号:document.querySelector('[data-nav]').classList.contains('mnav-open'),
    aria:document.querySelector('[data-mnav-toggle]').getAttribute('aria-expanded')};})()`);
console.log('  ' + JSON.stringify(m1));
check('菜单已打开', m1.打开 === true);
check('已到终态（opacity 1 / 无位移）', m1.透明度 === '1' && (m1.类 === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(m1.类)), `${m1.透明度} ${m1.类}`);
check('玻璃底 + 模糊', /rgba\(10, 10, 15, 0\.95\)/.test(m1.背景) && /blur\(20px\)/.test(String(m1.模糊)), `${m1.背景} | ${m1.模糊}`);
check('贴在导航下方', m1.顶部 >= 60, String(m1.顶部));
// 2026-09-18：菜单改成"四周内缩的圆角矩形浮层"（原来是占满宽度的通栏）
check('菜单左右各内缩 12px（不再通栏）',
  m1.左 === 12 && m1.右 === 12 && m1.宽 === 366, `左=${m1.左} 右=${m1.右} 宽=${m1.宽}`);
// 计算值是 "16px" 这种带单位的字符串，必须 parseFloat（Number('16px') 会得到 NaN —— 踩过）
const rr = String(m1.圆角四角).split('/').map((v) => parseFloat(v));
check('四角圆角一致且 ≥12px（圆角矩形）',
  rr.length === 4 && rr.every((n) => n >= 12) && rr.every((n) => Math.abs(n - rr[0]) < 0.6),
  m1.圆角四角);
// 抽屉内容：一级导航项 + 「记录」分组（组标题 + 缩进子链接）。
// 2026-09-18：「作品库分类 / 画廊分类」两组按用户要求删除，这里改为断言"确实没了"。
// 2026-09-19 晚：站长要求「文章/归档/日志」收进「记录」下拉 —— NAV 8 项 → 6 项，
//   其中「记录」带 3 个 child；抽屉里 = 一级链接 5 + 分组标题 1 + 分组内链接 3（共 8 个 <a>）。
// 2026-09-21：「记录」新增第 4 个 child「日历」（/calendar/，commit 78afb41）——
//   抽屉组内链接 3 → 4，总数 8 → 9（断言随功能事实同步，非放宽）。
check('抽屉一级链接 5 个 + 记录组内 4 个（共 9 个链接）',
  m1.一级链接数 === 5 && m1.链接数 === 9, `一级=${m1.一级链接数} 总=${m1.链接数}`);
check('抽屉含「记录」分组（1 组，且无 ?tag=/?game= 分类链接）',
  m1.分类组数 === 1 && m1.分类链接数 === 0, `组=${m1.分类组数} 分类链=${m1.分类链接数}`);
// 2026-09-18：底部 GitHub / Bilibili / RSS 三个外链按钮也按用户要求删除（桌面顶栏与页脚仍在）
check('抽屉已无外链按钮（GitHub/Bilibili/RSS）',
  m1.外链组数 === 0 && m1.外链数 === 0, `组=${m1.外链组数} 外链=${m1.外链数}`);
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
ws.close();
process.exit(failed.length ? 1 : 0);
