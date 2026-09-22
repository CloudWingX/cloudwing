// 交互增强：
//   滚动显现 / 数字滚动 / 全局阅读进度 / 封面灯箱 /
//   鼠标光斑 + 背景视差（磨砂玻璃氛围）/ 尊重 prefers-reduced-motion
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 状态（事件只挂载一次，DOM 每次导航后重扫） ---------- */
let scrollBound = false;
let ambienceOn = false;
let progressEl = null;
let lightboxState = null;

/* ---------- 主题：单套暗色（已删除亮色主题与切换按钮） ----------
   站点只有一套暗色电影感主题（见 global.css 的 :root 注释）：
   浅色玻璃 + 白字在物理上无法同时成立，保留浅色分支只会留下一堆无法达标的样式。
   这里只保证软导航后 <html data-theme> 仍是 dark（Astro 会用新文档的 <html> 覆写属性），
   与 Base.astro 的首屏内联脚本保持一致。 */
function lockDarkTheme() {
  document.documentElement.dataset.theme = 'dark';
}
if (!window.__cwDarkReplayBound) {
  window.__cwDarkReplayBound = true;
  document.addEventListener('astro:page-load', lockDarkTheme);
}

/* ---------- 焦点来源：指针 vs 键盘（配合 global.css 的 [data-pointer-focus]） ----------
   要解决的问题：点一下按钮就留下一圈强调色轮廓（站长反馈的"蓝色轮廓"）。
   规范上 :focus-visible 只在**键盘**操作时命中，Chromium 桌面实测也确实如此；
   但 Safari 与 Android Chrome 会把「点击 / 触摸」也判成 :focus-visible，
   于是纯 CSS 兜不住 —— 这里按"最后一次输入方式"给焦点元素打标：
     · 指针按下（mouse / touch / pen）→ 打 data-pointer-focus → 不画轮廓
     · 键盘按下（Tab / Enter / 方向键…）→ 撤标 → 照常画轮廓
   ⚠️ 文本输入类控件（input / textarea / select / contenteditable）**永远不打标**：
      光标的落点必须看得见，否则"在哪儿打字"就没法判断了 —— 这是 a11y 的底线，
      也正是"保留键盘可访问性"里最不能省的一条。 */
function focusModality() {
  if (window.__cwFocusModality) return;
  window.__cwFocusModality = true;

  let fromKeyboard = false;
  document.addEventListener('pointerdown', () => { fromKeyboard = false; }, true);
  document.addEventListener('keydown', () => { fromKeyboard = true; }, true);
  // 极老触摸机型不派发 pointerdown 时的兜底
  document.addEventListener('touchstart', () => { fromKeyboard = false; }, { capture: true, passive: true });

  // 文本输入类：光标的落点需要一直可见，不计输入方式
  const needsSteadyRing = (el) => {
    const tag = el.tagName;
    if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    if (tag !== 'INPUT') return false;
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    return !['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image', 'hidden'].includes(type);
  };

  document.addEventListener('focusin', (ev) => {
    const el = ev.target;
    if (!(el instanceof Element)) return;
    if (fromKeyboard || needsSteadyRing(el)) el.removeAttribute('data-pointer-focus');
    else el.setAttribute('data-pointer-focus', '');
  }, true);
  // 失焦即清标：软导航会换 DOM，别让复用的节点带着上一次的来源
  document.addEventListener('focusout', (ev) => {
    const el = ev.target;
    if (el instanceof Element) el.removeAttribute('data-pointer-focus');
  }, true);
}

/* ---------- 首页大标题 3D 光标跟随（vanilla-tilt 思路） ---------- */
let _tt = null;
let _ttRaf = 0;
let _ttHover = false;
const _ttCur = { x: 0, y: 0 };
const _ttTgt = { x: 0, y: 0 };

function stopTitleTilt() {
  if (_tt) {
    const { el, enter, move, leave } = _tt;
    el.removeEventListener('pointerenter', enter);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', leave);
    if (el.isConnected) el.style.transform = '';
  }
  _tt = null;
  if (_ttRaf) { cancelAnimationFrame(_ttRaf); _ttRaf = 0; }
  _ttHover = false;
  _ttCur.x = 0; _ttCur.y = 0;
  _ttTgt.x = 0; _ttTgt.y = 0;
}

