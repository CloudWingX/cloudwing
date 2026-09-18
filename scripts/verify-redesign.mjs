// 验证暗色电影感重构的关键点：
//  1) 单主题：站点恒为 dark，主题开关不再切浅色
//  2) 玻璃材质：边框 rgba(255,255,255,.2)、模糊 20px、圆角 16–24px、玻璃底色
//  3) 背景视频默认播放：导航栏的暂停按钮已删除（2026-09-18），按钮/样式/接口都不应残留
//  4) prefers-reduced-motion：系统要求减少动态时视频不播放（删除按钮后由它兜住 WCAG 2.2.2）
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
await s('Page.navigate', { url: BASE + '/blog/' });
await waitFor(`!!document.querySelector('.hd')`);
// 清偏好 → 站点默认（dark）
await ev(`try{localStorage.clear();sessionStorage.clear();document.cookie.split(';').forEach(c=>{const k=c.split('=')[0].trim();document.cookie=k+'=;path=/;max-age=0';});}catch(e){}`);
await s('Page.navigate', { url: BASE + '/blog/' });
await waitFor(`(()=>{const v=document.querySelector('.video-bg__el');return v&&v.readyState>=2;})()`, 60000);
await sleep(2500);

console.log('=== 单主题 ===');
check('站点恒为暗色', (await ev(`document.documentElement.dataset.theme`)) === 'dark');
// 主题切换按钮已删除（亮色主题一并移除）
check('主题切换按钮已删除', (await ev(`document.querySelectorAll('.theme-toggle').length`)) === 0);

console.log('\n=== 玻璃材质（滚动后；顶部刻意透明，见 verify-nav-shrink）===');
await ev(`window.scrollTo(0, 300)`);
await sleep(1200);
const glass = await ev(`(()=>{
  const g=document.querySelector('.header-container');
  const c=getComputedStyle(g);
  const card=document.querySelector('.post');
  const cc=card?getComputedStyle(card):null;
  const btn=document.querySelector('.btn-github');
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
// 2026-09-18 改版：导航边框/玻璃值照 reference —— 边框 rgba(255,255,255,0.08)、
// 底色 rgba(10,10,15,0.7)、模糊 blur(12px) saturate(180%)
check('导航边框 = rgba(255,255,255,0.08)', /255,\s*255,\s*255,\s*0?\.08\b/.test(glass.栏边框), glass.栏边框);
// 导航胶囊有自己的 --nav-blur（参考 spec: blur(12px) saturate(180%)），与全站玻璃令牌
// --glass-blur（saturate(1.2)，用于卡片/浮层）刻意分开，所以这里按导航自己的值断言。
check('导航胶囊模糊 = blur(12px) saturate(180%)（滚动形态）', /blur\(12px\)/.test(String(glass.栏模糊)) && /saturate\(1\.8\)/.test(String(glass.栏模糊)), String(glass.栏模糊));
check('全站玻璃令牌仍为 blur(20px) saturate(1.2)', /blur\(20px\) saturate\(1\.2\)/.test(String(glass.令牌)), String(glass.令牌));
check('卡片是玻璃底（半透明，非纯色）', /rgba\(/.test(String(glass.卡底)), String(glass.卡底));
check('卡片圆角在 16–24px', parseFloat(glass.卡圆角) >= 16 && parseFloat(glass.卡圆角) <= 24, String(glass.卡圆角));
// 胶囊必须"半透明但可读"：太透会让下方正文透上来（实测 0.28 时导航文字读不清）
check('导航胶囊半透明且可读（0.4–0.7）',
  parseFloat(String(glass.栏底).match(/[\d.]+\)$/)?.[0] || '1') >= 0.4 &&
  parseFloat(String(glass.栏底).match(/[\d.]+\)$/)?.[0] || '1') <= 0.7,
  String(glass.栏底));

// 2026-09-18：导航栏的「暂停背景动态」按钮按用户要求删除，背景视频**默认播放**。
// 这一节改为断言"按钮确实没了 + 视频确实在播"，并把 WCAG 的减少动态交给系统偏好验证。
console.log('\n=== 背景视频：默认播放（暂停按钮已删）===');
const vPaused = await ev(`document.querySelector('.video-bg__el').paused`);
const vPlayingCls = await ev(`document.querySelector('.video-bg').classList.contains('is-playing')`);
check('导航已无暂停按钮', (await ev(`!document.querySelector('[data-motion-toggle]') && !document.querySelector('.motion-toggle')`)) === true);
check('视频默认在播', vPaused === false, 'paused=' + vPaused);
check('视频已出画（.video-bg.is-playing）', vPlayingCls === true);
check('旧的暂停接口已移除（__cwVideoToggle / __cwVideoPaused / __cwMotion）',
  (await ev(`typeof window.__cwVideoToggle === 'undefined' && typeof window.__cwVideoPaused === 'undefined' && typeof window.__cwMotion === 'undefined'`)) === true);

// 系统级"减少动态"仍然生效（这是删除按钮后唯一的不播条件）
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await s('Page.navigate', { url: BASE + '/blog/' });
await waitFor(`!!document.querySelector('.video-bg__el')`, 60000);
await sleep(1500);
check('prefers-reduced-motion：视频不播放', (await ev(`document.querySelector('.video-bg__el').paused`)) === true);
await s('Emulation.setEmulatedMedia', { features: [] });
await s('Page.navigate', { url: BASE + '/blog/' });
await waitFor(`(()=>{const v=document.querySelector('.video-bg__el');return v&&v.readyState>=2;})()`, 60000);
await sleep(2000);
check('恢复正常偏好后重新播放', (await ev(`document.querySelector('.video-bg__el').paused`)) === false);

console.log('\n=== 导航栏滚动过渡 ===');
// 顶部是透明贴顶 → 滚下去变玻璃胶囊（形态由 verify-nav-shrink.mjs 细测）
await ev(`window.scrollTo(0, 0)`);
await sleep(900);
const atTop = await ev(`getComputedStyle(document.querySelector('.header-container')).backgroundColor`);
await ev(`window.scrollTo(0, 400)`);
await sleep(1200);
const scrolled = await ev(`getComputedStyle(document.querySelector('.header-container')).backgroundColor`);
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
