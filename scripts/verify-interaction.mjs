// 交互策略验收：把站长的三条要求变成断言。
//
// 背景（HANDOFF §49）：2026-09-19 站长要求
//   ① 文字不可用鼠标拖选 ② 点按钮后不出现"蓝色轮廓" ③ 键盘可访问性不能丢。
// 这三条最容易被"看起来改了"糊弄过去（比如有人用 pointer-events:none 或
// tabindex="-1" 去消轮廓，功能就废了），所以必须有断言，而且要**带对照组**——
// 否则"没选中文字"可能是拖拽本身就没生效（假绿）。
//
// 用法：先起预览 + 无头浏览器（同 smoke.mjs 的三步），再
//   node scripts/verify-interaction.mjs [baseUrl]
// 退出码：0=全过 / 1=有失败 / 2=环境没准备好
import { setTimeout as sleep } from 'node:timers/promises';

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
  const r = await fetch(`${BASE}/nav/`);
  if (!r.ok) throw new Error(String(r.status));
} catch {
  console.error(`✗ 连不上预览站点 ${BASE}——请先 npm run build && npm run preview`);
  process.exit(2);
}

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/nav/'), { method: 'PUT' })).json();
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
    errors.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || '').slice(0, 100));
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
await ev(`location.replace(${JSON.stringify(BASE + '/nav/')})`);
await sleep(3000);

// 拦住导航，免得测试把页面点走（每次 location.replace 后是全新文档，必须重装）
const GUARD = `(() => {
  if (window.__viGuard) return 1;
  window.__viGuard = 1;
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (a) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  return 1;
})()`;
await ev(GUARD);