function startTitleTilt() {
  const el = document.querySelector('.display-tilt');
  if (!el) { stopTitleTilt(); return; }
  if (_tt && _tt.el === el) return;
  stopTitleTilt();
  if (reduced || !window.matchMedia('(pointer: fine)').matches) return;

  const MAX_DEG = 11;   // 最大倾斜角
  const SHIFT = 12;     // 最大位移 px

  const enter = () => { _ttHover = true; };
  const move = (e) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    _ttTgt.x = (e.clientX - r.left) / r.width - 0.5;
    _ttTgt.y = (e.clientY - r.top) / r.height - 0.5;
  };
  const leave = () => { _ttHover = false; _ttTgt.x = 0; _ttTgt.y = 0; };

  el.addEventListener('pointerenter', enter, { passive: true });
  el.addEventListener('pointermove', move, { passive: true });
  el.addEventListener('pointerleave', leave, { passive: true });
  _tt = { el, enter, move, leave };

  const tick = () => {
    if (!_tt || !_tt.el) { _ttRaf = 0; return; }
    _ttRaf = requestAnimationFrame(tick);
    if (!_tt.el.isConnected) { stopTitleTilt(); return; }
    const k = _ttHover ? 0.16 : 0.08; // 悬停跟手 / 离开缓回
    _ttCur.x += (_ttTgt.x - _ttCur.x) * k;
    _ttCur.y += (_ttTgt.y - _ttCur.y) * k;
    const rx = (-_ttCur.y * MAX_DEG).toFixed(2);
    const ry = (_ttCur.x * MAX_DEG).toFixed(2);
    const tx = (_ttCur.x * SHIFT).toFixed(1);
    const ty = (_ttCur.y * SHIFT).toFixed(1);
    // 供内层两行标题做 3D 微视差（前后层反向错位）
    const x = _ttCur.x, y = _ttCur.y;
    _tt.el.style.setProperty('--bkx', `${(x * -16).toFixed(1)}px`);
    _tt.el.style.setProperty('--bky', `${(y * 13).toFixed(1)}px`);
    _tt.el.style.setProperty('--frx', `${(x * 20).toFixed(1)}px`);
    _tt.el.style.setProperty('--fry', `${(y * -16).toFixed(1)}px`);
    _tt.el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translate3d(${tx}px, ${ty}px, 0)`;
  };
  _ttRaf = requestAnimationFrame(tick);
}

function boot() {
  // 各效果独立容错：单个失败不拖累其他
  [
    pageEnter,          // 页面加载入场（整页淡入 + 入场元素自动错峰）
    scrollFade,
    scanReveals,
    runCounters,
    bindProgressBar,
    bindLightbox,
    initAmbience,
    startElegantTrails, // 优雅星轨：浅色玻璃下克制的细轨迹
    startTitleTilt,     // 首页大标题 3D 光标跟随
    lockDarkTheme,      // 主题：单套暗色（软导航后保持 data-theme=dark）
    focusModality,      // 焦点来源（指针/键盘）→ 点击不出轮廓、键盘照出（配 global.css）
    typedEffects,       // 打字机（TextType 移植）
    startDriftWall,     // 影集页漂移墙背景
    tocSpy,             // 右侧栏「本页目录」滚动高亮（子页面三栏壳层）
    sideSticky,         // 侧栏吸顶：始终贴在导航栏下方
    autoHideHeader,     // 导航栏滚动收缩形态（改版后不再下滑收起）
    calPanel,           // 侧栏更新日历：点日期展开当天记录
    // navSub 已移除：导航栏改成参考形态后不再有二级菜单（分类改由左栏导航树承担）
    weatherWidget,      // 左侧栏天气小帖（uapis.cn，浏览器端拉取 + 30 分钟缓存）
    githubTrending,     // 右侧栏 GitHub 热榜（日/周/月/年，Search API + 时间桶缓存，§56）
    musicPlayer,        // 左侧栏音乐播放器（歌曲见 site.ts 的 MUSIC）
    musicPage,          // 音乐子页面 /music/：大唱片旋转+视差、全参数、歌词（§67）
    searchModal,        // 全站搜索悬浮窗（Pagefind，首次打开才加载）
    // motionToggle 已移除：2026-09-18 按用户要求删掉导航栏的「暂停背景动态」按钮，
    // 背景视频默认播放；减少动态仍由 prefers-reduced-motion 自动处理。
  ].forEach((fn) => {
    try {
      fn();
    } catch (err) {
      if (window.console && console.warn) console.warn('ui:', err);
    }
  });
}

/* ---------- 页面加载入场（每页进入时：整页淡入 + 入场元素自动错峰） ---------- */
function pageEnter() {
  const main = document.querySelector('main');
  if (!main) return;

  // Astro 软导航会按新文档的 <html> 覆写属性，客户端加的 'js' 类会丢；
  // 而所有动效规则（html.js .sli / [data-ent] / main.page-enter）都依赖它，
  // 所以每次进入页面都补一次。
  document.documentElement.classList.add('js');

  // 1) 未显式指定 --ad 的 [data-ent] 元素，按 DOM 顺序自动排入场延迟（最多 8 档 × 70ms）
  document.querySelectorAll('[data-ent]').forEach((el, i) => {
    if (el.style.getPropertyValue('--ad')) return; // 尊重手写延迟
    el.style.setProperty('--ad', `${Math.min(i, 7) * 70}ms`);
  });

  if (reduced) return; // 减少动态：不播放整页动画（元素由 CSS 兜底为可见）

  // 2) 整页入场：软导航/首次加载时给 main 播一次淡入上浮，重启动画以支持重复导航
  main.classList.remove('page-enter');
  void main.offsetWidth;
  main.classList.add('page-enter');
  window.clearTimeout(pageEnter._t);
  pageEnter._t = window.setTimeout(() => main.classList.remove('page-enter'), 700);
}

// 交换 DOM 后立刻补 'js' 类（早于 astro:page-load），尽量减少“先可见后隐藏”的闪烁
document.addEventListener('astro:after-swap', () => {
  document.documentElement.classList.add('js');
});

/* ---------- 滚动显现 ---------- */
function scanReveals() {
  const els = document.querySelectorAll('.rv:not([data-rv-done])');
  if (!els.length) return;
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  els.forEach((el) => {
    el.dataset.rvDone = '1';
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          // 同 scrollFade：已滚过视口（top < 0）的元素也视为显现，避免漏触发后一直隐藏
          if (e.isIntersecting || e.boundingClientRect.top < 0) { el.classList.add('in'); io.disconnect(); }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
  });

  // 兜底：与 scrollFade 同理，一次性跳转可能让 .rv 元素“跳过”阈值而不触发回调
  const sweepRv = () => {
    window.__rvSweepRaf = 0;
    const vh = window.innerHeight || 800;
    document.querySelectorAll('.rv:not(.in)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.94 || r.bottom < 0) el.classList.add('in');
    });
  };
  if (!window.__rvSweepWired) {
    window.__rvSweepWired = true;
    const onScroll = () => {
      if (window.__rvSweepRaf) return;
      window.__rvSweepRaf = requestAnimationFrame(sweepRv);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }
  sweepRv();
}

/* ---------- 数字滚动（count-up） ---------- */
function runCounters() {
  const els = document.querySelectorAll('.count:not([data-count-done])');
  if (!els.length) return;
  const fmt = (n) => String(n).padStart(2, '0');
  els.forEach((el) => {
    el.dataset.countDone = '1';
    const to = parseInt(el.dataset.to ?? '0', 10);
    const finish = () => { el.textContent = fmt(to); };
    if (reduced || !('IntersectionObserver' in window)) { finish(); return; }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const dur = 900;
        const step = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
          else finish();
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
  });
}

/* ---------- 全站阅读进度条 ---------- */
function bindProgressBar() {
  progressEl = document.querySelector('.prog');
  if (!progressEl) return;
  if (!scrollBound) {
    scrollBound = true;
    const onScroll = () => {
      if (!progressEl) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      progressEl.style.width = `${max > 0 ? (doc.scrollTop / max) * 100 : 0}%`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
  }
}

/* ---------- 封面灯箱 ---------- */
function bindLightbox() {
  lightboxState = null; // 每次导航后 DOM 都会重建，重新绑定
  const cover = document.querySelector('.work-cover');
  const dlg = document.getElementById('lightbox');
  if (!cover || !dlg || typeof dlg.showModal !== 'function') return;
  const img = dlg.querySelector('img');
  const cap = dlg.querySelector('.lb-cap-title');
  const closeBtn = dlg.querySelector('.lb-close');
  const open = () => {
    img.src = cover.getAttribute('src') ?? '';
    img.alt = cover.getAttribute('alt') ?? '';
    if (cap) cap.textContent = img.alt;
    dlg.showModal();
    document.body.classList.add('modal-open');
  };
  const close = () => {
    dlg.close();
    document.body.classList.remove('modal-open');
  };
  cover.addEventListener('click', open);
  cover.setAttribute('tabindex', '0');
  cover.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
  closeBtn?.addEventListener('click', close);
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) close();
  });
  dlg.addEventListener('close', () => document.body.classList.remove('modal-open'));
}

/* ---------- 氛围动效：背景缓动视差（已移除鼠标白色光斑） ---------- */
function initAmbience() {
  if (ambienceOn || reduced || !window.matchMedia('(pointer: fine)').matches) return;
  ambienceOn = true;
  const bg = document.querySelector('.grid-bg');
  if (!bg) return;

  const target = { x: innerWidth / 2, y: innerHeight / 2 };
  const cur = { ...target };
  window.addEventListener('pointermove', (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
  }, { passive: true });

  let raf = 0;
  const tick = () => {
    cur.x += (target.x - cur.x) * 0.06;
    cur.y += (target.y - cur.y) * 0.06;
    const bx = (cur.x / innerWidth - 0.5) * -26;
    const by = (cur.y / innerHeight - 0.5) * -18;
    bg.style.transform = `translate3d(${bx.toFixed(2)}px, ${by.toFixed(2)}px, 0)`;
    raf = requestAnimationFrame(tick);
  };
  tick();
}

/* ---------- 首页星轨：Canvas 长曝光拖尾粒子 ---------- */
let _starCanvas = null;
let _starCtx = null;
let _starRaf = 0;
let _starRO = null;
let _starVisHandler = null;

function stopStarTrails() {
  if (_starRaf) { cancelAnimationFrame(_starRaf); _starRaf = 0; }
  if (_starRO) { _starRO.disconnect(); _starRO = null; }
  if (_starVisHandler) { document.removeEventListener('visibilitychange', _starVisHandler); _starVisHandler = null; }
  _starCanvas = null;
  _starCtx = null;
}

function startStarTrails() {
  const canvas = document.querySelector('.stars-canvas');
  if (!canvas) { stopStarTrails(); return; } // 本页没有星轨
  if (canvas === _starCanvas && _starCtx) return; // 已挂载
  stopStarTrails();
  _starCanvas = canvas;
  const host = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  if (!ctx || !host) return;
  _starCtx = ctx;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0, cx = 0, cy = 0, maxR = 1;
  let stars = [];

  const PALETTE = [
    [128, 130, 138], [164, 166, 174], [196, 197, 203], [219, 219, 224],
    [255, 255, 255], [182, 183, 190],
  ];

  const seed = () => {
    stars = [];
    const count = Math.max(70, Math.min(190, Math.round((w * h) / 8500)));
    for (let i = 0; i < count; i++) {
      const radius = Math.pow(Math.random(), 0.62) * maxR;
      const isComet = Math.random() < 0.12;
      stars.push({
        ang: Math.random() * Math.PI * 2,
        radius,
        spd: (isComet ? 0.0016 : 0.00018 + Math.random() * 0.0008) * (Math.random() < 0.5 ? -1 : 1),
        tw: Math.random() * Math.PI * 2,
        tws: 0.004 + Math.random() * 0.02,
        size: (isComet ? 1.9 : 0.6 + Math.random() * 1.1) * (radius < maxR * 0.55 ? 1 : 0.85),
        col: PALETTE[(Math.random() * PALETTE.length) | 0],
        base: 0.26 + Math.random() * 0.55,
        trail: [],
      });
    }
  };

  const fit = () => {
    const rect = host.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w * 0.82;
    cy = h * 0.05;
    maxR = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) * 1.04 + 40;
    seed();
  };

  const drawFrame = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const s of stars) {
      s.ang += s.spd;
      s.tw += s.tws;
      const x = cx + Math.cos(s.ang) * s.radius;
      const y = cy + Math.sin(s.ang) * s.radius;
      s.trail.push(x, y);
      if (s.trail.length > 120) s.trail.splice(0, 2);
      const al = s.base * (0.55 + 0.45 * Math.sin(s.tw));
      const [r, g, b] = s.col;
      const t = s.trail;
      const ptN = t.length / 2;
      // 尾迹：按亮度分 5 段渐隐，越靠星头越亮越粗
      if (ptN >= 2) {
        const per = Math.max(1, Math.ceil(ptN / 5));
        for (let band = 0; band < 5; band++) {
          const from = band * per * 2;
          if (from + 1 >= t.length) break;
          const to = Math.min(t.length, (band + 1) * per * 2 + 2);
          if (to - from < 2) break;
          const frac = Math.min(1, ((band + 1) * per) / ptN);
          ctx.strokeStyle = `rgba(${r},${g},${b},${(al * (0.05 + 0.5 * frac)).toFixed(3)})`;
          ctx.lineWidth = Math.max(0.5, s.size * (0.35 + 0.65 * frac));
          ctx.beginPath();
          ctx.moveTo(t[from], t[from + 1]);
          for (let p = from + 2; p < to; p += 2) ctx.lineTo(t[p], t[p + 1]);
          ctx.stroke();
        }
      }
      // 星头 + 亮星光晕
      if (s.size > 1.6) {
        ctx.fillStyle = `rgba(${r},${g},${b},${(al * 0.14).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(x, y, s.size * 3.2, 0, 6.2832);
        ctx.fill();
      }
      ctx.fillStyle = `rgba(${r},${g},${b},${al.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, s.size, 0, 6.2832);
      ctx.fill();
    }
  };

  const loop = () => {
    if (!_starCtx || _starCanvas !== canvas) return;
    drawFrame();
    _starRaf = requestAnimationFrame(loop);
  };

  fit();
  if (reduced) { drawFrame(); return; } // 减少动态：只画一帧静态星点

  _starRaf = requestAnimationFrame(loop);
  if ('ResizeObserver' in window) {
    _starRO = new ResizeObserver(() => { fit(); });
    _starRO.observe(host);
  }
  _starVisHandler = () => {
    if (document.hidden) {
      if (_starRaf) { cancelAnimationFrame(_starRaf); _starRaf = 0; }
    } else if (!_starRaf && _starCtx) {
      _starRaf = requestAnimationFrame(loop);
    }
  };
  document.addEventListener('visibilitychange', _starVisHandler);
}

/* ---------- 滚动淡入淡出（视口聚光：越靠近屏幕中央越亮，向上下渐隐并带位移） ---------- */
// 滑入式入场：进入视口 10% 时一次性滑入（AOS 风格，参考 aosx / AOS）
function scrollFade() {
  if (reduced) return; // 减少动态：元素保持完全可见（CSS 已兜底）
  const SEL = [
    // 首页：hero 之外的三个板块（01/02/03）逐块滚动显现
    '.home-block .wrap > *',
    '.home-block .acc-holder',
    '.home-block .ph-card',
    '.home .kicker', '.home .md-desc', '.home .feat', '.home .step',
    '.home .wk-card', '.home .outro .wrap > *',
    '.center-page .page-head > *', '.center-page .work-head',
    '.center-page .work-cover', '.center-page .grid .wk-item',
    '.center-page .lg > h2', '.center-page .lg > p.lg-desc',
    '.center-page .lg .ln-row', '.center-page .filterbar',
    '.center-page .info-list', '.center-page .prose',
  ].join(',');

  // 容器若曾是“整块显现”，先放平，让内部元素各自滑入
  document.querySelectorAll('.home .rv, .center-page .rv').forEach((el) => el.classList.add('in'));

  const items = Array.from(document.querySelectorAll(SEL)).filter((el) => !el.dataset.sli);
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
    return;
  }
  items.forEach((el, i) => {
    el.dataset.sli = '1';
    el.classList.add('sli');
    // 逐项错峰：同屏最多 8 档延迟，每档 70ms
    el.style.setProperty('--d', `${(i % 8) * 70}ms`);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          // 进入视口 → 显现；元素已在视口上方（快速跳转/锚点直达，已经“滚过”）也直接显现，
          // 否则会永久停在 opacity:0
          if (e.isIntersecting || e.boundingClientRect.top < 0) {
            el.classList.add('in');
            io.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
  });

  // 兜底扫描：IntersectionObserver 只在“跨越阈值”时回调——一次性跳转（End / PageDown /
  // 锚点直达）会让元素从视口下方直接到视口上方，从未跨越阈值 → 永远不回调。
  // 这里用滚动/尺寸变化时的节流扫描补齐漏网元素。
  const sweep = () => {
    sweep.raf = 0;
    const vh = window.innerHeight || 800;
    document.querySelectorAll('.sli:not(.in)').forEach((el) => {
      const r = el.getBoundingClientRect();
      // 已进入视口主要区域，或已滚过视口（底部在视口顶之上）→ 显现
      if (r.top < vh * 0.94 || r.bottom < 0) el.classList.add('in');
    });
  };
  if (!scrollFade._sweepWired) {
    scrollFade._sweepWired = true;
    const onScroll = () => {
      if (sweep.raf) return;
      sweep.raf = requestAnimationFrame(sweep);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }
  sweep();
}

/* ---------- 深空星海（迭代版）：层次视差星空 + 十字星芒 + 周期性流星 ----------
   参考：grok-shooting-stars / 星河涌动粒子特效（B 站 BV1kK8HzXENj） */
let _cosmic = { raf: 0, ro: null, move: null, vis: null, on: false };

function disposeCosmic() {
  if (_cosmic.raf) cancelAnimationFrame(_cosmic.raf);
  if (_cosmic.ro) { _cosmic.ro.disconnect(); _cosmic.ro = null; }
  if (_cosmic.move) { window.removeEventListener('pointermove', _cosmic.move); _cosmic.move = null; }
  if (_cosmic.vis) { document.removeEventListener('visibilitychange', _cosmic.vis); _cosmic.vis = null; }
  _cosmic.raf = 0;
  _cosmic.on = false;
}

function startCosmicSky() {
  const canvas = document.querySelector('.stars-canvas');
  if (!canvas) { disposeCosmic(); return; }
  const host = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  if (!ctx || !host) return;
  if (_cosmic.on && _cosmic.ro) return; // 已挂在同一画布
  disposeCosmic();
  _cosmic.on = true;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reducedM = reduced;
  const HI = [
    [255, 255, 255], [242, 242, 246], [250, 250, 252],
    [238, 238, 242], [248, 248, 250],
  ];
  const MID = [
    [118, 120, 130], [150, 152, 162], [126, 128, 138],
    [150, 152, 162], [140, 142, 152],
  ];

  let w = 0, h = 0;
  let stars = [];
  let meteors = [];
  let nextMeteor = 0.6 + Math.random() * 2;
  let t = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  const seed = () => {
    stars = [];
    const area = w * h;
    const nSmall = Math.max(90, Math.min(240, Math.round(area / 8200)));
    const nBig = Math.max(4, Math.min(14, Math.round(area / 62000)));
    for (let i = 0; i < nSmall; i++) {
      const c = MID[(Math.random() * MID.length) | 0];
      stars.push({
        x: Math.random() * w, y: Math.random() * h,
        size: 0.6 + Math.random() * 1.15,
        depth: 0.35 + Math.random() * 0.65,
        col: c, a: 0.3 + Math.random() * 0.5,
        tw: Math.random() * 6.283, tws: 0.5 + Math.random() * 1.8,
        big: false,
      });
    }
    for (let i = 0; i < nBig; i++) {
      const c = HI[(Math.random() * HI.length) | 0];
      stars.push({
        x: Math.random() * w, y: Math.random() * h,
        size: 1.9 + Math.random() * 2.3,
        depth: 1,
        col: c, a: 0.7 + Math.random() * 0.3,
        tw: Math.random() * 6.283, tws: 0.35 + Math.random() * 1,
        big: true,
      });
    }
  };

  const fit = () => {
    const rect = host.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  };

  const spawnMeteor = () => {
    const fromTop = Math.random() < 0.75;
    const x0 = Math.random() * w;
    const y0 = fromTop ? -40 : Math.random() * h * 0.45;
    const sp = 5 + Math.random() * 5;
    const dir = (Math.random() < 0.5 ? 1 : -1) * (0.55 + Math.random() * 0.5);
    meteors.push({
      x: x0, y: y0,
      vx: Math.sin(dir) * sp, vy: Math.cos(dir) * sp,
      len: 80 + Math.random() * 90,
      life: 240 + Math.random() * 140,
      age: 0,
    });
  };

  const drawStatic = () => {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const [r, g, b] = s.col;
      const a = s.a * 0.6;
      ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, 6.2832);
      ctx.fill();
    }
  };

  const drawFrame = () => {
    t += 0.016;
    ctx.clearRect(0, 0, w, h);
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    const ox = mouse.x / w - 0.5;
    const oy = mouse.y / h - 0.5;

    for (const s of stars) {
      const a = s.a * (0.5 + 0.5 * Math.sin(s.tw + t * s.tws));
      if (a < 0.03) continue;
      const px = s.x + ox * s.depth * 30;
      const py = s.y + oy * s.depth * 18;
      const [r, g, b] = s.col;
      if (s.big) {
        // 柔和光晕
        const halo = ctx.createRadialGradient(px, py, 0, px, py, s.size * 5.5);
        halo.addColorStop(0, `rgba(${r},${g},${b},${(a * 0.55).toFixed(3)})`);
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.beginPath(); ctx.arc(px, py, s.size * 5.5, 0, 6.2832); ctx.fill();
        // 十字星芒
        const L = s.size * 4.6;
        ctx.strokeStyle = `rgba(${r},${g},${b},${(a * 0.8).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px - L, py); ctx.lineTo(px + L, py);
        ctx.moveTo(px, py - L); ctx.lineTo(px, py + L);
        ctx.stroke();
        ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(px, py, s.size * 0.9, 0, 6.2832); ctx.fill();
      } else {
        ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(px, py, s.size, 0, 6.2832); ctx.fill();
      }
    }

    // 流星
    if (t >= nextMeteor) { spawnMeteor(); nextMeteor = t + 1.8 + Math.random() * 3.6; }
    meteors = meteors.filter((m) => m.age < m.life);
    for (const m of meteors) {
      m.age++;
      m.x += m.vx;
      m.y += m.vy;
      const dL = Math.hypot(m.vx, m.vy) || 1;
      const ux = m.vx / dL, uy = m.vy / dL;
      const tx = m.x - ux * m.len;
      const ty = m.y - uy * m.len;
      const fade = Math.max(0, 1 - m.age / m.life);
      const g2 = ctx.createLinearGradient(tx, ty, m.x, m.y);
      g2.addColorStop(0, 'rgba(255,255,255,0)');
      g2.addColorStop(0.7, `rgba(214,224,255,${(0.5 * fade).toFixed(3)})`);
      g2.addColorStop(1, `rgba(255,255,255,${fade.toFixed(3)})`);
      ctx.strokeStyle = g2;
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(m.x, m.y); ctx.stroke();
      if (fade > 0) {
        const hg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 6);
        hg.addColorStop(0, `rgba(255,255,255,${(0.85 * fade).toFixed(3)})`);
        hg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hg;
        ctx.beginPath(); ctx.arc(m.x, m.y, 6, 0, 6.2832); ctx.fill();
      }
    }
  };

  const loop = () => {
    if (!_cosmic.on) return;
    drawFrame();
    _cosmic.raf = requestAnimationFrame(loop);
  };

  fit();
  if (reducedM) { drawStatic(); return; }

  _cosmic.raf = requestAnimationFrame(loop);
  if ('ResizeObserver' in window) {
    _cosmic.ro = new ResizeObserver(() => { fit(); });
    _cosmic.ro.observe(host);
  }
  _cosmic.move = (e) => { mouse.tx = e.clientX; mouse.ty = e.clientY; };
  window.addEventListener('pointermove', _cosmic.move, { passive: true });
  _cosmic.vis = () => {
    if (document.hidden) {
      if (_cosmic.raf) { cancelAnimationFrame(_cosmic.raf); _cosmic.raf = 0; }
    } else if (!_cosmic.raf && _cosmic.on) {
      _cosmic.raf = requestAnimationFrame(loop);
    }
  };
  document.addEventListener('visibilitychange', _cosmic.vis);
}

