// probe-seek-live2.mjs — 验证「非 Range 资源在完全缓冲后 seekable 是否打开」
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
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value;

await send('Page.navigate', { url: BASE + '/blog/' });
await sleep(4000);
await ev(`document.querySelectorAll('[data-mu-toggle]')[0].click()`);
let done = false;
for (let i = 0; i < 30; i++) {
  const s = await ev(`(()=>{const a=window.__cwMusic.audio;return{bufEnd:a.buffered.length?+a.buffered.end(a.buffered.length-1).toFixed(1):0,dur:+a.duration.toFixed(1),seekLen:a.seekable.length,seekEnd:a.seekable.length?+a.seekable.end(0).toFixed(1):null,net:a.networkState}})()`);
  console.log('t+' + (i * 2) + 's buf=' + s.bufEnd + '/' + s.dur + ' seekable=[' + s.seekLen + ']end=' + s.seekEnd + ' net=' + s.net);
  if (s.dur && s.bufEnd >= s.dur - 2) { done = true; break; }
  await sleep(2000);
}
console.log('FULL_BUFFERED=' + done);
if (done) {
  const before = await ev(`(()=>{const a=window.__cwMusic.audio;return{seekLen:a.seekable.length,seekEnd:a.seekable.length?+a.seekable.end(0).toFixed(1):null}})()`);
  console.log('seekable-after-full-buffer:', JSON.stringify(before));
  await ev(`window.__cwMusic.audio.currentTime = 200`);
  await sleep(400);
  const s1 = await ev(`(()=>{const a=window.__cwMusic.audio;return{ct:+a.currentTime.toFixed(2),seeking:a.seeking,paused:a.paused}})()`);
  await sleep(1500);
  const s2 = await ev(`(()=>{const a=window.__cwMusic.audio;return{ct:+a.currentTime.toFixed(2),paused:a.paused}})()`);
  console.log('direct-assign-200 ct@+400ms:', JSON.stringify(s1));
  console.log('direct-assign-200 ct@+1900ms:', JSON.stringify(s2));
}
ws.close(); process.exit(0);
