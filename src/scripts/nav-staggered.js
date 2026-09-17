// ============================================================
// ReactBits 风格侧边菜单（StaggeredMenu）+ 顶部指示线
//
// 参数照 ReactBits 原实现（reactbits.dev / DavidHDev/react-bits 的 StaggeredMenu）：
//   · 预层滑入：xPercent offscreen→0，每层延迟 0.07s，duration 0.5，power4.out
//   · 面板滑入：xPercent offscreen→0，power4.out
//   · 菜单项入场：yPercent 140→0 + rotate 10→0 + opacity 0→1
//                 duration 1，stagger each 0.1 from 'start'，power4.out
//   · 社交链接：delay 0.35，duration 0.6，power2.out，stagger each 0.08
//   · 开关图标：整体 rotate 0→225，duration 0.8，power4.out（关闭时 0.35 power3.inOut）
//   · 关闭：面板 xPercent→offscreen，duration 0.5，power3.in；菜单项 yPercent→-140 /
//           rotate→-10，duration 0.32，power3.in
//
// 只动画 transform 与 opacity（GPU 友好）。
// prefers-reduced-motion：不播放，直接切换终态。
//
// 结构约定（见 Header.astro）：
//   [data-sm-toggle] 开关按钮，[data-sm-icon] 旋转容器
//   [data-sm-prelayers] > .sm-prelayer ×2（依次滑入）
//   [data-sm-panel] 主面板，内含 .sm-panel-itemLabel（入场作用对象）与 .sm-socials-link
// ============================================================
import gsap from 'gsap';

const OPEN_ATTR = 'data-sm-open';

function ready(fn) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
  else fn();
}

