// §75 探针：测量文件夹墙各文件夹纸张缩略图的实际渲染尺寸与观感差异
import WebSocket from 'file:///C:/Users/24645/.workbuddy/binaries/node/workspace/node_modules/ws/index.js';
const CDP = 'http://127.0.0.1:9222';
const BASE = process.argv[2] || 'https://cloudwing.pages.dev';
const list = await (await fetch(CDP + '/json/new?url=' + encodeURIComponent(BASE + '/gallery/'), { method: 'PUT' })).json();
console.log('TAB=' + list.id);
const ws = new WebSocket(list.webSocketDebuggerUrl, { perMessageDeflate: false });
let id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } });
await new Promise(r => ws.on('open', r));
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: BASE + '/gallery/' });
await new Promise(r => setTimeout(r, 9000));
const loc = await send('Runtime.evaluate', { expression: 'location.href', returnByValue: true });
console.log('LOC=' + JSON.stringify(loc.result?.value));
const data = await send('Runtime.evaluate', { expression: `(() => {
  const items = [...document.querySelectorAll('.gal-folder-item')];
  return JSON.stringify(items.map(it => {
    const name = it.querySelector('.folder-game')?.textContent;
    const papers = [...it.querySelectorAll('.folder-paper')].map(p => {
      const r = p.getBoundingClientRect(); const cs = getComputedStyle(p);
      return { w: Math.round(r.width), h: Math.round(r.height), fit: cs.objectFit, src: p.getAttribute('src')?.split('/').slice(-1)[0] };
    });
    return { name, papers };
  }));
})()`, returnByValue: true });
const folders = JSON.parse(data.result.value);
console.log(JSON.stringify(folders));
// 断言：object-fit 均为 cover，且所有文件夹同位纸张尺寸一致（≤2px）——
// 基准不写死像素：以第一个文件夹（横图图集）每张纸为基准，其余文件夹逐一比对
let allOk = true;
const base0 = folders[0].papers.map(p => [p.w, p.h]);
for (const f of folders) {
  f.papers.forEach((p, j) => {
    if (p.fit !== 'cover') { console.log(`FAIL ${f.name}: object-fit=${p.fit}`); allOk = false; }
    if (Math.abs(p.w - base0[j][0]) > 2 || Math.abs(p.h - base0[j][1]) > 2) {
      console.log(`FAIL ${f.name}: ${p.w}x${p.h} != 基准 ${base0[j][0]}x${base0[j][1]}`); allOk = false;
    }
  });
}
console.log('THUMB_CHECK=' + (allOk ? 'PASS' : 'FAIL'));
const shot = await send('Page.captureScreenshot', { format: 'png' });
const fs = await import('fs');
fs.writeFileSync('_shots/folder-thumb-probe' + (BASE.includes('localhost') ? '-local' : '') + '.png', Buffer.from(shot.data, 'base64'));
console.log('SHOT_SAVED');
console.log('PROBE_EXIT=' + (allOk ? 0 : 1));
await fetch(CDP + '/json/close/' + list.id);
process.exit(allOk ? 0 : 1);
