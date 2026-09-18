// 诊断（不断言）：定位 React error #424
//   "This root received an early update, before anything was able to hydrate.
//    Switched the entire root to client rendering."
//
// 为什么需要这个脚本：smoke.mjs 只保留异常描述的前 90 个字符，且 React 在生产构建里
// 把错误压成 "Minified React error #424"，栈信息全部丢失 —— 光看冒烟结果无法定位。
//
// 关键手法（踩过才知道）：
//   1. react-dom 在**模块求值那一刻**就把 fallback 抓进局部变量：
//        var ci = typeof reportError === 'function' ? reportError : <ErrorEvent 兜底>
//      所以必须在文档创建前注入（Page.addScriptToEvaluateOnNewDocument），
//      页面加载完再改 window.reportError 没用。
//   2. 注入时保留原实现并继续调用，否则 Runtime.exceptionThrown 不再触发，
//      诊断结果会和 smoke 的口径对不上。
//   3. 软导航不换 document，所以 __cw424 数组能跨页累积，用 __cwStep 标记每一步。
//
// 用法：
//   node scripts/diag-424.mjs [url] [rounds]
//   例： node scripts/diag-424.mjs http://127.0.0.1:4321 6
// 前置：预览已起 + 无头浏览器 9222 已起（且要串行跑，见 HANDOFF §7.1 第 6 条）。
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const ROUNDS = Number(process.argv[3] || 4);
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

// 软导航一圈：起点 /works/，再按站点导航里真实存在的链接点回去
const SEQ = ['/gallery/', '/about/', '/account/', '/', '/works/'];

// FLOW=smoke 时复刻 smoke.mjs [3] 的完整动作序列（分类链接 → 日历 → ⌘K 搜索 → 软导航一圈）。
// 只跑上面那串点击复现不出来，说明 #424 依赖更具体的时序。
const SMOKE_FLOW = process.env.FLOW === 'smoke';
const STRESS = process.env.STRESS === '1';

const HOOK = `(() => {
  const w = window;
  w.__cw424 = [];
  w.__cwStep = 'boot';
  const orig = w.reportError;
  w.reportError = function (e) {
    try {
      w.__cw424.push({
        msg: (e && e.message) ? String(e.message) : String(e),
        stack: (e && e.stack) ? String(e.stack) : '',
        path: location.pathname,
        t: Math.round(performance.now()),
        step: w.__cwStep || '?',
        islands: [...document.querySelectorAll('astro-island')].map((i) =>
          (i.getAttribute('component-url') || '').split('/').pop() || '?')
      });
    } catch (_) {}
    if (orig) { try { orig(e); } catch (_) {} }
  };
})()`;

const cleanFrame = (f) => {
  const u = (f.url || '').replace(/^https?:\/\/[^/]+/, '');
  return `${f.functionName || '(anon)'} @ ${u}:${f.lineNumber + 1}:${f.columnNumber + 1}`;
};

async function withTab(url, fn) {
  const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const thrown = [];
  const consoleErrs = [];
  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails || {};
      thrown.push({
        text: d.text || '',
        desc: ((d.exception && d.exception.description) || '').slice(0, 200),
        frames: ((d.stackTrace && d.stackTrace.callFrames) || []).map(cleanFrame),
      });
    }
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) {
      consoleErrs.push({ type: m.params.type, text: (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200) });
    }
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: HOOK });
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.result && r.result.exceptionDetails) throw new Error((r.result.exceptionDetails.exception || {}).description || 'eval error');
    return r.result && r.result.result ? r.result.result.value : undefined;
  };
  {
    // ★自检：注入型操作必须回读确认生效（HANDOFF §33 教训 7）——
    // 否则"0 命中"可能只是钩子没装上，而不是真的没复现。
    await send('Page.navigate', { url: 'about:blank' });
    await sleep(300);
    const hooked = await evaluate(`(() => {
      const ok = typeof window.reportError === 'function' && Array.isArray(window.__cw424);
      if (ok) reportError(new Error('__cw424_probe__'));
      return ok && (window.__cw424 || []).some((h) => /__cw424_probe__/.test(h.msg));
    })()`);
    if (!hooked) console.log('  ⚠️ reportError 钩子未装上 —— 本轮结果不可信（应检查 addScriptToEvaluateOnNewDocument）');
  }
  try {
    await fn({ send, evaluate, thrown, consoleErrs });
  } finally {
    ws.close();
    try { await fetch(`${CDP}/json/close/${tab.id}`); } catch { /* 忽略 */ }
  }
}