function initStaggeredMenu() {
  const header = document.querySelector('[data-nav]');
  const panel = document.querySelector('[data-sm-panel]');
  const prelayersWrap = document.querySelector('[data-sm-prelayers]');
  const toggle = document.querySelector('[data-sm-toggle]');
  const icon = document.querySelector('[data-sm-icon]');
  if (!header || !panel || !toggle || !icon) return;

  const st = (window.__cwSM ||= { open: false, wired: false, tl: null, reduced: false });
  const prelays = prelayersWrap ? Array.from(prelayersWrap.querySelectorAll('.sm-prelayer')) : [];
  const items = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
  const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));
  const socialTitle = panel.querySelector('.sm-socials-title');
  const textInner = document.querySelector('[data-sm-text]');
  const plusH = document.querySelector('[data-sm-plus-h]');
  const plusV = document.querySelector('[data-sm-plus-v]');

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 初始态（只设置一次；软导航后元素是同一个，用 wired 守卫避免重复 set）──
  if (!st.wired) {
    st.wired = true;
    const off = 100; // position='right' → 从右侧滑入
    gsap.set([panel, ...prelays], { xPercent: off, opacity: 1 });
    if (prelayersWrap) gsap.set(prelayersWrap, { xPercent: 0, opacity: 1 });
    gsap.set(items, { yPercent: 140, rotate: 10, opacity: 0 });
    gsap.set(socialLinks, { opacity: 0, yPercent: 40 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (plusH) gsap.set(plusH, { transformOrigin: '50% 50%', rotate: 0 });
    if (plusV) gsap.set(plusV, { transformOrigin: '50% 50%', rotate: 90 });
    gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
    if (textInner) gsap.set(textInner, { yPercent: 0 });
    panel.setAttribute('aria-hidden', 'true');
    if (prelayersWrap) prelayersWrap.style.pointerEvents = 'none';
  }

  const killTl = () => { if (st.tl) { st.tl.kill(); st.tl = null; } };

  // ── 打开 ──
  const openMenu = () => {
    if (st.open) return;
    st.open = true;
    killTl();
    header.classList.add('menu-open');
    document.documentElement.setAttribute(OPEN_ATTR, '1');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', '关闭菜单');
    panel.setAttribute('aria-hidden', 'false');

    // 减少动态：直接到终态，不做时间线
    if (reduced()) {
      gsap.set([panel, ...prelays], { xPercent: 0 });
      gsap.set(items, { yPercent: 0, rotate: 0, opacity: 1 });
      gsap.set([...socialLinks, socialTitle].filter(Boolean), { opacity: 1, yPercent: 0 });
      gsap.set(panel, { '--sm-num-opacity': 0.85 });
      gsap.set(icon, { rotate: 225 });
      if (textInner) gsap.set(textInner, { yPercent: -100 });
      return;
    }

    st.tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    // 预层依次滑入（每层延迟 0.07s）—— 关键：i * 0.07
    prelays.forEach((el, i) => {
      st.tl.fromTo(el, { xPercent: 100 }, { xPercent: 0, duration: 0.5 }, i * 0.07);
    });
    // 主面板（跟着最后一层之后稍晚一点）
    st.tl.to(panel, { xPercent: 0, duration: 0.5 }, prelays.length * 0.07 + 0.06);
    // 菜单项：旋转 + 上移，彼此间隔 0.1s
    st.tl.to(
      items,
      { yPercent: 0, rotate: 0, opacity: 1, duration: 1, stagger: { each: 0.1, from: 'start' } },
      '>-0.2',
    );
    // 编号淡入
    st.tl.to(panel, { '--sm-num-opacity': 0.85, duration: 0.4 }, '<0.25');
    // 社交链接最后淡入
    st.tl.to(
      [...socialLinks, socialTitle].filter(Boolean),
      { opacity: 1, yPercent: 0, duration: 0.6, ease: 'power2.out', stagger: { each: 0.08, from: 'start' } },
      '>-0.3',
    );
    // 图标旋转成叉号 + 文案上滚
    st.tl.to(icon, { rotate: 225, duration: 0.8, ease: 'power4.out' }, 0.05);
    if (textInner) st.tl.to(textInner, { yPercent: -100, duration: 0.3, ease: 'power2.out' }, 0.1);
  };

  // ── 关闭 ──
  const closeMenu = () => {
    if (!st.open) return;
    st.open = false;
    killTl();
    header.classList.remove('menu-open');
    document.documentElement.removeAttribute(OPEN_ATTR);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', '打开菜单');
    panel.setAttribute('aria-hidden', 'true');

    if (reduced()) {
      gsap.set([panel, ...prelays], { xPercent: 100 });
      gsap.set(items, { yPercent: 140, rotate: 10, opacity: 0 });
      gsap.set([...socialLinks, socialTitle].filter(Boolean), { opacity: 0, yPercent: 40 });
      gsap.set(panel, { '--sm-num-opacity': 0 });
      gsap.set(icon, { rotate: 0 });
      if (textInner) gsap.set(textInner, { yPercent: 0 });
      return;
    }

    st.tl = gsap.timeline({ defaults: { ease: 'power3.in' } });
    // 菜单项先退场（旋转 + 上移出画）
    st.tl.to(items, { yPercent: -140, rotate: -10, opacity: 0, duration: 0.32, stagger: { each: 0.04 } }, 0);
    st.tl.to([...socialLinks, socialTitle].filter(Boolean), { opacity: 0, duration: 0.2 }, 0);
    st.tl.to(panel, { '--sm-num-opacity': 0, duration: 0.2 }, 0);
    // 面板与预层滑出（power3.in）
    st.tl.to(panel, { xPercent: 100, duration: 0.5, ease: 'power3.in' }, 0.18);
    prelays.forEach((el, i) => {
      st.tl.to(el, { xPercent: 100, duration: 0.5, ease: 'power3.in' }, 0.22 + i * 0.06);
    });
    // 图标转回加号 + 文案滚回
    st.tl.to(icon, { rotate: 0, duration: 0.35, ease: 'power3.inOut' }, 0);
    if (textInner) st.tl.to(textInner, { yPercent: 0, duration: 0.3, ease: 'power2.out' }, 0);
  };

  const toggleMenu = () => (st.open ? closeMenu() : openMenu());

  // ── 事件（全局单次绑定 + document 委托：软导航后依然生效）──
  if (!st.bound) {
    st.bound = true;
    document.addEventListener('click', (ev) => {
      const t = ev.target instanceof Element ? ev.target : null;
      if (!t) return;
      if (t.closest('[data-sm-toggle]')) { ev.preventDefault(); toggleMenu(); return; }
      // 面板内点链接 → 关闭（软导航由 ClientRouter 接管）
      if (t.closest('[data-sm-panel] a')) { closeMenu(); return; }
      // 点面板外 → 关闭（ReactBits 的 closeOnClickAway）
      if (st.open && !t.closest('[data-sm-panel]') && !t.closest('.sm-prelayers')) closeMenu();
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && st.open) { ev.preventDefault(); closeMenu(); }
    });
    // 软导航后收起（新页面不该带着上一页的面板）
    document.addEventListener('astro:page-load', () => closeMenu());
    // 视口变宽到桌面时也收起，避免面板残留
    const mq = window.matchMedia('(min-width: 1024px)');
    if (mq.addEventListener) mq.addEventListener('change', () => closeMenu());
  }
  window.__cwSMToggle = toggleMenu;
  window.__cwSMClose = closeMenu;
}

