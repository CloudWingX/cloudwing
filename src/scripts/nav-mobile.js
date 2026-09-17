// ============================================================
// 导航交互（照 ReactBits 的 navbar + shrink-effect）
//
//   1) 滚缩：滚动时导航"贴顶通栏 → 下沉 16px 收成胶囊"
//      由 ui.js 的 setMaterial() 切 html[data-scrolled]，形态过渡全在 CSS（0.4s）。
//   2) 移动端：汉堡按钮切换顶部下拉的玻璃菜单（淡入 + 轻微下移）。
//   3) 顶部两条指示线（保留）：一条跟鼠标在菜单项间滑动，一条停在当前路由下方。
//
// 只动画 transform / opacity；prefers-reduced-motion 下不播过渡。
// 事件走 document 委托 + window 单例：软导航重建 Header 后依然有效。
// ============================================================
import gsap from 'gsap';

function ready(fn) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
  else fn();
}

/* ---------- 移动端汉堡菜单 ---------- */
function initMobileNav() {
  const st = (window.__cwMNav ||= { wired: false, open: false });
  if (st.wired) return;
  st.wired = true;

  const panel = () => document.querySelector('[data-mnav-panel]');
  const header = () => document.querySelector('[data-nav]');

  const sync = () => {
    const p = panel();
    const h = header();
    const t = document.querySelector('[data-mnav-toggle]');
    if (!p || !h || !t) return;
    p.hidden = !st.open;
    // 先移除 hidden 再加类，否则过渡不会从初始态开始
    if (st.open) requestAnimationFrame(() => p.classList.add('is-open'));
    else p.classList.remove('is-open');
    h.classList.toggle('mnav-open', st.open);
    t.setAttribute('aria-expanded', String(st.open));
    t.setAttribute('aria-label', st.open ? '关闭菜单' : '打开菜单');
  };

  const close = () => { if (st.open) { st.open = false; sync(); } };
  const toggle = () => { st.open = !st.open; sync(); };

  document.addEventListener('click', (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    if (t.closest('[data-mnav-toggle]')) { ev.preventDefault(); toggle(); return; }
    // 点菜单里的链接 → 收起（导航交给 ClientRouter）
    if (t.closest('[data-mnav-panel] a')) { close(); return; }
    // 点菜单外 → 收起
    if (st.open && !t.closest('[data-mnav-panel]') && !t.closest('[data-nav]')) close();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && st.open) { ev.preventDefault(); close(); }
  });
  // 视口变宽（回到桌面）或换页时收起，避免菜单残留
  const mq = window.matchMedia('(min-width: 769px)');
  if (mq.addEventListener) mq.addEventListener('change', () => close());
  document.addEventListener('astro:page-load', () => { st.open = false; sync(); });
  sync();
}

/* ---------- 顶部指示线：悬停跟随 + 当前页激活 ---------- */
function initNavIndicators() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const st = (window.__cwNavInd ||= { wired: false });

  const make = (cls) => {
    let el = nav.querySelector(`.${cls}`);
    if (!el) {
      el = document.createElement('span');
      el.className = `nav-ind ${cls}`;
      el.setAttribute('aria-hidden', 'true');
      nav.appendChild(el);
    }
    return el;
  };
  const hover = make('nav-ind--hover');
  const active = make('nav-ind--active');

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const moveTo = (el, line, { animate = true, gutter = 6 } = {}) => {
    if (!el) return;
    const nb = nav.getBoundingClientRect();
    const lb = el.getBoundingClientRect();
    const vars = {
      x: lb.left - nb.left + gutter,
      width: Math.max(0, lb.width - gutter * 2),
      opacity: 1,
    };
    if (animate && !reduced()) gsap.to(line, { ...vars, duration: 0.5, ease: 'power4.out', overwrite: 'auto' });
    else gsap.set(line, vars);
  };
  const syncActive = (animate) => {
    const cur = nav.querySelector("a[aria-current='page']");
    if (cur) moveTo(cur, active, { animate });
    else gsap.set(active, { opacity: 0 });
  };

  gsap.set(hover, { opacity: 0, width: 0, x: 0 });
  if (!st.wired) {
    st.wired = true;
    nav.addEventListener('pointerover', (ev) => {
      const a = ev.target instanceof Element ? ev.target.closest('a') : null;
      if (!a || !nav.contains(a)) return;
      moveTo(a, hover, { animate: true });
    });
    nav.addEventListener('pointerleave', () => {
      if (!reduced()) gsap.to(hover, { opacity: 0, duration: 0.25, ease: 'power2.out' });
      else gsap.set(hover, { opacity: 0 });
    });
    window.addEventListener('resize', () => syncActive(false), { passive: true });
    document.addEventListener('astro:page-load', () => syncActive(true));
  }
  requestAnimationFrame(() => syncActive(false));
}

function boot() {
  try { initMobileNav(); } catch (e) { /* ignore */ }
  try { initNavIndicators(); } catch (e) { /* ignore */ }
}
ready(boot);
document.addEventListener('astro:page-load', boot);
