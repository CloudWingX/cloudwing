// ============================================================
// 首页强调色预设（代码卡片底部那排色卡）
//
//   参考站（reactbits.dev 的 Nebula/Aurora/Ember/Ice）的做法是：
//   点一下只把 5 个 CSS 变量换掉（--pro-base/-dark/-light/-glow/-fg），
//   背景由 shader 自己缓动、代码高亮**不参与**过渡（实测切完就跳）。
//
//   这里多做两件事，因为需求是"颜色之间要有中间色的缓慢过渡，代码段也随之变色"：
//     1) 用 requestAnimationFrame 自己补间：强调色、代码高亮、整页色膜
//        全部按 900ms 从当前颜色插值到目标颜色 → 中途一定经过中间色；
//     2) 代码高亮也在这套补间里（参考没做）。
//
//   补间的是**颜色值**而不是 var 本身：CSS 变量默认不可动画，
//   靠 @property 注册又要逐个写类型，不如直接算 RGB 来得可控。
//
//   事件走 document 委托 + window 单例状态，软导航重建 DOM 后依然有效。
// ============================================================

/* 预设表由 index.astro 以 JSON 内联在 <script type="application/json" data-accent-presets> */
function readPresets() {
  const el = document.querySelector('script[data-accent-presets]');
  if (!el) return null;
  try {
    return JSON.parse(el.textContent || '[]');
  } catch {
    return null;
  }
}

const STORE_KEY = 'cw-accent';

/* ---------- 颜色工具 ---------- */
function parseColor(s) {
  if (!s) return null;
  const v = String(s).trim();
  let m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  m = v.match(/^#([0-9a-f]{3})$/i);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16));
  m = v.match(/rgba?\(([^)]+)\)/i);
  if (m) return m[1].split(/[,\s/]+/).slice(0, 3).map((x) => parseFloat(x));
  return null;
}
const toHex = (c) =>
  '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

/* mix(base, other, w)：以 base 为主（与 CSS color-mix 的语义一致） */
function mix(base, other, w) {
  const a = parseColor(base);
  const b = parseColor(other);
  if (!a || !b) return base;
  return [0, 1, 2].map((k) => a[k] * (1 - w) + b[k] * w);
}
const lerp = (a, b, t) => [0, 1, 2].map((k) => a[k] + (b[k] - a[k]) * t);

/* 一套预设 → 需要补间的全部颜色端点 */
const SOFT_A = 0.14; // --accent-soft 的固定 alpha（与 global.css 的取值一致）
function endpoints(p) {
  return {
    accent: p.base,
    deep: p.deep,
    soft: parseColor(p.soft) || parseColor(p.base), // soft 是 rgba 串；解析不到就退回 base 的通道
    softA: SOFT_A,
    key: mix(p.base, '#ffffff', 0.18),
    attr: mix(p.base, '#ffffff', 0.12),
    str: mix(p.base, '#7fd6a8', 0.42),
    fn: mix(p.base, '#8fb4f0', 0.28),
    comp: mix(p.base, '#ffffff', 0.58),
    num: mix(p.base, '#e8d98a', 0.38),
    tint: p.tint,
    tintA: p.tintA,
    hue: p.hue ?? 0,
    sat: p.sat ?? 1,
    /* 代码段里"会跟着换"的那两处（照参考：色值胶囊 + 每个数值都随预设变） */
    varHex: String(p.base).toUpperCase(),
    nums: p.nums || ['0.50', '0'],
  };
}

/* 把代码段里随预设变化的那两处写进 DOM */
function applyCodeVars(p) {
  document.querySelectorAll('.code-body .ln-var').forEach((el) => {
    el.textContent = String(p.base).toUpperCase();
  });
  const nums = p.nums || ['0.50', '0'];
  document.querySelectorAll('.code-body .ln-num').forEach((el, i) => {
    if (nums[i] != null) el.textContent = nums[i];
  });
}

