// 截左侧栏底部（音乐播放器）用于肉眼确认排版。
// 用法：node scripts/shot-music.mjs [baseUrl] [outFile]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const OUT = process.argv[3] || 'D:\\deep seek workplace\\_shots\\music.png';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/blog/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 2, mobile: false });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('cw-theme-pref','light');document.cookie='cw-theme-pref=light;path=/';}catch(e){}` });
await send('Page.navigate', { url: BASE + '/blog/' });
await sleep(4500);

// 侧栏是 sticky 且比视口高的，直接截底部会被裁。
// 截图用：临时解除吸顶，让左栏回到正常文档流，一次就能拍全。
await send('Runtime.evaluate', {
  expression: `(()=>{const s=document.createElement('style'); s.id='shot-unstick';
    s.textContent='.shell-left,.shell-right{position:static!important;min-height:0!important}';
    document.head.appendChild(s);})()`,
});
await sleep(600);
// 解除吸顶后左栏回到文档流，音乐卡在页面靠下位置：滚过去
await send('Runtime.evaluate', {
  expression: `(()=>{const c=document.querySelector('[data-music]'); if(!c) return; const b=c.getBoundingClientRect(); scrollTo(0, b.top+scrollY-120);})()`,
});
await sleep(1000);

const clip = await send('Runtime.evaluate', {
  expression: `(()=>{
    const c=document.querySelector('[data-music]'); if(!c) return null;
    const b=c.getBoundingClientRect();
    return {x:Math.max(0,Math.round(b.x)-14),y:Math.max(0,Math.round(b.y)-12),width:Math.round(b.width)+28,height:Math.round(b.height)+24,scale:1};
  })()`,
  returnByValue: true,
});
const c = clip.result?.result?.value;
console.log('音乐卡位置(视口坐标):', JSON.stringify(c));

// 整屏截图后用 sharp 裁剪（避免 CDP clip 的坐标系换算问题）
const full = await send('Page.captureScreenshot', { format: 'png' });
if (full.result?.data) {
  const buf = Buffer.from(full.result.data, 'base64');
  if (c) {
    const { default: sharp } = await import('sharp');
    const meta = await sharp(buf).metadata();
    const dpr = meta.width / 1440; // deviceScaleFactor=2
    const left = Math.max(0, Math.round(c.x * dpr));
    const top = Math.max(0, Math.round(c.y * dpr));
    const w = Math.min(Math.round(c.width * dpr), meta.width - left);
    const h = Math.min(Math.round(c.height * dpr), meta.height - top);
    await sharp(buf).extract({ left, top, width: w, height: h }).toFile(OUT);
    console.log(`✓ ${OUT}  (裁 ${w}×${h} @dpr${dpr})`);
  } else {
    writeFileSync(OUT, buf);
    console.log('✓ 整屏（未找到音乐卡，写全图）' + OUT);
  }
} else console.log('✗ 截图失败: ' + JSON.stringify(full.error));
const st = await send('Runtime.evaluate', {
  expression: `(()=>{const c=document.querySelector('[data-music]'); return c?{count:c.dataset.musicCount, state:c.dataset.state||'(未播放)', 有音频元素: !!document.querySelector('audio'), 播放器全局: !!window.__cwMusic}:null;})()`,
  returnByValue: true,
});
console.log('状态:', JSON.stringify(st.result?.result?.value));
ws.close();
