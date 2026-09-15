// 站点冒烟测试：用无头浏览器跑一遍关键断言，避免改坏侧栏同步 / 软导航 / 响应式。
//
// 用法：
//   1) 先起预览：  npm run build && npm run preview -- --port 4321 --host 127.0.0.1
//   2) 再起无头浏览器（--user-data-dir 不能带空格）：
//        $ud = Join-Path $env:TEMP 'cwcdp'
//        Start-Process 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -ArgumentList @(
//          '--headless=new','--remote-debugging-port=9222','--remote-allow-origins=*',"--user-data-dir=$ud",
//          '--no-first-run','--disable-extensions')
//   3) 运行：      node scripts/smoke.cjs             （默认测 http://127.0.0.1:4321）
//                  node scripts/smoke.cjs https://cloudwing.pages.dev   （也可测线上）
//
// 退出码：0 全过 / 1 有失败项 / 2 环境没准备好（预览或浏览器没起）
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const SHELL_PAGES = ['/works/', '/works/w002-site/', '/gallery/', '/about/', '/account/', '/search/'];
const ALL_PAGES = [ '/', ...SHELL_PAGES, '/404.html'];

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  ✅' : '  ❌'} ${name}${detail ? '  —— ' + detail : ''}`);
};

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
    if (m.method === 'Runtime.exceptionThrown') {
      errors.push(((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text || '').slice(0, 90));
    }
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  await send('Runtime.enable');
  await send('Page.enable');
  const evaluate = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (r.result.exceptionDetails) throw new Error((r.result.exceptionDetails.exception || {}).description || 'eval error');
    return r.result.result.value;
  };
  try {
    await fn({ send, evaluate, errors });
  } finally {
    ws.close();
    try { await fetch(`${CDP}/json/close/${tab.id}`); } catch { /* 忽略 */ }
  }
}

const setup = async (send, width, height) => {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
};