const main = async () => {
  try {
    const r = await fetch(`${CDP}/json/version`);
    if (!r.ok) throw new Error(String(r.status));
  } catch {
    console.error(`✗ 连不上无头浏览器 ${CDP}`);
    process.exit(2);
  }

  console.log(`\n=== #424 诊断：${BASE} × ${ROUNDS} 轮 ===`);
  const all = [];

  // LOAD=N：先开 N 个重页面标签制造调度竞争（smoke 的 [1] 会连开 6 个标签页，
  // 历史上 #424 命中时机器上就有 20+ 个标签页 —— 竞争显然是触发条件的一部分）。
  const LOAD = Number(process.env.LOAD || 0);
  for (let i = 0; i < LOAD; i++) {
    try { await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/about/'), { method: 'PUT' }); } catch { /* 忽略 */ }
  }
  if (LOAD) console.log(`（已开 ${LOAD} 个 /about/ 标签制造调度竞争）`);

  for (let round = 1; round <= ROUNDS; round++) {
    await withTab(BASE, async ({ send, evaluate, thrown, consoleErrs }) => {
      await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      // #424 是水合竞态：CPU 降速会把"空闲水合"推迟，把偶发变成高频（CPU=4 实测有效）
      if (process.env.CPU) await send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.CPU) });
      await send('Page.navigate', { url: BASE + '/works/' });
      await sleep(4000);
      // smoke.mjs 的 [3] 是"开页后又 location.replace 一次"——照抄，保持时序一致
      if (SMOKE_FLOW) {
        await evaluate(`location.replace(${JSON.stringify(BASE + '/works/')})`);
        await sleep(3500);
      }

      const steps = [];
      // STRESS=1：快速连续换页（间隔很短）——让多个岛的水合互相重叠，
      // 这是 #424 最可能的触发条件（Astro 的 hydrateRoot + 紧随的 root.render 撞在一起）。
      if (STRESS) {
        const hops = Number(process.env.HOPS || 14);
        for (let i = 0; i < hops; i++) {
          const path = SEQ[i % SEQ.length];
          await evaluate(`window.__cwStep = ${JSON.stringify('STRESS#' + (i + 1) + ' → ' + path)}`);
          await evaluate(`[...document.querySelectorAll('a')].find((a) => a.getAttribute('href') === ${JSON.stringify(path)})?.click()`);
          await sleep(Number(process.env.GAP || 450));
        }
        const hitsNow = await evaluate(`JSON.stringify(window.__cw424 || [])`).then(JSON.parse).catch(() => []);
        steps.push({ path: `STRESS×${hops}`, hits: hitsNow.length });
      }
      if (SMOKE_FLOW) {
        await evaluate(`window.__cwStep = '点击左栏分类链接'`);
        await evaluate(`document.querySelector('a[href*="?tag="]')?.click()`);
        await sleep(2500);
        await evaluate(`window.__cwStep = '点击更新日历'`);
        await evaluate(`document.querySelector('[data-cal-day]')?.click()`);
        await sleep(800);
        await evaluate(`window.__cwStep = '⌘K 打开搜索'`);
        await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true }))`);
        await sleep(900);
        await evaluate(`window.__cwStep = '关闭搜索'`);
        await evaluate(`document.querySelector('[data-search-close]')?.click()`);
        await sleep(500);
      }
      for (const path of SEQ) {
        await evaluate(`window.__cwStep = ${JSON.stringify('→ ' + path)}`);
        await evaluate(`[...document.querySelectorAll('a')].find((a) => a.getAttribute('href') === ${JSON.stringify(path)})?.click()`);
        await sleep(3200);
        const hits = await evaluate(`JSON.stringify(window.__cw424 || [])`).then(JSON.parse).catch(() => []);
        steps.push({ path, hits: hits.length });
      }

      const hits = await evaluate(`JSON.stringify(window.__cw424 || [])`).then(JSON.parse).catch(() => []);
      const n424 = thrown.filter((t) => /#424/.test(t.text + t.desc)).length;
      console.log(`\n[第 ${round} 轮] reportError 命中 ${hits.length} 条｜Runtime.exceptionThrown(#424) ${n424} 条｜其它异常 ${thrown.length - n424} 条`);
      console.log('  逐步命中：' + steps.map((s) => `${s.path}=${s.hits}`).join('  '));
      for (const h of hits) {
        console.log(`   · step=${h.step} path=${h.path} t=${h.t}ms islands=[${h.islands.join(', ')}]`);
        const lines = String(h.stack || '(无 stack)').split('\n').slice(0, 10);
        lines.forEach((l, i) => console.log(`       ${i === 0 ? '↳' : ' '} ${l.trim()}`));
      }
      for (const t of thrown) {
        if (!/#424/.test(t.text + t.desc)) continue;
        console.log(`   · exceptionThrown: ${t.desc || t.text}`);
        (t.frames || []).slice(0, 8).forEach((f) => console.log(`       ↳ ${f}`));
      }
      if (consoleErrs.length) {
        console.log(`   · console.error/warn ${consoleErrs.length} 条，前 3 条：`);
        consoleErrs.slice(0, 3).forEach((c) => console.log(`       - [${c.type}] ${c.text}`));
      }
      all.push({ round, hits, thrown: thrown.filter((t) => /#424/.test(t.text + t.desc)) });
    });
  }

  const total = all.reduce((n, r) => n + r.hits.length, 0);
  const totalThrown = all.reduce((n, r) => n + r.thrown.length, 0);
  console.log(`\n=== 汇总：${ROUNDS} 轮里 reportError 命中 ${total} 条、exceptionThrown(#424) ${totalThrown} 条 ===`);
  const byStep = new Map();
  for (const r of all) for (const h of r.hits) byStep.set(h.step, (byStep.get(h.step) || 0) + 1);
  if (byStep.size) {
    console.log('按步骤聚合：');
    [...byStep.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`   ${v} 次  ${k}`));
  } else {
    console.log('本轮未复现 —— 提高轮数或换更快的机器再试（它是时序相关的间歇问题）。');
  }
};

main().catch((e) => { console.error('诊断脚本自身出错：', e.message); process.exit(1); });
