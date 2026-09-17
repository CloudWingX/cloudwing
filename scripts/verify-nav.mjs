// 验证导航栏 / 二级菜单的边框与高斯模糊是否生效。
// 用法：node scripts/verify-nav.mjs [baseUrl] [light|dark]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const THEME = process.argv[3] === 'light' ? 'light' : 'dark';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const OUT = 'D:\\deep seek workplace\\_shots';

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const p = new Map(); const errs = [];
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push((((m.params.exceptionDetails.exception || {}).description) || '').slice(0, 100));
  if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
};
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: THEME }] });
await s('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('cw-theme-pref','${THEME}');}catch(e){}` });
await s('Page.navigate', { url: BASE + '/works/' });
const waitFor = async (x, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(400); } return false; };
await waitFor(`!!document.querySelector('.hd')`);
await sleep(1500);

// ⚠️ 顶部是**刻意透明贴顶**的（ReactBits shrink 形态），胶囊在滚动后才成型 ——
// 所以这里先滚下去再采样；顶部形态由 verify-nav-shrink.mjs 专测。
await ev(`window.scrollTo(0, 400)`);
await sleep(900);
// 上滑一点让 autoHideHeader 把导航滑回来（否则它收在屏幕外，量到 top 为负）
await ev(`window.scrollTo(0, 340)`);
await sleep(1200);

console.log(`=== 导航胶囊（主题 ${THEME}，滚动后）===`);
// 导航已从"通栏条"改为"顶部悬浮玻璃胶囊"：玻璃材质直接落在 .hd 上（不再有 .hd-glass 层）。
const bar = await ev(`(()=>{const hd=document.querySelector('.hd'); if(!hd) return null; const c=getComputedStyle(hd);
  const b=hd.getBoundingClientRect();
  return {边框:c.borderTopWidth+' '+c.borderTopStyle+' '+c.borderTopColor,
    // 注意：构建时的 CSS 压缩可能只保留 -webkit-backdrop-filter（Chrome 认这个，效果一样），
    // 所以两个属性都读，只读标准属性会误判成 none。
    模糊:c.backdropFilter||c.webkitBackdropFilter||'none',
    背景:c.backgroundColor,
    圆角:c.borderTopLeftRadius,
    宽:Math.round(b.width), 高:Math.round(b.height), 顶部距:Math.round(b.top),
    视口宽:document.documentElement.clientWidth,
    pointerEvents:c.pointerEvents,
    最右:Math.round(b.right), 最左:Math.round(b.left)};})()`);
console.log('  ' + JSON.stringify(bar));
// 胶囊：宽 min(1200px, 100% - 40px) 居中、距顶 16px、圆角 999px（完全圆头）
const expW = Math.min(1120, bar.视口宽);
check('滚动后胶囊宽度收到 1120', Math.abs(bar.宽 - expW) <= 2, `宽=${bar.宽} 期望=${expW}`);
check('胶囊居中', Math.abs(bar.最左 - (bar.视口宽 - bar.宽) / 2) <= 2, `左=${bar.最左}`);
check('滚动后距顶部 16px（下沉）', Math.abs(bar.顶部距 - 16) <= 2, String(bar.顶部距));
check('圆角 999px（完全圆头）', parseFloat(bar.圆角) >= 40, bar.圆角);
const borderW = parseFloat(String(bar.边框));
check('有可见边框（1px）', borderW >= 1, bar.边框);
check('边框不是透明', !/rgba\([^)]*,\s*0\)/.test(String(bar.边框)), bar.边框);
check('胶囊内有高斯模糊', /blur\(\s*\d+/.test(String(bar.模糊)) && parseFloat(String(bar.模糊).match(/blur\((\d+)/)[1]) >= 12, String(bar.模糊));
check('背景为半透明玻璃（非纯色）', /rgba\(/.test(String(bar.背景)), String(bar.背景));

console.log('\n=== 二级菜单（下拉容器）===');
await ev(`(()=>{const c=document.querySelector('[data-nav-caret]'); if(c) c.click();})()`);
await sleep(700);
const sub = await ev(`(()=>{const el=document.querySelector('.nav-sub'); const c=getComputedStyle(el);
  const b=el.getBoundingClientRect();
  return {可见:c.visibility==='visible'&&parseFloat(c.opacity)>0.9,
    边框:c.borderTopWidth+' '+c.borderTopStyle+' '+c.borderTopColor,
    模糊:c.backdropFilter||c.webkitBackdropFilter,
    背景:(c.backgroundImage||c.backgroundColor||'').slice(0,60),
    尺寸:Math.round(b.width)+'×'+Math.round(b.height),
    子项数:el.querySelectorAll('li').length};})()`);
console.log('  ' + JSON.stringify(sub));
const subW = parseFloat(String(sub.边框));
check('二级菜单已展开', sub.可见 === true && sub.子项数 > 0, `${sub.子项数} 项`);
check('二级菜单有可见边框', subW >= 1, sub.边框);
check('二级菜单边框内有高斯模糊', /blur\(\s*\d+/.test(String(sub.模糊)) && parseFloat(String(sub.模糊).match(/blur\((\d+)/)[1]) >= 12, String(sub.模糊));
// 背景必须足够实：太透会让底下的卡片文字透进来（历史症状）
const alpha = String(sub.背景).match(/rgba?\([^)]*?,\s*(0?\.\d+)\)/g) || [];
const minA = alpha.length ? Math.min(...alpha.map((x) => parseFloat(x.match(/,\s*(0?\.\d+)\)/)[1]))) : 1;
check('二级菜单背景足够实（不透字）', minA >= 0.9 || !String(sub.背景).includes('rgba'), `最低 alpha=${minA}`);

console.log('\n=== 布局未受影响 ===');
check('无横向溢出', (await ev(`document.documentElement.scrollWidth-document.documentElement.clientWidth`)) === 0);
check('导航项仍可点击（元素在最上层）', (await ev(`(()=>{const a=document.querySelector('.nav a[href="/works/"]');
  if(!a) return false; const b=a.getBoundingClientRect();
  const top=document.elementFromPoint(Math.round(b.left+b.width/2), Math.round(b.top+b.height/2));
  return a===top||a.contains(top)||top?.closest('.nav')!==null;})()`)) === true);
check('无 JS 异常', errs.length === 0, errs[0] || '');

const shot = await s('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) { writeFileSync(`${OUT}\\nav-${THEME}.png`, Buffer.from(shot.result.data, 'base64')); console.log(`\n  ✓ nav-${THEME}.png`); }

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
