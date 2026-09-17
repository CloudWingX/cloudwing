// ReactBits 风格导航验收：侧边菜单（StaggeredMenu）+ 顶部指示线。
// 参数依据 ReactBits 原实现：预层 0.07s 递增、菜单项 stagger 0.1、power4.out、图标 225°。
// 用法：node scripts/verify-nav-rb.mjs [baseUrl]
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

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Page.navigate', { url: BASE + '/works/' });
await waitFor(`!!document.querySelector('[data-sm-panel]')`);
await sleep(2500);

console.log('=== 结构（ReactBits StaggeredMenu）===');
const st = await ev(`(()=>({
  开关:!!document.querySelector('[data-sm-toggle]'),
  图标线:document.querySelectorAll('.sm-icon-line').length,
  预层:document.querySelectorAll('.sm-prelayer').length,
  面板:!!document.querySelector('[data-sm-panel]'),
  菜单项:document.querySelectorAll('.sm-panel-item').length,
  编号规则:(()=>{const li=document.querySelector('.sm-panel-item'); if(!li) return null;
    const c=getComputedStyle(li,'::after'); return c.content;})(),
  社交:document.querySelectorAll('.sm-socials-link').length,
  社交标题:!!document.querySelector('.sm-socials-title'),
  悬停线:!!document.querySelector('.nav-ind--hover'),
  激活线:!!document.querySelector('.nav-ind--active'),
}))()`);
console.log('  ' + JSON.stringify(st));
check('有加号⇄叉号开关', st.开关 && st.图标线 === 2, `图标线 ${st.图标线}`);
check('有 2 层预层', st.预层 === 2, String(st.预层));
check('有主面板', st.面板 === true);
check('菜单项齐全（5 项）', st.菜单项 === 5, String(st.菜单项));
check('菜单项有编号（decimal-leading-zero）', /counter/.test(String(st.编号规则)), String(st.编号规则));
check('有社交链接 + 标题', st.社交 >= 3 && st.社交标题 === true, `${st.社交} 个`);
check('有悬停指示线', st.悬停线 === true);
check('有激活指示线', st.激活线 === true);

console.log('\n=== 关闭态初始位移（应从右侧屏外）===');
const closed = await ev(`(()=>{const pa=document.querySelector('[data-sm-panel]');
  const pr=document.querySelector('.sm-prelayer');
  return {面板:getComputedStyle(pa).transform, 预层:getComputedStyle(pr).transform,
    面板可见:getComputedStyle(pa).opacity, aria:pa.getAttribute('aria-hidden')};})()`);
console.log('  ' + JSON.stringify(closed));
check('面板初始在屏外（x 平移 > 0）', /matrix\(1, 0, 0, 1, (\d+(\.\d+)?), 0\)/.test(String(closed.面板)) && parseFloat(String(closed.面板).split(',')[4]) > 100, String(closed.面板));
check('初始 aria-hidden=true', closed.aria === 'true', String(closed.aria));

console.log('\n=== 打开动画（逐帧记录位移，验证 stagger 与缓动）===');
await ev(`(()=>{
  window.__sm=[];
  const t0=performance.now();
  const tick=()=>{
    const pr=[...document.querySelectorAll('.sm-prelayer')].map(e=>{const m=new DOMMatrixReadOnly(getComputedStyle(e).transform); return Math.round(m.m41);});
    const pa=Math.round(new DOMMatrixReadOnly(getComputedStyle(document.querySelector('[data-sm-panel]')).transform).m41);
    const it=[...document.querySelectorAll('.sm-panel-itemLabel')].map(e=>+(+getComputedStyle(e).opacity).toFixed(2));
    const ic=new DOMMatrixReadOnly(getComputedStyle(document.querySelector('[data-sm-icon]')).transform);
    const rot=Math.round(Math.atan2(ic.b, ic.a)*180/Math.PI);
    window.__sm.push({t:Math.round(performance.now()-t0), pr, pa, it, rot});
    if (performance.now()-t0 < 3000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})()`);
