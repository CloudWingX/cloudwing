// 亮色主题可读性审计：用 CDP 打开页面，对每个可见文字节点算「前景 vs 实际背景」的
// WCAG 对比度，列出不达标项；并统计页面亮度分布，找出"刺眼"（大面积高亮度低对比）区域。
//
// 用法：
//   1) 先起预览：  npm run build && npm run preview -- --port 4321 --host 127.0.0.1
//   2) 再起无头浏览器： 见 HANDOFF §7.1（--remote-debugging-port=9222）
//   3) node scripts/contrast-audit.mjs [baseUrl]
//
// 退出码：0 = 无严重问题 / 1 = 存在不达标项 / 2 = 环境没起
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const THEME = process.argv[3] === 'dark' ? 'dark' : 'light'; // 第二参数：light（默认）| dark
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const PAGES = ['/', '/works/', '/gallery/', '/about/', '/account/'];

// 在浏览器里跑：合成背景（穿透透明祖先，把半透明叠加算进去）+ 算对比度
const AUDIT_FN = `(() => {
  const lum = (r, g, b) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const l1 = lum(...a), l2 = lum(...b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };
  const parse = (s) => {
    const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null;
    const p = m[1].split(/[,\\/]/).map((x) => parseFloat(x));
    return { c: [p[0], p[1], p[2]], a: p.length > 3 && !isNaN(p[3]) ? p[3] : 1 };
  };
  // 收集所有绘制了背景的祖先层，自底向上做 alpha 合成
  const effBg = (el) => {
    const layers = [];
    let n = el;
    while (n && n.nodeType === 1) {
      const bg = parse(getComputedStyle(n).backgroundColor);
      if (bg && bg.a > 0.001) layers.push(bg);
      n = n.parentElement;
    }
    // 兜底画布：body/html 常常是透明的（渐变背景画在 body 上），直接假设白色
    // 会在深色主题下把一切都算成"白底黑字"，得出满屏假的 1:1 —— 先问 body/html 的实色。
    let canvas = [255, 255, 255];
    for (const sel of ['body', 'html']) {
      const e2 = document.querySelector(sel);
      if (!e2) continue;
      const bg = parse(getComputedStyle(e2).backgroundColor);
      if (bg && bg.a > 0.99) { canvas = bg.c; break; }
      // 渐变背景（backgroundImage）时 backgroundColor 是透明的：用主题底色兜底
      if (bg && bg.a > 0.001) canvas = bg.c;
    }
    if (canvas[0] === 255 && canvas[1] === 255 && canvas[2] === 255) {
      canvas = document.documentElement.dataset.theme === 'dark' ? [12, 12, 14] : [255, 255, 255];
    }
    layers.push({ c: canvas, a: 1 });
    let out = canvas;
    for (let i = layers.length - 1; i >= 0; i--) {
      const L = layers[i];
      out = [0, 1, 2].map((k) => L.c[k] * L.a + out[k] * (1 - L.a));
    }
    return out.map((v) => Math.round(v));
  };
  const out = [];
  const seen = new Set();
  document.querySelectorAll('body *').forEach((el) => {
    // 只看直接含文字的节点
    const txt = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join('');
    if (!txt) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.5) return;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    if (r.bottom < 0 || r.top > innerHeight * 6) return;
    const fg = parse(cs.color); if (!fg) return;

    // 渐变裁切文字（background-clip:text + color:transparent）：computed color 全透明，
    // 直接按前景算会得到假 1:1。改用渐变各停靠点的平均色近似评估。
    const clip = cs.webkitBackgroundClip || cs.backgroundClip || '';
    let fgColor = fg.c, fgAlpha = fg.a, approx = false;
    if (fg.a < 0.05 && /text/.test(clip)) {
      const stops = (String(cs.backgroundImage).match(/rgba?\\([^)]+\\)/g) || []).map(parse).filter(Boolean);
      if (stops.length) {
        fgColor = [0, 1, 2].map((k) => stops.reduce((a, s) => a + s.c[k], 0) / stops.length);
        fgAlpha = 1; approx = true;
      }
    }

    const bgc = effBg(el);
    const fr = [0, 1, 2].map((k) => fgColor[k] * fgAlpha + bgc[k] * (1 - fgAlpha));
    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3.0 : 4.5;
    const cr = ratio(fr, bgc);
    const key = el.tagName + '|' + (typeof el.className === 'string' ? el.className : '') + '|' + cs.color + '|' + txt.slice(0, 12);
    if (seen.has(key)) return; seen.add(key);
    out.push({
      sel: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : ''),
      txt: txt.slice(0, 26), cr: Math.round(cr * 100) / 100, need, size, weight,
      color: cs.color, bg: 'rgb(' + bgc.join(',') + ')', ok: cr >= need, approx,
    });
  });
  const lums = out.map((o) => lum(...o.bg.match(/\\d+/g).slice(0, 3).map(Number)));
  const avg = lums.length ? lums.reduce((a, b) => a + b, 0) / lums.length : 0;
  return { items: out, avgBgLum: Math.round(avg * 1000) / 1000, count: out.length, theme: document.documentElement.dataset.theme };
})()`;

