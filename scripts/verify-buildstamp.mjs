// §60 构建指纹自愈探针（§7.6：先证红，再证绿，再证不循环）。
// §60 构建指纹自愈常驻回归（默认打本地 4321；线上用法：node scripts/verify-buildstamp.mjs https://cloudwing.pages.dev）
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = 'http://127.0.0.1:9222';
const results = [];
const check = (name, ok, detail = '') => { results.push(ok); console.log(`  ${ok ? '✅' : '❌'} ${name}${detail ? '  —— ' + detail : ''}`); };

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent('about:blank'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await send('Runtime.enable');
await send('Page.enable');
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send('Page.navigate', { url: BASE + '/?cb=' + Date.now() });
await sleep(3500);

// ① 基线：戳一致时手动派发 astro:page-load → 不应刷新
await ev(`window.__probe = 'alive'; document.dispatchEvent(new Event('astro:page-load'))`);
await sleep(1500);
const alive = await ev(`window.__probe === 'alive'`);
check('戳一致时不触发刷新', alive === true);

// ② 缺陷态：伪造旧戳（= 存量标签页跨部署）→ 必须触发整页刷新
await ev(`window.__cwBuildStamp = 'stale-deploy'; window.__probe = 'armed'`);
await ev(`document.dispatchEvent(new Event('astro:page-load'))`);
let reloaded = false;
for (let i = 0; i < 20; i++) {
  await sleep(400);
  reloaded = (await ev(`window.__probe === 'armed'`)) === false;
  if (reloaded) break;
}
const stampNow = await ev(`window.__cwBuildStamp`);
check('伪造旧戳后触发整页刷新', reloaded === true, `stamp=${stampNow}`);
check('刷新后戳已一致', stampNow !== 'stale-deploy');

// ③ 防环：模拟「为构建 X 刷过一次、但 DOM 还是 X 且 JS 仍旧」——防护表已记 X → 必须放弃刷新
await ev(`(() => {
  var meta = document.querySelector('meta[name="cw-build"]');
  meta.setAttribute('content', 'ghost-build');
  try { sessionStorage.setItem('cwBuildReload', 'ghost-build'); } catch (e) {}
  window.__cwBuildStamp = 'old-js';
  window.__probe = 'alive2';
})()`);
await ev(`document.dispatchEvent(new Event('astro:page-load'))`);
await sleep(1500);
const alive2 = await ev(`window.__probe === 'alive2'`);
check('sessionStorage 防环：同一构建只刷一次', alive2 === true);

console.log(`\n=== ${results.filter(Boolean).length}/${results.length} 通过 ===`);
ws.close();
process.exit(results.every(Boolean) ? 0 : 1);
