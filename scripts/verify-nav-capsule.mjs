// 导航胶囊：滚动行为 + 当前页短横线 + 移动端下拉面板。
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
  if (m.method === 'Runtime.exceptionThrown') errs.push((((m.params.exceptionDetails.exception || {}).description) || '').slice(0, 90));
  if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
};
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };
const waitFor = async (x, ms = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(400); } return false; };
const cap = () => ev(`(()=>{const hd=document.querySelector('.hd'); const c=getComputedStyle(hd);
  return {高:Math.round(hd.getBoundingClientRect().height), 背景:c.backgroundColor, 阴影:c.boxShadow.slice(0,44),
    边框:c.borderTopColor, scrolled:document.documentElement.dataset.scrolled};})()`);

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Page.navigate', { url: BASE + '/works/' });
await waitFor(`!!document.querySelector('.hd')`);
await sleep(2000);

console.log('=== 滚动行为（阈值 80px）===');
const top = await cap();
console.log('  顶部: ' + JSON.stringify(top));
await ev(`window.scrollTo(0, 60)`); await sleep(700);
const at60 = await cap();
check('滚动 60px 未变（阈值 80px）', at60.scrolled === '0' && at60.高 === top.高, `scrolled=${at60.scrolled} 高=${at60.高}`);
await ev(`window.scrollTo(0, 200)`); await sleep(800);
const at200 = await cap();
console.log('  滚动 200px: ' + JSON.stringify(at200));
check('超过 80px → 高度缩到 52px', at200.高 === 52, `${top.高} → ${at200.高}`);
check('超过 80px → 背景加深', at200.背景 !== top.背景, `${top.背景} → ${at200.背景}`);
check('超过 80px → 阴影加重', at200.阴影 !== top.阴影, at200.阴影);
await ev(`window.scrollTo(0, 0)`); await sleep(800);
const back = await cap();
check('滚回顶部立即恢复 56px', back.高 === top.高 && back.scrolled === '0', `${back.高}px`);

console.log('\n=== 当前页标记 ===');
const cur = await ev(`(()=>{const a=document.querySelector('.nav a[aria-current="page"]');
  if(!a) return null; const c=getComputedStyle(a,'::after');
  return {文字:a.textContent.trim(), 背景:getComputedStyle(a).backgroundColor,
    横线:c.content!=='none'&&c.width+' '+c.height, 横线色:c.backgroundColor, 横线位置:c.bottom};})()`);
console.log('  ' + JSON.stringify(cur));
check('当前页用短横线标记', cur && cur.横线 && cur.横线 !== 'auto auto', String(cur && cur.横线));
check('当前页不是整块高亮', cur && /rgba\([^)]*,\s*0\)/.test(cur.背景), String(cur && cur.背景));
check('横线为雾蓝', cur && /159,\s*211,\s*232/.test(String(cur.横线色)), String(cur && cur.横线色));

console.log('\n=== 链接规格 ===');
const link = await ev(`(()=>{const a=document.querySelector('.nav a'); const c=getComputedStyle(a);
  return {字号:c.fontSize, 字重:c.fontWeight, padding:c.paddingTop+' '+c.paddingLeft, 圆角:c.borderTopLeftRadius, 默认色:c.color};})()`);
console.log('  ' + JSON.stringify(link));
check('链接 14px', link.字号 === '14px', link.字号);
check('链接字重 500', link.字重 === '500', link.字重);
check('padding 8px 14px', link.padding === '8px 14px', link.padding);
check('圆角 10px', link.圆角 === '10px', link.圆角);

const brand = await ev(`(()=>{const b=document.querySelector('.brand .bname'); const c=getComputedStyle(b);
  return {字号:c.fontSize, 字重:c.fontWeight, 字距:c.letterSpacing, 字距px:parseFloat(c.letterSpacing)};})()`);
console.log('  Logo: ' + JSON.stringify(brand));
// 注意：-0.01em 在 15px 下算式值是 -0.15px，比较要按"em 换算后的像素"判，不能字面比字符串
check('Logo 15px / 600 / -0.01em',
  brand.字号 === '15px' && brand.字重 === '600' && Math.abs(brand.字距px - (15 * -0.01)) < 0.02,
  JSON.stringify(brand));

console.log('\n=== 移动端下拉面板 ===');
await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await s('Page.navigate', { url: BASE + '/works/' });
await waitFor(`!!document.querySelector('.burger')`);
await sleep(1800);
const mTop = await cap();
check('移动端胶囊左右各留 16px', Math.abs(mTop.高 - 56) <= 1, `高=${mTop.高}`);
const mWidth = await ev(`(()=>{const hd=document.querySelector('.hd'); const b=hd.getBoundingClientRect();
  return {左:Math.round(b.left), 右:Math.round(innerWidth-b.right), 视口:document.documentElement.clientWidth};})()`);
check('左右留白各 16px', mWidth.左 === 16 && mWidth.右 === 16, JSON.stringify(mWidth));
check('导航链接收进汉堡（桌面链接组隐藏）', (await ev(`getComputedStyle(document.querySelector('.nav')).display`)) === 'none');
await ev(`document.querySelector('[data-nav-burger]')?.click()`);
await sleep(700);
const panel = await ev(`(()=>{const d=document.querySelector('.drawer'); if(!d||d.hidden) return null;
  const c=getComputedStyle(d); const b=d.getBoundingClientRect();
  return {背景:c.backgroundColor, 模糊:c.backdropFilter||c.webkitBackdropFilter, 圆角:c.borderTopLeftRadius,
    动画:c.animationName, 顶部:Math.round(b.top), 左:Math.round(b.left), 右:Math.round(b.right)};})()`);
console.log('  ' + JSON.stringify(panel));
check('面板从顶部下拉（在胶囊下方）', panel && panel.顶部 >= 70, String(panel && panel.顶部));
check('面板圆角 20px', panel && panel.圆角 === '20px', String(panel && panel.圆角));
check('面板模糊 24px', panel && /blur\(24px\)/.test(String(panel.模糊)), String(panel && panel.模糊));
check('面板背景为深色玻璃（暗色电影感）', panel && /rgba\(9,\s*12,\s*16/.test(String(panel.背景)), String(panel && panel.背景));
check('面板有淡入 + 下移动效', panel && panel.动画 !== 'none', String(panel && panel.动画));
check('无 JS 异常', errs.length === 0, errs[0] || '');

const shot = await s('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) { writeFileSync('D:\\deep seek workplace\\_shots\\nav-mobile-panel.png', Buffer.from(shot.result.data, 'base64')); console.log('\n  ✓ nav-mobile-panel.png'); }

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