await ev(`document.querySelector('[data-sm-toggle]').click()`);
await sleep(3200);
const frames = await ev(`window.__sm`);
const first = frames[0], last = frames[frames.length - 1];
console.log(`  帧数=${frames.length}`);
console.log(`  起始 预层=${JSON.stringify(first.pr)} 面板=${first.pa} 图标=${first.rot}°`);
console.log(`  结束 预层=${JSON.stringify(last.pr)} 面板=${last.pa} 图标=${last.rot}°`);
check('预层与面板最终归位（x=0）', last.pr.every((v) => Math.abs(v) <= 1) && Math.abs(last.pa) <= 1, `预层=${last.pr} 面板=${last.pa}`);
// atan2 会把 225° 归一化成 -135°（两者相差 360°），比较前先归一到 [0,360)
const norm = (d) => ((d % 360) + 360) % 360;
check('图标旋转 225°（加号→叉号）', Math.abs(norm(last.rot) - 225) <= 3, `原始 ${last.rot}° → 归一 ${norm(last.rot)}°`);
// 预层错峰：找到两层"到达 x<10"的帧，验证后到达的那层更晚
const arrive = (idx) => { const f = frames.find((x) => Math.abs(x.pr[idx]) < 10); return f ? f.t : -1; };
const a0 = arrive(0), a1 = arrive(1);
check('两层预层错峰滑入（后一层更晚）', a0 > 0 && a1 > 0 && Math.abs(a1 - a0) >= 30, `先后到达 t=${a0}ms / ${a1}ms`);
// 菜单项错峰：逐项首次达到 opacity≥0.99 的时间应递增
const firstFull = frames[0].it.map((_, i) => { const f = frames.find((x) => x.it[i] >= 0.99); return f ? f.t : -1; });
console.log(`  菜单项依次就位 t=${JSON.stringify(firstFull)}`);
const increasing = firstFull.every((t, i) => i === 0 || (t >= 0 && firstFull[i - 1] >= 0 && t > firstFull[i - 1]));
check('菜单项依次入场（stagger 递增）', increasing, JSON.stringify(firstFull));
check('打开后 aria-expanded=true', (await ev(`document.querySelector('[data-sm-toggle]').getAttribute('aria-expanded')`)) === 'true');