/* ---------- 优雅星轨（贴合浅色玻璃风）：极坐标细轨迹拖尾，低对比，克制 ----------
   参考：fralonra/star-time-lapse（延时星轨）、Danziger/starsjs（旋转星系） */
let _eleg = { raf: 0, ro: null, vis: null, on: false };

function disposeEleg() {
  if (_eleg.raf) cancelAnimationFrame(_eleg.raf);
  if (_eleg.ro) { _eleg.ro.disconnect(); _eleg.ro = null; }
  if (_eleg.vis) { document.removeEventListener('visibilitychange', _eleg.vis); _eleg.vis = null; }
  _eleg.raf = 0;
  _eleg.on = false;
}

function startElegantTrails() {
  const canvas = document.querySelector('.stars-canvas');
  if (!canvas) { disposeEleg(); return; }
  const host = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  if (!ctx || !host) return;
  if (_eleg.on && _eleg.ro) return;
  disposeEleg();
  _eleg.on = true;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reducedM = reduced;
  const PALETTE = [
    [200, 200, 205], [140, 141, 148], [255, 255, 255],
    [170, 171, 178], [230, 230, 234], [255, 255, 255],
  ];
  let w = 0, h = 0, cx = 0, cy = 0, maxR = 1, t = 0;
  let tracers = [];
  let dust = [];

  const seed = () => {
    tracers = [];
    dust = [];
    maxR = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) * 1.02 + 20;
    const area = w * h;
    const n = Math.max(90, Math.min(190, Math.round(area / 11000)));
    for (let i = 0; i < n; i++) {
      const rr = Math.pow(Math.random(), 0.6) * maxR;
      const c = PALETTE[(Math.random() * PALETTE.length) | 0];
      const bright = Math.random() < 0.16;
      tracers.push({
        ang: Math.random() * 6.2832,
        r: rr,
        spd: (0.00012 + Math.random() * 0.0006) * (Math.random() < 0.5 ? -1 : 1),
        ph: Math.random() * 6.2832,
        size: (bright ? 1.6 : 0.7 + Math.random() * 1.2) * (0.7 + Math.random() * 0.6),
        col: c,
        base: bright ? 0.62 : 0.3 + Math.random() * 0.3,
        bright,
        trail: [],
      });
    }
    // 衬底微尘（几乎静止，营造“星光点点”而非“流星雨”）
    const nd = Math.max(60, Math.min(160, Math.round(area / 15000)));
    for (let i = 0; i < nd; i++) {
      dust.push({
        x: Math.random() * w, y: Math.random() * h,
        size: 0.5 + Math.random() * 1,
        col: PALETTE[(Math.random() * PALETTE.length) | 0],
        a: 0.12 + Math.random() * 0.2,
        ph: Math.random() * 6.2832,
        tws: 0.3 + Math.random() * 0.8,
      });
    }
  };

  const fit = () => {
    const rect = host.getBoundingClientRect();
    w = Math.max(1, rect.width);
    h = Math.max(1, rect.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w * 0.84;   // 星轨极点偏右上，画面留白给文字
    cy = h * 0.1;
    seed();
  };

  const drawStatic = () => {
    ctx.clearRect(0, 0, w, h);
    for (const s of tracers) {
      const [r, g, b] = s.col;
      const x = cx + Math.cos(s.ang) * s.r;
      const y = cy + Math.sin(s.ang) * s.r;
      ctx.fillStyle = `rgba(${r},${g},${b},${s.base * 0.55})`;
      ctx.beginPath(); ctx.arc(x, y, s.size, 0, 6.2832); ctx.fill();
    }
  };

  const drawFrame = () => {
    t += 0.016;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';

    // 衬底微尘
    for (const d of dust) {
      const a = d.a * (0.6 + 0.4 * Math.sin(d.ph + t * d.tws));
      const [r, g, b] = d.col;
      ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.size, 0, 6.2832); ctx.fill();
    }

    // 轨迹粒子
    const HLIMIT = 150; // 尾迹帧数上限（约 2.5 秒的“慢门”）
    for (const s of tracers) {
      s.ang += s.spd;
      const x = cx + Math.cos(s.ang) * s.r;
      const y = cy + Math.sin(s.ang) * s.r;
      s.trail.push(x, y);
      if (s.trail.length > HLIMIT * 2) s.trail.splice(0, 2);
      const tw = 0.65 + 0.35 * Math.sin(s.ph + t * 0.9);
      const al = s.base * tw;
      const [r, g, b] = s.col;
      const tl = s.trail;
      const total = tl.length / 2;
      if (total >= 2) {
        const bands = 6;
        for (let band = 0; band < bands; band++) {
          const i0 = Math.max(0, Math.floor((band / bands) * total) * 2);
          const i1 = Math.max(i0 + 2, Math.floor(((band + 1) / bands) * total) * 2);
          if (i0 + 1 >= tl.length || i1 > tl.length) continue;
          const fade = (band + 1) / bands; // 越靠近头部越亮
          ctx.strokeStyle = `rgba(${r},${g},${b},${(al * 0.05 + al * fade * 0.45).toFixed(3)})`;
          ctx.lineWidth = Math.max(0.5, s.size * (0.4 + 0.6 * fade));
          ctx.beginPath();
          ctx.moveTo(tl[i0], tl[i0 + 1]);
          ctx.lineTo(tl[i1], tl[i1 + 1]);
          ctx.stroke();
        }
      }
      // 星点头部：大星加一层柔光，其余小点直接点
      if (s.bright) {
        const glow = ctx.createRadialGradient(x, y, 0, x, y, s.size * 4);
        glow.addColorStop(0, `rgba(${r},${g},${b},${(al * 0.4).toFixed(3)})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y, s.size * 4, 0, 6.2832); ctx.fill();
      }
      ctx.fillStyle = `rgba(${r},${g},${b},${al.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, y, s.size * 0.95, 0, 6.2832); ctx.fill();
    }
  };

  const loop = () => {
    if (!_eleg.on) return;
    drawFrame();
    _eleg.raf = requestAnimationFrame(loop);
  };

  fit();
  if (reducedM) { drawStatic(); return; }

  _eleg.raf = requestAnimationFrame(loop);
  if ('ResizeObserver' in window) {
    _eleg.ro = new ResizeObserver(() => { fit(); });
    _eleg.ro.observe(host);
  }
  _eleg.vis = () => {
    if (document.hidden) {
      if (_eleg.raf) { cancelAnimationFrame(_eleg.raf); _eleg.raf = 0; }
    } else if (!_eleg.raf && _eleg.on) {
      _eleg.raf = requestAnimationFrame(loop);
    }
  };
  document.addEventListener('visibilitychange', _eleg.vis);
}

/* ---------- DriftWall 漂移墙（React Bits <DriftWall /> 原生移植） ---------- */
let _dwState = null;

function stopDriftWall() {
  const s = _dwState;
  _dwState = null;
  if (!s) return;
  if (s.raf) cancelAnimationFrame(s.raf);
  if (s.pm) window.removeEventListener('pointermove', s.pm);
}

function startDriftWall() {
  const root = document.querySelector('[data-drift-bg]');
  if (!root) { stopDriftWall(); return; }
  if (_dwState && _dwState.root === root) return;
  stopDriftWall();

  let cfg = {};
  let images = [];
  try { cfg = JSON.parse(root.dataset.cfg || '{}'); images = JSON.parse(root.dataset.images || '[]'); } catch (e) { /* ignore */ }
  if (!Array.isArray(images) || !images.length) return;

  const plane = root.querySelector('[data-plane]');
  if (!plane) return;

  const columns = cfg.columns || 5;
  const tw = cfg.tileWidth || 220;
  const th = cfg.tileHeight || 148;
  const gap = cfg.gap || 16;
  const tileH = th + gap;
  const speed = cfg.speed || 46;
  const dir = cfg.direction === 'down' ? -1 : 1;
  const variance = cfg.variance == null ? 0.45 : cfg.variance;
  const parallax = cfg.parallax || 0.6;
  const tilt = cfg.tilt || 15;
  const turn = cfg.turn || -10;
  const perspective = cfg.perspective || 1300;
  const depth = -120;

  root.style.setProperty('--dw-tile-w', `${tw}px`);
  root.style.setProperty('--dw-tile-h', `${th}px`);
  root.style.setProperty('--dw-gap', `${gap}px`);
  root.style.setProperty('--dw-radius', `${cfg.radius || 14}px`);
  root.style.setProperty('--dw-perspective', `${perspective}px`);
  root.style.setProperty('--dw-dim', String(cfg.dim == null ? 0.5 : cfg.dim));

  // 图片轮流分配到各列
  const colList = Array.from({ length: columns }, () => []);
  images.forEach((src, i) => colList[i % columns].push(src));
  const cols = [];
  colList.forEach((list, c) => {
    const col = document.createElement('div');
    col.className = 'dw-col';
    const track = document.createElement('div');
    track.className = 'dw-track';
    list.forEach((src) => {
      const tile = document.createElement('div');
      tile.className = 'dw-tile';
      const inner = document.createElement('div');
      inner.className = 'dw-inner';
      const img = document.createElement('img');
      img.src = src; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      inner.appendChild(img);
      tile.appendChild(inner);
      track.appendChild(tile);
    });
    col.appendChild(track);
    plane.appendChild(col);
    cols.push({ track, per: list.length * tileH, tiles: Array.from(track.children) });
  });

  // 纵向补齐副本实现无缝循环
  const rootH = Math.max(600, root.clientHeight || window.innerHeight);
  cols.forEach((col) => {
    const copies = Math.max(2, Math.ceil((rootH * 2.1) / col.per) + 1);
    for (let i = 1; i < copies; i++) {
      col.tiles.forEach((t) => col.track.appendChild(t.cloneNode(true)));
    }
  });

  const offsets = cols.map((col, c) => col.per * ((c * 0.37) % 1));
  const velos = cols.map((_, c) => {
    const pseudo = (((c * 0.6180339887 + 0.35) % 1) * 2 - 1);
    const alt = c % 2 === 0 ? 1 : -1;
    return speed * (1 + variance * pseudo) * dir * alt;
  });
  const baseTransform = () =>
    `translate(-50%, -50%) scale(1.16) rotateX(${tilt}deg) rotateY(${turn}deg) translateZ(${depth}px)`;

  if (reduced) {
    plane.style.transform = baseTransform();
    cols.forEach((col, c) => { col.track.style.transform = `translate3d(0, ${-offsets[c]}px, 0)`; });
    return;
  }

  const ptr = { x: 0, y: 0 };
  const damped = { x: 0, y: 0 };
  const pm = (e) => {
    const r = root.getBoundingClientRect();
    if (!r.width || !r.height) return;
    ptr.x = (e.clientX - r.left) / r.width - 0.5;
    ptr.y = (e.clientY - r.top) / r.height - 0.5;
  };
  window.addEventListener('pointermove', pm, { passive: true });

  let last = null;
  let raf = 0;
  const loop = (ts) => {
    raf = requestAnimationFrame(loop);
    if (document.hidden) return;
    if (last === null) last = ts;
    const dt = Math.min(0.05, Math.max(0, (ts - last) / 1000));
    last = ts;
    const damp = 1 - Math.exp(-dt / 0.12);
    damped.x += (ptr.x * parallax * 8 - damped.x) * damp;
    damped.y += (-ptr.y * parallax * 8 - damped.y) * damp;
    plane.style.transform =
      `translate(-50%, -50%) scale(1.16) ` +
      `rotateX(${(tilt + damped.y).toFixed(2)}deg) rotateY(${(turn + damped.x).toFixed(2)}deg) ` +
      `translateZ(${depth}px)`;
    cols.forEach((col, c) => {
      let next = (offsets[c] || 0) + velos[c] * dt;
      next = ((next % col.per) + col.per) % col.per;
      offsets[c] = next;
      col.track.style.transform = `translate3d(0, ${(-next).toFixed(2)}px, 0)`;
    });
  };

  plane.style.transform = baseTransform();
  raf = requestAnimationFrame(loop);
  _dwState = { root, raf, pm };
}

/* ---------- 打字机（TextType · React Bits 移植，ui 驱动） ---------- */
function typedEffects() {
  if (reduced) return; // 减少动态：保留 SSR 静态文字
  const els = Array.from(document.querySelectorAll('[data-typed]')).filter(
    (el) => !el.dataset.typedRun,
  );
  if (!els.length) return;

  els.forEach((el) => {
    el.dataset.typedRun = '1';
    let phrases = [];
    try {
      phrases = JSON.parse(el.dataset.phrases || '[]');
    } catch (e) { /* ignore */ }
    if (!Array.isArray(phrases) || !phrases.length) return;
    phrases = phrases.map((x) => String(x)).filter((x) => x.length);

    const speed = parseInt(el.dataset.speed || '70', 10);
    const delSpd = parseInt(el.dataset.del || '32', 10);
    const pause = parseInt(el.dataset.pause || '1700', 10);
    const loop = el.dataset.loop !== 'false';
    const cursorChar = el.dataset.cursor || '|';
    const onVisible = el.dataset.onvisible === 'true';

    // 输出区 + 光标
    const out = document.createElement('span');
    out.className = 'typed-out';
    const caret = document.createElement('span');
    caret.className = 'typed-caret';
    caret.textContent = cursorChar;
    el.textContent = '';
    el.appendChild(out);
    el.appendChild(caret);

    let pi = 0;
    let ci = 0;
    let deleting = false;
    let timer = 0;

    const later = (fn, ms) => { timer = window.setTimeout(fn, ms); };
    const refresh = () => { out.textContent = phrases[pi].slice(0, ci); };

    const step = () => {
      if (!el.isConnected) { window.clearTimeout(timer); return; }
      const phrase = phrases[pi];
      if (!deleting) {
        if (ci < phrase.length) {
          ci++;
          refresh();
          later(step, speed);
        } else if (loop) {
          deleting = true;
          later(step, pause);
        } else {
          return; // 单次输入完成，保持文字
        }
      } else {
        if (ci > 0) {
          ci--;
          refresh();
          later(step, delSpd);
        } else {
          deleting = false;
          pi = (pi + 1) % phrases.length;
          later(step, 120);
        }
      }
    };

    const start = () => step();
    if (onVisible && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) { io.disconnect(); start(); }
          });
        },
        { threshold: 0.15 },
      );
      io.observe(el);
    } else {
      start();
    }
  });
}

