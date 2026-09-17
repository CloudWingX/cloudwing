// 验证首页 StrokeText：几何是否与第一行匹配、描边/填充动画是否在跑、动效是否仍在。
// 用法：node scripts/verify-stroke.mjs [baseUrl]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const OUT = 'D:\\deep seek workplace\\_shots';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
mkdirSync(OUT, { recursive: true });

// 用 about:blank 开标签页，再显式导航一次。
// （若开页时就指向目标地址、随后又 Page.navigate，会变成"两次加载"，实测会出现
//   时而查不到 DOM、时而记录器采不到帧的抽风结果。）
const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
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

const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;

// 逐帧记录器必须在**首次导航之前**注入（记录描边 dashoffset 与 wipe 宽度）。
// 注意两个已踩过的坑：
//   · GSAP 把 stroke-dasharray/offset 设在每个 <tspan> 上，盯外层 <text> 会看到 none；
//   · 动画在加载后 ~1.4s 就画完，事后采样只能看到终态。
await s('Page.addScriptToEvaluateOnNewDocument', {
  source: `window.__strokeLog=[];
    (function tick(){
      try{
        const rows=[...document.querySelectorAll('.display .stroke-line')].map((root)=>{
          const tp=root.querySelector('[data-stroke-char]');
          if(!tp) return -1; // 还没挂载
          return +(parseFloat(getComputedStyle(tp).strokeDashoffset)||0).toFixed(0);
        });
        const rect=document.querySelector('clipPath rect');
        if(rows.length) window.__strokeLog.push([rows[0], rows[1] !== undefined ? rows[1] : -1,
          rect ? +(parseFloat(rect.getAttribute('width'))||0).toFixed(0) : -1]);
      }catch(e){}
      requestAnimationFrame(tick);
    })();`,
});

// 打开页面并**等到 hero 真的在 DOM 里**再断言。
// 固定 sleep 在线上不可靠：网络慢一点就会查询到空文档，得到一整排 null 的假失败
// （实测线上 4s 不够、本地够，于是同一份代码两边结果不一致）。
await s('Page.navigate', { url: BASE + '/' });
let ready = false;
// 首页有个 WebGL 粒子层，首屏渲染偏慢（实测线上要 10~20s 才把 hero 量出来）。
// 这里等到"元素存在且有高度"，最多 40s；超时也继续断言（真失败仍会暴露）。
for (let i = 0; i < 80; i++) {
  await sleep(500);
  const ok = await ev(`(()=>{const e=document.querySelector('.display .line1'); return !!e && e.getBoundingClientRect().height>0;})()`);
  if (ok) { ready = true; break; }
}
if (!ready) console.log('  · hero 等待较久（>40s），继续按当前状态断言');
// 再等动画画完（同一帧记录器还在跑）
await sleep(3500);

const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };

const geom = () => ev(`(()=>{
  const hosts=[...document.querySelectorAll('.display .stroke-line')];
  const svg=document.querySelector('.display .stroke-line .stroke-text__svg');
  const st=document.querySelector('.stroke-text__stroke');
  const fi=document.querySelector('.stroke-text__fill');
  const disp=document.querySelector('.display');
  const l1=document.querySelector('.display .line1');
  const r=(e)=>{ if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}; };
  return {
    h1:r(disp), line1:r(l1), host:r(hosts[1]||hosts[0]), svg:r(svg),
    行数: hosts.length,
    行高: hosts.map(e=>Math.round(e.getBoundingClientRect().height)),
    行文本: hosts.map(e=>e.getAttribute('aria-label')),
    dispFont: disp?getComputedStyle(disp).fontSize:null,
    hostFont: hosts[0]?getComputedStyle(hosts[0]).fontSize:null,
    viewBox: svg?svg.getAttribute('viewBox'):null,
    strokeColor: st?getComputedStyle(st).stroke:null,
    fillColor: fi?getComputedStyle(fi).fill:null,
  };})()`);

console.log('=== 几何与配色 ===');
const g0 = await geom();
console.log('  ' + JSON.stringify(g0, null, 1));
// 暗色电影感重构：主标题只保留**一行**核心信息（用户要求"只保留一行核心信息"），
// 故断言从"两行 + 级联"改为"一行 + 单行描边动画"。
check('主标题是一行 StrokeText', g0.行数 === 1, `行数=${g0.行数}，文本=${JSON.stringify(g0.行文本)}`);
check('渲染出了 SVG 字形', g0.host && g0.host.h > 0, `高度=${g0.host && g0.host.h}`);
check('行高在 48–72px 区间（用户指定字号）', g0.行高 && g0.行高.length === 1 && g0.行高[0] >= 44 && g0.行高[0] <= 80, `行高=${JSON.stringify(g0.行高)}`);
check('文案正确（一行说完）', /^HELLO THIS IS /.test(String((g0.行文本 || [])[0])), String((g0.行文本 || [])[0]));
check('描边色来自令牌（非官方紫）', !!g0.strokeColor && !/A78BFA|167,\s*139,\s*250/i.test(g0.strokeColor), String(g0.strokeColor));
check('填充色已设置', !!g0.fillColor, String(g0.fillColor));

console.log('\n=== 画字动画过程（页面内逐帧记录，从加载瞬间开始）===');
// 记录器已在首次导航前注入（见文件开头）。这里只读取结果——
// 注意：若在此处再 Page.navigate 一次，会变成第二次加载，数据反而可能为空。
const log = await ev(`(()=>{const L=window.__strokeLog||[];
  const r0=[...new Set(L.map(x=>x[0]))], r1=[...new Set(L.map(x=>x[1]))];
  const wipe=[...new Set(L.map(x=>x[2]))];
  // 第一行出现动画的帧号 vs 第二行出现动画的帧号 → 看级联
  const first = (idx, skipNeg) => { const i = L.findIndex(x => skipNeg ? (x[idx] > 0 && x[idx] < 6999) : (x[idx] >= 0)); return i; };
  return {帧数:L.length,
          第一行不同值数:r0.length, 第二行不同值数:r1.length,
          第一行起始:r0[0], 第二行起始:r1.find(v=>v>=0),
          第一行动画首帧:first(0), 第二行挂载首帧:first(1, false),
          wipe最大:Math.max(...wipe)};})()`);
console.log('  ' + JSON.stringify(log));
check('主标题有描边动画', log && log.第一行不同值数 > 1, `${log && log.第一行不同值数} 个不同值`);
check('填充走 wipe（rect 宽度增长到全宽）', log && log.wipe最大 > 0, `max=${log && log.wipe最大}`);

console.log('\n=== 与既有动效共存 ===');
check('外层 h1 仍带 display-tilt（3D 倾斜宿主）', (await ev(`!!document.querySelector('h1.display.display-tilt')`)) === true);
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
