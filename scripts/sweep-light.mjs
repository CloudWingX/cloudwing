// 变体扫描：在浏览器里临时覆盖 CSS 变量/规则，同一页面测多档"压暗程度"，
// 输出每档的像素亮度统计，用来挑定值（避免反复改文件重建）。
//
// 用法：node scripts/sweep-light.mjs [url]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';

const URL = process.argv[2] || 'http://127.0.0.1:4321/works/';
const CDP = 'http://127.0.0.1:9222';
const OUT = 'D:\\deep seek workplace\\_shots\\sweep';
mkdirSync(OUT, { recursive: true });

// 变体：只改"底色 + 玻璃面"两处，卡片白面（--paper-1）保持不动
const VARIANTS = [
  { name: 'A-当前', css: '' },
  {
    name: 'B-底色再压深',
    css: `html[data-theme='light']{--bg:#e2e5e9;--bg-deep:#d4d8de}`,
  },
  {
    name: 'C-底色+玻璃都压',
    css: `html[data-theme='light']{
      --bg:#e2e5e9;--bg-deep:#d4d8de;
      --glass:linear-gradient(165deg,rgba(255,255,255,.62),rgba(250,250,252,.34));
      --glass-strong:linear-gradient(165deg,rgba(255,255,255,.8),rgba(252,252,253,.5));
    }`,
  },
  {
    name: 'D-卡片白面也压到浅灰',
    css: `html[data-theme='light']{
      --bg:#e2e5e9;--bg-deep:#d4d8de;
      --paper-1:#f7f8fa;
      --glass:linear-gradient(165deg,rgba(255,255,255,.6),rgba(250,250,252,.32));
      --glass-strong:linear-gradient(165deg,rgba(255,255,255,.78),rgba(252,252,253,.48));
    }`,
  },
];

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(URL), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try{localStorage.setItem('cw-theme-pref','light');sessionStorage.setItem('cw-theme-pref','light');document.cookie='cw-theme-pref=light;path=/';}catch(e){}`,
});
await send('Page.navigate', { url: URL });
await sleep(3000);

async function stats(pngBuffer) {
  const { data, info } = await sharp(pngBuffer).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels; const total = info.width * info.height;
  let sum = 0, over88 = 0, over94 = 0;
  for (let i = 0; i < data.length; i += ch) {
    const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
    sum += l;
    if (l >= 0.88) over88++;
    if (l >= 0.94) over94++;
  }
  return { mean: sum / total, pct88: over88 / total * 100, pct94: over94 / total * 100 };
}

console.log(`页面：${URL}\n`);
console.log('变体                 均值    亮度≥0.88   亮度≥0.94');
for (const v of VARIANTS) {
  await send('Runtime.evaluate', {
    expression: `(() => {
      const old = document.getElementById('sweep-style'); if (old) old.remove();
      const s = document.createElement('style'); s.id = 'sweep-style';
      s.textContent = ${JSON.stringify(v.css)};
      if (${JSON.stringify(v.css)}) document.head.appendChild(s);
    })()`,
  });
  await sleep(900);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(shot.result.data, 'base64');
  writeFileSync(`${OUT}\\${v.name}.png`, buf);
  const s = await stats(buf);
  console.log(`${v.name.padEnd(22)} ${s.mean.toFixed(3)}   ${s.pct88.toFixed(1).padStart(5)}%     ${s.pct94.toFixed(1).padStart(5)}%`);
}
ws.close();
console.log(`\n截图：${OUT}`);