/* ---------- 右侧栏「本页目录」：滚动高亮 + 平滑跳转 ----------
   子页面三栏壳层用。软导航会重建 DOM，所以每次 page-load 都重新绑定；
   观察器句柄存 window 上，避免切页后旧观察器继续持有已移除的标题。 */
function tocSpy() {
  if (window.__cwTocIO) {
    window.__cwTocIO.disconnect();
    window.__cwTocIO = null;
  }
  // 点击监听也要去重：首次加载时 boot() 会被 DOMContentLoaded 与 astro:page-load
  // 各调一次，重复绑定会让同一次点击滚两遍（实测表现为滚动打架、停在半路）。
  if (window.__cwTocClick) {
    window.__cwTocClick.el.removeEventListener('click', window.__cwTocClick.fn);
    window.__cwTocClick = null;
  }
  const box = document.querySelector('[data-toc]');
  if (!box) return;

  const links = [...box.querySelectorAll('a[href^="#"]')];
  const map = new Map(); // 标题元素 → 目录链接
  links.forEach((a) => {
    const id = decodeURIComponent(a.getAttribute('href').slice(1));
    const el = id && document.getElementById(id);
    if (el) map.set(el, a);
  });
  if (!map.size) return;

  const setOn = (active) => links.forEach((a) => a.classList.toggle('on', a === active));

  // 点击：平滑滚到标题（让开吸顶头部，见 shell.css 的 scroll-margin-top）
  // 注意目标是 map 的「键」（标题元素），不是链接本身；stopPropagation 挡住
  // Astro ClientRouter 在 document 上的同页锚点接管，避免滚动被它打断。
  const onClick = (ev) => {
    const a = ev.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
    if (!target) return;
    ev.preventDefault();
    ev.stopPropagation();
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    setOn(a);
    if (window.history && history.replaceState) history.replaceState(null, '', a.getAttribute('href'));
  };
  box.addEventListener('click', onClick);
  window.__cwTocClick = { el: box, fn: onClick };

  if (!('IntersectionObserver' in window)) return;
  const visible = new Map();
  window.__cwTocIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => visible.set(en.target, en.isIntersecting));
      // 取「当前可见、且位置最靠上」的标题作为高亮项
      let best = null;
      let bestTop = Infinity;
      visible.forEach((isIn, el) => {
        if (!isIn) return;
        const top = el.getBoundingClientRect().top;
        if (top < bestTop) {
          bestTop = top;
          best = el;
        }
      });
      if (best) setOn(map.get(best));
    },
    // 头部 64px + 呼吸位以下算「进入阅读区」，视口下 60% 之外不算
    { rootMargin: '-84px 0px -55% 0px', threshold: 0 },
  );
  map.forEach((_, el) => window.__cwTocIO.observe(el));
}

/* ---------- 导航栏形态：滚动收缩（不做下滑收起） ----------
   2026-09-18 改版：导航形态照 reference 复刻 —— 参考的导航**不会**随下滑隐藏，
   只有"贴顶通栏 → 下沉 16px 收成胶囊"这一种形态变化。
   故这里只保留 setMaterial()，不再切 .hd-hidden。
   （.hd-hidden 与 html[data-hd] 的旧逻辑已废弃；sideSticky() 只按导航栏实际高度计算。） */
function autoHideHeader() {
  // 向下滚动超过 80px → 下沉 16px + 变矮 + 玻璃加深。
  // 只切一个 html 属性，具体样式在 Header.astro 的 [data-scrolled='1']。
  const SCROLL_MATERIAL_AT = 80;
  let ticking = false;

  const setMaterial = (y) => {
    const want = y > SCROLL_MATERIAL_AT ? '1' : '0';
    const root = document.documentElement;
    if (root.dataset.scrolled !== want) root.dataset.scrolled = want;
  };

  if (window.__cwHeaderWired) {
    // 软导航后沿用同一套监听，但按新页面的滚动位置重置形态
    window.__cwHeaderReset && window.__cwHeaderReset();
    return;
  }
  window.__cwHeaderWired = true;

  const onScroll = () => setMaterial(window.scrollY);

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        onScroll();
      });
    },
    { passive: true },
  );
  window.__cwHeaderReset = () => setMaterial(window.scrollY);
  onScroll();
}

/* ---------- 侧栏吸顶：恒贴在导航栏下方 ----------
   侧栏不自己滚动（无内部滚动条）。两栏共用同一个 sticky top，齐步移动、同一时刻停住。
     · 导航栏始终在场（改版后不再下滑收起）→ top 恒为「导航栏高度 + 18px 呼吸位」，
       绝不取负值，这样侧栏内容不会钻到导航栏底下被半透明玻璃盖住。
   软导航会重建 DOM，故每次 page-load 与 resize 都重算。 */
function sideSticky() {
  const sides = [...document.querySelectorAll('.shell-left, .shell-right')];
  if (!sides.length) {
    window.__cwSideRefresh = null;
    return;
  }

  const HEADER = 64; // 站点头部高度（未滚动时；滚动后 56，见下）
  const GAP = 18; // 吸顶时与导航栏的呼吸位

  const apply = () => {
    const vh = window.innerHeight;
    /* 导航栏高度每次现量：未滚动 64px、滚动收缩后 56px（移动端 52px），
       且外层还有 0→16px 的 padding-top。写死 64 会在滚动后让侧栏压到导航栏底下。 */
    const header = document.querySelector('.site-header');
    const navH = header ? Math.round(header.getBoundingClientRect().height) : HEADER;

    // 先把上一轮的等高清掉，量出两栏各自的自然高度（读取会强制回流）
    sides.forEach((el) => {
      el.style.minHeight = '';
    });
    const heights = sides.map((el) => el.getBoundingClientRect().height).filter((h) => h > 0);
    if (!heights.length) return;

    /* 等高：sticky 的可滑动余量 = 容器（网格行）高度 − 本栏高度，
       两栏高度不同时余量就不同 —— 内容短的页面（主内容比右栏还矮）上，
       高的那栏会先被容器下边界顶走、矮的那栏还贴着，于是越滚越错位。
       把两栏补成等高后，余量一致，两栏严格同步（不会改变卡片位置，只是多了空白高度）。 */
    const maxH = Math.max(...heights);
    sides.forEach((el) => {
      if (el.style.minHeight !== `${maxH}px`) el.style.minHeight = `${maxH}px`;
    });

    /* 导航栏现在**始终在场**（改版后不再下滑收起，见 autoHideHeader 的注释），
       所以吸顶值恒为「导航栏高度 + 呼吸位」，绝不取负值 ——
       侧栏内容不会钻到导航栏底下被半透明玻璃盖住。 */
    const navTop = navH + GAP;
    sides.forEach((el) => el.style.removeProperty('--side-top'));
    const shared = Math.round(navTop);
    sides.forEach((el) => {
      // 导航栏高度在滚动前后会变（64↔56），用 0.16s 平滑跟住这次变化。
      el.style.setProperty('--side-dur', '0.16s');
      el.style.setProperty('--side-top', shared + 'px');
    });
  };
  window.__cwSideRefresh = apply;

  apply();
  // 字体/图片加载完高度会变，稍后再量一次
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  window.setTimeout(apply, 600);

  if (!window.__cwSideStickyWired) {
    window.__cwSideStickyWired = true;
    window.addEventListener('resize', () => window.setTimeout(apply, 80));
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => apply());
      window.__cwSideRO = ro;
    }
  }
  // 观察当前页面的两栏（跨页时 DOM 重建，重新观察）
  if (window.__cwSideRO) {
    window.__cwSideRO.disconnect();
    sides.forEach((el) => window.__cwSideRO.observe(el));
  }
}

/* ---------- 侧栏「活跃热力图」：点色块浮出简短信息 ----------
   数据由组件以 <script type="application/json" data-cal-data> 内联在卡片里；
   点色块 → 在色块上方浮出「这天有 N 次更新、N 次修复」式的简短信息；
   再点同格 / 点击别处 / 滚动 / Esc → 收起。软导航后 DOM 重建，
   这里只绑一次 document 委托，每次点击现读数据、现建浮层。 */
function calPanel() {
  if (window.__cwCalWired) return;
  window.__cwCalWired = true;

  const readData = () => {
    const el = document.querySelector('[data-cal-data]');
    if (!el) return {};
    try {
      return JSON.parse(el.textContent || '{}');
    } catch (err) {
      return {};
    }
  };

  let tip = null;
  let tipFor = '';

  const hide = () => {
    document.querySelectorAll('.hc[data-cal-day][aria-expanded]').forEach((b) => b.removeAttribute('aria-expanded'));
    if (tip) { tip.remove(); tip = null; }
    tipFor = '';
  };

  const open = (btn) => {
    const day = btn.dataset.calDay || '';
    if (tipFor === day) { hide(); return; } // 再点同格 = 收起
    hide();

    const items = readData()[day] || [];
    // 按类型计数（保持出现顺序）：上线 2、修复 1 …
    const order = [];
    const counts = new Map();
    items.forEach((it) => {
      const k = it.kind || '更新';
      if (!counts.has(k)) order.push(k);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    const breakdown = order.map((k) => `${k} ${counts.get(k)} 次`).join('、');
    const parts = day.split('-');
    const wd = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date(day + 'T00:00:00').getDay()];
    const dateLabel = `${Number(parts[1])} 月 ${Number(parts[2])} 日 · ${wd}`;

    tip = document.createElement('div');
    tip.className = 'heat-tip';
    tip.setAttribute('role', 'status');
    const head = document.createElement('strong');
    head.textContent = `${dateLabel} · ${items.length} 条`;
    const body = document.createElement('span');
    body.textContent = items.length ? `这天有 ${breakdown}` : '这天没有记录';
    tip.appendChild(head);
    tip.appendChild(body);
    document.body.appendChild(tip);
    tipFor = day;

    // 定位：色块上方居中，钳在视口内
    const r = btn.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    let top = r.top - th - 8;
    if (top < 8) top = r.bottom + 8; // 上方放不下就放下方
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
    btn.setAttribute('aria-expanded', 'true');
  };

  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('.hc[data-cal-day]');
    if (btn) {
      ev.preventDefault();
      open(btn);
      return;
    }
    if (ev.target.closest('.heat-tip')) return; // 浮层内点击不收起
    hide();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') hide();
  });
  window.addEventListener('scroll', hide, { passive: true });
  window.addEventListener('resize', hide);
}

