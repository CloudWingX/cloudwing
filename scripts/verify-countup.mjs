// 验证侧栏统计的 CountUp：初次加载计数过程 + 软导航后是否重放。
// 用法：node scripts/verify-countup.mjs [baseUrl]
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/blog/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map(); const errs = [];
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

const readVals = async () => {
  const r = await send('Runtime.evaluate', {
    expression: `[...document.querySelectorAll('.sw-stats .v')].map(e => e.textContent.trim()).join(' | ')`,
    returnByValue: true,
  });
  return r.result?.result?.value;
};
const hasIslands = async () => {
  const r = await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('astro-island[component-export="default"]').length + ' islands; sw-stats 数=' + document.querySelectorAll('.sw-stats .v').length`,
    returnByValue: true,
  });
  return r.result?.result?.value;
};

console.log(`=== 首屏加载 ${BASE}/blog/ ===`);
await send('Page.navigate', { url: BASE + '/blog/' });
// 尽早采样，捕捉从 0 计上去的过程
const samples = [];
for (let t = 0; t < 14; t++) {
  await sleep(250);
  samples.push(await readVals());
}
console.log('  计数采样（每 250ms）:');
samples.forEach((s, i) => console.log(`    ${(i * 0.25).toFixed(2)}s  ${s}`));
console.log('  ' + await hasIslands());

console.log(`\n=== 软导航到 /gallery/ 后是否重放 ===`);
await send('Runtime.evaluate', { expression: `[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')==='/gallery/')?.click()` });
const after = [];
for (let t = 0; t < 14; t++) {
  await sleep(250);
  after.push(await readVals());
}
console.log('  采样:');
after.forEach((s, i) => console.log(`    ${(i * 0.25).toFixed(2)}s  ${s}`));
console.log('  ' + await hasIslands());

console.log(`\n=== 硬刷新（reload）后是否重放 ===`);
await send('Page.reload');
const rel = [];
for (let t = 0; t < 14; t++) {
  await sleep(250);
  rel.push(await readVals());
}
rel.forEach((s, i) => console.log(`    ${(i * 0.25).toFixed(2)}s  ${s}`));

if (errs.length) console.log('\n页面异常: ' + errs.slice(0, 3).join(' ;; '));
else console.log('\n无 JS 异常');
ws.close();
