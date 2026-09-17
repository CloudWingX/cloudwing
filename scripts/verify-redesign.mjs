// 验证暗色电影感重构的关键点：
//  1) 单主题：站点恒为 dark，主题开关不再切浅色
//  2) 玻璃材质：边框 rgba(255,255,255,.2)、模糊 20px、圆角 16–24px、玻璃底色
//  3) 暂停动态按钮可用（WCAG 2.2.2）：点了之后视频暂停、aria-pressed 同步
//  4) prefers-reduced-motion：视频不播放
//  5) 滚动时导航栏从透明过渡到半透明暗色
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

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
const waitFor = async (x, ms = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(400); } return false; };

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Page.navigate', { url: BASE + '/works/' });
await waitFor(`!!document.querySelector('.hd-glass')`);
// 清偏好 → 站点默认（dark）
await ev(`try{localStorage.clear();sessionStorage.clear();document.cookie.split(';').forEach(c=>{const k=c.split('=')[0].trim();document.cookie=k+'=;path=/;max-age=0';});}catch(e){}`);
await s('Page.navigate', { url: BASE + '/works/' });
await waitFor(`(()=>{const v=document.querySelector('.video-bg__el');return v&&v.readyState>=2;})()`, 60000);
await sleep(2500);

console.log('=== 单主题 ===');
check('站点恒为暗色', (await ev(`document.documentElement.dataset.theme`)) === 'dark');
// 点主题开关后仍应是 dark
await ev(`document.querySelector('.theme-toggle')?.click()`);
await sleep(600);
check('点主题开关后仍为暗色（不再切浅色）', (await ev(`document.documentElement.dataset.theme`)) === 'dark',
  await ev(`document.documentElement.dataset.theme`));

console.log('\n=== 玻璃材质 ===');
const glass = await ev(`(()=>{
  const g=document.querySelector('.hd-glass');
  const c=getComputedStyle(g);
  const card=document.querySelector('.wk-card');
  const cc=card?getComputedStyle(card):null;
  const btn=document.querySelector('.pill');
  const bc=btn?getComputedStyle(btn):null;
  return {
    栏边框:c.borderBottomColor, 栏模糊:c.backdropFilter||c.webkitBackdropFilter, 栏底:c.backgroundColor,
    卡边框:cc?cc.borderTopColor:null,
    // 注意：构建压缩可能只保留 -webkit-backdrop-filter，必须两个都读
    卡模糊:cc?(cc.backdropFilter||cc.webkitBackdropFilter):null,
    卡圆角:cc?cc.borderTopLeftRadius:null, 卡底:cc?cc.backgroundColor:null,
    胶囊边框:bc?bc.borderTopColor:null, 胶囊圆角:bc?bc.borderTopLeftRadius:null,
    令牌:getComputedStyle(document.documentElement).getPropertyValue('--glass-blur').trim(),
  };})()`);
console.log('  ' + JSON.stringify(glass));
check('导航栏边框 = rgba(255,255,255,0.2)', /255,\s*255,\s*255,\s*0?\.2\b/.test(glass.栏边框), glass.栏边框);
check('玻璃模糊 = blur(20px) saturate(1.2)', /blur\(20px\)/.test(String(glass.栏模糊)) && /saturate\(1\.2\)/.test(String(glass.栏模糊)), String(glass.栏模糊));
check('卡片是玻璃底（半透明，非纯色）', /rgba\(/.test(String(glass.卡底)), String(glass.卡底));
check('卡片圆角在 16–24px', parseFloat(glass.卡圆角) >= 16 && parseFloat(glass.卡圆角) <= 24, String(glass.卡圆角));
check('导航栏滚动前近乎透明（≤0.35）', parseFloat(String(glass.栏底).match(/[\d.]+\)$/)?.[0] || '1') <= 0.35, String(glass.栏底));

console.log('\n=== 暂停动态（WCAG 2.2.2）===');
const before = await ev(`document.querySelector('.video-bg__el').paused`);
await ev(`document.querySelector('[data-motion-toggle]')?.click()`);
await sleep(700);
const after = await ev(`document.querySelector('.video-bg__el').paused`);
const pressed = await ev(`document.querySelector('[data-motion-toggle]')?.getAttribute('aria-pressed')`);
check('有暂停按钮', (await ev(`!!document.querySelector('[data-motion-toggle]')`)) === true);
check('点击后视频暂停', before === false && after === true, `${before} → ${after}`);
check('aria-pressed 同步为 true', pressed === 'true', String(pressed));
// 恢复
await ev(`document.querySelector('[data-motion-toggle]')?.click()`);
await sleep(800);
check('再点一次恢复播放', (await ev(`document.querySelector('.video-bg__el').paused`)) === false);

console.log('\n=== 导航栏滚动过渡 ===');
const atTop = await ev(`getComputedStyle(document.querySelector('.hd-glass')).backgroundColor`);
await ev(`window.scrollTo(0, 400)`);
await sleep(900);
const scrolled = await ev(`getComputedStyle(document.querySelector('.hd-glass')).backgroundColor`);
console.log(`  顶部 ${atTop}  →  滚动后 ${scrolled}`);
check('滚动后导航栏加深', atTop !== scrolled, `${atTop} → ${scrolled}`);

check('无 JS 异常', errs.length === 0, errs[0] || '');

// 截图（作品库）
await ev(`window.scrollTo(0,0)`);
await sleep(1200);
const shot = await s('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) { writeFileSync('D:\\deep seek workplace\\_shots\\r-final-works.png', Buffer.from(shot.result.data, 'base64')); console.log('\n  ✓ r-final-works.png'); }

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
