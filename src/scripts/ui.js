// 交互增强：
//   滚动显现 / 数字滚动 / 全局阅读进度 / 封面灯箱 /
//   鼠标光斑 + 背景视差（磨砂玻璃氛围）/ 尊重 prefers-reduced-motion
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 状态（事件只挂载一次，DOM 每次导航后重扫） ---------- */
let scrollBound = false;
let ambienceOn = false;
let progressEl = null;
let lightboxState = null;

/* ---------- 主题切换（仅 白日 / 夜间 两态，全局委托，切页刷新后仍生效） ---------- */
let themeBound = false;
let themeMediaBound = false;
const THEME_KEY = 'cw-theme';      // 旧键：已解析的主题（兼容历史会话）
const PREF_KEY = 'cw-theme-pref';  // 偏好：light | dark（旧值 auto 按系统解析，点按后固定为二态）

function setCookie(key, val) {
  try {
    document.cookie = `${key}=${encodeURIComponent(val)}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) { /* ignore */ }
}
function getCookie(key) {
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  } catch (e) { return null; }
}

function storeGet(key) {
  try { const v = localStorage.getItem(key); if (v) return v; } catch (e) { /* ignore */ }
  try { const v = sessionStorage.getItem(key); if (v) return v; } catch (e) { /* ignore */ }
  return getCookie(key);
}
function storeSet(key, val) {
  try { localStorage.setItem(key, val); } catch (e) { /* ignore */ }
  try { sessionStorage.setItem(key, val); } catch (e) { /* ignore */ }
  setCookie(key, val);
}

// 偏好：仅 light/dark；旧 auto/旧键按系统解析一次（不进入存储循环）
function readPref() {
  const p = storeGet(PREF_KEY);
  if (p === 'light' || p === 'dark') return p;
  const old = storeGet(THEME_KEY);
  if (old === 'light' || old === 'dark') { storeSet(PREF_KEY, old); return old; }
  return null; // 无偏好 → 跟随系统
}

function systemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyPref(mode) {
  const root = document.documentElement;
  const resolved = mode === 'dark' || (mode !== 'light' && systemDark()) ? 'dark' : 'light';
  root.dataset.theme = resolved;
  root.dataset.themePref = resolved; // 二态：始终落盘 light/dark
  storeSet(PREF_KEY, resolved);
  storeSet(THEME_KEY, resolved); // 保留旧键兼容
}

// 无固定偏好时的“跟随系统”：只刷新 dataset，不落盘，用户点按后才固定二态
function applySystem() {
  const root = document.documentElement;
  root.dataset.theme = systemDark() ? 'dark' : 'light';
}

function syncThemeButtons() {
  const root = document.documentElement;
  const dark = root.dataset.theme === 'dark';
  document.querySelectorAll('.theme-toggle').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(dark));
    btn.title = '白日 / 夜间';
    btn.setAttribute('aria-label', dark ? '当前为夜间模式，点击切换到白日模式' : '当前为白日模式，点击切换到夜间模式');
  });
}

function initThemeToggle() {
  if (!themeBound) {
    themeBound = true;
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-toggle');
      if (!btn) return;
      // 只在 白日 / 夜间 之间切换（去掉“跟随系统”）
      const darkNow = document.documentElement.dataset.theme === 'dark';
      applyPref(darkNow ? 'light' : 'dark');
      syncThemeButtons();
    });
  }
  if (!themeMediaBound) {
    themeMediaBound = true;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    // 无固定偏好时才跟随系统变化（用户点过按钮后即固定）
    const onChange = () => {
      if (!readPref()) { applySystem(); syncThemeButtons(); }
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }
  syncThemeButtons();
}

/* ---------- 主题全局重放（修复：ClientRouter 软切换后仅当前页生效） ----------
   每次页内导航完成（astro:page-load）都按持久化偏好重新设置 <html data-theme>，
   保证切到任意子页主题一致；只注册一次，避免模块多次执行造成重复监听。 */
function bindThemeReplay() {
  if (window.__cwThemeReplayBound) return;
  window.__cwThemeReplayBound = true;
  document.addEventListener('astro:page-load', () => {
    const p = readPref();
    if (p) applyPref(p);
    else applySystem();
    syncThemeButtons();
  });
}
bindThemeReplay();

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
    scrollFade,
    scanReveals,
    runCounters,
    bindProgressBar,
    bindLightbox,
    initAmbience,
    startElegantTrails, // 优雅星轨：浅色玻璃下克制的细轨迹
    startTitleTilt,     // 首页大标题 3D 光标跟随
    initThemeToggle,    // 夜晚/白天切换（切页后仍可用）
    typedEffects,       // 打字机（TextType 移植）
    startDriftWall,     // 影集页漂移墙背景
  ].forEach((fn) => {
    try {
      fn();
    } catch (err) {
      if (window.console && console.warn) console.warn('ui:', err);
    }
  });
}

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
          if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
  });
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
          if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
  });
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

// 首次加载与每次导航后都执行（函数内部有守卫，可安全重复调用）
document.addEventListener('astro:page-load', boot);
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
