// shot-align.mjs — 1920 视口下首页/画廊顶部截图（验证导航-内容对齐）
import { writeFileSync } from 'node:fs';

const CDP = 'http://127.0.0.1:9222';
const BASE = 'http://127.0.0.1:4321';
const target = await (await fetch(CDP + '/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const q = pending.get(m.id); pending.delete(m.id); m.error ? q.rej(new Error(JSON.stringify(m.error))) : q.res(m.result); } };
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 950, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');

for (const [page, name] of [['/', 'align-home-1920'], ['/gallery/', 'align-gallery-1920']]) {
  await send('Page.navigate', { url: BASE + page });
  for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 120)); const rs = await send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true }); if (rs.result.value === 'complete') break; }
  await new Promise(r => setTimeout(r, 800));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('D:/deep seek workplace/endfield-blog/_shots/' + name + '.png', Buffer.from(shot.data, 'base64'));
  console.log('saved ' + name + '.png');
}
ws.close(); process.exit(0);
