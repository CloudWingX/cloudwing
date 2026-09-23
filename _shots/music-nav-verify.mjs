// §78 验证探针：手机视口播放全程 nav 宽度恒定 + scrollWidth 不越界
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
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send('Page.navigate', { url: BASE + '/music/' });
await new Promise(r => setTimeout(r, 6000));
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.value;

const scan = `(() => {
  const vw = document.documentElement.clientWidth;
  const c = document.querySelector('.header-container').getBoundingClientRect();
  return JSON.stringify({ vw, scrollW: document.documentElement.scrollWidth, navW: Math.round(c.width*10)/10, navX: Math.round(c.x*10)/10 });
})()`;

let allOk = true;
console.log('BEFORE:', await ev(scan));
await ev(`document.querySelector('.mp-play').click()`);
// 播放后 8 秒密集采样（覆盖 45° 最宽点 ~2.5s）
let t = 0; const steps = [400, 400, 400, 500, 700, 1000, 1500, 1500, 1000];
for (const d of steps) { t += d; await new Promise(r => setTimeout(r, d)); const s = JSON.parse(await ev(scan));
  if (s.scrollW > s.vw || Math.abs(s.navW - s.vw) > 1) { console.log('FAIL T+' + t + ':', JSON.stringify(s)); allOk = false; }
  else console.log('T+' + t + ': OK', JSON.stringify(s));
}
console.log('NAV_FIX=' + (allOk ? 'PASS' : 'FAIL'));
const shot = await send('Page.captureScreenshot', { format: 'png' });
const fs = await import('fs');
fs.writeFileSync('_shots/music-nav-fixed' + (BASE.includes('localhost') ? '-local' : '') + '.png', Buffer.from(shot.data, 'base64'));
await fetch(CDP + '/json/close/' + list.id);
process.exit(allOk ? 0 : 1);