/* ── 工具：真实指针事件 ── */
const boxOf = (sel) => ev(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)});
  if (!el) return null;
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, t: r.top, w: r.width, h: r.height };
})()`);

const mouse = (type, x, y, buttons) =>
  send('Input.dispatchMouseEvent', { type, x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1, buttons: buttons || 0 });

const clickAt = async (x, y) => {
  await mouse('mousePressed', x, y, 1);
  await mouse('mouseReleased', x, y, 0);
  await sleep(250);
};

const dragAcross = async (x1, y1, x2, y2) => {
  await mouse('mousePressed', x1, y1, 1);
  for (let i = 1; i <= 8; i++) {
    await mouse('mouseMoved', x1 + ((x2 - x1) * i) / 8, y1 + ((y2 - y1) * i) / 8, 1);
    await sleep(30);
  }
  await mouse('mouseReleased', x2, y2, 0);
  await sleep(200);
};

const selectionLen = () => ev(`(() => { const s = getSelection(); return s ? s.toString().trim().length : -1; })()`);

console.log(`\n=== 交互策略验收：${BASE} ===`);

/* ── A. 鼠标拖选不得选中正文 ── */
console.log('\n[A] 鼠标拖选正文：应选不中（含对照组，证明拖拽本身有效）');
// 刻意选**不在链接里**的段落：Chrome 在 <a> 上拖拽会走原生链接拖放而不是选文字，
// 两种情况下都选不中，会掩盖真实结论（对照组必须能红，否则这条断言没有意义）。
const para = await boxOf('.page-head .txt');
if (!para) {
  check('找得到一段正文（.page-head .txt）', false, '选择器没命中');
} else {
  await ev('getSelection().removeAllRanges()');
  await dragAcross(para.l + 4, para.t + para.h / 2, para.l + Math.min(para.w - 6, 220), para.t + para.h / 2);
  const got = await selectionLen();
  check('拖过正文后没有选中文字', got === 0, `选中 ${got} 字`);

  // 对照组：临时放行 user-select，同样的拖拽必须能选到字
  await ev(`(() => {
    const s = document.createElement('style'); s.id = '__vi_ctrl';
    s.textContent = '*{ -webkit-user-select:text !important; user-select:text !important; }';
    document.head.appendChild(s);
    getSelection().removeAllRanges();
    return 1;
  })()`);
  await sleep(150);
  await dragAcross(para.l + 4, para.t + para.h / 2, para.l + Math.min(para.w - 6, 220), para.t + para.h / 2);
  const ctrl = await selectionLen();
  await ev(`document.getElementById('__vi_ctrl')?.remove(); getSelection().removeAllRanges();`);
  check('对照组：放行 user-select 后同样拖拽能选中（证明拖拽有效）', ctrl > 0, `选中 ${ctrl} 字`);
}

/* ── B. 鼠标点击控件：不出轮廓 ── */
console.log('\n[B] 鼠标点击控件：不出现轮廓');
const OUTLINE = `(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const cs = getComputedStyle(el);
  return {
    tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().trim().slice(0, 24),
    style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) || 0,
    pointerFocus: el.hasAttribute('data-pointer-focus'), focusVisible: el.matches(':focus-visible'),
  };
})()`;
for (const [sel, label] of [['.pf-avatar', '圆形头像'], ['a.nvc', '导航卡片'], ['.nvc-ico', '卡片图标位']]) {
  const b = await boxOf(sel);
  if (!b) { check(`点${label}后不出现轮廓`, false, `找不到 ${sel}`); continue; }
  await ev('document.activeElement && document.activeElement.blur()');
  await sleep(120);
  await clickAt(b.x, b.y);
  const o = await ev(OUTLINE);
  const noRing = !!o && (o.width === 0 || o.style === 'none');
  check(`点${label}后不出现轮廓`, noRing, o ? `${o.tag}.${o.cls} outline=${o.style} ${o.width}px` : '没拿到焦点');
}

/* ── C. 键盘 Tab：轮廓必须还在（可访问性不能丢） ── */
console.log('\n[C] 键盘 Tab：轮廓必须保留');
await ev('document.activeElement && document.activeElement.blur(); document.body.focus();');
await sleep(120);
const tabbed = [];
for (let i = 0; i < 4; i++) {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 9, key: 'Tab', code: 'Tab' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, key: 'Tab', code: 'Tab' });
  await sleep(180);
  const o = await ev(OUTLINE);
  if (o) tabbed.push(o);
}
const ringed = tabbed.filter((o) => o.width >= 2 && o.style !== 'none' && !o.pointerFocus);
check(`Tab 聚焦过的 ${tabbed.length} 个元素里，有可见轮廓`, ringed.length > 0,
  tabbed.map((o) => `${o.tag}.${o.cls}:${o.width}px`).join(' '));
check('键盘聚焦的元素不带 data-pointer-focus 标记', tabbed.every((o) => !o.pointerFocus),
  tabbed.filter((o) => o.pointerFocus).map((o) => o.cls).join('、') || '无');

/* ── D. 文本输入类：光标落点必须始终可见 ── */
console.log('\n[D] 文本输入框：指针点击后仍要有可见轮廓（"在哪儿打字"要看得见）');
await ev(`(() => {
  const old = document.getElementById('__vi_input');
  if (old) old.remove();
  const i = document.createElement('input');
  i.id = '__vi_input'; i.type = 'text'; i.value = 'probe';
  i.style.cssText = 'position:fixed;left:40px;top:40px;width:160px;height:32px;z-index:99999';
  document.body.appendChild(i);
  return 1;
})()`);
await sleep(150);
const ib = await boxOf('#__vi_input');
if (!ib) {
  check('注入的探针输入框可用', false);
} else {
  await clickAt(ib.x, ib.y);
  const o = await ev(OUTLINE);
  check('指针点击文本输入框后仍有轮廓', !!o && o.width >= 2 && o.style !== 'none',
    o ? `outline=${o.style} ${o.width}px pointerFocus=${o.pointerFocus}` : '没拿到焦点');
}

/* ── E. 输入框仍可选中文本 ── */
const ues = await ev(`(() => {
  const i = document.getElementById('__vi_input');
  const body = getComputedStyle(document.body);
  const inp = i ? getComputedStyle(i) : null;
  return { body: body.userSelect, input: inp ? inp.userSelect : '(无输入框)' };
})()`);
check('body 关闭了拖选（user-select: none）', ues.body === 'none', `body=${ues.body}`);
check('输入框放行了选中（user-select: text）', ues.input === 'text', `input=${ues.input}`);

/* ── F. 文章正文必须**仍可选中**（§49 刻意保留的"例外的例外"） ──
   动机：`body{user-select:none}` 一刀切会把**文章正文与代码块**一起锁住。
   本站是博客，正文与代码可复制属核心用途 → 对 .pp-md 显式放行。
   这条断言的价值在于：**防止那条例外将来被谁顺手删掉**（删了 F 会红）。
   注意它**必须能红**（§7.6 第 3 条）：把 global.css 里 .pp-md 那条注释掉，这里就该失败。 */
console.log('\n[F] 文章正文：必须仍能选中复制（刻意保留的例外）');
try {
  const idx = await (await fetch(`${BASE}/posts/`)).text();
  const slug = (idx.match(/href="\/posts\/([^"/]+)\/"/) || [])[1];
  if (!slug) throw new Error('从 /posts/ 里没解析到文章链接');
  await ev(`location.replace(${JSON.stringify(`${BASE}/posts/${slug}/`)})`);
  await sleep(2500);
  await ev(GUARD); // 导航后是全新文档，守卫要重装
  const para2 = await boxOf('.pp-md p');
  if (!para2) {
    check('找得到一段文章正文（.pp-md p）', false, '选择器没命中');
  } else {
    await ev('getSelection().removeAllRanges()');
    await dragAcross(para2.l + 4, para2.t + para2.h / 2, para2.l + Math.min(para2.w - 6, 240), para2.t + para2.h / 2);
    const got2 = await selectionLen();
    check('拖过文章正文后能选中文字（例外生效）', got2 > 0, `选中 ${got2} 字`);
  }
} catch (e) {
  check('文章正文可选中（例外生效）', false, String(e.message || e).slice(0, 80));
}

check('全程无 JS 异常', errors.length === 0, errors[0] || '');

await ev(`document.getElementById('__vi_input')?.remove(); getSelection().removeAllRanges();`);
ws.close();
try { await fetch(`${CDP}/json/close/${tab.id}`); } catch { /* 忽略 */ }

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
if (failed.length) failed.forEach((f) => console.log('  ❌ ' + f.name));
process.exit(failed.length ? 1 : 0);
