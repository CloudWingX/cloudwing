// 全站背景一致性：每个页面「视频存在 / 在播 / 透明度 / 粒子仍在 / 底色动画」是否一致。
// 同时记录软导航时视频节点是否被重建（seq 不变 = 复用）。
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const THEME = process.argv[3] === 'light' ? 'light' : 'dark';

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

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: THEME }] });
await s('Page.addScriptToEvaluateOnNewDocument', {
  source: `try{localStorage.setItem('cw-theme-pref','${THEME}');}catch(e){}
    window.__seqc=0;(function t(){try{var v=document.querySelector('.video-bg__el');
      if(v&&!v.__seq) v.__seq=++window.__seqc;}catch(e){}requestAnimationFrame(t);})();`,
});
const waitFor = async (x, ms = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(400); } return false; };

const snap = () => ev(`(()=>{
  const v=document.querySelector('.video-bg__el'), w=document.querySelector('.video-bg');
  const part=document.querySelector('.pparticles-layer'), grid=document.querySelector('.grid-bg');
  return {path:location.pathname,
    has:!!v, seq:v?v.__seq:null, paused:v?v.paused:null, ready:v?v.readyState:null,
    opacity:v?getComputedStyle(v).opacity:null, z:w?getComputedStyle(w).zIndex:null,
    particles:!!part, grid:!!grid,
    cls:document.body.className, bgAnim:getComputedStyle(document.body).animationName};})()`);

const PAGES = ['/', '/blog/', '/gallery/', '/about/', '/account/', '/404.html'];
console.log(`=== 逐个硬刷新访问（主题 ${THEME}）===`);
const seqs = new Set();
for (const path of PAGES) {
  await s('Page.navigate', { url: BASE + path });
  await waitFor(`(()=>{const v=document.querySelector('.video-bg__el');return v&&v.readyState>=2;})()`, 45000);
  await sleep(1200);
  const d = await snap();
  seqs.add(d.seq);
  console.log(`  ${String(path).padEnd(12)} 存在=${d.has?1:0} 在播=${d.paused===false?1:0} ready=${d.ready} 透明度=${d.opacity} z=${d.z} 粒子=${d.particles?1:0} 光晕=${d.grid?1:0}`);
  if (path !== '/404.html') {
    check(`${path} 有视频且在播`, d.has && d.paused === false && d.ready >= 2);
    check(`${path} 视频层级/透明度正确`, d.z === '-4' && parseFloat(d.opacity) > 0.05 && parseFloat(d.opacity) < 1, `z=${d.z} op=${d.opacity}`);
    check(`${path} 旧背景（粒子/光晕）仍在`, d.particles === true && d.grid === true);
    check(`${path} body 带 has-video-bg`, /has-video-bg/.test(d.cls), d.cls);
  }
}

console.log('\n=== 软导航一圈（应复用同一个视频节点）===');
await s('Page.navigate', { url: BASE + '/' });
await waitFor(`(()=>{const v=document.querySelector('.video-bg__el');return v&&v.readyState>=2;})()`, 45000);
await sleep(1000);
const before = (await snap()).seq;
for (const path of ['/blog/', '/gallery/', '/about/', '/account/']) {
  await ev(`[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')===${JSON.stringify(path)})?.click()`);
  await waitFor(`location.pathname===${JSON.stringify(path)}`, 20000);
  await sleep(1500);
  const d = await snap();
  console.log(`  ${String(path).padEnd(12)} seq=${d.seq} 在播=${d.paused===false?1:0} ready=${d.ready} 粒子=${d.particles?1:0}`);
  check(`软导航到 ${path}：视频未被重建且仍在播`, d.seq === before && d.paused === false && d.ready >= 2, `seq=${d.seq}`);
}
check('全程无 JS 异常', errs.length === 0, errs[0] || '');

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
