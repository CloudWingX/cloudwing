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
// 注意：清完要**回读确认**——页面还在导航中时执行清理会清了个空，导致下一次运行才正常
// （实测第一遍 5/14、第二遍 14/14，就是这里没确认）。
await send('Network.enable');
await send('Network.clearBrowserCookies');
let cleared = false;
for (let i = 0; i < 12 && !cleared; i++) {
  await send('Page.navigate', { url: BASE + '/works/' });
  await sleep(2000);
  await clearPref();
  const left = await ev(`(()=>{try{return String(localStorage.getItem('cw-theme-pref'))}catch(e){return 'err'}})()`);
  cleared = left === 'null';
  if (!cleared) await sleep(800);
}
if (!cleared) console.log('  ⚠️ 预置清理未确认成功，默认值断言可能受残留影响');
await send('Page.navigate', { url: 'about:blank' });
await sleep(400);

// 模拟操作系统偏好（无头浏览器默认是 dark，所以要显式压成 light 才有意义）
const osScheme = (v) => send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: v }] });

const themeNow = () => ev(`document.documentElement.dataset.theme`);

// 轮询等待主题被解析出来。
// ⚠️ 固定 sleep 在无头浏览器里不可靠：页面慢一点就读到 `undefined`，
//    于是"默认值"断言整片变红（实测第一遍 5/14、第二遍 14/14 就是这么来的）。
const waitTheme = async (ms = 20000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const t = await ev(`document.documentElement.dataset.theme || null`);
    if (t) return t;
    await sleep(300);
  }
  return null;
};

console.log('=== 1) 全新访客：系统偏好「浅色」，站点应仍为夜间 ===');
await osScheme('light');
// 存储已在上面的预置步骤里清干净了（且此刻停在 about:blank，同源操作不可用）
await send('Page.navigate', { url: BASE + '/works/' });
const t1 = await waitTheme();
check('默认主题为 dark', t1 === 'dark', String(t1));
const tc = await ev(`[...document.querySelectorAll('meta[name=theme-color]')].map(m=>m.content).join(',')`);
check('浏览器 UI 颜色跟随实际主题（暗）', String(tc).includes('#070b0f'), String(tc));
const prefStored = await ev(`(()=>{try{return String(localStorage.getItem('cw-theme-pref'))}catch(e){return 'err'}})()`);
check('默认不写入偏好（保持"跟随系统以外"的干净状态）', prefStored === 'null', String(prefStored));

console.log('\n=== 2) 全新访客：系统偏好「深色」，站点应为夜间 ===');
await osScheme('dark');
await clearPref();
await send('Page.navigate', { url: BASE + '/works/' });
check('系统深色时也是 dark', (await waitTheme()) === 'dark');

// ★暗色电影感重构后：全站只有一套暗色主题★
// 浅色路径已不可达（浅色玻璃 + 白字在物理上无法同时成立），
// 所以"用户选过 light"的期望从"渲染为 light"改为"仍渲染 dark，但偏好被记住"。
console.log('\n=== 3) 用户显式选过「浅色」：站点仍渲染暗色（单主题），但偏好被记住 ===');
await ev(`(()=>{try{localStorage.setItem('cw-theme-pref','light')}catch(e){}})()`);
await osScheme('dark');
await send('Page.navigate', { url: BASE + '/works/' });
const t3 = await waitTheme();
check('单主题：即使选过 light 仍渲染 dark', t3 === 'dark', String(t3));
check('偏好被记住（dataset.themePref = light）',
  (await ev(`document.documentElement.dataset.themePref`)) === 'light',
  await ev(`document.documentElement.dataset.themePref`));

console.log('\n=== 4) 点主题开关：仍渲染暗色，偏好二态切换并落盘 ===');
await ev(`document.querySelector('.theme-toggle').click()`);
await sleep(600);
check('点击后仍为 dark（单主题）', (await themeNow()) === 'dark');
check('偏好已落盘为 dark', (await ev(`localStorage.getItem('cw-theme-pref')`)) === 'dark');
await ev(`document.querySelector('.theme-toggle').click()`);
await sleep(600);
check('再点后偏好回到 light', (await ev(`localStorage.getItem('cw-theme-pref')`)) === 'light');
check('观感仍是 dark', (await themeNow()) === 'dark');

console.log('\n=== 5) 软导航到别的页面：仍恒为 dark ===');
await ev(`[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')==='/gallery/')?.click()`);
check('软导航后仍为 dark', (await waitTheme()) === 'dark');

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
// 采样偶尔会 0 帧（无头浏览器里导航/注入的时序问题）：重试直到真的采到帧，
// 否则会误报成"没有采到帧"这种与站点无关的失败。
const readSeen = () => ev(`(()=>{const s=window.__seen||[]; return {总数:s.length, 浅色帧:s.filter(x=>x==='light').length, 空帧:s.filter(x=>x==='(空)').length, 首帧:s[0]||null};})()`);
let seen = null;
for (let i = 0; i < 5; i++) {
  await send('Page.navigate', { url: BASE + '/gallery/' });
  await sleep(2600);
  seen = await readSeen();
  if (seen && seen.总数 > 20) break;
  await sleep(600);
}
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