/* ---------- 侧栏天气小帖 ----------
   数据源 uapis.cn（免费无需 key，中文）。静态站构建时拿不到访客 IP，所以在这里拉：
   结果存 localStorage（30 分钟），软导航重建 DOM 时直接用缓存渲染，不重复请求。
   失败/离线只显示一行提示 + 重试按钮，不弹错。 */
function weatherWidget() {
  const card = document.querySelector('[data-weather]');
  if (!card) return;

  const KEY = '__cwWeather_v1';
  const TTL = 30 * 60 * 1000;
  const API = 'https://uapis.cn/api/v1/misc/weather?extended=true&forecast=true&hourly=false&minutely=false&indices=false&lang=zh';
  const GLYPHS = [
    [/雷/, '⛈'],
    [/雪|冰|冻/, '❄'],
    [/雨/, '☂'],
    [/雾|霾|沙|尘|浮尘/, '≋'],
    [/阴/, '☁'],
    [/多云/, '⛅'],
    [/晴/, '☀'],
  ];
  const glyphOf = (text) => {
    const t = String(text || '');
    for (const [re, g] of GLYPHS) if (re.test(t)) return g;
    return '☁';
  };
  const el = (sel) => card.querySelector(sel);

  const readCache = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && data.t > Date.now() - TTL && data.v) return data.v;
    } catch (e) {
      /* 忽略 */
    }
    return null;
  };
  const writeCache = (v) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), v }));
    } catch (e) {
      /* 隐私模式等忽略 */
    }
  };

  const render = (d) => {
    card.dataset.wxState = 'ready';
    const temp = d.temperature != null ? Math.round(d.temperature) : '--';
    el('[data-wx-temp]').textContent = temp;
    el('[data-wx-glyph]').textContent = glyphOf(d.weather);
    el('[data-wx-city]').textContent = (d.city || d.district || d.province || '—').replace(/市$/, '');
    el('[data-wx-cond]').textContent = d.weather || '';

    const bits = [];
    if (d.temp_max != null && d.temp_min != null) bits.push(`高 ${Math.round(d.temp_max)}° 低 ${Math.round(d.temp_min)}°`);
    if (d.feels_like != null) bits.push(`体感 ${Math.round(d.feels_like)}°`);
    if (d.humidity != null) bits.push(`湿度 ${d.humidity}%`);
    if (d.wind_direction) bits.push(`${d.wind_direction}${d.wind_power || ''}`);
    el('[data-wx-meta]').textContent = bits.join(' · ');

    const aqiEl = el('[data-wx-aqi]');
    if (d.aqi != null) {
      aqiEl.hidden = false;
      aqiEl.innerHTML = '';
      const b = document.createElement('b');
      b.textContent = `AQI ${d.aqi}`;
      aqiEl.appendChild(b);
      const cat = document.createElement('span');
      cat.textContent = `${d.aqi_category || ''}${d.aqi_primary ? ' · ' + d.aqi_primary : ''}`.trim();
      aqiEl.appendChild(cat);
    } else {
      aqiEl.hidden = true;
    }

    const daysEl = el('[data-wx-days]');
    const days = (d.forecast || []).slice(0, 3);
    daysEl.innerHTML = '';
    if (days.length) {
      daysEl.hidden = false;
      days.forEach((f) => {
        const li = document.createElement('li');
        const wd = document.createElement('span');
        wd.className = 'd-wd';
        wd.textContent = (f.week || '').replace(/^星期/, '周');
        const g = document.createElement('span');
        g.className = 'd-glyph';
        g.textContent = glyphOf(f.weather_day);
        const t = document.createElement('span');
        t.className = 'd-temp';
        const hi = document.createElement('b');
        hi.textContent = `${Math.round(f.temp_max)}°`;
        t.appendChild(hi);
        t.appendChild(document.createTextNode(` / ${Math.round(f.temp_min)}°`));
        li.appendChild(wd);
        li.appendChild(g);
        li.appendChild(t);
        daysEl.appendChild(li);
      });
    } else {
      daysEl.hidden = true;
    }

    el('[data-wx-note]').textContent = [d.report_time, d.city ? `${d.city}${d.district && d.district !== d.city ? ' ' + d.district : ''}` : '']
      .filter(Boolean)
      .join(' · ');
    el('[data-wx-retry]').hidden = true;
  };

  const failed = (msg) => {
    card.dataset.wxState = 'error';
    el('[data-wx-city]').textContent = msg;
    el('[data-wx-cond]').textContent = '';
    el('[data-wx-note]').textContent = '天气数据源：uapis.cn';
    el('[data-wx-retry]').hidden = false;
  };

  const load = (force) => {
    if (!force) {
      const cached = readCache();
      if (cached) {
        render(cached);
        return;
      }
    }
    if (navigator.connection && navigator.connection.saveData) {
      failed('已开启省流模式');
      return;
    }
    // 首屏 boot() 可能被 DOMContentLoaded 与 astro:page-load 各调一次，
    // 加个在途标记，避免同一秒发出两个相同请求
    if (window.__cwWeatherLoading) return;
    window.__cwWeatherLoading = true;
    card.dataset.wxState = 'loading';
    const city = card.dataset.weatherCity;
    const url = city ? `${API}&city=${encodeURIComponent(city)}` : API;
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctrl ? window.setTimeout(() => ctrl.abort(), 9000) : null;
    fetch(url, ctrl ? { signal: ctrl.signal } : undefined)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('http ' + r.status))))
      .then((res) => {
        window.clearTimeout(timer);
        if (!res || res.temperature == null) throw new Error('bad payload');
        writeCache(res);
        render(res);
      })
      .catch(() => {
        window.clearTimeout(timer);
        failed('天气暂不可用');
      })
      .finally(() => {
        window.__cwWeatherLoading = false;
      });
  };

  if (!window.__cwWeatherWired) {
    window.__cwWeatherWired = true;
    // 委托：重试按钮（软导航后依然有效）
    document.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-wx-retry]')) {
        ev.preventDefault();
        load(true);
      }
    });
  }
  load(false);
}

/* ---------- 右侧栏「GitHub 热榜」（§56，2026-09-20；§69 数据源改造 2026-09-22）----------
   日/周/月/年四个周期（默认每日），数据 = 构建时快照 /api/gh-hot.json（同域静态文件，
   由 scripts/fetch-ghhot.mjs 在构建时拉 GitHub Search API 生成：期间内新建仓库按 star
   排序）。访客端不再直连 api.github.com —— 无鉴权搜索接口 10 次/分限流 + 跨境网络
   不稳的问题从根上消除，站点能开热榜就能开。
   刷新语义按站长要求保留「时间桶」：缓存键 = 当前桶（日桶=当天 / 周桶=本周周一 /
   月桶 / 年桶，访客本地时区），桶一滚动即等价于「每日 24 点 / 周、月、年最后一天
   24 点」自动重拉同域快照；页面驻留时每分钟比对桶 ID，过点即自动重拉。 */
function githubTrending() {
  const card = document.querySelector('[data-ghhot]');
  if (!card) return;

  const KEY = '__cwGhHot_v1';
  /* 每周期条数由构建快照决定（scripts/fetch-ghhot.mjs 的 N=8），前端不再拼查询 */
  const LANG_COLORS = {
    JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572a5', Rust: '#dea584',
    Go: '#00add8', 'C++': '#f34b7d', C: '#555555', Java: '#b07219', 'C#': '#178600',
    Vue: '#41b883', HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051', Zig: '#ec915c',
    Lua: '#000080', MDX: '#fcb32c', 'Jupyter Notebook': '#da5b0b', Swift: '#f05138',
    Kotlin: '#a97bff', Ruby: '#701516', PHP: '#4f5d95', Dart: '#00b4ab', Svelte: '#ff3e00',
  };
  const el = (sel) => card.querySelector(sel);

  const pad = (n) => String(n).padStart(2, '0');
  /* 周期 → 桶 ID 与查询起点（均为本地时区；桶滚动点即要求的 24 点） */
  const bucketOf = (period, now = new Date()) => {
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();
    if (period === 'daily') return { id: `${y}-${pad(m + 1)}-${pad(d)}`, start: `${y}-${pad(m + 1)}-${pad(d)}` };
    if (period === 'weekly') {
      const mon = new Date(y, m, d - ((now.getDay() + 6) % 7)); // 本周一
      const s = `${mon.getFullYear()}-${pad(mon.getMonth() + 1)}-${pad(mon.getDate())}`;
      return { id: 'w' + s, start: s };
    }
    if (period === 'monthly') return { id: `${y}-${pad(m + 1)}`, start: `${y}-${pad(m + 1)}-01` };
    return { id: String(y), start: `${y}-01-01` };
  };

  const readStore = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  };
  const writeStore = (all) => {
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* 隐私模式等忽略 */ }
  };

  const fmtStars = (n) => (n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n));

  const render = (period, items) => {
    const cur = card.dataset.ghhotPeriod || 'daily';
    if (cur !== period) return; // 用户已切走：丢弃过期渲染
    card.dataset.ghhotState = 'ready';
    const list = el('[data-ghhot-list]');
    list.innerHTML = '';
    items.forEach((r, i) => {
      const li = document.createElement('li');
      li.className = 'sw-hot-item';
      const rank = document.createElement('span');
      rank.className = 'sw-hot-rank';
      rank.textContent = String(i + 1);
      const main = document.createElement('div');
      main.className = 'sw-hot-main';
      const a = document.createElement('a');
      a.className = 'sw-hot-name';
      a.href = r.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = r.name;
      const meta = document.createElement('span');
      meta.className = 'sw-hot-meta';
      const stars = document.createElement('span');
      stars.className = 'sw-hot-stars';
      stars.textContent = '★ ' + fmtStars(r.stars);
      meta.appendChild(stars);
      if (r.lang) {
        const lang = document.createElement('span');
        lang.className = 'sw-hot-lang';
        const dot = document.createElement('i');
        dot.style.background = LANG_COLORS[r.lang] || '';
        lang.appendChild(dot);
        lang.appendChild(document.createTextNode(r.lang));
        meta.appendChild(lang);
      }
      const desc = document.createElement('p');
      desc.className = 'sw-hot-desc';
      desc.textContent = r.desc || '';
      desc.title = r.desc || '';
      main.appendChild(a);
      main.appendChild(meta);
      main.appendChild(desc);
      li.appendChild(rank);
      li.appendChild(main);
      list.appendChild(li);
    });
  };

  const failed = (period) => {
    if ((card.dataset.ghhotPeriod || 'daily') !== period) return;
    card.dataset.ghhotState = 'error';
    el('[data-ghhot-note]').innerHTML = '';
    el('[data-ghhot-note]').textContent = '热榜暂时不可用（数据加载失败）';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sw-hot-refresh';
    btn.textContent = '重试';
    btn.addEventListener('click', () => load(period, true));
    el('[data-ghhot-note]').appendChild(btn);
  };

  const inflight = {};
  const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];
  /* 数据源 = 同域构建快照（§69）。一次拉全量四周期、按各周期访客当前桶写缓存：
     之后切 tab 命中缓存零请求零等待；桶滚动后重拉同域文件拿部署新版。 */
  const fetchBucket = (period, bucket) => {
    if (inflight[period]) return;
    inflight[period] = true;
    card.dataset.ghhotState = 'loading';
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = ctrl ? window.setTimeout(() => ctrl.abort(), 3000) : null;
    fetch('/api/gh-hot.json', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('http ' + r.status))))
      .then((snap) => {
        window.clearTimeout(timer);
        const list = snap && snap.periods;
        const all = readStore();
        let hitAny = false;
        PERIODS.forEach((p) => {
          const entry = list && list[p];
          if (!entry || !Array.isArray(entry.items) || !entry.items.length) return;
          hitAny = true;
          all[p] = { bucket: bucketOf(p).id, items: entry.items, t: Date.now() };
        });
        if (!hitAny) throw new Error('empty');
        writeStore(all);
        const cur = all[period];
        if (!(cur && cur.bucket === bucket.id && cur.items && cur.items.length)) {
          throw new Error('empty');
        }
        render(period, cur.items);
      })
      .catch(() => {
        window.clearTimeout(timer);
        failed(period);
      })
      .finally(() => {
        inflight[period] = false;
      });
  };

  const load = (period, force) => {
    const bucket = bucketOf(period);
    card.dataset.ghhotPeriod = period;
    if (!force) {
      const cached = readStore()[period];
      if (cached && cached.bucket === bucket.id && cached.items) {
        render(period, cached.items);
        return;
      }
    }
    fetchBucket(period, bucket);
  };

  /* tab 切换：委托 + window 单例（软导航重建侧栏后依然有效）。
     ⚠️ 监听器与定时器只注册一次，但侧栏每次软导航都会整块换新，而本函数
     每页都会重跑、拿到新的 card/load 闭包。若监听器抓死首次的闭包，切 tab
     就会写进已脱离文档的旧卡片（实测缺陷：period 不变、选中态不动、列表不刷新）。
     现把「当前这一次」的 card/load 挂 window.__cwGhHotApi，监听器只做转发。 */
  window.__cwGhHotApi = { card, load };
  if (!window.__cwGhHotWired) {
    window.__cwGhHotWired = true;
    document.addEventListener('click', (ev) => {
      const tab = ev.target instanceof Element && ev.target.closest('[data-ghhot-tab]');
      if (!tab) return;
      const api = window.__cwGhHotApi;
      if (!api || !api.card || !api.card.isConnected) return;
      ev.preventDefault();
      const period = tab.getAttribute('data-ghhot-tab');
      api.card.querySelectorAll('[data-ghhot-tab]').forEach((b) =>
        b.setAttribute('aria-selected', String(b === tab)));
      api.load(period, false);
    });
    /* 驻留自动刷新：每分钟比对当前周期的桶 ID，跨桶（如 24 点）自动重拉 */
    window.setInterval(() => {
      const api = window.__cwGhHotApi;
      if (!api || !api.card || !document.contains(api.card)) return;
      const period = api.card.dataset.ghhotPeriod || 'daily';
      const bucket = bucketOf(period);
      const cached = readStore()[period];
      if (!cached || cached.bucket !== bucket.id) api.load(period, true);
    }, 60000);
  }
  load('daily', false);
}

