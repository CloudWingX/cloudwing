// /log/ 子页面验收：结构完整性 + 玻璃材质 + 导航注册 + 无横向溢出。
//
// 背景（HANDOFF §50）：2026-09-19 站长要求增加网站日志子页面。
// 数据源是 src/content/changelog/*.md（一天一文件），/blog/ 是压缩时间线，
// /log/ 是完整展开版。断言刻意用「相对计数」而不用具体数字（比如天数=17），
// 这样以后加 changelog 不会误报。
//
// 用法：先起预览 + 无头浏览器（同 smoke.mjs 的三步），再
//   node scripts/verify-log.mjs [baseUrl]
// 退出码：0=全过 / 1=有失败 / 2=环境没准备好
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`  ${ok ? '✅' : '❌'} ${name}${detail ? '  —— ' + detail : ''}`);
};

// 环境自检
try {
  const r = await fetch(`${CDP}/json/version`);
  if (!r.ok) throw new Error(String(r.status));
} catch {
  console.error(`✗ 连不上无头浏览器 ${CDP}——请按 smoke.mjs 头部注释启动 Edge`);
  process.exit(2);
}
try {
  const r = await fetch(`${BASE}/log/`);
  if (!r.ok) throw new Error(String(r.status));
} catch {
  console.error(`✗ 连不上预览站点 ${BASE}——请先 npm run build && npm run preview`);
  process.exit(2);
}

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/log/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0;
const pending = new Map();
const errors = [];
const send = (method, params = {}) =>
  new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.method === 'Runtime.exceptionThrown') {
    errors.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').slice(0, 120));
  }
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
await send('Runtime.enable');
await send('Page.enable');
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text || 'eval error');
  return r.result.result.value;
};

await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await ev(`location.replace(${JSON.stringify(BASE + '/log/')})`);
await sleep(3000);

/* A. 页面壳层与标题 */
const head = await ev(`(() => ({
  h1: document.querySelector('.page-head h1')?.textContent?.trim() || '',
  url: location.pathname,
  ready: document.readyState,
}))()`);
check('A1 落在 /log/ 且加载完成', head.url === '/log/' && head.ready === 'complete', head.url + ' ' + head.ready);
check('A2 页头标题为「日志」', head.h1 === '日志', head.h1);

/* B. 数据结构：年 → 日 → 条目 */
const st = await ev(`(() => {
  const q = (s) => document.querySelectorAll(s).length;
  const years = [...document.querySelectorAll('.lg-yy')].map(e => e.textContent.trim());
  const days = [...document.querySelectorAll('.lg-day')];
  const badDay = days.filter(d => d.querySelectorAll('.lg-item').length === 0).length;
  const items = [...document.querySelectorAll('.lg-item')];
  const badItem = items.filter(i => !i.querySelector('.lg-kind') || !i.querySelector('.lg-title')).length;
  const notes = items.filter(i => i.querySelector('.lg-note')).length;
  const postLinks = document.querySelectorAll('.lg-post').length;
  const hasEmpty = /没有|暂无/.test(document.querySelector('.page-head')?.textContent || '');
  return { years, yearsCount: years.length, days: days.length, badDay,
           items: items.length, badItem, notes, postLinks, hasEmpty };
})()`);
check('B1 有按年分组（≥1 个年份）', st.yearsCount >= 1, (st.years || []).join('/'));
check('B2 年份从新到旧排列', JSON.stringify(st.years) === JSON.stringify([...(st.years || [])].sort().reverse()), (st.years || []).join('→'));
check('B3 每个日期卡都有条目（无空日）', st.badDay === 0, `days=${st.days}`);
check('B4 条目数 ≥ 天数（一天至少一条）', st.items >= st.days && st.items > 0, `items=${st.items} days=${st.days}`);
check('B5 每个条目都有类型徽标 + 标题', st.badItem === 0, `bad=${st.badItem}`);
check('B6 有备注详情与文章链接', st.notes > 0 && st.postLinks > 0, `notes=${st.notes} postLinks=${st.postLinks}`);
check('B7 无「暂无日志」空态兜底', !st.hasEmpty);

/* C. 导航注册：顶栏 + 左栏 + 当前高亮 */
const nav = await ev(`(() => {
  const top = [...document.querySelectorAll('header a[href="/log/"], .site-nav a[href="/log/"], nav a[href="/log/"]')].length;
  const side = [...document.querySelectorAll('aside a[href="/log/"]')].length;
  const cur = [...document.querySelectorAll('a[href="/log/"]')].filter(a =>
    a.matches('[aria-current="page"]') || a.classList.contains('cur') || a.classList.contains('active')).length;
  return { top, side, cur };
})()`);
check('C1 顶栏有「日志」入口', nav.top >= 1, `top=${nav.top}`);
check('C2 左栏有「更新日志」入口', nav.side >= 1, `side=${nav.side}`);
check('C3 当前页高亮标记', nav.cur >= 1, `cur=${nav.cur}`);

/* D. 材质与布局 */
const fx = await ev(`(() => {
  const card = document.querySelector('.lg-day');
  if (!card) return { has: false };
  const cs = getComputedStyle(card);
  const doc = document.documentElement;
  return {
    has: true,
    blur: cs.backdropFilter || cs.webkitBackdropFilter || '',
    bg: cs.backgroundColor,
    hscroll: doc.scrollWidth - doc.clientWidth,
  };
})()`);
check('D1 日期卡用玻璃材质（backdrop-filter）', fx.has && /blur/.test(fx.blur || ''), fx.blur);
check('D2 无横向溢出', fx.hscroll === 0, `overflow=${fx.hscroll}px`);

/* E. 运行时无 JS 异常 */
check('E1 页面无运行时异常', errors.length === 0, errors.slice(0, 2).join(' | '));

/* 截图留档（注意：CDP 截图 clip 用文档坐标，这里截视口即可） */
const shot = await send('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) {
  const dir = new URL('../_shots/', import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL('log-page.png', dir), Buffer.from(shot.result.data, 'base64'));
  console.log('  📸 截图已存 _shots/log-page.png');
}

const fail = results.filter(r => !r.ok).length;
console.log(`\n${fail === 0 ? '🎉' : '💥'} verify-log：${results.length - fail}/${results.length} 通过`);
process.exit(fail === 0 ? 0 : 1);
