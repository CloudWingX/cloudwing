// 验证首页 StrokeText：几何是否与第一行匹配、描边/填充动画是否在跑、动效是否仍在。
// 用法：node scripts/verify-stroke.mjs [baseUrl]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const OUT = 'D:\\deep seek workplace\\_shots';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
mkdirSync(OUT, { recursive: true });

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const p = new Map(); const errs = [];
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text);
  if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
};
await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });
// 先真正打开页面再断言：withTab 的初始 url 在 about:blank 上不执行，
// 直接查询会拿到一整排 null（踩过一次）。
await s('Page.navigate', { url: BASE + '/' });
await sleep(4000);

const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };

const geom = () => ev(`(()=>{
  const l1=document.querySelector('.display .line1');
  const host=document.querySelector('.display .stroke-line');
  const svg=document.querySelector('.display .stroke-line .stroke-text__svg');
  const st=document.querySelector('.stroke-text__stroke');
  const fi=document.querySelector('.stroke-text__fill');
  const disp=document.querySelector('.display');
  const r=(e)=>{ if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}; };
  return {
    h1:r(disp), line1:r(l1), host:r(host), svg:r(svg),
    dispFont: disp?getComputedStyle(disp).fontSize:null,
    hostFont: host?getComputedStyle(host).fontSize:null,
    svgH: svg?getComputedStyle(svg).height:null,
    viewBox: svg?svg.getAttribute('viewBox'):null,
    strokeColor: st?getComputedStyle(st).stroke:null,
    fillColor: fi?getComputedStyle(fi).fill:null,
    ariaLabel: host?host.getAttribute('aria-label'):null,
    strokeDash: st?st.style.strokeDashoffset||getComputedStyle(st).strokeDashoffset:null,
  };})()`);

console.log('=== 几何与配色 ===');
const g0 = await geom();
console.log('  ' + JSON.stringify(g0, null, 1));
check('StrokeText 根节点已渲染', !!g0.host);
check('第一行与标题同级存在', !!g0.line1);
check('两行高度接近（不出现明显错位）', g0.host && g0.line1 && Math.abs(g0.host.h - g0.line1.h) <= 22, `line1=${g0.line1 && g0.line1.h} host=${g0.host && g0.host.h}`);
check('aria-label 正确', g0.ariaLabel === 'CloudWing', String(g0.ariaLabel));
check('描边色来自令牌（非官方紫）', !!g0.strokeColor && !/A78BFA|167,\s*139,\s*250/i.test(g0.strokeColor), String(g0.strokeColor));
check('填充色已设置', !!g0.fillColor, String(g0.fillColor));

console.log('\n=== 画字动画过程（页面内逐帧记录，从加载瞬间开始）===');
// 关键1：动画在页面加载后 1.4s 左右就画完，事后采样只能看到终态。
// 关键2：GSAP 把 stroke-dasharray/offset 设在**每个 <tspan>** 上（不是外层 <text>），
//        盯 <text> 会看到 "none" 而误判"没有描边动画"（踩过一次）。
await s('Page.addScriptToEvaluateOnNewDocument', {
  source: `window.__strokeLog=[];
    (function tick(){
      try{
        const tp=document.querySelector('[data-stroke-char]');
        const rect=document.querySelector('clipPath rect');
        if(tp) window.__strokeLog.push([
          +(parseFloat(getComputedStyle(tp).strokeDashoffset)||0).toFixed(0),
          rect ? +(parseFloat(rect.getAttribute('width'))||0).toFixed(0) : -1
        ]);
      }catch(e){}
      requestAnimationFrame(tick);
    })();`,
});
await s('Page.navigate', { url: BASE + '/' });
await sleep(4200);
const log = await ev(`(()=>{const L=window.__strokeLog||[];
  const dash=[...new Set(L.map(x=>x[0]))];
  const wipe=[...new Set(L.map(x=>x[1]))];
  return {帧数:L.length, 描边出现过的值:dash.slice(0,8), 描边不同值数:dash.length,
          wipe起始:wipe.slice(0,4), wipe最大:Math.max(...wipe)};})()`);
console.log('  ' + JSON.stringify(log));
check('描边有动画（dashoffset 从大值收到 0）', log && log.描边不同值数 > 1, `不同值 ${log && log.描边不同值数} 个：${log && log.描边出现过的值}`);
check('填充走 wipe（rect 宽度增长到全宽）', log && log.wipe最大 > 0, `max=${log && log.wipe最大}`);

console.log('\n=== 与既有动效共存 ===');
check('外层 h1 仍是 .display-tilt（3D 倾斜宿主）', (await ev(`!!document.querySelector('.display-tilt')`)) === true);
check('视差变量仍在下发（--frx）', (await ev(`(()=>{const e=document.querySelector('.display-tilt'); return getComputedStyle(e).getPropertyValue('--frx').trim();})()`)) !== '');
check('无 JS 异常', errs.length === 0, errs[0] || '');

// 截图（含动画中与结束）
const shot = async (name) => {
  const r = await s('Page.captureScreenshot', { format: 'png' });
  if (r.result?.data) { writeFileSync(`${OUT}\\${name}`, Buffer.from(r.result.data, 'base64')); console.log('  ✓ ' + name); }
};
await s('Page.navigate', { url: BASE + '/' });
await sleep(500); await shot('stroke-mid.png');
await sleep(4000); await shot('stroke-end.png');

const failed = results.filter((x) => !x.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
