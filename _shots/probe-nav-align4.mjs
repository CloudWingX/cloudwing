// probe-nav-align4.mjs — 量化「导航栏 vs 各页内容容器」相对位置（硬加载）
// 视口 1280/1536/1920 × 页面 /, /gallery/, /posts/, /log/, /calendar/
import { writeFileSync } from 'node:fs';

const CDP = 'http://127.0.0.1:9222';
const BASE = 'http://127.0.0.1:4321';
const VIEWPORTS = [1280, 1536, 1920];
const PAGES = ['/', '/gallery/', '/posts/', '/log/', '/calendar/'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const target = await (await fetch(CDP + '/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
function send(method, params = {}) {
  return new Promise((res, rej) => {
    const i = ++id; pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
}
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const p = pending.get(m.id); pending.delete(m.id);
    m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
  }
};
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

// 测量表达式（避免模板字符串嵌套，纯字符串拼接）
const EXPR = [
  '(() => {',
  '  const rr = (el) => { const b = el.getBoundingClientRect(); return { l: +b.left.toFixed(2), r: +b.right.toFixed(2), w: +b.width.toFixed(2) }; };',
  '  const hc = document.querySelector(".header-container");',
  '  const logo = document.querySelector(".logo");',
  '  const nav1 = document.querySelector(".nav-links a");',
  '  const out = { cw: document.documentElement.clientWidth, sc: document.documentElement.getAttribute("data-scrolled"), sy: window.scrollY };',
  '  out.hc = hc ? rr(hc) : null;',
  '  out.logoL = logo ? +logo.getBoundingClientRect().left.toFixed(2) : null;',
  '  out.nav1L = nav1 ? +nav1.getBoundingClientRect().left.toFixed(2) : null;',
  '  const sels = ["h1", ".shell", ".wrap", ".gal-layout", ".cal-shell", ".post-wrap", "main > section", "main > div"];',
  '  out.anchors = [];',
  '  const seen = new Set();',
  '  for (const s of sels) {',
  '    const el = document.querySelector(s);',
  '    if (el && !seen.has(el)) { seen.add(el); const a = rr(el); a.sel = s; a.cls = String(el.className || "").slice(0, 50); out.anchors.push(a); }',
  '  }',
  '  const main = document.querySelector("main");',
  '  if (main) { out.mainKids = Array.from(main.children).slice(0, 3).map(el => { const a = rr(el); a.cls = String(el.className || "").slice(0, 50); a.tag = el.tagName; return a; }); }',
  '  return out;',
  '})()'
].join('\n');

const rows = [];
for (const vw of VIEWPORTS) {
  await send('Emulation.setDeviceMetricsOverride', { width: vw, height: 900, deviceScaleFactor: 1, mobile: false });
  for (const page of PAGES) {
    await send('Page.navigate', { url: BASE + page });
    let ready = '';
    for (let i = 0; i < 40; i++) {
      await sleep(120);
      try {
        const rs = await send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
        ready = rs.result.value;
        if (ready === 'complete') break;
      } catch { /* navigating */ }
    }
    await sleep(350);
    const res = await send('Runtime.evaluate', { expression: EXPR, returnByValue: true });
    const m = res.result.value;
    if (!m) { console.log(vw, page, 'MEASURE_FAIL'); continue; }
    m.vw = vw; m.page = page;
    rows.push(m);
    const an = (m.anchors || []).map(a => a.sel + '{l=' + a.l + ',r=' + a.r + ',w=' + a.w + '}').join(' | ');
    console.log('[' + vw + '] ' + page.padEnd(11) + ' cw=' + m.cw + ' sc=' + m.sc +
      ' hc{l=' + (m.hc ? m.hc.l : '-') + ',r=' + (m.hc ? m.hc.r : '-') + ',w=' + (m.hc ? m.hc.w : '-') + '}' +
      ' logoL=' + m.logoL + ' nav1L=' + m.nav1L);
    console.log('           anchors: ' + an);
    if (m.mainKids) console.log('           mainKids: ' + m.mainKids.map(k => k.tag + '.' + k.cls + '{l=' + k.l + ',w=' + k.w + '}').join(' | '));
  }
}

writeFileSync(new URL('./nav-align4.json', import.meta.url), JSON.stringify(rows, null, 2));

// 差值表：logo 左缘 vs 各锚点左缘（同一视口内横向比较）
console.log('\n===== 差值表：logoL - 锚点l（正值=logo在锚点右侧）=====');
for (const vw of VIEWPORTS) {
  console.log('--- viewport ' + vw + ' ---');
  for (const row of rows.filter(r => r.vw === vw)) {
    const diffs = (row.anchors || []).map(a => a.sel + ': ' + (row.logoL - a.l).toFixed(1)).join('  ');
    console.log(row.page.padEnd(11) + ' logoL=' + row.logoL + '  Δ ' + diffs);
  }
}
console.log('DONE rows=' + rows.length);
ws.close(); process.exit(0);
