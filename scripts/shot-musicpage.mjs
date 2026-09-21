// /music/ 页面截图（§67）：桌面全页 + 播放中唱片特写 + 移动端。
// 用法：node scripts/shot-musicpage.mjs [baseUrl]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const OUT = 'D:/deep seek workplace/endfield-blog/_shots';

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/music/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await send('Page.enable'); await send('Runtime.enable');

const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value;
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${OUT}/${name}`, Buffer.from(r.result.data, 'base64'));
  console.log('shot:', name);
};
const setVP = (w, h) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });

await setVP(1920, 1080);
await send('Page.navigate', { url: BASE + '/music/' });
await sleep(4500);
await ev(`window.scrollTo(0,0)`);
await sleep(600);
await shot('musicpage-top-1920.png');

// 播放 + 悬停视差后的唱片特写（滚动到唱片居中）
await ev(`document.querySelector('[data-mp-toggle]').click()`);
await sleep(1200);
const st1 = await ev(`(()=>{const r=document.querySelector('[data-music-page]');const a=window.__cwMusicPage.audio;
  return {状态:r.dataset.state,时间:a.currentTime.toFixed(1),时长:+a.duration.toFixed(1),
    音量:r.querySelector('[data-mp-volpct]').textContent,填充:r.querySelector('[data-mp-fill]').style.width};})()`);
console.log('state:', JSON.stringify(st1));
await ev(`(()=>{const w=document.querySelector('[data-mp-discwrap]');const r=w.getBoundingClientRect();
  window.scrollTo(0, window.scrollY + r.top - 220);})()`);
await sleep(800);
await ev(`(()=>{const w=document.querySelector('[data-mp-discwrap]');const r=w.getBoundingClientRect();
  w.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+r.width*0.78,clientY:r.top+r.height*0.25,bubbles:true}));})()`);
await sleep(1200);
await shot('musicpage-playing-1920.png');

// 曲目表 + 参数区
await ev(`(()=>{const p=document.querySelector('.mp-params');window.scrollTo(0, window.scrollY + p.getBoundingClientRect().top - 140);})()`);
await sleep(700);
await shot('musicpage-params-1920.png');

// 移动端
await setVP(390, 844);
await ev(`window.scrollTo(0,0)`);
await sleep(1200);
await shot('musicpage-mobile-390.png');

ws.close();
console.log('DONE');