/* ---------- 左侧栏「音乐播放器」----------
   歌曲列表在 site.ts 的 MUSIC（为空则只有占位，直接返回）。
   ⚠️ <audio> 必须挂在 document.body 上、而不是侧栏里：软导航会整个换掉侧栏 DOM，
      挂在里面的话一切页面音乐就断。同理状态存 window 单例、监听走 document 委托。 */
/* ---------- 歌词加载（侧栏播放器与音乐页共用，§67）----------
   零配置约定：把 <id>.lrc 放进 public/music/lyrics/ 即自动启用同步歌词。
   解析结果按曲目 id 缓存（404 也缓存，避免反复请求）。 */
const lrcCache = new Map();
function parseLRC(text) {
  const out = [];
  for (const raw of String(text || '').split(/\r?\n/)) {
    // 一行可带多个时间戳：[mm:ss.xx][mm:ss.xx]歌词
    const stamps = [...raw.matchAll(/\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g)];
    if (!stamps.length) continue;
    const line = raw.replace(/\[[^\]]*\]/g, '').trim();
    if (!line) continue;
    for (const m of stamps) {
      const frac = m[3] ? parseInt(m[3].padEnd(3, '0'), 10) / 1000 : 0;
      out.push({ t: parseInt(m[1], 10) * 60 + parseInt(m[2], 10) + frac, text: line });
    }
  }
  out.sort((a, b) => a.t - b.t);
  return out;
}
async function loadLyrics(id) {
  if (!id) return null;
  if (lrcCache.has(id)) return lrcCache.get(id);
  try {
    const res = await fetch(`/music/lyrics/${encodeURIComponent(id)}.lrc`);
    let val = null;
    if (res.ok) {
      const lines = parseLRC(await res.text());
      if (lines.length) val = { lines };
    }
    lrcCache.set(id, val);
    return val;
  } catch (e) {
    return null;
  }
}

