// probe-sw-local.mjs — 本地验证 sw.js：注册/接管/206 切片/缓存填充/seek
import { setTimeout as sleep } from 'node:timers/promises';
const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const tab = await (await fetch(CDP + '/json/new?' + encodeURIComponent(BASE + '/blog/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send('Page.navigate', { url: BASE + '/blog/' });
await sleep(3500);

// 1) SW 状态与接管
let ctl = null;
for (let i = 0; i < 20; i++) {
  ctl = await ev(`(()=>{const r=navigator.serviceWorker.controller;return r?{scope:r.scope,state:r.state}:null})()`);
  if (ctl) break;
  await sleep(500);
}
console.log('SW controller:', JSON.stringify(ctl));

// 2) 切片 206（SW 指纹：cache-control=max-age=14400）
const r1 = await ev(`(async()=>{const r=await fetch('/music/evolution-era.mp3',{headers:{Range:'bytes=1000-1099'}});
  return {status:r.status,cr:r.headers.get('content-range'),cc:r.headers.get('cache-control'),ct:r.headers.get('content-type'),len:r.headers.get('content-length')};})()`);
console.log('range 1000-1099:', JSON.stringify(r1));

// 3) 后缀分片 bytes=-200
const r2 = await ev(`(async()=>{const r=await fetch('/music/evolution-era.mp3',{headers:{Range:'bytes=-200'}});
  return {status:r.status,cr:r.headers.get('content-range'),cc:r.headers.get('cache-control')};})()`);
console.log('suffix -200:', JSON.stringify(r2));

// 4) 播放 3 秒 → 缓存应填充
await ev(`document.querySelectorAll('[data-mu-toggle]')[0].click()`);
await sleep(3000);
const cacheInfo = await ev(`(async()=>{const has=await caches.has('cw-audio-v1');if(!has)return{has:false};
  const c=await caches.open('cw-audio-v1');const keys=await c.keys();return{has:true,n:keys.length,urls:keys.map(k=>k.url.split('/').pop())};})()`);
console.log('cache after play:', JSON.stringify(cacheInfo));

// 5) 中段 seek（媒体栈路径）
await ev(`window.__cwMusic.audio.currentTime = 150`);
await sleep(600);
const seek = await ev(`(()=>{const a=window.__cwMusic.audio;return{ct:+a.currentTime.toFixed(2),seeking:a.seeking,paused:a.paused}})()`);
await sleep(1200);
const seek2 = await ev(`(()=>{const a=window.__cwMusic.audio;return{ct:+a.currentTime.toFixed(2),paused:a.paused}})()`);
console.log('seek-150 @+600ms:', JSON.stringify(seek));
console.log('seek-150 @+1800ms:', JSON.stringify(seek2));

ws.close(); process.exit(0);
