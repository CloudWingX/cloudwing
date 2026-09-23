// §78 探针2：播放瞬间的横向溢出源定位
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

// 溢出源扫描：列出 right>视口宽 或 left<0 的可见元素
const scan = `(() => {
  const vw = document.documentElement.clientWidth;
  const bad = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      bad.push(el.tagName + '.' + String(el.className).split(' ').slice(0,2).join('.') + ' L' + Math.round(r.left) + ' R' + Math.round(r.right) + ' W' + Math.round(r.width));
    }
  }
  return JSON.stringify({ vw, scrollW: document.documentElement.scrollWidth, bodyScrollW: document.body.scrollWidth, bad: bad.slice(0, 14) });
})()`;

console.log('BEFORE:', await ev(scan));
await ev(`document.querySelector('.mp-play').click()`);
// 播放后密集采样
for (const delay of [300, 800, 1500, 2500, 4000]) {
  await new Promise(r => setTimeout(r, delay === 300 ? 300 : delay - (delay > 300 ? [300,800,1500,2500][[300,800,1500,2500,4000].indexOf(delay)-1] : 0)));
  console.log('T+' + delay + ':', await ev(scan));
}
await fetch(CDP + '/json/close/' + list.id);
process.exit(0);
