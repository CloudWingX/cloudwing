// probe-seek-live.mjs — 定位「线上 seek 失败」：处理函数没跑到 vs 浏览器 seek 行为
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'https://cloudwing.pages.dev').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/blog/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value;

await send('Page.navigate', { url: BASE + '/blog/' });
await sleep(4500);

// 1) 劫持捕获阶段 click，记录到达处理链时的一切状态
await ev(`(()=>{window.__sd={};
  document.addEventListener('click',e=>{
    const bar=e.target&&e.target.closest?e.target.closest('[data-mu-bar]'):null;
    const a=window.__cwMusic&&window.__cwMusic.audio;
    const r=bar?bar.getBoundingClientRect():null;
    window.__sd={clientX:e.clientX,isTrusted:e.isTrusted,barFound:!!bar,
      rleft:r?+r.left.toFixed(1):null,rwidth:r?+r.width.toFixed(1):null,
      durAtHandler:a?+Number(a.duration).toFixed(2):null,
      seekableLen:a?a.seekable.length:null,
      seekableEnd:(a&&a.seekable.length)?+a.seekable.end(a.seekable.length-1).toFixed(1):null,
      readyStateAt:a?a.readyState:null,
      bufferedEnd:(a&&a.buffered.length)?+a.buffered.end(a.buffered.length-1).toFixed(1):null,
      ctBefore:a?+a.currentTime.toFixed(2):null};
  },true);})()`);

await ev(`document.querySelectorAll('[data-mu-toggle]')[0].click()`);
await sleep(2000);
console.log('after-play state:', JSON.stringify(await ev(`(()=>{const a=window.__cwMusic.audio;return{paused:a.paused,ct:+a.currentTime.toFixed(2),dur:+a.duration.toFixed(2),ready:a.readyState,bufEnd:a.buffered.length?+a.buffered.end(0).toFixed(1):null,seekLen:a.seekable.length,seekEnd:a.seekable.length?+a.seekable.end(0).toFixed(1):null,net:a.networkState,err:a.error&&a.error.code}})()`)));

// 2) bar 点击 seek（与 verify 相同手法）
await ev(`(()=>{const b=document.querySelector('[data-mu-bar]');const r=b.getBoundingClientRect();
  b.dispatchEvent(new MouseEvent('click',{clientX:r.left+r.width*0.75,clientY:r.top+r.height/2,bubbles:true}));})()`);
await sleep(300);
const h1 = await ev(`window.__sd`);
const c1 = await ev(`(()=>{const a=window.__cwMusic.audio;return {ct:+a.currentTime.toFixed(2),seeking:a.seeking,ready:a.readyState,net:a.networkState,err:a.error&&a.error.code}})()`);
await sleep(1500);
const c2 = await ev(`(()=>{const a=window.__cwMusic.audio;return {ct:+a.currentTime.toFixed(2),seeking:a.seeking,ready:a.readyState}})()`);
console.log('bar-click handler-saw:', JSON.stringify(h1));
console.log('bar-click ct@+300ms:', JSON.stringify(c1));
console.log('bar-click ct@+1800ms:', JSON.stringify(c2));

// 3) 直接赋值 seek
await ev(`window.__cwMusic.audio.currentTime = 150`);
await sleep(300);
const d1 = await ev(`(()=>{const a=window.__cwMusic.audio;return {ct:+a.currentTime.toFixed(2),seeking:a.seeking,ready:a.readyState}})()`);
await sleep(1500);
const d2 = await ev(`(()=>{const a=window.__cwMusic.audio;return {ct:+a.currentTime.toFixed(2),seeking:a.seeking,ready:a.readyState}})()`);
console.log('direct-assign ct@+300ms:', JSON.stringify(d1));
console.log('direct-assign ct@+1800ms:', JSON.stringify(d2));

// 4) MP3 的 Range 支持（外部直测 CDN）
const mp3 = BASE + '/music/evolution-era.mp3';
try {
  const head = await fetch(mp3, { method: 'HEAD' });
  const rng = await fetch(mp3, { headers: { Range: 'bytes=0-0' } });
  console.log('mp3 HEAD:', head.status, 'accept-ranges=' + head.headers.get('accept-ranges'), 'content-length=' + head.headers.get('content-length'), 'type=' + head.headers.get('content-type'));
  console.log('mp3 Range req:', rng.status, 'content-range=' + rng.headers.get('content-range'));
} catch (e) { console.log('mp3 fetch error: ' + e.message); }

ws.close(); process.exit(0);