const shot = await s('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) writeFileSync('D:\\deep seek workplace\\_shots\\sm-open.png', Buffer.from(shot.result.data, 'base64'));

console.log('\n=== 关闭 ===');
await ev(`document.querySelector('[data-sm-toggle]').click()`);
await sleep(1600);
const afterClose = await ev(`(()=>{const pa=document.querySelector('[data-sm-panel]');
  const m=new DOMMatrixReadOnly(getComputedStyle(pa).transform);
  return {面板x:Math.round(m.m41), aria:pa.getAttribute('aria-hidden'),
    菜单项:getComputedStyle(document.querySelector('.sm-panel-itemLabel')).opacity,
    图标:(()=>{const ic=new DOMMatrixReadOnly(getComputedStyle(document.querySelector('[data-sm-icon]')).transform);
      return Math.round(Math.atan2(ic.b,ic.a)*180/Math.PI);})()};})()`);
console.log('  ' + JSON.stringify(afterClose));
check('关闭后面板回到屏外', afterClose.面板x > 100, String(afterClose.面板x));
check('关闭后菜单项隐藏', parseFloat(afterClose.菜单项) < 0.05, afterClose.菜单项);
check('关闭后图标回到 0°', Math.abs(afterClose.图标) <= 3, `${afterClose.图标}°`);

console.log('\n=== 指示线 ===');
const ind = await ev(`(()=>{
  const nav=document.querySelector('.nav');
  const h=document.querySelector('.nav-ind--hover'), a=document.querySelector('.nav-ind--active');
  const links=[...nav.querySelectorAll('a')];
  const nb=nav.getBoundingClientRect();
  const cur=nav.querySelector("a[aria-current='page']");
  const cb=cur?cur.getBoundingClientRect():null;
  return {链接数:links.length,
    悬停线opacity:getComputedStyle(h).opacity, 激活线opacity:getComputedStyle(a).opacity,
    激活线x:Math.round(new DOMMatrixReadOnly(getComputedStyle(a).transform).m41),
    当前项相对x:cb?Math.round(cb.left-nb.left):null,
    激活线宽:Math.round(parseFloat(getComputedStyle(a).width)),
    当前项宽:cb?Math.round(cb.width):null};})()`);
console.log('  ' + JSON.stringify(ind));
check('激活线停在当前页项下方', ind.当前项相对x !== null && Math.abs(ind.激活线x - ind.当前项相对x) <= 12, `线x=${ind.激活线x} 项x=${ind.当前项相对x}`);
check('激活线宽度贴合菜单项', ind.当前项宽 !== null && Math.abs(ind.激活线宽 - (ind.当前项宽 - 12)) <= 6, `线宽=${ind.激活线宽} 项宽=${ind.当前项宽}`);
check('悬停线初始隐藏', parseFloat(ind.悬停线opacity) < 0.05, ind.悬停线opacity);

// 悬停跟随：对第 4 个菜单项派发 pointerover，看悬停线是否移动过去
await ev(`(()=>{const a=[...document.querySelectorAll('.nav a')][3];
  a.dispatchEvent(new PointerEvent('pointerover',{bubbles:true}));})()`);
await sleep(800);
const hoverNow = await ev(`(()=>{const h=document.querySelector('.nav-ind--hover');
  return {opacity:getComputedStyle(h).opacity, x:Math.round(new DOMMatrixReadOnly(getComputedStyle(h).transform).m41),
    navX:Math.round(document.querySelector('.nav').getBoundingClientRect().left),
    linkX:Math.round([...document.querySelectorAll('.nav a')][3].getBoundingClientRect().left)};})()`);
console.log('  ' + JSON.stringify(hoverNow));
check('悬停线跟随鼠标移动到该菜单项', parseFloat(hoverNow.opacity) > 0.5 && Math.abs(hoverNow.x - (hoverNow.linkX - hoverNow.navX)) <= 12, JSON.stringify(hoverNow));

console.log('\n=== 键盘与减少动态 ===');
await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
await sleep(600);
check('Esc 可关闭菜单', (await ev(`document.documentElement.hasAttribute('data-sm-open')`)) === false);

await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await s('Page.navigate', { url: BASE + '/works/' });
await waitFor(`!!document.querySelector('[data-sm-toggle]')`);
await sleep(2000);
await ev(`document.querySelector('[data-sm-toggle]').click()`);
await sleep(400); // 减少动态下应"立即"到位
const rm = await ev(`(()=>{const pa=document.querySelector('[data-sm-panel]');
  const m=new DOMMatrixReadOnly(getComputedStyle(pa).transform);
  return {面板x:Math.round(m.m41), 菜单项:getComputedStyle(document.querySelector('.sm-panel-itemLabel')).opacity};})()`);
console.log('  ' + JSON.stringify(rm));
check('减少动态：菜单立即到位（无过渡）', Math.abs(rm.面板x) <= 1 && parseFloat(rm.菜单项) > 0.9, JSON.stringify(rm));

console.log('\n=== 移动端 ===');
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await s('Page.navigate', { url: BASE + '/works/' });
await waitFor(`!!document.querySelector('[data-sm-toggle]')`);
await sleep(2200);
await ev(`document.querySelector('[data-sm-toggle]').click()`);
await sleep(2600);
const mob = await ev(`(()=>{const pa=document.querySelector('[data-sm-panel]');
  const b=pa.getBoundingClientRect();
  return {宽:Math.round(b.width), 视口:document.documentElement.clientWidth,
    溢出:document.documentElement.scrollWidth-document.documentElement.clientWidth};})()`);
console.log('  ' + JSON.stringify(mob));
check('移动端面板占满宽度', Math.abs(mob.宽 - mob.视口) <= 2, `${mob.宽}/${mob.视口}`);
check('移动端无横向溢出', mob.溢出 === 0, String(mob.溢出));
const shot2 = await s('Page.captureScreenshot', { format: 'png' });
if (shot2.result?.data) writeFileSync('D:\\deep seek workplace\\_shots\\sm-m390.png', Buffer.from(shot2.result.data, 'base64'));

check('全程无 JS 异常', errs.length === 0, errs[0] || '');

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
