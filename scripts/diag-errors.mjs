// 找出线上到底哪个页面抛 React 错误，并打印错误详情。
// 用法：node scripts/diag-errors.mjs [baseUrl]
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'https://cloudwing.pages.dev').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const PAGES = ['/', '/posts/', '/blog/', '/gallery/', '/about/', '/account/', '/404.html'];

const sleep2 = sleep;
for (const path of PAGES) {
  const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const p = new Map(); const errs = [];
  const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      errs.push(((d.exception || {}).description || d.text || '').split('\n').slice(0, 3).join(' | ').slice(0, 260));
    }
    if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
  };
  await s('Page.enable'); await s('Runtime.enable');
  await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await s('Page.navigate', { url: BASE + path });
  // 等到页面真正就绪（轮询，不用固定 sleep）
  const t0 = Date.now();
  while (Date.now() - t0 < 30000) {
    const r = await s('Runtime.evaluate', { expression: `document.readyState === 'complete' && !!document.querySelector('main')`, returnByValue: true });
    if (r.result?.result?.value) break;
    await sleep2(500);
  }
  await sleep2(3500); // 留时间给水合与延迟挂载的行
  console.log(`${path.padEnd(20)} 异常=${errs.length}${errs.length ? '  ' + errs[0] : ''}`);
  ws.close();
  try { await fetch(`${CDP}/json/close/${tab.id}`); } catch {}
}
