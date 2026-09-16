// 逐帧记录首页大标题两行的几何，找出"加载出来之前错位"的具体表现。
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const p = new Map();
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); } };
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });

// 在文档里从最早时刻开始逐帧采样
await s('Page.addScriptToEvaluateOnNewDocument', {
  source: `window.__g=[]; window.__t0=performance.now();
    (function tick(){
      try{
        const h1=document.querySelector('h1.display');
        const rows=[...document.querySelectorAll('.display .stroke-line')];
        const svg=document.querySelector('.display .stroke-line .stroke-text__svg');
        const rec=(el)=>{ if(!el) return null; const b=el.getBoundingClientRect();
          return [Math.round(b.x),Math.round(b.y),Math.round(b.width),Math.round(b.height)]; };
        window.__g.push({ t:Math.round(performance.now()-window.__t0), h1:rec(h1), n:rows.length,
          r0:rec(rows[0]), r1:rec(rows[1]), svg:rec(svg),
          vb: svg?svg.getAttribute('viewBox'):null, glyphs: document.querySelectorAll('[data-stroke-char]').length });
      }catch(e){}
      requestAnimationFrame(tick);
    })();`,
});

await s('Page.navigate', { url: BASE + '/' });
await sleep(5000);
const data = await ev(`(()=>{
  const G=window.__g||[];
  // 只保留"有变化"的帧，压缩输出
  const key=(x)=>JSON.stringify([x.h1,x.n,x.r0,x.r1,x.vb,x.glyphs]);
  const out=[]; let last=null;
  for(const g of G){ const k=key(g); if(k!==last){ out.push(g); last=k; } }
  return {总帧:G.length, 变化帧:out.length, 序列:out.slice(0,14)};
})()`);
console.log('总帧=' + data.总帧 + '  变化帧=' + data.变化帧);
data.序列.forEach((g) => {
  console.log(`t=${String(g.t).padStart(4)}ms h1=${JSON.stringify(g.h1)} 行数=${g.n} 第1行=${JSON.stringify(g.r0)} 第2行=${JSON.stringify(g.r1)} 字形数=${g.glyphs} vb=${g.vb}`);
});
ws.close();