function musicPlayer() {
  const card = document.querySelector('[data-music]');
  if (!card) {
    musicCard = null; // 软导航到无侧栏卡页面：旧引用已脱离 DOM，置空防误写
    return;
  }
  musicCard = card;
  musicEndedOwner = 'side'; // 当前页侧栏连着：曲终推进归侧管（音乐页会覆盖为 'page'）
  const total = Number(musicCard.dataset.musicCount || '0');
  if (!total) return; // 歌曲未添加：只有占位内容，无需交互

  const st =
    window.__cwMusic ||
    (window.__cwMusic = {
      audio: null,
      index: 0,
      wired: false,
      restored: false,
      lyricsOpen: false, // 歌词面板是否展开（软导航后据此恢复）
      lyricsFor: -1, // 已加载歌词的曲目下标
      lyricsLines: null, // 当前曲目的 LRC 行（null = 纯音乐/暂无）
      lyricsPtr: 0, // 当前高亮行指针
    });

  // ---- 音频元素：全站共享单例（侧栏与 /music/ 页同一元素，状态天然同步）----
  const audio = getSharedAudio();
  if (!audio.__sideBound) {
    audio.__sideBound = true;
    audio.addEventListener('timeupdate', () => {
      paintProgress();
      syncLyrics();
      if (audio.duration && !audio.paused) {
        // 记录播放位置：整页刷新后可以接着放
        try {
          sessionStorage.setItem('cw-music-at', String(Math.floor(audio.currentTime)));
        } catch (e) {
          /* ignore */
        }
      }
    });
    audio.addEventListener('loadedmetadata', () => {
      paintProgress();
      if (musicCard && musicCard.dataset.musicResume) {
        const at = Number(musicCard.dataset.musicResume) || 0;
        if (at > 0 && at < (audio.duration || Infinity)) audio.currentTime = at;
        delete musicCard.dataset.musicResume;
      }
    });
    audio.addEventListener('play', () => {
      // §67.9：与音乐页共用同一元素，不再互斥；只刷本视图 UI
      if (musicCard) musicCard.dataset.state = 'playing';
      setToggleLabel(true);
    });
    audio.addEventListener('pause', () => {
      if (musicCard) musicCard.dataset.state = 'paused';
      setToggleLabel(false);
    });
    // 曲终推进：只有「所有权视图」才推进，防止两个监听器双跳
    audio.addEventListener('ended', () => {
      if (musicEndedOwner === 'side') step(1, true);
    });
    audio.addEventListener('error', () => {
      if (!musicCard) return;
      musicCard.dataset.state = 'error';
      setToggleLabel(false);
      const dur = musicCard.querySelector('[data-mu-dur]');
      if (dur) dur.textContent = '--:--';
    });
  }
  st.audio = audio;

  // ---- 取曲目信息（从侧栏的 DOM 上读，避免在 ui.js 里再引一份 MUSIC）----
  // ⚠️ 共享监听器在 /music/ 页也会触发，此时 musicCard 为 null：一律守卫
  const srcs = () => {
    const raw = (musicCard && musicCard.dataset.musicSrcs) || '';
    return raw ? raw.split('|') : [];
  };

  const fmt = (s) => {
    if (!isFinite(s) || s <= 0) return '0:00';
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, '0')}`;
  };

  const setToggleLabel = (playing) => {
    if (!musicCard) return;
    const btn = musicCard.querySelector('[data-mu-toggle]');
    if (!btn) return;
    btn.setAttribute('aria-label', playing ? '暂停' : '播放');
  };

  const paintProgress = () => {
    if (!musicCard) return;
    const bar = musicCard.querySelector('[data-mu-bar]');
    const fill = musicCard.querySelector('[data-mu-fill]');
    const cur = musicCard.querySelector('[data-mu-cur]');
    const dur = musicCard.querySelector('[data-mu-dur]');
    const d = audio.duration;
    const t = audio.currentTime;
    if (fill && isFinite(d) && d > 0) fill.style.width = `${(t / d) * 100}%`;
    if (cur) cur.textContent = fmt(t);
    if (dur) dur.textContent = isFinite(d) && d > 0 ? fmt(d) : '--:--';
    if (bar && isFinite(d) && d > 0) {
      bar.setAttribute('aria-valuenow', String(Math.round((t / d) * 100)));
      bar.setAttribute('aria-valuetext', `${fmt(t)} / ${fmt(d)}`);
    }
  };

  /* ---- 歌词面板（「词」按钮弹出；LRC 零配置，见文件顶部 loadLyrics 注释）---- */
  const ids = () => (musicCard && musicCard.dataset.musicIds ? musicCard.dataset.musicIds : '').split('|');
  const insts = () => (musicCard && musicCard.dataset.musicInst ? musicCard.dataset.musicInst : '').split('|');
  const lyPanel = () => (musicCard ? musicCard.querySelector('[data-mu-lyrics-panel]') : null);
  const lyInner = () => (musicCard ? musicCard.querySelector('[data-mu-lyrics-inner]') : null);

  const lyricsPaint = (data) => {
    const inner = lyInner();
    if (!inner) return;
    st.lyricsFor = st.index;
    st.lyricsLines = data && data.lines ? data.lines : null;
    st.lyricsPtr = 0;
    if (!st.lyricsLines) {
      const isInst = insts()[st.index] === '1';
      inner.innerHTML = `<p class="mu-ly-empty">${isInst ? '♪ 纯音乐，请欣赏' : '暂无歌词'}</p>`;
      return;
    }
    inner.innerHTML = st.lyricsLines
      .map((l) => `<p class="mu-ly-line">${l.text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`)
      .join('');
    syncLyrics();
  };

  const ensureLyrics = () => {
    if (st.lyricsFor === st.index && lyInner() && lyInner().childNodes.length) return;
    const inner = lyInner();
    if (inner && !inner.childNodes.length) inner.innerHTML = '<p class="mu-ly-empty">歌词加载中…</p>';
    const reqIdx = st.index;
    loadLyrics(ids()[reqIdx]).then((data) => {
      // 加载期间可能已切歌/收起面板：不再渲染（下次打开会重新加载）
      if (st.index !== reqIdx || !st.lyricsOpen) return;
      lyricsPaint(data);
    });
  };

  const syncLyrics = () => {
    if (!st.lyricsOpen || !st.lyricsLines) return;
    const t = audio.currentTime || 0;
    let p = st.lyricsPtr;
    if (p < st.lyricsLines.length && t + 0.2 < st.lyricsLines[p].t) p = 0; // 回退（拖动进度条）
    while (p + 1 < st.lyricsLines.length && st.lyricsLines[p + 1].t <= t) p++;
    st.lyricsPtr = p;
    const inner = lyInner();
    if (!inner) return;
    const nodes = inner.querySelectorAll('.mu-ly-line');
    nodes.forEach((n, i) => n.classList.toggle('on', i === p));
    const cur = nodes[p];
    if (cur) {
      const top = cur.offsetTop - inner.clientHeight / 2 + cur.offsetHeight / 2;
      if (Math.abs(inner.scrollTop - top) > 2) inner.scrollTop = top;
    }
  };

  const toggleLyrics = () => {
    st.lyricsOpen = !st.lyricsOpen;
    const panel = lyPanel();
    const btn = musicCard.querySelector('[data-mu-lyrics]');
    if (panel) panel.hidden = !st.lyricsOpen;
    if (btn) btn.setAttribute('aria-expanded', String(st.lyricsOpen));
    if (st.lyricsOpen) ensureLyrics();
  };

  const load = (i, autoplay) => {
    if (!musicCard) return; // 共享监听器场景下的安全网（正常路径 srcs 空已拦）
    const list = srcs();
    if (!list.length) return;
    st.index = ((i % list.length) + list.length) % list.length;
    audio.src = list[st.index];
    musicCard.dataset.state = 'loading';
    // 曲名/作者：由页面按 index 渲染成 data 属性太啰嗦，这里直接读 DOM 上的列表
    const titles = (musicCard.dataset.musicTitles || '').split('|');
    const artists = (musicCard.dataset.musicArtists || '').split('|');
    const tEl = musicCard.querySelector('[data-mu-title]');
    const aEl = musicCard.querySelector('[data-mu-artist]');
    if (tEl) tEl.textContent = titles[st.index] || '未命名曲目';
    if (aEl) aEl.textContent = artists[st.index] || '未知作者';
    const no = musicCard.querySelector('[data-mu-no]');
    if (no) no.textContent = `${String(st.index + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    try {
      sessionStorage.setItem('cw-music-idx', String(st.index));
    } catch (e) {
      /* ignore */
    }
    // 切歌：歌词状态重置（面板开着就自动加载新词）
    st.lyricsLines = null;
    st.lyricsPtr = 0;
    if (st.lyricsOpen) {
      const inner = lyInner();
      if (inner) inner.innerHTML = '<p class="mu-ly-empty">歌词加载中…</p>';
      const reqIdx = st.index;
      loadLyrics(ids()[reqIdx]).then((data) => {
        if (st.index !== reqIdx || !st.lyricsOpen) return;
        lyricsPaint(data);
      });
    } else {
      st.lyricsFor = -1;
    }
    paintProgress();
    if (autoplay) {
      const p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // 浏览器拦截自动播放：保持暂停，等用户点一下
          musicCard.dataset.state = 'paused';
        });
      }
    }
  };

  const step = (delta, autoplay) => {
    if (!audio.src) return load(st.index + delta, autoplay);
    load(st.index + delta, autoplay);
  };

  // ---- 共享单例对齐：audio.src 可能已由 /music/ 页装载（软导航往返）----
  // 按文件名对齐曲目下标；对得上就不动音频（进度/播放态就是实况）。
  if (audio.src) {
    const cur = decodeURIComponent((audio.currentSrc || audio.src || '').split('/').pop() || '');
    const found = srcs().findIndex((s) => decodeURIComponent(s.split('/').pop() || '') === cur);
    if (found >= 0) st.index = found;
  }

  // ---- 首次进入：恢复上次的曲目与播放位置（不自动播放，避免被拦截）----
  // audio.src 已有曲目（从另一视图带过来）时跳过恢复：index 已按 src 对齐。
  if (!st.restored) {
    st.restored = true;
    if (!audio.src) {
      let idx = 0;
      let at = 0;
      try {
        idx = Number(sessionStorage.getItem('cw-music-idx') || '0') || 0;
        at = Number(sessionStorage.getItem('cw-music-at') || '0') || 0;
      } catch (e) {
        /* ignore */
      }
      st.index = idx;
      // 位置通过 dataset 传给 loadedmetadata 里使用
      musicCard.dataset.musicResume = String(at);
      load(idx, false);
    }
  }

  // 软导航后侧栏被重建：把 UI 重新同步到正在播放的音频
  paintProgress();
  setToggleLabel(!audio.paused);
  if (audio.src) {
    const no = musicCard.querySelector('[data-mu-no]');
    const list = srcs();
    if (no) no.textContent = `${String(st.index + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    const titles = (musicCard.dataset.musicTitles || '').split('|');
    const tEl = musicCard.querySelector('[data-mu-title]');
    if (tEl && titles[st.index]) tEl.textContent = titles[st.index];
    if (!audio.paused) musicCard.dataset.state = 'playing';
  }

  // 歌词面板若在软导航前是展开的：在新 DOM 上恢复展开态并重渲染当前词
  if (st.lyricsOpen) {
    const panel = lyPanel();
    const btn = musicCard.querySelector('[data-mu-lyrics]');
    if (panel) panel.hidden = false;
    if (btn) btn.setAttribute('aria-expanded', 'true');
    ensureLyrics();
  }

  if (st.wired) return;
  st.wired = true;

  // ---- 事件委托：软导航换掉侧栏 DOM 后依然有效 ----
  document.addEventListener('click', (ev) => {
    const el = ev.target instanceof Element ? ev.target : null;
    if (!el) return;
    const host = el.closest('[data-music]');
    if (!host) return;

    if (el.closest('[data-mu-toggle]')) {
      if (audio.paused) {
        if (!audio.src) load(st.index, true);
        else {
          const p = audio.play();
          if (p && typeof p.catch === 'function')
            p.catch(() => {
              // 自动播放被策略拦截（无手势/无头环境）：归位为暂停态，别卡在 loading
              if (musicCard) musicCard.dataset.state = 'paused';
            });
        }
      } else audio.pause();
      return;
    }
    if (el.closest('[data-mu-prev]')) return step(-1, true);
    if (el.closest('[data-mu-next]')) return step(1, true);
    if (el.closest('[data-mu-lyrics]')) return toggleLyrics();

    const bar = el.closest('[data-mu-bar]');
    if (bar && isFinite(audio.duration) && audio.duration > 0) {
      const r = bar.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      audio.currentTime = ratio * audio.duration;
      paintProgress();
    }
  });

  // 进度条键盘操作（←/→ 各 5 秒），无额外 tabindex 依赖
  document.addEventListener('keydown', (ev) => {
    const bar = ev.target instanceof Element ? ev.target.closest('[data-mu-bar]') : null;
    if (!bar) return;
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    ev.preventDefault();
    if (!isFinite(audio.duration)) return;
    audio.currentTime = Math.min(
      audio.duration,
      Math.max(0, audio.currentTime + (ev.key === 'ArrowRight' ? 5 : -5)),
    );
    paintProgress();
  });
}

/* ---------- 音乐页 /music/（§67）：中央大唱片 + 全参数 + 歌词 + 曲目表 ----------
   唱片播放时旋转（CSS animation + play-state），悬停 3D 视差（rAF 插值 tilt +
   高光跟随）。数据全部来自页面 data-*（site.ts 渲染）。
   ⚠️ 委托监听器只绑一次，但它调到的 load/paint 必须查询「当前文档」的节点：
   软导航往返 /music/ 后旧 root 已脱离 DOM，写进去用户看不见 —— 所以 DOM 一律经
   mpRoot（每次 boot 更新为当前文档的页面容器）取，音频/状态仍走 window 单例。

   §67.9 状态同步：侧栏与音乐页共用同一个 <audio>（getSharedAudio 单例），
   曲目/进度/播放态天然一致，不再有「互斥播放」。两套监听器经 __sideBound /
   __pageBound 各绑一次；UI 刷新一律经 musicCard / mpRoot（当前文档）；曲终
   推进由 musicEndedOwner 决定归哪个视图管（每次 boot 按视图连通性更新）。 */
let mpRoot = null;
let musicCard = null; // 侧栏音乐卡（每次 boot 更新为当前文档节点，仿 mpRoot）
let musicEndedOwner = null; // 'side' | 'page'：曲终推进归谁（boot 按连通性定）
let sharedAudio = null;

function getSharedAudio() {
  if (sharedAudio) return sharedAudio;
  const a = new Audio();
  a.preload = 'metadata';
  sharedAudio = a;
  return a;
}

function musicPage() {
  const root = document.querySelector('[data-music-page]');
  if (!root) {
    mpRoot = null; // 软导航离开 /music/：旧 root 已脱离 DOM，置空防误写
    return;
  }
  mpRoot = root;
  musicEndedOwner = 'page'; // 音乐页连着：曲终按页面循环模式推进（覆盖侧栏的 'side'）

  const st =
    window.__cwMusicPage ||
    (window.__cwMusicPage = {
      audio: null,
      index: 0,
      wired: false,
      restored: false,
      loop: 'list', // list 顺序循环 | one 单曲循环 | shuffle 随机
      lyFor: -1,
      lyLines: undefined, // undefined=加载中 null=无歌词 数组=已就绪
      lyPtr: 0,
      vol: 1,
    });

  // ---- 数据（页面容器 data-*，pipe 分隔；与 site.ts 的 MUSIC 同源；一律读当前 mpRoot）----
  const list = (k) => ((mpRoot && mpRoot.dataset[k]) || '').split('|');
  const ids = () => list('mpIds');
  const srcs = () => list('mpSrcs');
  const titles = () => list('mpTitles');
  const artists = () => list('mpArtists');
  const albums = () => list('mpAlbums');
  const covers = () => list('mpCovers');
  const insts = () => list('mpInst');
  const durs = () => list('mpDurs');
  const sizes = () => list('mpSizes');
  const origins = () => list('mpOrigins');

  const qs = (sel) => (mpRoot ? mpRoot.querySelector(sel) : null);
  const fmt = (s) => {
    if (!isFinite(s) || s <= 0) return '0:00';
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${String(r).padStart(2, '0')}`;
  };
  const LOOP_LABEL = { list: '顺序循环', one: '单曲循环', shuffle: '随机播放' };

  // ---- 音频单例：全站共享（与侧栏同一元素，状态天然同步，§67.9）----
  const audio = getSharedAudio();
  if (!audio.__pageBound) {
    audio.__pageBound = true;
    audio.addEventListener('loadedmetadata', () => {
      paint();
      const at = Number(mpRoot && mpRoot.dataset.mpResume) || 0;
      if (at > 0 && at < (audio.duration || Infinity)) audio.currentTime = at;
      if (mpRoot) delete mpRoot.dataset.mpResume;
    });
    audio.addEventListener('timeupdate', () => {
      paint();
      syncLyrics();
      if (audio.duration && !audio.paused) {
        try {
          sessionStorage.setItem('cw-mp-at', String(Math.floor(audio.currentTime)));
        } catch (e) {
          /* ignore */
        }
      }
    });
    // §67.9：与侧栏共用同一元素，不再互斥；只刷本视图 UI
    audio.addEventListener('play', paint);
    audio.addEventListener('pause', paint);
    audio.addEventListener('playing', paint);
    audio.addEventListener('waiting', paint);
    // 曲终推进：只有「所有权视图」才按自己的循环模式推进，防止双跳
    audio.addEventListener('ended', () => {
      if (musicEndedOwner !== 'page') return;
      const n = srcs().length;
      if (st.loop === 'one') {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && p.catch) p.catch(() => {});
      } else if (st.loop === 'shuffle' && n > 1) {
        let next = st.index;
        while (next === st.index) next = Math.floor(Math.random() * n);
        load(next, true);
      } else {
        load(st.index + 1, true);
      }
    });
    audio.addEventListener('error', paint);
  }
  st.audio = audio;

  // ---- 渲染：进度/时间/状态/唱片/列表/参数 全量刷 ----
  function paint() {
    const d = audio.duration;
    const t = audio.currentTime;
    const fill = qs('[data-mp-fill]');
    if (fill && isFinite(d) && d > 0) fill.style.width = `${(t / d) * 100}%`;
    const bar = qs('[data-mp-bar]');
    if (bar && isFinite(d) && d > 0) {
      bar.setAttribute('aria-valuenow', String(Math.round((t / d) * 100)));
      bar.setAttribute('aria-valuetext', `${fmt(t)} / ${fmt(d)}`);
    }
    const cur = qs('[data-mp-cur]');
    if (cur) cur.textContent = fmt(t);
    const dur = qs('[data-mp-dur]');
    if (dur) dur.textContent = isFinite(d) && d > 0 ? fmt(d) : durs()[st.index] || '--:--';

    const playing = !audio.paused && !audio.ended && audio.readyState > 2;
    const err = audio.error;
    const stateTxt = err ? '播放出错' : audio.paused ? (t > 0 ? '已暂停' : '待播放') : '播放中';
    if (mpRoot) mpRoot.dataset.state = err ? 'error' : playing ? 'playing' : audio.paused ? 'paused' : 'loading';
    const disc = qs('[data-mp-disc]');
    if (disc) disc.classList.toggle('is-playing', playing);
    const stEl = qs('[data-mp-state]');
    if (stEl) stEl.textContent = stateTxt;
    const loopEl = qs('[data-mp-loop]');
    if (loopEl) {
      loopEl.textContent = LOOP_LABEL[st.loop] || LOOP_LABEL.list;
      loopEl.dataset.mode = st.loop;
    }
    const loopLabel = qs('[data-mp-loop-label]');
    if (loopLabel) loopLabel.textContent = LOOP_LABEL[st.loop] || LOOP_LABEL.list;
    // 音量百分比在控制区与参数区各有一份，全量刷
    if (mpRoot) mpRoot.querySelectorAll('[data-mp-volpct]').forEach((n) => {
      n.textContent = `${Math.round(st.vol * 100)}%`;
    });
    const noEl = qs('[data-mp-no]');
    if (noEl) noEl.textContent = `${String(st.index + 1).padStart(2, '0')} / ${String(srcs().length).padStart(2, '0')}`;
    // 曲目表活动态
    const items = mpRoot ? mpRoot.querySelectorAll('[data-mp-item]') : [];
    items.forEach((n, i) => n.classList.toggle('on', i === st.index));
    const toggle = qs('[data-mp-toggle]');
    if (toggle) toggle.setAttribute('aria-label', playing ? '暂停' : '播放');
  }

  // ---- 歌词（页面常驻面板；加载/渲染/同步）----
  function renderLyrics() {
    const inner = qs('[data-mp-lyrics-inner]');
    if (!inner) return;
    if (st.lyLines === undefined) {
      inner.innerHTML = '<p class="mp-ly-empty">歌词加载中…</p>';
      return;
    }
    if (!st.lyLines) {
      const isInst = insts()[st.index] === '1';
      inner.innerHTML = isInst
        ? '<p class="mp-ly-empty">♪ 这是一首纯音乐 · 请尽情欣赏</p>'
        : '<p class="mp-ly-empty">暂无歌词</p>';
      return;
    }
    inner.innerHTML = st.lyLines
      .map((l) => `<p class="mp-ly-line">${l.text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`)
      .join('');
    syncLyrics(true);
  }
  function ensureLyrics() {
    if (st.lyFor === st.index) {
      renderLyrics();
      return;
    }
    const reqIdx = st.index;
    st.lyLines = undefined;
    renderLyrics();
    loadLyrics(ids()[reqIdx]).then((data) => {
      if (st.index !== reqIdx) return; // 加载期间已切歌
      st.lyFor = reqIdx;
      st.lyLines = data && data.lines ? data.lines : null;
      st.lyPtr = 0;
      renderLyrics();
    });
  }
  function syncLyrics(force) {
    if (!st.lyLines || !st.lyLines.length) return;
    const inner = qs('[data-mp-lyrics-inner]');
    if (!inner) return;
    const t = audio.currentTime || 0;
    let p = st.lyPtr;
    if (p < st.lyLines.length && t + 0.2 < st.lyLines[p].t) p = 0; // 拖动回退
    while (p + 1 < st.lyLines.length && st.lyLines[p + 1].t <= t) p++;
    st.lyPtr = p;
    const nodes = inner.querySelectorAll('.mp-ly-line');
    nodes.forEach((n, i) => n.classList.toggle('on', i === p));
    const cur = nodes[p];
    if (cur && (force || !audio.paused)) {
      const top = cur.offsetTop - inner.clientHeight / 2 + cur.offsetHeight / 2;
      inner.scrollTop = top;
    }
  }

  // ---- 静态参数区（标题/作者/专辑/封面/格式/大小/时长/来源/文件名）----
  // load() 与 boot 尾（共享单例按 src 对齐 index 后）都会刷
  function paintStatics() {
    const setP = (k, v) => {
      const el = qs(k);
      if (el) el.textContent = v;
    };
    setP('[data-mp-title]', titles()[st.index] || '未命名曲目');
    setP('[data-mp-artist]', artists()[st.index] || '未知作者');
    setP('[data-mp-album]', albums()[st.index] || '');
    const label = qs('[data-mp-label]');
    const cov = covers()[st.index];
    if (label) label.style.backgroundImage = cov ? `url("${cov}")` : 'none';
    setP('[data-mp-fmt]', 'MP3 · 320 kbps CBR');
    setP('[data-mp-size]', sizes()[st.index] ? sizes()[st.index] + ' MB' : '--');
    setP('[data-mp-length]', durs()[st.index] ? fmt(Number(durs()[st.index])) : '--:--');
    setP('[data-mp-origin]', origins()[st.index] || '--');
    setP('[data-mp-file]', (srcs()[st.index] || '').split('/').pop() || '--');
  }

  // ---- 装载曲目 ----
  function load(i, autoplay) {
    const n = srcs().length;
    if (!n) return;
    st.index = ((i % n) + n) % n;
    audio.src = srcs()[st.index];
    paintStatics();
    // 歌词
    st.lyFor = -1;
    st.lyLines = undefined;
    st.lyPtr = 0;
    ensureLyrics();
    try {
      sessionStorage.setItem('cw-mp-idx', String(st.index));
    } catch (e) {
      /* ignore */
    }
    paint();
    if (autoplay) {
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  }

  // ---- 共享单例对齐：audio.src 可能已由侧栏装载（首页→/music/ 软导航）----
  // 侧栏切歌只更新它自己的 st.index 与 audio.src；页面 boot 必须按 src
  // 对齐自己的 st.index，否则曲目表高亮/曲名/进度会停在旧曲目上。
  if (audio.src) {
    const cur = decodeURIComponent((audio.currentSrc || audio.src || '').split('/').pop() || '');
    const found = srcs().findIndex((s) => decodeURIComponent(s.split('/').pop() || '') === cur);
    if (found >= 0) st.index = found;
  }

  // ---- 首次进入：恢复上次曲目/进度/音量/循环（不自动播放）----
  // audio.src 已有曲目（侧栏带过来）时跳过曲目恢复：index 已按 src 对齐、
  // 位置就是实况；音量/循环偏好始终恢复。
  if (!st.restored) {
    st.restored = true;
    try {
      // ⚠️ Number(null) === 0：键不存在会被误读成「音量 0」（静音），
      // 必须先判 null 再转数字（§67 截图实测踩坑）。
      const rawVol = localStorage.getItem('cw-mp-vol');
      const v = rawVol == null ? NaN : Number(rawVol);
      if (!isNaN(v) && v >= 0 && v <= 1) st.vol = v;
      const l = localStorage.getItem('cw-mp-loop');
      if (l && LOOP_LABEL[l]) st.loop = l;
    } catch (e) {
      /* ignore */
    }
    const volInput = qs('[data-mp-vol]');
    if (volInput) volInput.value = String(Math.round(st.vol * 100));
    // 音量是共享音频的全局属性：恢复时真正应用到元素（原先只改 st.vol，
    // 实际音量要等用户动滑杆才生效 —— §67.9 顺手修正）
    if (!isNaN(st.vol)) audio.volume = st.vol;
    if (!audio.src) {
      let idx = 0;
      let at = 0;
      try {
        idx = Number(sessionStorage.getItem('cw-mp-idx') || '0') || 0;
        at = Number(sessionStorage.getItem('cw-mp-at') || '0') || 0;
      } catch (e) {
        /* ignore */
      }
      st.index = idx;
      if (mpRoot) mpRoot.dataset.mpResume = String(at);
      load(idx, false);
    }
  }

  // ---- 悬停视差：rAF 插值 tilt + 高光跟随（减少动态时完全关闭）----
  const wrap = qs('[data-mp-discwrap]');
  if (wrap && !reduced) {
    let cx = 0, cy = 0, tx = 0, ty = 0, rafOn = false;
    const tick = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      wrap.style.transform = `perspective(900px) rotateX(${(-cy * 10).toFixed(2)}deg) rotateY(${(cx * 12).toFixed(2)}deg)`;
      if (mpRoot) {
        mpRoot.style.setProperty('--shx', `${(50 + cx * 34).toFixed(1)}%`);
        mpRoot.style.setProperty('--shy', `${(50 + cy * 34).toFixed(1)}%`);
      }
      if (Math.abs(tx - cx) > 0.0008 || Math.abs(ty - cy) > 0.0008) {
        requestAnimationFrame(tick);
      } else {
        rafOn = false;
      }
    };
    const kick = () => {
      if (!rafOn) {
        rafOn = true;
        requestAnimationFrame(tick);
      }
    };
    wrap.addEventListener('pointermove', (ev) => {
      const r = wrap.getBoundingClientRect();
      tx = Math.min(1, Math.max(-1, ((ev.clientX - r.left) / r.width) * 2 - 1));
      ty = Math.min(1, Math.max(-1, ((ev.clientY - r.top) / r.height) * 2 - 1));
      kick();
    });
    wrap.addEventListener('pointerleave', () => {
      tx = 0;
      ty = 0;
      kick();
    });
  }
  // 软导航回来：新 DOM 全量重刷一遍 + 歌词重渲染
  // （ensureLyrics：index 与已加载歌词一致就直接渲染，不一致（共享单例对齐
  //  了新曲目）就自动加载，加载完成有 index 守卫，安全）
  paintStatics(); // index 可能已按 audio.src 对齐：静态参数区跟着新曲目刷
  paint();
  ensureLyrics();

  if (st.wired) return;
  st.wired = true;

  // ---- 事件（document 委托，软导航后依然有效）----
  document.addEventListener('click', (ev) => {
    const el = ev.target instanceof Element ? ev.target : null;
    if (!el) return;
    const inPage = el.closest('[data-music-page]');
    if (!inPage) return;

    if (el.closest('[data-mp-toggle]')) {
      if (audio.paused) {
        if (!audio.src) load(st.index, true);
        else {
          const p = audio.play();
          if (p && typeof p.catch === 'function')
            p.catch(() => {
              paint(); // 自动播放被拦截：按当前真实状态重刷（保持「待播放」而非 loading）
            });
        }
      } else audio.pause();
      return;
    }
    if (el.closest('[data-mp-prev]')) return load(st.index - 1, true);
    if (el.closest('[data-mp-next]')) return load(st.index + 1, true);
    if (el.closest('[data-mp-loop]')) {
      st.loop = st.loop === 'list' ? 'one' : st.loop === 'one' ? 'shuffle' : 'list';
      try {
        localStorage.setItem('cw-mp-loop', st.loop);
      } catch (e) {
        /* ignore */
      }
      return paint();
    }
    const item = el.closest('[data-mp-item]');
    if (item) {
      const i = Number(item.dataset.mpItem || '0');
      if (i === st.index && !audio.paused) {
        audio.pause();
      } else if (i === st.index && audio.paused) {
        const p = audio.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        load(i, true);
      }
      return;
    }
    const bar = el.closest('[data-mp-bar]');
    if (bar && isFinite(audio.duration) && audio.duration > 0) {
      const r = bar.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      audio.currentTime = ratio * audio.duration;
      paint();
      syncLyrics(true);
    }
  });

  // 音量滑杆（input 事件）
  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (!(el instanceof Element) || !el.matches('[data-mp-vol]')) return;
    const v = Math.min(100, Math.max(0, Number(el.value || '100')));
    st.vol = v / 100;
    audio.volume = st.vol;
    try {
      localStorage.setItem('cw-mp-vol', String(st.vol));
    } catch (e) {
      /* ignore */
    }
    paint();
  });

  // 进度条键盘 ←/→（与侧栏一致：各 5 秒）
  document.addEventListener('keydown', (ev) => {
    const bar = ev.target instanceof Element ? ev.target.closest('[data-mp-bar]') : null;
    if (!bar) return;
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    ev.preventDefault();
    if (!isFinite(audio.duration)) return;
    audio.currentTime = Math.min(
      audio.duration,
      Math.max(0, audio.currentTime + (ev.key === 'ArrowRight' ? 5 : -5)),
    );
    paint();
  });
}

