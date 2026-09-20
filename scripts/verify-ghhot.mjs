// GitHub 热榜验收（§56，2026-09-20 站长要求）：右栏站点统计卡上方的热榜卡片。
//
// 站长要求：
//   ① 位置：右侧栏站点统计卡片上方；
//   ② 日/周/月/年四个子选项，默认每日；
//   ③ 刷新语义 = 每日 24 点 / 周、月、年最后一天 24 点自动换新（实现为时间桶缓存：
//      缓存键 = 当前桶，桶滚动即自动重拉；页面驻留时每分钟比对桶 ID）；
//   ④ 点击跳转对应仓库。
//
// 用法：先起预览 + 无头浏览器（同 smoke.mjs 三步），再
//   node scripts/verify-ghhot.mjs [baseUrl]
// 退出码：0=全过 / 1=有失败 / 2=环境没准备好
// ⚠️ 数据来自 api.github.com 真实请求（无鉴权限流 10 次/分钟）：脚本只实拉「每日/每周」
//    两个周期（月/年与它们同一代码路径，不为验证多耗限流），别在循环里跑本脚本。
import { setTimeout as sleep } from 'node:timers/promises';
import fs from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${name}${detail ? '  —— ' + detail : ''}`);
};

try {
  const r = await fetch(`${CDP}/json/version`);
  if (!r.ok) throw new Error(String(r.status));
} catch {
  console.error(`✗ 连不上无头浏览器 ${CDP}——请按 smoke.mjs 头部注释启动 Edge`);
  process.exit(2);
}
try {
  const r = await fetch(`${BASE}/blog/`);
  if (!r.ok) throw new Error(String(r.status));
} catch {
  console.error(`✗ 连不上预览/站点 ${BASE}`);
  process.exit(2);
}

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(`${BASE}/blog/`), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pend = new Map();
const send = (m, pp = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const click = async (x, y) => {
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
};
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await ev(`location.replace(${JSON.stringify(`${BASE}/blog/`)})`);
await sleep(3500);

/* ① 位置：存在且紧邻的下一张卡就是 STATS */
const pos = await ev(`(() => {
  const hot = document.querySelector('[data-ghhot]');
  const next = hot?.nextElementSibling;
  return {
    hot: !!hot,
    statsIsNext: next?.querySelector('h2')?.textContent.includes('STATS') ?? false,
    tabs: hot ? [...hot.querySelectorAll('[data-ghhot-tab]')].map(b => b.getAttribute('data-ghhot-tab')) : [],
    defaultSel: hot?.querySelector('[data-ghhot-tab][aria-selected="true"]')?.getAttribute('data-ghhot-tab'),
  };
})()`);
check('卡片存在且位于站点统计卡上方', pos.hot && pos.statsIsNext);
check('四个周期 tab（日/周/月/年）', (pos.tabs || []).join(',') === 'daily,weekly,monthly,yearly');
check('默认选中「每日」', pos.defaultSel === 'daily');

/* ② 等每日榜真实渲染（首次 fetch api.github.com，给足时间） */
await sleep(9000);
const daily = await ev(`(() => {
  const card = document.querySelector('[data-ghhot]');
  const items = [...card.querySelectorAll('.sw-hot-item')];
  return {
    state: card.dataset.ghhotState,
    n: items.length,
    url: items[0]?.querySelector('.sw-hot-name')?.href || '',
    stars: items[0]?.querySelector('.sw-hot-stars')?.textContent || '',
  };
})()`);
check('每日榜渲染出条目（≥5）', daily.state === 'ready' && daily.n >= 5, `state=${daily.state} n=${daily.n}`);
check('条目链接跳转 github.com 仓库', /^https:\/\/github\.com\/[^/]+\/[^/]+/.test(daily.url), daily.url);
check('条目带 star 数', /★/.test(daily.stars), daily.stars);

/* ③ 切每周：tab 选中态更新 + 渲染 */
await click(...(await ev(`(() => {
  const b = document.querySelector('[data-ghhot-tab="weekly"]');
  const r = b.getBoundingClientRect();
  return [Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)];
})()`)) || [0, 0]);
await sleep(9000);
const weekly = await ev(`(() => {
  const card = document.querySelector('[data-ghhot]');
  return {
    state: card.dataset.ghhotState,
    sel: card.querySelector('[data-ghhot-tab][aria-selected="true"]')?.getAttribute('data-ghhot-tab'),
    n: card.querySelectorAll('.sw-hot-item').length,
  };
})()`);
check('切「每周」后正常渲染', weekly.state === 'ready' && weekly.sel === 'weekly' && weekly.n >= 5,
  `state=${weekly.state} sel=${weekly.sel} n=${weekly.n}`);

/* ④ 时间桶缓存：键与当前日/周桶一致（= 24 点跨桶自动换新的实现依据） */
const cache = await ev(`(() => {
  const raw = JSON.parse(localStorage.getItem('__cwGhHot_v1') || '{}');
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const wk = 'w' + mon.getFullYear() + '-' + pad(mon.getMonth() + 1) + '-' + pad(mon.getDate());
  return { daily: raw.daily?.bucket === today, weekly: raw.weekly?.bucket === wk };
})()`);
check('每日缓存桶 = 当天（跨 24 点自动失效）', cache.daily === true);
check('每周缓存桶 = 本周周一（周末 24 点跨桶）', cache.weekly === true);

/* ⑤ 截图存档 */
await ev(`document.querySelector('[data-ghhot]')?.scrollIntoView({ block: 'center', behavior: 'instant' })`);
await sleep(600);
const shot = await send('Page.captureScreenshot', { format: 'png' });
try { fs.writeFileSync('_shots/ghhot.png', Buffer.from(shot.result.data, 'base64')); } catch { /* 只读环境忽略 */ }

const pass = results.every((r) => r.ok);
console.log(`=== 结果：${results.filter((r) => r.ok).length}/${results.length} 通过 ===`);
process.exit(pass ? 0 : 1);
