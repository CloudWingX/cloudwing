// 手机端取证：多种真实机型视口 × 关键页面，截图 + 量关键几何（溢出/宽高/是否重叠）。
// 用法：node scripts/mobile-shots.mjs [baseUrl] [outDir]
import { setTimeout as sleep } from 'node:timers/promises';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const OUT = process.argv[3] || 'D:\\deep seek workplace\\_shots\\mobile';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

// 覆盖常见机型宽度：小屏 iPhone SE、主流 iPhone、安卓大屏
const DEVICES = [
  { name: '375-iphone-se', w: 375, h: 667 },
  { name: '390-iphone14', w: 390, h: 844 },
  { name: '414-plus', w: 414, h: 896 },
];
const PAGES = [['home', '/'], ['blog', '/blog/'], ['gallery', '/gallery/'], ['about', '/about/'], ['account', '/account/']];

mkdirSync(OUT, { recursive: true });

const probe = `(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) }; };
  const cs = (el, p) => el ? getComputedStyle(el)[p] : null;
  const overflow = [...document.querySelectorAll('body *')].filter((e) => {
    const b = e.getBoundingClientRect();
    return b.width > 0 && (b.right > innerWidth + 1 || b.left < -1);
  }).slice(0, 6).map((e) => e.tagName.toLowerCase() + '.' + (typeof e.className === 'string' ? e.className.split(' ')[0] : ''));
  const ly = document.querySelector('.ly-floater');
  const lyCanvas = document.querySelector('.ly-floater canvas');
  return {
    vw: innerWidth, vh: innerHeight,
    docOverflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    scrollH: document.documentElement.scrollHeight,
    offenders: overflow,
    侧栏左: cs(document.querySelector('.shell-left'), 'display'),
    burger: cs(document.querySelector('[data-mnav-toggle]'), 'display'),
    吊牌容器: r(ly), 吊牌canvas: r(lyCanvas),
    吊牌高: ly ? Math.round(ly.getBoundingClientRect().height) : null,
    主标题: r(document.querySelector('h1')),
    页面头部: r(document.querySelector('.page-head') || document.querySelector('.work-head')),
  };
})()`;

async function shot(device, name, path) {
  const url = BASE + path;
  const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(url), { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map();
  const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: device.w, height: device.h, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `try{localStorage.setItem('cw-theme-pref','light');document.cookie='cw-theme-pref=light;path=/';}catch(e){}`,
  });
  await send('Page.navigate', { url });
  await sleep(4000);
  const r = await send('Runtime.evaluate', { expression: probe, returnByValue: true });
  const s = await send('Page.captureScreenshot', { format: 'png' });
  if (s.result?.data) writeFileSync(`${OUT}\\${device.name}__${name}.png`, Buffer.from(s.result.data, 'base64'));
  ws.close();
  try { await fetch(`${CDP}/json/close/${tab.id}`); } catch {}
  return r.result?.result?.value;
}

for (const d of DEVICES) {
  console.log(`\n=== ${d.name} (${d.w}×${d.h}) ===`);
  for (const [name, path] of PAGES) {
    const v = await shot(d, name, path);
    if (!v) { console.log(`  ${name}: 探针失败`); continue; }
    const extra = name === 'about' ? `  吊牌容器=${v.吊牌容器 ? v.吊牌容器.w + '×' + v.吊牌容器.h : '无'} canvas=${v.吊牌canvas ? v.吊牌canvas.w + '×' + v.吊牌canvas.h : '无'}` : '';
    console.log(`  ${name.padEnd(8)} 溢出=${v.docOverflowX}  页面高=${v.scrollH}  侧栏=${v.侧栏左}  汉堡=${v.burger}${extra}`);
    if (v.offenders.length) console.log(`           超出视口的元素: ${v.offenders.join(', ')}`);
  }
}
console.log(`\n截图目录：${OUT}`);
