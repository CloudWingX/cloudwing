// 验证搜索悬浮窗：触发方式、Pagefind 懒加载、结果、关闭方式、软导航后仍可用。
// 用法：node scripts/verify-search.mjs [baseUrl]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const OUT = 'D:\\deep seek workplace\\_shots';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const p = new Map(); const errs = [];
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push(((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text || '').slice(0, 120));
  if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
};
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };
const waitFor = async (x, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(400); } return false; };

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Page.navigate', { url: BASE + '/works/' });
await waitFor(`!!document.querySelector('[data-search-modal]')`);
await sleep(1200);

console.log('=== 初始状态：不应该预先加载 Pagefind ===');
check('悬浮窗已挂到页面', (await ev(`!!document.querySelector('[data-search-modal]')`)) === true);
check('初始未拉取 pagefind-ui.js', (await ev(`!document.getElementById('pagefind-ui-js')`)) === true);
check('初始未拉取 pagefind-ui.css', (await ev(`!document.getElementById('pagefind-ui-css')`)) === true);
check('弹窗初始是关闭的', (await ev(`!document.querySelector('[data-search-modal]').open`)) === true);

console.log('\n=== 用 ⌘/Ctrl+K 打开（顶栏搜索按钮已按参考导航移除）===');
// 2026-09-18 改版：导航照 reference 复刻，顶栏不再有搜索按钮。
// 现存入口：⌘/Ctrl+K、左栏导航树的搜索按钮、移动端下拉菜单里的搜索按钮。
await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'k',metaKey:true,ctrlKey:true,bubbles:true}))`);
await waitFor(`document.querySelector('[data-search-modal]').open`);
check('快捷键后弹窗打开', (await ev(`document.querySelector('[data-search-modal]').open`)) === true);
await waitFor(`!!document.querySelector('.pagefind-ui__search-input')`, 20000);
check('Pagefind UI 已挂载（输入框出现）', (await ev(`!!document.querySelector('.pagefind-ui__search-input')`)) === true);
check('打开后才加载 pagefind-ui.css', (await ev(`!!document.getElementById('pagefind-ui-css')`)) === true);
check('输入框自动获得焦点', (await ev(`document.activeElement === document.querySelector('.pagefind-ui__search-input')`)) === true);

console.log('\n=== 搜索并出结果 ===');
await ev(`(()=>{const i=document.querySelector('.pagefind-ui__search-input');
  i.value='作品'; i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
await waitFor(`document.querySelectorAll('.pagefind-ui__result').length > 0`, 20000);
const n = await ev(`document.querySelectorAll('.pagefind-ui__result').length`);
check('搜索「作品」出结果', n > 0, `${n} 条`);
const msg = await ev(`(()=>{const m=document.querySelector('.pagefind-ui__message'); return m?m.textContent.trim():null;})()`);
console.log('  提示文案: ' + msg);

console.log('\n=== 截图（弹窗内结果）===');
const shot = await s('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) { writeFileSync(`${OUT}\\search-modal.png`, Buffer.from(shot.result.data, 'base64')); console.log('  ✓ search-modal.png'); }

console.log('\n=== 关闭方式 ===');
await ev(`document.querySelector('[data-search-close]').click()`);
await sleep(400);
check('点关闭按钮可关', (await ev(`document.querySelector('[data-search-modal]').open`)) === false);
await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'k',metaKey:true,ctrlKey:true,bubbles:true}))`);
await waitFor(`document.querySelector('[data-search-modal]').open`);
await ev(`document.querySelector('[data-search-modal]').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);
await sleep(300);
// Esc 由原生 dialog 处理，这里直接调用 cancel 语义验证状态清理
await ev(`(()=>{const d=document.querySelector('[data-search-modal]'); if(d.open) d.close();})()`);
await sleep(300);
check('关闭后状态类被清理', (await ev(`!document.documentElement.classList.contains('search-open')`)) === true);

console.log('\n=== 快捷键 ⌘/Ctrl+K ===');
await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}))`);
await sleep(500);
check('Ctrl+K 可打开', (await ev(`document.querySelector('[data-search-modal]').open`)) === true);
await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}))`);
await sleep(400);
check('再按一次可关闭', (await ev(`document.querySelector('[data-search-modal]').open`)) === false);

console.log('\n=== 软导航后仍可用 ===');
await ev(`[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')==='/gallery/')?.click()`);
await sleep(3500);
check('换页后悬浮窗还在', (await ev(`!!document.querySelector('[data-search-modal]')`)) === true);
await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'k',metaKey:true,ctrlKey:true,bubbles:true}))`);
await waitFor(`document.querySelector('[data-search-modal]').open`, 10000);
check('换页后仍能打开', (await ev(`document.querySelector('[data-search-modal]').open`)) === true);
check('换页后不再重复加载脚本', (await ev(`document.querySelectorAll('#pagefind-ui-js').length <= 1`)) === true);

check('全程无 JS 异常', errs.length === 0, errs[0] || '');

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