function reduced() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initHeroTheme() {
  const st = (window.__cwAccent ||= { wired: false, key: null, raf: 0 });
  const presets = readPresets();
  if (!presets || !presets.length) return;

  const root = document.documentElement;
  const EASE = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic

  /* 一次性把某套预设写成"终态"（不补间）。首屏与 reduced-motion 走这里。 */
  const apply = (p) => {
    const e = endpoints(p);
    root.style.setProperty('--accent', e.accent);
    root.style.setProperty('--accent-deep', e.deep);
    root.style.setProperty('--accent-rgb', parseColor(e.accent).map(Math.round).join(', '));
    root.style.setProperty('--accent-soft', `rgba(${e.soft.map(Math.round).join(', ')}, ${e.softA})`);
    root.style.setProperty('--code-key', toHex(e.key));
    root.style.setProperty('--code-attr', toHex(e.attr));
    root.style.setProperty('--code-str', toHex(e.str));
    root.style.setProperty('--code-fn', toHex(e.fn));
    root.style.setProperty('--code-comp', toHex(e.comp));
    root.style.setProperty('--code-num', toHex(e.num));
    root.style.setProperty('--tint-c', e.tint);
    root.style.setProperty('--tint-a', String(e.tintA));
    root.style.setProperty('--vid-hue', `${e.hue}deg`);
    root.style.setProperty('--vid-sat', String(e.sat));
    applyCodeVars(p);
  };

  /* 从 from 预设缓动到 to 预设（经过中间色） */
  const tween = (from, to, dur = 900) => {
    if (st.raf) cancelAnimationFrame(st.raf);
    if (reduced() || !from) {
      apply(to);
      return;
    }
    const a = endpoints(from);
    const b = endpoints(to);
    const t0 = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      const k = EASE(t);
      const c = (x, y) => toHex(lerp(x, y, k));
      root.style.setProperty('--accent', c(parseColor(a.accent), parseColor(b.accent)));
      root.style.setProperty('--accent-deep', c(parseColor(a.deep), parseColor(b.deep)));
      root.style.setProperty('--accent-rgb', lerp(parseColor(a.accent), parseColor(b.accent), k).map(Math.round).join(', '));
      root.style.setProperty(
        '--accent-soft',
        `rgba(${lerp(a.soft, b.soft, k).map(Math.round).join(', ')}, ${(a.softA + (b.softA - a.softA) * k).toFixed(3)})`,
      );
      root.style.setProperty('--code-key', c(a.key, b.key));
      root.style.setProperty('--code-attr', c(a.attr, b.attr));
      root.style.setProperty('--code-str', c(a.str, b.str));
      root.style.setProperty('--code-fn', c(a.fn, b.fn));
      root.style.setProperty('--code-comp', c(a.comp, b.comp));
      root.style.setProperty('--code-num', c(a.num, b.num));
      root.style.setProperty('--tint-c', c(parseColor(a.tint), parseColor(b.tint)));
      root.style.setProperty('--tint-a', String(a.tintA + (b.tintA - a.tintA) * k));
      /* 色相旋转也一起补间：hue 是 -180~180 的环形量，直接线性插值即可
         （选的预设都在同一侧，不会绕远路），中间帧就是"路过"的颜色。 */
      root.style.setProperty('--vid-hue', `${(a.hue + (b.hue - a.hue) * k).toFixed(2)}deg`);
      root.style.setProperty('--vid-sat', String(a.sat + (b.sat - a.sat) * k));
      if (t < 1) st.raf = requestAnimationFrame(step);
      else {
        st.raf = 0;
        applyCodeVars(to); // 色块与代码里那两处"文字值"在终点对齐（色块本身是平滑变的）
      }
    };
    st.raf = requestAnimationFrame(step);
  };

  const byKey = (k) => presets.find((p) => p.key === k) || presets[0];
  const fallback = presets[0];

  /* 同步按钮的 aria-pressed */
  const syncButtons = (key) => {
    document.querySelectorAll('[data-accent-preset]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.accentPreset === key));
    });
  };

  /* 首屏：读上次的选择；没有就保持默认（等于什么都不做）并记下基准 */
  if (!st.key) {
    let saved = null;
    try {
      saved = localStorage.getItem(STORE_KEY);
    } catch {
      /* 隐私模式下不可用 */
    }
    const target = saved ? byKey(saved) : fallback;
    st.key = target.key;
    // 只在"确实选了非默认"时才写变量，默认态保持 CSS 里那套原值
    if (target.key !== fallback.key) apply(target);
    syncButtons(target.key);
  } else {
    syncButtons(st.key);
  }

  if (!st.wired) {
    st.wired = true;
    /* "大标题与卡片顶部齐平"：左栏第一块是徽标胶囊、标题在它下面
       （中间还有 badge 的 margin-bottom，实测 28px）。
       做法：目标 = 标题自身的顶（绝对坐标）；卡片在顶对齐下的自然顶
       = hero 内容区顶（卡片不带上外边距时就在那里，与当前 margin 无关）。
       两者相减就是需要补的上外边距 —— 用绝对坐标算，避免"上一轮 margin"反复叠加。
       ⚠️ 不要用 badge.bottom 当目标：那是 32，而标题顶是 60（差在 badge 的下边距）。 */
    const alignCard = () => {
      const root2 = document.documentElement;
      const hero = document.querySelector('.hero');
      const title = document.querySelector('.hero-title');
      const card = document.querySelector('.code-card');
      if (!hero || !title || !card) return;
      if (getComputedStyle(hero).flexDirection === 'column') {
        root2.style.setProperty('--card-align', '0px');
        return;
      }
      const hr = hero.getBoundingClientRect();
      const padT = parseFloat(getComputedStyle(hero).paddingTop) || 0;
      const baseTop = hr.top + padT; // 卡片不带 margin 时所在的顶
      const target = title.getBoundingClientRect().top;
      const delta = Math.round(target - baseTop);
      if (delta >= 0) root2.style.setProperty('--card-align', delta + 'px');
    };
    st.align = alignCard;
    window.addEventListener('resize', alignCard, { passive: true });
  }
  if (st.align) st.align();

  if (!st.wired2) {
    st.wired2 = true;
    document.addEventListener('click', (ev) => {
      const t = ev.target instanceof Element ? ev.target : null;
      const btn = t && t.closest('[data-accent-preset]');
      if (!btn) return;
      const key = btn.dataset.accentPreset;
      if (!key || key === st.key) return;
      const from = byKey(st.key);
      const to = byKey(key);
      st.key = to.key;
      try {
        localStorage.setItem(STORE_KEY, to.key);
      } catch {
        /* 忽略 */
      }
      syncButtons(to.key);
      tween(from, to);
    });
  }
  // 字体/图片加载完高度会变，再对齐一次
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => st.align && st.align());
  window.setTimeout(() => st.align && st.align(), 400);
}