/* ---------- 顶部指示线：悬停跟随 + 当前页激活 ----------
   ReactBits 主站导航的两条线：一条跟着鼠标在菜单项之间滑动，一条停在当前路由下方。
   只动 transform（x）与 width / opacity。 */
function initNavIndicators() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const st = (window.__cwNavInd ||= { wired: false, active: null, hover: null });

  // 两条线各插一次（软导航换掉 nav 后，旧线随 DOM 一起没了，这里按需重建）
  let hover = nav.querySelector('.nav-ind--hover');
  let active = nav.querySelector('.nav-ind--active');
  if (!hover) {
    hover = document.createElement('span');
    hover.className = 'nav-ind nav-ind--hover';
    hover.setAttribute('aria-hidden', 'true');
    nav.appendChild(hover);
  }
  if (!active) {
    active = document.createElement('span');
    active.className = 'nav-ind nav-ind--active';
    active.setAttribute('aria-hidden', 'true');
    nav.appendChild(active);
  }
  st.hover = hover;
  st.active = active;

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const links = () => Array.from(nav.querySelectorAll('a'));

  // 把线移到某个链接下方（相对 nav 的坐标）
  const moveTo = (el, line, { animate = true, gutter = 0 } = {}) => {
    if (!el) return;
    const nb = nav.getBoundingClientRect();
    const lb = el.getBoundingClientRect();
    const x = lb.left - nb.left + gutter;
    const w = Math.max(0, lb.width - gutter * 2);
    const vars = { x, width: w, opacity: 1 };
    if (animate && !reduced()) gsap.to(line, { ...vars, duration: 0.5, ease: 'power4.out', overwrite: 'auto' });
    else gsap.set(line, vars);
  };

  const syncActive = (animate) => {
    const cur = nav.querySelector("a[aria-current='page']");
    if (cur) moveTo(cur, active, { animate, gutter: 6 });
    else gsap.set(active, { opacity: 0 });
  };

  if (!st.wired) {
    st.wired = true;
    // 悬停线初始隐藏（否则会一直亮在左上角）
    gsap.set(hover, { opacity: 0, width: 0, x: 0 });
    // 悬停跟随（pointer: fine 才有意义）
    nav.addEventListener('pointerover', (ev) => {
      const a = ev.target instanceof Element ? ev.target.closest('a') : null;
      if (!a || !nav.contains(a)) return;
      moveTo(a, hover, { animate: true, gutter: 6 });
    });
    // 鼠标移出整个 nav（而不是移出单个链接）
    nav.addEventListener('pointerleave', () => {
      if (!reduced()) gsap.to(hover, { opacity: 0, duration: 0.25, ease: 'power2.out' });
      else gsap.set(hover, { opacity: 0 });
    });
    // 视口变化时重新定位激活线（不播放动画）
    window.addEventListener('resize', () => syncActive(false), { passive: true });
    document.addEventListener('astro:page-load', () => syncActive(true));
  }
  // 首次定位：等字体/布局稳定
  // （注意：软导航可能换掉整个 nav，届时上面的 wired 分支会重建两条线，这里重新设置初始态）
  gsap.set(hover, { opacity: 0, width: 0, x: 0 });
  requestAnimationFrame(() => syncActive(false));
}

function boot() {
  initStaggeredMenu();
  initNavIndicators();
}
ready(boot);
document.addEventListener('astro:page-load', boot);
