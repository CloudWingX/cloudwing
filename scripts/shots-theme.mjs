// 主题截图对比：在无头浏览器里分别用 light / dark 渲染同一页面并截图，
// 供亮度取证（scripts/imgstats.mjs）比较，避免依赖系统 prefers-color-scheme。
//
// 用法：node scripts/shots-theme.mjs [baseUrl] [outDir]
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const OUT = process.argv[3] || 'D:\\deep seek workplace\\_shots';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const PAGES = [['home', '/'], ['works', '/works/'], ['gallery', '/gallery/'], ['about', '/about/']];
const THEMES = ['light', 'dark'];
const W = 1440, H = 900;

mkdirSync(OUT, { recursive: true });

async function capture(url, theme, file) {
  const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(url), { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map();
  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try{localStorage.setItem('cw-theme-pref','${theme}');sessionStorage.setItem('cw-theme-pref','${theme}');document.cookie='cw-theme-pref=${theme};path=/';}catch(e){}`,
  });
  await send('Page.navigate', { url });
  await sleep(3000);
  // 兜底：确保真的处于目标主题（并触发站点自身的重算）
  await send('Runtime.evaluate', {
    expression: `document.documentElement.dataset.theme='${theme}';document.documentElement.dataset.themePref='${theme}';`,
  });
  await sleep(1600); // 等粒子/动效稳定
  const r = await send('Page.captureScreenshot', { format: 'png' });
  if (r.result?.data) {
    writeFileSync(file, Buffer.from(r.result.data, 'base64'));
    const t = await send('Runtime.evaluate', { expression: `document.documentElement.dataset.theme`, returnByValue: true });
    console.log(`  ✓ ${file}  (theme=${t.result.result.value})`);
  } else {
    console.log(`  ✗ 截图失败 ${file}  keys=${JSON.stringify(Object.keys(r))} err=${JSON.stringify(r.error)} result=${r.result ? JSON.stringify(Object.keys(r.result)) : 'null'}`);
  }
  ws.close();
  try { await fetch(`${CDP}/json/close/${tab.id}`); } catch {}
}

try { const r = await fetch(`${CDP}/json/version`); if (!r.ok) throw new Error(); }
catch { console.error(`✗ 连不上无头浏览器 ${CDP}`); process.exit(2); }

for (const [name, path] of PAGES) {
  console.log(`\n[${name}] ${path}`);
  for (const theme of THEMES) await capture(BASE + path, theme, `${OUT}\\${name}-${theme}.png`);
}
console.log(`\n输出目录：${OUT}`);
