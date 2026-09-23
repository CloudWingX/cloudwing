// 探针：点开抽屉后分时采样 transform，判断「未动画」vs「被复位」
import WebSocket from 'file:///C:/Users/24645/.workbuddy/binaries/node/workspace/node_modules/ws/index.js';
import { appendFileSync, unlinkSync } from 'fs';
const LOGF = new URL('./diag4-out.log', import.meta.url);
try { unlinkSync(LOGF); } catch {}
const t0 = Date.now();
const log = (...a) => { try { appendFileSync(LOGF, (Date.now() - t0) + 'ms ' + a.join(' ') + '\n'); } catch {} };
setTimeout(() => { log('WATCHDOG'); process.exit(2); }, 30000);
const tab = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.on('open', r); ws.on('error', j); });
log('ws open');
let id = 0; const pend = new Map();
ws.on('message', (d) => { const m = JSON.parse(d); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
await s('Page.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await s('Page.navigate', { url: 'http://localhost:4321/blog/' });
await new Promise((r) => setTimeout(r, 4000));
log('loaded');
// 状态快照
log('st0:', await ev(`JSON.stringify({wired:!!window.__cwMNav?.wired, open:!!window.__cwMNav?.open, gsap:typeof window.gsap!=='undefined'||'module-only'})`));
await ev(`document.querySelector('[data-mnav-toggle]').click()`);
for (const ms of [0, 150, 400, 900, 1500]) {
  await new Promise((r) => setTimeout(r, ms));
  log('t+' + ms, await ev(`(()=>{const p=document.querySelector('[data-mnav-panel]');const i=p.querySelector('.sm-panel');const l=i.querySelectorAll('.sm-label')[0];
    return JSON.stringify({panelTr:getComputedStyle(i).transform.slice(0,40), hidden:p.hidden,
      labelTr:l?getComputedStyle(l).transform.slice(0,40):'-',
      num:i.querySelector('.sm-link')?.style.getPropertyValue('--sm-num')??'-',
      openCls:p.classList.contains('is-open')});})()`));
}
log('st1:', await ev(`JSON.stringify({open:!!window.__cwMNav?.open})`));
await fetch('http://127.0.0.1:9222/json/close/' + tab.id);
process.exit(0);
