// 探针：某点上有哪些元素/伪元素在画（用来把像素坐标翻译成 DOM）。
// 用法：node scripts/probe-point.mjs <page> <x> <y>
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = 'http://127.0.0.1:4321';
const PAGE = process.argv[2] || '/';
const PX = +(process.argv[3] || 1091), PY = +(process.argv[4] || 188);
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
await s('Page.navigate', { url: BASE + PAGE });
const waitFor = async (x, ms = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(400); } return false; };
await waitFor(`(()=>{const v=document.querySelector('.video-bg__el');return v&&v.readyState>=2;})()`, 60000);
await sleep(2500);
await ev(`(()=>{const st=document.createElement('style');st.textContent='*,*::before,*::after{animation:none !important;transition:none !important}';document.head.appendChild(st);return true;})()`);
await ev(`document.querySelector('.video-bg__el')?.pause()`);
await sleep(600);

const info = await ev(`(()=>{const pt=[${PX},${PY}];
  const els=document.elementsFromPoint(pt[0],pt[1]);
  const d=(e)=>{ if(!e) return 'null'; const r=e.getBoundingClientRect();
    return e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).join('.'):'')
      +' ['+[r.left,r.top,r.right,r.bottom].map(Math.round).join(',')+']'; };
  const chain=els.map(d);
  const pe=[];
  for(const e of els){ for(const which of ['::before','::after']){ const c=getComputedStyle(e,which);
    if(c.content&&c.content!=='none') pe.push(d(e)+which+' bg='+c.backgroundImage.slice(0,90)+' bgc='+c.backgroundColor+' box='+c.inset+' w='+c.width+' h='+c.height); } }
  return JSON.stringify({chain,pe},null,1);})()`);
console.log(info);

try { await fetch(`${CDP}/json/close/${tab.id}`); } catch { /* 忽略 */ }
ws.close();
