// ============================================================
// 导航交互（照 ReactBits 的 navbar + shrink-effect）
//
//   1) 滚缩：滚动时导航"贴顶通栏 → 下沉 16px 收成胶囊"
//      由 ui.js 的 setMaterial() 切 html[data-scrolled]，形态过渡全在 CSS（0.4s）。
//   2) 移动端：StaggeredMenu 抽屉（右侧滑入 + 前导层错峰 + 条目错峰，gsap 驱动）。
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

/* ---------- 移动端 StaggeredMenu 抽屉（2026-09-23，移植自 React Bits 同名组件）----------
   形态：右侧全高滑入 + 2 层强调色前导层错峰跟进 + 条目 yPercent 错峰入场 +
   序号淡入 + 加号图标旋转 225° + 「菜单/关闭」文字竖向滚动。
   架构不变：document 委托 + window 单例（软导航重建 Header 后依然有效）；
   契约不变：data-mnav-toggle / [data-mnav-panel] hidden / is-open / mnav-open。
   prefers-reduced-motion：所有时长归零（状态瞬间到位，不播动画）。 */
function initMobileNav() {
  const st = (window.__cwMNav ||= { wired: false, open: false });
  if (st.wired) return;
  st.wired = true;

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D = () => (reduced() ? 0 : 1); // 时长倍率：reduce → 0（瞬间到位）

  const els = () => ({
    panel: document.querySelector('[data-mnav-panel]'),
    header: document.querySelector('[data-nav]'),
    toggle: document.querySelector('[data-mnav-toggle]'),
  });
  const parts = (panel) => ({
    inner: panel.querySelector('.sm-panel'),
    layers: Array.from(panel.querySelectorAll('.sm-prelayer')),
    labels: Array.from(panel.querySelectorAll('.sm-label')),
    links: Array.from(panel.querySelectorAll('.sm-link')),
    subs: Array.from(panel.querySelectorAll('.sm-sub')),
  });

  /* 关闭态初值：与 CSS 的 SSR 初始态一致（屏外 / 标签压下 / 序号透明）。
     ⚠️ 必须显式 x:0 —— CSS 里的 translateX(100%) 会被 gsap 解析成独立 x 分量
     与 xPercent 叠加（起点变 200%、终态卡在 100%），2026-09-23 实测。 */
  const applyClosed = (panel) => {
    if (!panel) return;
    const p = parts(panel);
    gsap.set([p.inner, ...p.layers], { x: 0, xPercent: 100 });
    gsap.set(p.labels, { yPercent: 140, rotate: 10 });
    gsap.set(p.links, { '--sm-num': 0 });
    panel.hidden = true;
  };
  const killTweens = () => {
    openTlRef?.kill(); openTlRef = null;
    closeTweenRef?.kill(); closeTweenRef = null;
    textTweenRef?.kill(); textTweenRef = null;
    iconTweenRef?.kill(); iconTweenRef = null;
  };

  let openTlRef = null, closeTweenRef = null, textTweenRef = null, iconTweenRef = null;

  /* 开关的图标 + 文字动画（打开/关闭共用） */
  const animateIcon = (opening) => {
    const icon = els().toggle?.querySelector('.sm-icon');
    if (!icon) return;
    iconTweenRef?.kill();
    iconTweenRef = opening
      ? gsap.to(icon, { rotate: 225, duration: 0.8 * D(), ease: 'power4.out', overwrite: 'auto' })
      : gsap.to(icon, { rotate: 0, duration: 0.35 * D(), ease: 'power3.inOut', overwrite: 'auto' });
  };
  const animateText = (opening) => {
    const inner = els().toggle?.querySelector('[data-mnav-text]');
    if (!inner) return;
    const cur = opening ? '菜单' : '关闭';
    const target = opening ? '关闭' : '菜单';
    const seq = [cur];
    for (let i = 0; i < 3; i++) seq.push(seq[seq.length - 1] === '菜单' ? '关闭' : '菜单');
    if (seq[seq.length - 1] !== target) seq.push(target);
    inner.innerHTML = seq.map((l) => `<span>${l}</span>`).join('');
    textTweenRef?.kill();
    gsap.set(inner, { yPercent: 0 });
    textTweenRef = gsap.to(inner, {
      yPercent: -((seq.length - 1) / seq.length) * 100,
      duration: (0.5 + seq.length * 0.07) * D(),
      ease: 'power4.out',
    });
  };

  const open = () => {
    const { panel, header, toggle } = els();
    if (!panel) return;
    closeTweenRef?.kill(); closeTweenRef = null;
    applyClosed(panel);
    panel.hidden = false;
    panel.classList.add('is-open'); // verify 契约：开抽屉即有 is-open
    st.open = true;
    header?.classList.add('mnav-open');
    toggle?.setAttribute('aria-expanded', 'true');
    toggle?.setAttribute('aria-label', '关闭菜单');

    const p = parts(panel);
    if (reduced()) { // 瞬间到位
      gsap.set([p.inner, ...p.layers], { xPercent: 0 });
      gsap.set(p.labels, { yPercent: 0, rotate: 0 });
      gsap.set(p.links, { '--sm-num': 1 });
    } else {
      const tl = gsap.timeline();
      openTlRef = tl;
      p.layers.forEach((l, i) =>
        tl.fromTo(l, { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07));
      const at = p.layers.length * 0.07 + 0.08;
      tl.fromTo(p.inner, { xPercent: 100 }, { xPercent: 0, duration: 0.65, ease: 'power4.out' }, at);
      tl.to(p.labels, { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: 0.09 }, at + 0.1);
      tl.to(p.links, { '--sm-num': 1, duration: 0.6, ease: 'power2.out', stagger: 0.06 }, at + 0.15);
    }
    animateIcon(true);
    animateText(true);
  };

  const close = () => {
    const { panel, header, toggle } = els();
    if (!panel || !st.open) { st.open = false; return; }
    st.open = false;
    openTlRef?.kill(); openTlRef = null;
    panel.classList.remove('is-open');
    header?.classList.remove('mnav-open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', '打开菜单');

    const p = parts(panel);
    if (reduced()) {
      applyClosed(panel);
    } else {
      closeTweenRef?.kill();
      closeTweenRef = gsap.to([p.inner, ...p.layers], {
        x: 0, xPercent: 100, duration: 0.32, ease: 'power3.in', overwrite: 'auto',
        onComplete: () => applyClosed(panel),
      });
    }
    animateIcon(false);
    animateText(false);
  };
  const closeNow = () => { // 软导航换页/回桌面：不等动画，立即归位
    killTweens();
    st.open = false;
    const { panel, header, toggle } = els();
    if (panel) applyClosed(panel);
    header?.classList.remove('mnav-open');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', '打开菜单');
  };

  /* 「记录」组：点击父项只展开/收起下拉，不跳转不关抽屉。
     必须捕获阶段 + stopPropagation：抢在 ClientRouter（bubble）与本文件的
     「点抽屉链接即收起」委托之前，否则 preventDefault 拦不住 pushState 导航。 */
  document.addEventListener('click', (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    const link = t.closest('[data-mnav-panel] .sm-item.has-sub > .sm-link');
    if (!link) return;
    ev.preventDefault();
    ev.stopPropagation();
    const item = link.closest('.sm-item.has-sub');
    const on = !item.classList.contains('open');
    item.classList.toggle('open', on);
    link.setAttribute('aria-expanded', String(on));
    if (on && !reduced()) {
      const subLinks = item.querySelectorAll('.sm-sub a');
      gsap.fromTo(subLinks, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out', stagger: 0.05 });
    }
  }, true);

  document.addEventListener('click', (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    if (t.closest('[data-mnav-toggle]')) { ev.preventDefault(); st.open ? close() : open(); return; }
    // 点抽屉里的链接 → 收起（导航交给 ClientRouter）
    if (t.closest('[data-mnav-panel] a')) { close(); return; }
    // 点抽屉外 → 收起
    if (st.open && !t.closest('[data-mnav-panel]') && !t.closest('[data-nav]')) close();
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && st.open) { ev.preventDefault(); close(); }
  });
  // 视口变宽（回到桌面）或换页时收起，避免抽屉残留
  const mq = window.matchMedia('(min-width: 769px)');
  if (mq.addEventListener) mq.addEventListener('change', () => closeNow());
  document.addEventListener('astro:page-load', () => closeNow());
  closeNow();
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

/* ---------- 桌面端「记录」父项：点击只开合二级菜单，不跳转（2026-09-20 站长要求）----------
   父项 a 语义上仍是分组入口而非页面链接：click 统一 preventDefault，
   改为给 li 加/去 .open（CSS 与 hover 同款展开态）。触屏没有 hover，这条也是触屏的唯一展开途径。
   事件走 document 委托 + window 单例，软导航重建 Header 后依然有效。 */
function initSubmenuToggle() {
  const st = (window.__cwSubT ||= { wired: false });
  if (st.wired) return;
  st.wired = true;

  const items = () => Array.from(document.querySelectorAll('.nav-links li.has-sub'));
  const setOpen = (li, on) => {
    li.classList.toggle('open', on);
    li.querySelector(':scope > a')?.setAttribute('aria-expanded', String(on));
  };
  const closeAll = (except) => {
    items().forEach((li) => { if (li !== except) setOpen(li, false); });
  };

  document.addEventListener('click', (ev) => {
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    const trigger = t.closest('.nav-links li.has-sub > a');
    if (trigger) {
      // 必须捕获阶段 + stopPropagation：ClientRouter 也在 document 上监听 click
      // 接管同源链接，若让它先跑，preventDefault 拦不住它的 pushState 导航。
      ev.preventDefault(); // 点「记录」不跳任何页面，只展开/收起二级菜单
      ev.stopPropagation();
      const li = trigger.closest('li.has-sub');
      const on = !li.classList.contains('open');
      closeAll(li);
      setOpen(li, on);
      return;
    }
    // 点父项以外（含二级菜单里的真实链接）→ 收起已展开的分组
    if (!t.closest('.nav-links li.has-sub')) closeAll();
  }, true); // capture：抢在 ClientRouter 的 bubble 监听之前
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeAll();
  });
}

function boot() {
  try { initMobileNav(); } catch (e) { /* ignore */ }
  try { initNavIndicators(); } catch (e) { /* ignore */ }
  try { initSubmenuToggle(); } catch (e) { /* ignore */ }
}
ready(boot);
document.addEventListener('astro:page-load', boot);
