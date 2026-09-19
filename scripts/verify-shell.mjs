// 壳层一致性验收（§52，2026-09-20 站长要求）：三个子页面页头格式统一 + 顶对齐。
//
// 站长四条要求：
//   ① 子页面标题格式统一（都是 .page-head h1 同一套字号/字体）
//   ② 标题上方小字（kicker）格式统一 → 「<b>英文</b> / 中文」，无「· 后缀」
//   ③ 标题下方不放描述简介（.txt / .sub 不允许作为 page-head 直接子元素）
//   ④ 中心内容列（侧栏除外）顶部与侧栏首卡顶边对齐，各子页面一致（偏差 ≤ 1px）
//
// 背景：/posts /blog /log 的 root 包装各带 padding-top 2.4rem、account 的 .room-stage
// 带 0.5rem，gallery/nav/about 为 0 —— 三种偏差并存；改壳层时还踩过「kicker 的 UA
// 默认 margin-top 1em 塌陷出 page-head 把标题块推下 12px」的坑（见 global.css .kicker 注）。
// 本脚本把这三件事全部变成断言，防止将来加新子页面时再次漂移。
//
// 用法：先起预览 + 无头浏览器（同 smoke.mjs 的三步），再
//   node scripts/verify-shell.mjs [baseUrl]
// 退出码：0=全过 / 1=有失败 / 2=环境没准备好
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const PAGES = ['/posts/', '/blog/', '/log/', '/gallery/', '/nav/', '/about/', '/account/'];

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
  const r = await fetch(`${BASE}/blog/`);
  if (!r.ok) throw new Error(String(r.status));
} catch {
  console.error(`✗ 连不上预览站点 ${BASE}——请先 npm run build && npm run preview`);
  process.exit(2);
}

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
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

const KICKER_RE = /^[A-Z]+ \/ .+$/; // 「EN / 中文」，无「· 后缀」
for (const path of PAGES) {
  console.log(`\n── ${path} ──`);
  await ev(`location.replace(${JSON.stringify(BASE + path)})`);
  await sleep(2500);
  const r = await ev(`(() => {
    const card = document.querySelector('.shell-left .sidecard');
    const head = document.querySelector('.page-head') || document.querySelector('.work-head');
    if (!card || !head) return { err: '壳层结构缺失', card: !!card, head: !!head };
    const dev = head.getBoundingClientRect().top - card.getBoundingClientRect().top;
    const kicker = head.querySelector('.kicker, .no-big');
    const desc = [...head.children].filter(el => el.classList.contains('txt') || el.classList.contains('sub')).length;
    const h1 = head.querySelector('h1');
    return {
      偏差: Math.round(dev * 10) / 10,
      kicker: kicker ? kicker.textContent.replace(/\\s+/g, ' ').trim() : null,
      kickerBold: kicker ? (kicker.querySelector('b')?.textContent || '') : null,
      kickerText: kicker ? [...kicker.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).filter(Boolean).join(' ') : null,
      描述数: desc,
      h1: h1 ? h1.textContent.trim() : '',
      溢出: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  })()`);
  if (r.err) { check(`${path} 壳层结构完整`, false, JSON.stringify(r)); continue; }
  check(`${path} 内容顶与侧栏首卡顶对齐（≤1px）`, Math.abs(r.偏差) <= 1, `偏差=${r.偏差}px`);
  check(`${path} kicker 是「EN / 中文」格式`, !!r.kicker && KICKER_RE.test(r.kicker) && !r.kicker.includes('·'), JSON.stringify(r.kicker));
  check(`${path} kicker 英文词在 <b> 里`, !!r.kickerBold && /^[A-Z]+$/.test(r.kickerBold), String(r.kickerBold));
  check(`${path} 标题下无描述简介`, r.描述数 === 0);
  check(`${path} h1 非空`, r.h1.length > 0, r.h1.slice(0, 12));
  check(`${path} 无横向溢出`, r.溢出 === 0, `溢出=${r.溢出}px`);
}

check('全程无 JS 异常', errors.length === 0, errors.slice(0, 2).join(' | '));

const fail = results.filter(r => !r.ok).length;
console.log(`\n${fail === 0 ? '🎉' : '💥'} verify-shell：${results.length - fail}/${results.length} 通过`);
ws.close();
process.exit(fail === 0 ? 0 : 1);
