// 验证主题默认值：默认夜间、尊重用户显式选择、开关可用、无"首屏闪浅色"。
// 用法：node scripts/verify-theme.mjs [baseUrl]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/works/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map(); const errs = [];
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value;
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`  ${ok ? '✅' : '❌'} ${name}${detail ? '  —— ' + detail : ''}`); };

// 清掉三通道偏好，模拟"第一次来的访客"
const clearPref = async () => {
  await ev(`(()=>{
    try{localStorage.removeItem('cw-theme-pref');localStorage.removeItem('cw-theme');}catch(e){}
    try{sessionStorage.removeItem('cw-theme-pref');sessionStorage.removeItem('cw-theme');}catch(e){}
    document.cookie='cw-theme-pref=;path=/;max-age=0';
    document.cookie='cw-theme=;path=/;max-age=0';
  })()`);
};

// 开局先清干净：否则同一个调试浏览器里上一次测试留下的偏好会让"默认值"断言全部误判
// （实测踩过：跑完 contrast-audit light 后残留 cw-theme-pref=light，本脚本前 3 项全红）。
await send('Network.enable');
await send('Network.clearBrowserCookies');
await send('Page.navigate', { url: BASE + '/works/' });
await sleep(2500);
await clearPref();
await send('Page.navigate', { url: 'about:blank' });
await sleep(400);

// 模拟操作系统偏好（无头浏览器默认是 dark，所以要显式压成 light 才有意义）
const osScheme = (v) => send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: v }] });

const themeNow = () => ev(`document.documentElement.dataset.theme`);

console.log('=== 1) 全新访客：系统偏好「浅色」，站点应仍为夜间 ===');
await osScheme('light');
// 存储已在上面的预置步骤里清干净了（且此刻停在 about:blank，同源操作不可用）
await send('Page.navigate', { url: BASE + '/works/' });
await sleep(3500);
const t1 = await themeNow();
check('默认主题为 dark', t1 === 'dark', String(t1));
const tc = await ev(`[...document.querySelectorAll('meta[name=theme-color]')].map(m=>m.content).join(',')`);
check('浏览器 UI 颜色跟随实际主题（暗）', String(tc).includes('#0c0c0e'), String(tc));
const prefStored = await ev(`(()=>{try{return String(localStorage.getItem('cw-theme-pref'))}catch(e){return 'err'}})()`);
check('默认不写入偏好（保持"跟随系统以外"的干净状态）', prefStored === 'null', String(prefStored));

console.log('\n=== 2) 全新访客：系统偏好「深色」，站点应为夜间 ===');
await osScheme('dark');
await clearPref();
await send('Page.navigate', { url: BASE + '/works/' });
await sleep(3000);
check('系统深色时也是 dark', (await themeNow()) === 'dark');

console.log('\n=== 3) 用户显式选过「浅色」：系统深色也必须保持浅色 ===');
await ev(`(()=>{try{localStorage.setItem('cw-theme-pref','light')}catch(e){}})()`);
await osScheme('dark');
await send('Page.navigate', { url: BASE + '/works/' });
await sleep(3000);
const t3 = await themeNow();
check('尊重用户的 light 选择', t3 === 'light', String(t3));

console.log('\n=== 4) 点主题开关：切换并落盘 ===');
await ev(`document.querySelector('.theme-toggle').click()`);
await sleep(600);
check('点击后切到 dark', (await themeNow()) === 'dark');
check('偏好已落盘为 dark', (await ev(`localStorage.getItem('cw-theme-pref')`)) === 'dark');
await ev(`document.querySelector('.theme-toggle').click()`);
await sleep(600);
check('再点回 light', (await themeNow()) === 'light');
check('偏好已落盘为 light', (await ev(`localStorage.getItem('cw-theme-pref')`)) === 'light');

console.log('\n=== 5) 用户选过 light 后，软导航到别的页面仍是 light ===');
await ev(`[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')==='/gallery/')?.click()`);
await sleep(3500);
check('软导航后仍为 light', (await themeNow()) === 'light');

console.log('\n=== 6) 首屏是否闪过浅色（默认夜间、用户没选过）===');
await clearPref();
await osScheme('light');
// 采样器必须在**新文档里**就开始跑：用 addScriptToEvaluateOnNewDocument 注入，
// 否则软导航/刷新会把上一页 window 上的采样数组清掉（第一次就踩了这个坑，收到 0 帧）。
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `window.__seen=[]; (function tick(){
    try{ window.__seen.push(document.documentElement.dataset.theme||'(空)'); }catch(e){}
    requestAnimationFrame(tick);
  })();`,
});
await send('Page.navigate', { url: BASE + '/gallery/' });
await sleep(2600);
const seen = await ev(`(()=>{const s=window.__seen||[]; return {总数:s.length, 浅色帧:s.filter(x=>x==='light').length, 空帧:s.filter(x=>x==='(空)').length, 首帧:s[0]||null};})()`);
console.log('  ' + JSON.stringify(seen));
check('采到足够帧数', seen && seen.总数 > 20, `帧数=${seen && seen.总数}`);
check('从未出现 light 帧', seen && seen.浅色帧 === 0, `light 帧=${seen && seen.浅色帧}`);
check('首帧即为 dark（无空档）', seen && seen.首帧 === 'dark', String(seen && seen.首帧));

check('全程无 JS 异常', errs.length === 0, errs[0] || '');

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
if (failed.length) failed.forEach((f) => console.log('  ❌ ' + f.name));
ws.close();
process.exit(failed.length ? 1 : 0);
