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

const SHELL_PAGES = ['/posts/', '/blog/', '/log/', '/gallery/', '/nav/', '/about/', '/account/'];
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

// 等待布局就绪：线上 /account/ 内嵌 giscus 第三方 iframe，6s 固定等待可能仍停在
// readyState=loading（此时 .shell 还没渲染 → 侧栏高度测成 0，误报为站点问题）。
// 这里改为轮询"选择器已存在且高度>0"，最多等 40s（线上 /account/ 内嵌 giscus，
// 冷启动偶发要 20s+）；超时则照常断言（真失败仍会暴露），并打印超时提示便于判读。
const waitForLayout = async (evaluate, selector, timeoutMs = 40000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const ok = await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)});
      return !!e && e.getBoundingClientRect().height > 0; })()`);
    if (ok) return Date.now() - t0;
    await sleep(500);
  }
  return -1;
};

// 等 sideSticky() 把两栏补成等高之后再做断言：实测 /404.html 会先出现
// 左 661 / 右 841 的中间态，约 1s 后才被补齐到 841/841。
// 不等它就会把这个瞬态误报成"两栏不等高"。
const waitForEqualSidebars = async (evaluate, timeoutMs = 15000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const d = await evaluate(`(() => { const l=document.querySelector('.shell-left'), r=document.querySelector('.shell-right');
      const h=(e)=>e?Math.round(e.getBoundingClientRect().height):0; return { l:h(l), r:h(r) }; })()`);
    if (d && d.l > 0 && d.r > 0 && Math.abs(d.l - d.r) <= 1) return { waited: Date.now() - t0, ...d };
    await sleep(400);
  }
  return null;
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
    const r = await fetch(BASE + '/blog/');
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
      await sleep(3000);
      // 首页不套三栏壳层，等 .main-content 即可；子页面还要等两栏被补成等高
      const isHomePage = path === '/';
      const waited = await waitForLayout(evaluate, isHomePage ? '.main-content' : '.shell-left');
      if (waited < 0) console.log(`  · ${path} ⚠️ 等待布局超时（40s），下面的断言可能是等待不足而非站点问题`);
      else if (waited > 3000) console.log(`  · ${path} 布局等待 ${(waited / 1000).toFixed(1)}s`);
      if (!isHomePage) await waitForEqualSidebars(evaluate);
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
  await withTab(BASE + '/blog/', async ({ send, evaluate }) => {
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
  await withTab(BASE + '/blog/', async ({ send, evaluate, errors }) => {
    await setup(send, 1440, 900);
    // 二级菜单是 JS 生成的（ui.js 的 navSub()），日历面板也由 JS 渲染。
    // 固定 6s 在线上会赶在它们生成之前就查询 → 误报"未找到 ?tag= 链接 / 无日历"。
    // 这里轮询等到它们出现再断言。
    const waitFor = async (expr, ms = 30000) => {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        const ok = await evaluate(expr);
        if (ok) return true;
        await sleep(500);
      }
      return false;
    };
    // 内容入口：2026-09-19 起作品库移除，左栏导航树为「文章」分组（/posts/），
    // 归档时间线在 /blog/。这里点左栏的文章入口 → 打开文章列表 → 进详情页。
    await waitFor(`[...document.querySelectorAll('a[href="/posts/"]')].some((x) => x.closest('.shell-left'))`);
    await waitFor(`!!document.querySelector('[data-cal-day]')`);
    await evaluate(`[...document.querySelectorAll('a[href="/posts/"]')].find((x) => x.closest('.shell-left'))?.click()`);
    // 轮询等软导航完成：线上水合比本地慢，固定 sleep 会读到中间态
    let postsNav = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 15000) {
      await sleep(500);
      postsNav = !!(await evaluate(`location.pathname === '/posts/' && !!document.querySelector('.pcard')`));
      if (postsNav) break;
    }
    check('左栏文章入口 → 打开文章列表', postsNav === true, postsNav ? '/posts/（列表已渲染）' : '未跳转');
    // 点第一篇文章 → 详情页
    await evaluate(`document.querySelector('.pcard .pc-title a')?.click()`);
    let detail = null;
    const t1 = Date.now();
    while (Date.now() - t1 < 15000) {
      await sleep(500);
      detail = await evaluate(`(()=>({路径:location.pathname.startsWith('/posts/'),
        正文:!!document.querySelector('.pp-md'), 标题:!!document.querySelector('.pp-title')}))()`);
      if (detail && detail.路径 && detail.正文) break;
    }
    check('文章列表 → 详情页打开', !!detail && detail.路径 && detail.正文, detail ? detail.路径 : '未跳转');
    // 归档时间线：/blog/ 精确到日、可跳转对应文章
    await evaluate(`location.href = ${JSON.stringify(BASE + '/blog/')}`);
    await sleep(2500);
    const arch = await evaluate(`(()=>{const days=[...document.querySelectorAll('.tl-day')];
      const withPost=[...document.querySelectorAll('.tl-day a[href^="/posts/"]')];
      return {天数:days.length, 可跳文章:withPost.length, 年份:[...document.querySelectorAll('.tl-yy')].length};})()`);
    check('归档时间线按日记录（≥5 天）', arch.天数 >= 5, `${arch.天数} 天 / ${arch.年份} 个年份`);
    check('时间线条目可跳转对应文章详情', arch.可跳文章 > 0, `${arch.可跳文章} 条可跳`);
    // 热力图：点有记录的色块 → 色块上方浮出简短信息（这天有几次更新、几次修复）
    await evaluate(`document.querySelector('[data-cal-day]')?.click()`);
    await sleep(600);
    const cal = await evaluate(`(() => { const t = document.querySelector('.heat-tip');
      const cell = document.querySelector('.hc[data-cal-day][aria-expanded]');
      return t ? { text: t.textContent, pinned: !!cell } : null; })()`);
    check('热力图点击浮出简短信息', !!cal && /这天有/.test(cal.text) && cal.pinned,
      cal ? cal.text.slice(0, 40) : '无浮层');
    // 再点同格 → 收起
    await evaluate(`document.querySelector('[data-cal-day]')?.click()`);
    await sleep(400);
    const calGone = await evaluate(`!document.querySelector('.heat-tip')`);
    check('再点同格浮层收起', calGone === true);
    // 搜索悬浮窗：2026-09-18 改版后顶栏不再有搜索按钮（照 reference 的导航），
    // 只剩 ⌘/Ctrl+K 与侧栏/移动端按钮三种入口 —— 这里测键盘入口。
    await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true }))`);
    await sleep(900);
    const modalOpen = await evaluate(`!!document.querySelector('[data-search-modal]')?.open`);
    check('搜索悬浮窗可打开（⌘/Ctrl+K）', modalOpen === true);
    await evaluate(`document.querySelector('[data-search-close]')?.click()`);
    await sleep(500);
    const modalClosed = await evaluate(`!document.querySelector('[data-search-modal]')?.open`);
    check('搜索悬浮窗可关闭', modalClosed === true);
    check('交互过程无 JS 异常', errors.length === 0, errors[0] || '');
    // 软导航一圈
    for (const path of ['/gallery/', '/about/', '/account/', '/']) {
      await evaluate(`[...document.querySelectorAll('a')].find((a) => a.getAttribute('href') === ${JSON.stringify(path)})?.click()`);
      await sleep(3500);
    }
    // 画廊大图（2026-09-20 修复回归）：软导航一圈后再进画廊，点卡片必须能开大图。
    // 修复前：页面脚本缓存了 dialog 节点，软导航换新后 showModal 抛
    // InvalidStateError (not in a Document)，表现为「点卡片没反应」。
    await evaluate(`[...document.querySelectorAll('a[href="/gallery/"]')].find((a) => a.getBoundingClientRect().width > 0)?.click()`);
    let galNav = false;
    const t2 = Date.now();
    while (Date.now() - t2 < 15000) {
      await sleep(500);
      galNav = !!(await evaluate(`location.pathname === '/gallery/' && document.querySelectorAll('[data-gal-open]').length > 0`));
      if (galNav) break;
    }
    check('软导航一圈后进画廊、卡片就位', galNav === true);
    // §59 文件夹视图回归（2026-09-20）：默认看到文件夹墙、图集隐藏
    await sleep(600);
    const folderWall = await evaluate(`(() => {
      const fw = document.getElementById('gal-folders-sec');
      const ab = document.getElementById('gal-album-sec');
      return { has: !!fw, fwHidden: fw ? fw.hidden : null, abHidden: ab ? ab.hidden : null,
        folders: document.querySelectorAll('.gal-folders .folder').length };
    })()`);
    check('默认显示文件夹墙（§59）',
      folderWall.has === true && folderWall.fwHidden === false && folderWall.abHidden === true,
      JSON.stringify(folderWall));
    // 点文件夹 → /gallery/?game=X 进入对应图集（文件夹墙隐藏、图集显示、有可见卡片）
    await evaluate(`document.querySelector('.gal-folders .folder')?.click()`);
    let galAlbum = false;
    const t3 = Date.now();
    while (Date.now() - t3 < 8000) {
      await sleep(400);
      galAlbum = !!(await evaluate(`(() => {
        const fw = document.getElementById('gal-folders-sec');
        const ab = document.getElementById('gal-album-sec');
        const vis = [...document.querySelectorAll('[data-gal-open]')].some((c) => c.getBoundingClientRect().width > 0);
        return /[?&]game=/.test(location.search) && fw?.hidden === true && ab?.hidden === false && vis;
      })()`));
      if (galAlbum) break;
    }
    check('点文件夹进入对应图集（§59）', galAlbum === true);
    await evaluate(`document.querySelector('[data-gal-open]')?.click()`);
    await sleep(800);
    const galDlgOpen = await evaluate(`document.getElementById('galDialog')?.open === true`);
    check('画廊点卡片打开大图（软导航后）', galDlgOpen === true);
    await evaluate(`document.querySelector('[data-gal-close]')?.click()`);
    await sleep(400);
    const galDlgClosed = await evaluate(`document.getElementById('galDialog')?.open !== true`);
    check('画廊大图可关闭', galDlgClosed === true);
    // 「返回文件夹」→ /gallery/（无查询串）应回到文件夹墙（§59）
    await evaluate(`document.querySelector('.gf-clear')?.click()`);
    let galBack = false;
    const t4 = Date.now();
    while (Date.now() - t4 < 8000) {
      await sleep(400);
      galBack = !!(await evaluate(`(() => {
        const fw = document.getElementById('gal-folders-sec');
        const ab = document.getElementById('gal-album-sec');
        return location.pathname === '/gallery/' && !location.search &&
          fw?.hidden === false && ab?.hidden === true;
      })()`));
      if (galBack) break;
    }
    check('「返回文件夹」回到文件夹墙（§59）', galBack === true);
    check('软导航一圈后仍无 JS 异常', errors.length === 0, errors[0] || '');
  });

  // 4) 手机视口：侧栏隐藏、单列
  console.log('\n[4] 手机视口');
  await withTab(BASE + '/blog/', async ({ send, evaluate }) => {
    await setup(send, 414, 860);
    await evaluate(`location.replace(${JSON.stringify(BASE + '/blog/')})`);
    await sleep(3000);
    // 手机端侧栏是 display:none（高度 0），所以等中栏出现即可
    await waitForLayout(evaluate, '.main-content');
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
