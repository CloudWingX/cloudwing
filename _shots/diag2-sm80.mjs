// 诊断 v2：ws 包 + raw message dump，验证 CDP 通路
import WebSocket from 'file:///C:/Users/24645/.workbuddy/binaries/node/workspace/node_modules/ws/index.js';
import { appendFileSync } from 'fs';
const LOGF = new URL('./diag2-out.log', import.meta.url);
try { appendFileSync(LOGF, ''); } catch {}
const t0 = Date.now();
const log = (...a) => { const line = (Date.now() - t0) + 'ms ' + a.join(' '); try { appendFileSync(LOGF, line + '\n'); } catch {} };
setTimeout(() => { log('WATCHDOG_EXIT'); process.exit(2); }, 20000);
const tab = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { const to = setTimeout(() => j(new Error('open timeout')), 5000); ws.on('open', () => { clearTimeout(to); r(); }); ws.on('error', j); });
log('ws open');
ws.on('message', (d) => { const m = JSON.parse(d); log('<<', m.id ?? m.method, m.result ? JSON.stringify(m.result).slice(0, 60) : ''); });
let id = 0;
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; ws.send(JSON.stringify({ id: i, method: m, params: pp })); ws.once('message', function h(d) { const x = JSON.parse(d); if (x.id === i) r(x); else ws.once('message', h); }); });
await s('Page.enable');
log('Page.enable ok');
await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
log('emulation ok');
await s('Page.navigate', { url: 'http://127.0.0.1:4321/blog/' });
await new Promise((r) => setTimeout(r, 3000));
const v = (await s('Runtime.evaluate', { expression: "!!document.querySelector('[data-mnav-toggle]')", returnByValue: true })).result.result.value;
log('toggle present:', v);
await fetch('http://127.0.0.1:9222/json/close/' + tab.id);
process.exit(0);