const main = async () => {
  // 环境自检
  try {
    const r = await fetch(`${CDP}/json/version`);
    if (!r.ok) throw new Error(String(r.status));
  } catch {
    console.error(`✗ 连不上无头浏览器 ${CDP}——请按脚本头部注释启动 Edge（--remote-debugging-port=9222）`);
    process.exit(2);
  }
  try {
    const r = await fetch(BASE + '/works/');
    if (!r.ok) throw new Error(String(r.status));
  } catch {
    console.error(`✗ 连不上预览站点 ${BASE}——请先 npm run build && npm run preview -- --port 4321`);
    process.exit(2);
  }

  console.log(`\n=== 冒烟测试：${BASE} ===`);

  // 1) 每个页面：横向溢出 / 控制台异常 / 侧栏存在性
  console.log('\n[1] 各页面布局与异常');
  for (const path of ALL_PAGES) {
    await withTab(BASE + path, async ({ send, evaluate, errors }) => {
      await setup(send, 1440, 900);
      await evaluate(`location.replace(${JSON.stringify(BASE + path)})`);
      await sleep(6000);
      const d = await evaluate(`(() => {
        const l = document.querySelector('.shell-left'), r = document.querySelector('.shell-right');
        const h = (e) => e ? Math.round(e.getBoundingClientRect().height) : 0;
        return { ovf: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          左: h(l), 右: h(r), 左有滚动条: l ? l.scrollHeight > l.clientHeight + 1 : false,
          体: getComputedStyle(document.body).className };
      })()`);
      check(`${path} 横向溢出 0`, d.ovf === 0, 'overflowX=' + d.ovf);
      check(`${path} 无 JS 异常`, errors.length === 0, errors[0] || '');
      const isHome = path === '/';
      check(`${path} ${isHome ? '首页无侧栏' : '子页面有侧栏'}`, isHome ? d.左 === 0 && d.右 === 0 : d.左 > 0 && d.右 > 0);
      if (!isHome) {
        check(`${path} 两栏等高`, d.左 === d.右, `${d.左} / ${d.右}`);
        check(`${path} 侧栏无内部滚动条`, !d.左有滚动条);
      }
    });
  }

  // 2) 长页面：两栏吸顶逐帧同步 + 不被导航栏压在下面
  console.log('\n[2] 侧栏吸顶同步（/gallery/ 全页往返，逐帧采样）');
  await withTab(BASE + '/works/', async ({ send, evaluate }) => {
    await setup(send, 1440, 900);
    await evaluate(`location.replace(${JSON.stringify(BASE + '/gallery/')})`);
    await sleep(6000);
    await evaluate(`(() => {
      window.__d = 0; window.__p = 0;
      (function tick() {
        const l = document.querySelector('.shell-left'), r = document.querySelector('.shell-right'), h = document.querySelector('.site-header');
        if (l && r && h) {
          const a = l.getBoundingClientRect(), b = r.getBoundingClientRect(), hb = h.getBoundingClientRect();
          if (Math.abs(a.top - b.top) > 0.6) window.__d++;
          const cssL = parseFloat(getComputedStyle(l).top);
          const pinned = Math.abs(a.top - cssL) < 1.2;
          if (pinned && a.top < hb.bottom - 1 && hb.bottom > 0) window.__p++;
        }
        requestAnimationFrame(tick);
      })();
    })()`);
    const maxY = await evaluate('document.documentElement.scrollHeight - innerHeight');
    for (let y = 0; y <= maxY; y += 120) { await evaluate(`window.scrollTo(0, ${y})`); await sleep(35); }
    for (let y = maxY; y >= 0; y -= 120) { await evaluate(`window.scrollTo(0, ${y})`); await sleep(35); }
    await sleep(400);
    const d = await evaluate('({ desync: window.__d, pinnedUnderNav: window.__p })');
    check('两栏滚动不同步帧 = 0', d.desync === 0, 'desync=' + d.desync);
    check('侧栏不会钉在导航栏下方', d.pinnedUnderNav === 0, 'frames=' + d.pinnedUnderNav);
  });

  // 3) 软导航往返后交互仍在（分类筛选 + 更新日历）
  console.log('\n[3] 软导航往返后的交互');
  await withTab(BASE + '/works/', async ({ send, evaluate, errors }) => {
    await setup(send, 1440, 900);
    await sleep(6000);
    // 点导航栏「作品库」二级菜单里的第一个分类
    const href = await evaluate(`(() => {
      const a = [...document.querySelectorAll('.nav-sub a')].find((x) => x.search && x.search.includes('tag='));
      return a ? a.getAttribute('href') : null; })()`);
    if (href) {
      await evaluate(`[...document.querySelectorAll('.nav-sub a')].find((x) => x.getAttribute('href') === ${JSON.stringify(href)}).click()`);
      await sleep(4000);
      const d = await evaluate(`(() => ({ url: location.pathname + location.search,
        hidden: [...document.querySelectorAll('.wk-item')].filter((i) => i.hidden).length,
        chip: document.getElementById('catnow') ? !document.getElementById('catnow').hidden : null }))()`);
      check('导航分类 → 列表按分类过滤', d.hidden > 0, `${d.url}（隐藏 ${d.hidden} 项）`);
      check('分类回显条出现', d.chip === true);
    } else {
      check('导航栏存在分类二级菜单', false, '未找到 ?tag= 链接');
    }
    // 更新日历：点有记录的日期应展开明细
    await evaluate(`document.querySelector('[data-cal-day]')?.click()`);
    await sleep(800);
    const cal = await evaluate(`(() => { const p = document.querySelector('[data-cal-panel]');
      return p ? { open: !p.hidden, items: p.querySelectorAll('li').length } : null; })()`);
    check('侧栏更新日历可展开当天记录', !!cal && cal.open && cal.items > 0, cal ? `${cal.items} 条` : '无日历');
    check('交互过程无 JS 异常', errors.length === 0, errors[0] || '');
    // 软导航一圈
    for (const path of ['/gallery/', '/about/', '/account/', '/search/', '/']) {
      await evaluate(`[...document.querySelectorAll('a')].find((a) => a.getAttribute('href') === ${JSON.stringify(path)})?.click()`);
      await sleep(3500);
    }
    check('软导航一圈后仍无 JS 异常', errors.length === 0, errors[0] || '');
  });

  // 4) 手机视口：侧栏隐藏、单列
  console.log('\n[4] 手机视口');
  await withTab(BASE + '/works/', async ({ send, evaluate }) => {
    await setup(send, 414, 860);
    await evaluate(`location.replace(${JSON.stringify(BASE + '/works/')})`);
    await sleep(6000);
    const d = await evaluate(`(() => { const l = document.querySelector('.shell-left');
      // 手机端是单列：中栏不一定是 .shell 的直接子元素，选择器放宽并容错，
      // 否则软导航换页的竞态会让这里的 querySelector 返回 null 而抛错（非站点问题）。
      const m = document.querySelector('.shell > .main-content') || document.querySelector('.main-content');
      return { 左栏显示: l ? getComputedStyle(l).display : 'none',
        中栏宽: m ? Math.round(m.getBoundingClientRect().width) : null,
        ovf: document.documentElement.scrollWidth - document.documentElement.clientWidth }; })()`);
    check('手机端侧栏隐藏', d.左栏显示 === 'none');
    check('手机端无横向溢出', d.ovf === 0, 'overflowX=' + d.ovf);
    check('手机端单列（中栏可见）', d.中栏宽 !== null && d.中栏宽 > 300, `中栏宽=${d.中栏宽}`);
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
  if (failed.length) {
    failed.forEach((f) => console.log(`  ❌ ${f.name} ${f.detail}`));
    process.exit(1);
  }
};

main().catch((e) => {
  console.error('冒烟测试自身出错：', e.message);
  process.exit(1);
});