/* ---------- 全站搜索：悬浮窗 ----------
   搜索从"独立页面"改成悬浮窗（<dialog>），触发点：顶栏搜索按钮、移动端抽屉、
   侧栏导航树里的「搜索」、以及 ⌘/Ctrl+K。
   Pagefind 的 JS 与 CSS 都在**首次打开时**才加载（原先搜索页会在进入时就拉），
   之后复用。状态放 window 单例、监听走 document 委托，软导航后照常可用。 */
function searchModal() {
  if (!document.querySelector('[data-search-modal]')) return;
  const st = window.__cwSearch || (window.__cwSearch = { wired: false, mounted: false });

  // 脚本只拉一次；但 UI 实例要按"当前弹窗节点"判断是否需要挂载
  // （软导航会换掉弹窗 DOM，旧实例随之消失，必须在新节点上重建）。
  const ensurePagefind = () => {
    return new Promise((resolve) => {
      // CSS 只在首次打开时插入
      if (!document.getElementById('pagefind-ui-css')) {
        const link = document.createElement('link');
        link.id = 'pagefind-ui-css';
        link.rel = 'stylesheet';
        link.href = '/pagefind/pagefind-ui.css';
        document.head.appendChild(link);
      }
      const mount = () => {
        const PF = window.PagefindUI;
        const host = document.querySelector('[data-search-modal]');
        const target = host ? host.querySelector('[data-search-target]') : null;
        if (typeof PF !== 'function' || !target) return false;
        if (target.querySelector('.pagefind-ui')) return true; // 这个节点已经挂过了
        st.mounted = true;
        new PF({
          element: target,
          showSubResults: true,
          showImages: false,
          translations: {
            placeholder: '搜索博客、图集与页面…',
            clear_search: '清空',
            load_more: '加载更多结果',
            search_label: '站内搜索',
            filters_label: '筛选',
            zero_results: '没有找到与「[SEARCH_TERM]」相关的内容',
            many_results: '找到 [COUNT] 条与「[SEARCH_TERM]」相关的内容',
            one_result: '找到 1 条与「[SEARCH_TERM]」相关的内容',
            alt_search: '未找到「[SEARCH_TERM]」，改为显示「[DIFFERENT_TERM]」的结果',
            search_suggestion: '没有结果，试试以下关键词：',
            searching: '搜索「[SEARCH_TERM]」…',
          },
        });
        return true;
      };
      if (window.PagefindUI) return resolve(mount());
      let s = document.getElementById('pagefind-ui-js');
      if (!s) {
        s = document.createElement('script');
        s.id = 'pagefind-ui-js';
        s.src = '/pagefind/pagefind-ui.js';
        s.defer = true;
        s.addEventListener('load', () => resolve(mount()));
        s.addEventListener('error', () => resolve(false));
        document.head.appendChild(s);
      } else {
        s.addEventListener('load', () => resolve(mount()), { once: true });
        // 已加载但还没初始化的情况
        window.setTimeout(() => resolve(mount()), 100);
      }
    });
  };

  const open = () => {
    // ⚠️ 每次都重新取：软导航会换掉整棵 body，之前缓存的引用会变成
    // "不在文档里"的旧节点，对它调 showModal() 会抛
    // `InvalidStateError: The element is not in a Document`（实测踩到）。
    const el = document.querySelector('[data-search-modal]');
    if (!el || el.open) return;
    st.el = el;
    // 保留当前滚动位置：dialog 滚动锁会改 body，关闭后要还原
    st.scrollY = window.scrollY;
    if (typeof el.showModal === 'function') el.showModal();
    else el.setAttribute('open', '');
    document.documentElement.classList.add('search-open');
    ensurePagefind().then(() => {
      // 聚焦输入框（Pagefind 挂载是异步的，轮询等它就绪再聚焦）
      let tries = 0;
      const focus = () => {
        const input = document.querySelector('[data-search-modal] .pagefind-ui__search-input');
        if (input) { input.focus(); return; }
        if (tries++ < 25) window.setTimeout(focus, 60);
      };
      focus();
    });
  };

  const close = () => {
    const el = st.el || document.querySelector('[data-search-modal]');
    if (!el) return;
    if (typeof el.close === 'function' && el.open) el.close();
    else el.removeAttribute('open');
    document.documentElement.classList.remove('search-open');
    if (typeof st.scrollY === 'number') window.scrollTo(0, st.scrollY);
  };

  window.__cwSearchOpen = open;
  if (st.wired) return;
  st.wired = true;

  // 触发点（委托：软导航换掉 Header/侧栏后依然有效）
  document.addEventListener('click', (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    if (t.closest('[data-search-close]')) { ev.preventDefault(); close(); return; }
    const trigger = t.closest('[data-search-open]');
    if (trigger) { ev.preventDefault(); open(); return; }
    // 点面板外的遮罩区域关闭（<dialog> 自身就是遮罩层）
    if (t.matches('[data-search-modal]')) close();
  });

  // close / cancel 也用委托，并对比"当前"的弹窗节点
  // （软导航会换掉 <dialog>，不能跟旧引用比较，否则状态类清不掉）
  const onDialogStateChange = (ev) => {
    const cur = document.querySelector('[data-search-modal]');
    if (!cur || ev.target !== cur) return;
    document.documentElement.classList.remove('search-open');
    if (ev.type === 'close' && typeof st.scrollY === 'number') window.scrollTo(0, st.scrollY);
  };
  document.addEventListener('close', onDialogStateChange, true);
  document.addEventListener('cancel', onDialogStateChange, true);

  // ⌘/Ctrl + K
  document.addEventListener('keydown', (ev) => {
    if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'k' || ev.key === 'K')) {
      ev.preventDefault();
      const cur = document.querySelector('[data-search-modal]');
      if (cur && cur.open) close(); else open();
    }
  });
}

// 首次加载与每次导航后都执行（函数内部有守卫，可安全重复调用）
document.addEventListener('astro:page-load', boot);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
