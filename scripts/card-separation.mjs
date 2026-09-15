// 量"卡面 vs 页面底色"的实际分离度：取卡片区域中心与卡片外背景的渲染像素。
import sharp from 'sharp';
import { setTimeout as sleep } from 'node:timers/promises';

const CDP = 'http://127.0.0.1:9222';
const BASE = process.argv[2] || 'http://127.0.0.1:4321';
const THEME = process.argv[3] || 'light';

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/works/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: THEME }] });
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try{localStorage.setItem('cw-theme-pref','${THEME}');document.cookie='cw-theme-pref=${THEME};path=/';}catch(e){}`,
});
await send('Page.navigate', { url: BASE + '/works/' });
await sleep(4500);

// 卡片内一点（标题下方留白）与卡片外页面底色点
const pts = await send('Runtime.evaluate', {
  expression: `(() => {
    const c = document.querySelector('.wk-card');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return {
      cardX: Math.round(r.left + r.width/2), cardY: Math.round(r.top + r.height*0.55),
      gapX: Math.round(r.left + r.width + 18), gapY: Math.round(r.top + r.height*0.55),
      cardRect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
    };
  })()`, returnByValue: true,
});
const p = pts.result.result.value;
if (!p) { console.log('未找到 .wk-card'); process.exit(1); }
const shot = await send('Page.captureScreenshot', { format: 'png' });
const { data, info } = await sharp(Buffer.from(shot.result.data, 'base64')).raw().toBuffer({ resolveWithObject: true });
const at = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i+1], data[i+2]]; };
const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }; return 0.2126*f(c[0]) + 0.7152*f(c[1]) + 0.0722*f(c[2]); };
const cr = (a, b) => { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1,l2), lo = Math.min(l1,l2); return ((hi+0.05)/(lo+0.05)).toFixed(2); };

const cardPx = at(p.cardX, p.cardY), gapPx = at(p.gapX, p.gapY);
console.log(`主题=${THEME}  卡片矩形=${p.cardRect.join(',')}`);
console.log(`  卡面像素   rgb(${cardPx.join(',')})  亮度=${lum(cardPx).toFixed(3)}`);
console.log(`  卡外底色   rgb(${gapPx.join(',')})  亮度=${lum(gapPx).toFixed(3)}`);
console.log(`  卡面 vs 底色 对比度 = ${cr(cardPx, gapPx)}:1  （越大越"浮得起来"）`);
ws.close();
