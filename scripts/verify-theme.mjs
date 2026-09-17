// 主题验证：站点只有**一套暗色主题**（亮色主题与切换按钮已删除）。
// 用法：node scripts/verify-theme.mjs [baseUrl]
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const p = new Map(); const errs = [];
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push((((m.params.exceptionDetails.exception || {}).description) || '').slice(0, 90));
  if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
};
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };
const themeNow = () => ev(`document.documentElement.dataset.theme`);
const waitFor = async (x, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(400); } return false; };

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

console.log('=== 1) 全新访客：清空所有存储后仍是暗色 ===');
await s('Page.navigate', { url: BASE + '/works/' });
await sleep(2000);
await ev(`try{localStorage.clear();sessionStorage.clear();document.cookie.split(';').forEach(c=>{const k=c.split('=')[0].trim();document.cookie=k+'=;path=/;max-age=0';});}catch(e){}`);
await s('Page.navigate', { url: BASE + '/works/' });
await waitFor(`!!document.documentElement.dataset.theme`);
await sleep(1500);
check('默认主题为 dark', (await themeNow()) === 'dark', String(await themeNow()));

console.log('\n=== 2) 系统偏好浅色时，站点仍是暗色（不再跟随系统） ===');
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
await s('Page.navigate', { url: BASE + '/works/' });
await waitFor(`!!document.documentElement.dataset.theme`);
await sleep(1200);
check('系统浅色时仍为 dark', (await themeNow()) === 'dark', String(await themeNow()));

console.log('\n=== 3) 历史遗留偏好不能把站点切回浅色 ===');
await ev(`(()=>{try{localStorage.setItem('cw-theme-pref','light');localStorage.setItem('cw-theme','light');}catch(e){}})()`);
await s('Page.navigate', { url: BASE + '/works/' });
await waitFor(`!!document.documentElement.dataset.theme`);
await sleep(1200);
check('存过 light 偏好也仍是 dark', (await themeNow()) === 'dark', String(await themeNow()));

console.log('\n=== 4) 主题切换按钮已删除 ===');
check('页面上没有 .theme-toggle', (await ev(`document.querySelectorAll('.theme-toggle').length`)) === 0);
check('没有日/月图标残留', (await ev(`document.querySelectorAll('.ico-sun,.ico-moon').length`)) === 0);

console.log('\n=== 5) 浏览器 UI 颜色跟随暗色 ===');
const tc = await ev(`[...document.querySelectorAll('meta[name=theme-color]')].map(m=>m.content).join(',')`);
check('theme-color 为深色', String(tc).includes('#070b0f'), String(tc));

console.log('\n=== 6) 软导航后仍是暗色 ===');
await ev(`[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')==='/gallery/')?.click()`);
await waitFor(`location.pathname==='/gallery/'`);
await sleep(1500);
check('软导航后仍为 dark', (await themeNow()) === 'dark', String(await themeNow()));

console.log('\n=== 7) 首屏不闪浅色（逐帧采样）===');
await s('Page.addScriptToEvaluateOnNewDocument', {
  source: `window.__seen=[];(function t(){try{window.__seen.push(document.documentElement.dataset.theme||'?');}catch(e){}requestAnimationFrame(t);})();`,
});
await ev(`try{localStorage.clear();sessionStorage.clear();}catch(e){}`);
await s('Page.navigate', { url: BASE + '/' });
await sleep(4500);
const seen = await ev(`(()=>{const a=window.__seen||[];return {总数:a.length,浅色帧:a.filter(x=>x==='light').length,首帧:a.find(x=>x&&x!=='?')||'?'};})()`);
console.log('  ' + JSON.stringify(seen));
check('采到足够帧数', seen && seen.总数 > 20, `帧数=${seen && seen.总数}`);
check('从未出现 light 帧', seen && seen.浅色帧 === 0, `light 帧=${seen && seen.浅色帧}`);
check('首帧即为 dark（无空档）', seen && seen.首帧 === 'dark', String(seen && seen.首帧));

check('全程无 JS 异常', errs.length === 0, errs[0] || '');

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
