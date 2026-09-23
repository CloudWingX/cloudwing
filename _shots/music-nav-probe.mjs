// §78 探针：手机视口下音乐页「点播放前后」导航栏几何对比
import WebSocket from 'file:///C:/Users/24645/.workbuddy/binaries/node/workspace/node_modules/ws/index.js';
const CDP = 'http://127.0.0.1:9222';
const BASE = process.argv[2] || 'http://localhost:4321';
const list = await (await fetch(CDP + '/json/new?url=' + encodeURIComponent('about:blank'), { method: 'PUT' })).json();
const ws = new WebSocket(list.webSocketDebuggerUrl, { perMessageDeflate: false });
let id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } });
await new Promise(r => ws.on('open', r));
await send('Page.enable');
// iPhone 视口
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true });
await send('Page.navigate', { url: BASE + '/music/' });
await new Promise(r => setTimeout(r, 6000));

const meas = `(() => {
  const c = document.querySelector('.header-container');
  const h = document.querySelector('.site-header');
  const r = c.getBoundingClientRect();
  return JSON.stringify({
    scrolled: document.documentElement.getAttribute('data-scrolled'),
    container: { x: Math.round(r.x*10)/10, y: Math.round(r.y*10)/10, w: Math.round(r.width*10)/10, h: Math.round(r.height*10)/10 },
    headerPadTop: getComputedStyle(h).paddingTop,
    scrollY: Math.round(window.scrollY),
    docW: document.documentElement.clientWidth,
    playing: document.querySelector('.mp-play')?.classList.contains('is-playing') || document.body.className,
  });
})()`;

const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.value;
console.log('BEFORE:', await ev(meas));

// 找播放按钮并点击（真 touch/pointer 序列更接近实机；先 click）
const clickPlay = `(() => {
  const btn = document.querySelector('.mp-play') || document.querySelector('[data-mp-play]') || document.querySelector('button[aria-label*="播放"]');
  if (!btn) return 'NO_BTN:' + [...document.querySelectorAll('button')].map(b=>b.className).slice(0,12).join('|');
  btn.click();
  return 'CLICKED ' + btn.className;
})()`;
console.log(await ev(clickPlay));
await new Promise(r => setTimeout(r, 2500));
console.log('AFTER:', await ev(meas));

// 若还没播放，再等一下（可能有淡入）后再量一次
await new Promise(r => setTimeout(r, 3000));
console.log('AFTER2:', await ev(meas));

const shot = await send('Page.captureScreenshot', { format: 'png' });
const fs = await import('fs');
fs.writeFileSync('_shots/music-nav-s78.png', Buffer.from(shot.data, 'base64'));
await fetch(CDP + '/json/close/' + list.id);
process.exit(0);
