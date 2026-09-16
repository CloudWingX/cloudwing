// 截图侧栏统计卡的计数过程（中途一帧 + 结束一帧），用于肉眼确认动画与排版。
// 用法：node scripts/shot-countup.mjs [baseUrl] [outDir]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const OUT = process.argv[3] || 'D:\\deep seek workplace\\_shots';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
mkdirSync(OUT, { recursive: true });

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/works/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('cw-theme-pref','light');document.cookie='cw-theme-pref=light;path=/';}catch(e){}` });

// 统计卡在右栏顶部，裁该区域
const clipOf = async () => {
  const r = await send('Runtime.evaluate', {
    expression: `(()=>{const c=document.querySelector('.sw-stats'); if(!c) return null; const b=c.closest('.sidecard').getBoundingClientRect(); return {x:Math.max(0,Math.round(b.x)-6),y:Math.max(0,Math.round(b.y)-6),width:Math.round(b.width)+12,height:Math.round(b.height)+12};})()`,
    returnByValue: true,
  });
  return r.result?.result?.value;
};

await send('Page.navigate', { url: BASE + '/works/' });
await sleep(700);                                  // 计数进行中
let clip = await clipOf();
console.log('  clip =', JSON.stringify(clip));
if (clip) {
  const s = await send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } });
  if (s.result?.data) { writeFileSync(`${OUT}\\countup-mid.png`, Buffer.from(s.result.data, 'base64')); console.log('  ✓ countup-mid.png（计数中）'); }
  else console.log('  ✗ 中途截图失败 err=' + JSON.stringify(s.error) + ' keys=' + JSON.stringify(Object.keys(s.result || {})));
}
await sleep(3000);                                 // 计数结束
clip = await clipOf();
if (clip) {
  const s = await send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } });
  if (s.result?.data) { writeFileSync(`${OUT}\\countup-end.png`, Buffer.from(s.result.data, 'base64')); console.log('  ✓ countup-end.png（计数结束）'); }
  else console.log('  ✗ 结束截图失败 err=' + JSON.stringify(s.error));
}
const vals = await send('Runtime.evaluate', { expression: `[...document.querySelectorAll('.sw-stats .v')].map(e=>e.textContent.trim()).join(' | ')`, returnByValue: true });
console.log('  结束值: ' + vals.result.result.value);
ws.close();