async function withTab(url, fn) {
  const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(url), { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const errors = [];
  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  await send('Page.enable');
  await send('Runtime.enable');
  try { return await fn({ send, errors }); }
  finally { ws.close(); try { await fetch(`${CDP}/json/close/${tab.id}`); } catch {} }
}

const main = async () => {
  try {
    const r = await fetch(`${CDP}/json/version`);
    if (!r.ok) throw new Error(String(r.status));
  } catch {
    console.error(`✗ 连不上无头浏览器 ${CDP}`);
    process.exit(2);
  }

  const failures = [];
  for (const path of PAGES) {
    const res = await withTab(BASE + path, async ({ send }) => {
      // 无头浏览器 prefers-color-scheme 默认 dark；按参数强制成目标主题
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: THEME }] });
      // 注意这里是被注入到浏览器的源码字符串，必须把 THEME 用 JSON.stringify 内插进去
      const th = JSON.stringify(THEME);
      await send('Page.addScriptToEvaluateOnNewDocument', {
        source: `try{localStorage.setItem('cw-theme-pref',${th});sessionStorage.setItem('cw-theme-pref',${th});document.cookie='cw-theme-pref='+${th}+';path=/';}catch(e){}`,
      });
      await send('Page.navigate', { url: BASE + path });
      await sleep(2600);
      // 兜底：主题不符就直接置位并等重排
      const t = await send('Runtime.evaluate', { expression: `document.documentElement.dataset.theme`, returnByValue: true });
      if (t.result.result.value !== THEME) {
        await send('Runtime.evaluate', { expression: `document.documentElement.dataset.theme=${th};document.documentElement.dataset.themePref=${th};` });
        await sleep(700);
      }
      const r = await send('Runtime.evaluate', { expression: AUDIT_FN, returnByValue: true });
      if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval error');
      return r.result.result.value;
    });

    const bad = res.items.filter((i) => !i.ok);
    console.log(`\n=== ${path}  (theme=${res.theme}, 文字节点=${res.count}, 平均背景亮度=${res.avgBgLum}) ===`);
    if (!bad.length) console.log('  ✅ 全部达标');
    else {
      bad.sort((a, b) => a.cr - b.cr);
      for (const b of bad.slice(0, 14)) {
        console.log(`  ❌ ${b.cr}:1 (需 ${b.need})  ${b.size}px/${b.weight}  ${b.sel}  "${b.txt}"  ${b.color} on ${b.bg}${b.approx ? '  (渐变近似)' : ''}`);
        failures.push({ page: path, ...b });
      }
      if (bad.length > 14) console.log(`  … 另有 ${bad.length - 14} 项`);
    }
  }

  console.log(`\n=== 汇总：不达标文字 ${failures.length} 处 ===`);
  const byColor = {};
  for (const f of failures) byColor[f.color] = (byColor[f.color] || 0) + 1;
  Object.entries(byColor).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c}  →  ${n} 处`));
  process.exit(failures.length ? 1 : 0);
};

main();
