// §63 证红/证绿：软导航跨页后是否发生「计划外整页刷新」（buildstamp 误判）。
// 判据：硬加载 A 页 → 打内存标记 → 软导航到 B 页 → 标记仍在 = 没刷新（绿）；
// 标记消失 = 发生了 location.reload()（红，§60 指纹逐页漂移缺陷）。
// §63 跨页软导航零误刷常驻回归（指纹逐页漂移缺陷的守卫）。线上用法：node scripts/verify-noreload.mjs https://cloudwing.pages.dev
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
const clickAt = async (x, y) => {
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', { type, x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 });
  }
};

await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: BASE + '/posts/?cb=' + Date.now() });
await sleep(4000);

// A → B：/posts/ 软导航到 /about/（不同页面，指纹若漂移必触发 reload）
await ev(`window.__noReload = 'alive'`);
const link = await ev(`(() => { const a = [...document.querySelectorAll('a[href="/about/"]')].find(a => a.getBoundingClientRect().width > 0);
  if (!a) return null; const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
await clickAt(link.x, link.y);
await sleep(4500);
const url1 = await ev(`location.pathname`);
const alive1 = await ev(`window.__noReload === 'alive'`);
check(`软导航 /posts/ → ${url1} 无计划外刷新`, alive1 === true && url1 === '/about/', `marker=${alive1 ? 'alive' : 'GONE（发生了 reload）'}`);

// B → C：/about/ 软导航到 /gallery/
await ev(`window.__noReload = 'alive2'`);
const link2 = await ev(`(() => { const a = [...document.querySelectorAll('a[href="/gallery/"]')].find(a => a.getBoundingClientRect().width > 0);
  if (!a) return null; const r = a.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
await clickAt(link2.x, link2.y);
await sleep(4500);
const url2 = await ev(`location.pathname`);
const alive2 = await ev(`window.__noReload === 'alive2'`);
check(`软导航 /about/ → ${url2} 无计划外刷新`, alive2 === true && url2 === '/gallery/', `marker=${alive2 ? 'alive2' : 'GONE（发生了 reload）'}`);

// 指纹一致性：当前页 meta 与内存戳应相同（软导航后不发生误判重置）
const stamps = await ev(`(() => { const m = document.querySelector('meta[name="cw-build"]');
  return { dom: m ? m.getAttribute('content') : null, mem: window.__cwBuildStamp || null }; })()`);
check('指纹一致（DOM=内存）', stamps.dom === stamps.mem, JSON.stringify(stamps));

console.log(`\n=== ${results.filter(Boolean).length}/${results.length} 通过 ===`);
ws.close();
process.exit(results.every(Boolean) ? 0 : 1);
