// 截「全新访客默认主题」下的整页，确认开箱观感（不预设偏好、系统偏好压成 light 以证明与系统无关）。
// 用法：node scripts/shot-default-theme.mjs [baseUrl] [outFile]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const OUT = process.argv[3] || 'D:\\deep seek workplace\\_shots\\default-theme.png';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/works/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
// 关键：把系统偏好压成 light —— 站点仍应是暗色，证明默认值不依赖系统
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
// 不写入任何偏好：全新访客
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try{localStorage.removeItem('cw-theme-pref');localStorage.removeItem('cw-theme');sessionStorage.removeItem('cw-theme-pref');sessionStorage.removeItem('cw-theme');document.cookie='cw-theme-pref=;path=/;max-age=0';document.cookie='cw-theme=;path=/;max-age=0';}catch(e){}`,
});
await send('Page.navigate', { url: BASE + '/works/' });
await sleep(4500);
const t = await send('Runtime.evaluate', { expression: `document.documentElement.dataset.theme`, returnByValue: true });
console.log('全新访客主题 = ' + t.result.result.value + '（系统偏好被压成 light）');
const s = await send('Page.captureScreenshot', { format: 'png' });
if (s.result?.data) { writeFileSync(OUT, Buffer.from(s.result.data, 'base64')); console.log('✓ ' + OUT); }
else console.log('✗ 截图失败: ' + JSON.stringify(s.error));
ws.close();
