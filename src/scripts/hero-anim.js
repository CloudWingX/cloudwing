// ============================================================
// 首页 Hero 动画（严格按规格实现）
//
//   Eyebrow      ShinyText   微光扫过，4s 循环
//   主标题        BlurText    逐词模糊渐现：blur(10px)→0、opacity 0→1、y 20→0
//                             逐词延迟 80ms、时长 0.8s、cubic-bezier(0.16,1,0.3,1)
//   clouds/wings GradientText 流动渐变（CSS 里做，见 index.astro 的 .ht-accent）
//   副标题        SplitText   逐字 y:40 → 0、opacity 0 → 1，每字延迟 50ms
//
//   触发：IntersectionObserver（进入视口才开始）
//   只动画 transform / opacity / filter
//   prefers-reduced-motion：直接落到终态，不做动画
// ============================================================
import gsap from 'gsap';

const EASE_BLUR = 'cubic-bezier(0.16, 1, 0.3, 1)'; // 规格指定
const EASE_SPLIT = 'power3.out';

// 把元素内的文本按"词"切分成 span（保留原有子元素里的强调色/字重）
// 规则：只处理直接文本节点；已有的元素子节点（.ht-dim / .ht-accent）当作一个整体 token。
// ★空白必须显式保留★：把词包进 inline-block 的 span 后，源码里的空格会被折叠掉
//   （"code on clouds" 会变成 "codeonclouds"）—— 所以空格单独建成 `&nbsp;` 文本节点。
function splitWords(line) {
  const tokens = [];
  line.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      // 用捕获组切分，保留分隔符本身；\s 不匹配 U+00A0，这里一并纳入
      (node.textContent ?? '').split(/([^\S\u00A0]+|[\u00A0]+)/).forEach((s) => {
        if (!s) return;
        if (/^[\s\u00A0]+$/.test(s)) tokens.push({ type: 'space' });
        else tokens.push({ type: 'text', text: s });
      });
    } else {
      tokens.push({ type: 'el', el: node.cloneNode(true) });
    }
  });
  line.textContent = '';
  const out = [];
  tokens.forEach((t) => {
    if (t.type === 'space') {
      // 非断行空格：既能断开词与词的间距，又不会被折叠
      line.appendChild(document.createTextNode('\u00A0'));
      return;
    }
    const span = document.createElement('span');
    span.className = 'hero-word';
    if (t.type === 'el') span.appendChild(t.el);
    else span.textContent = t.text;
    line.appendChild(span);
    out.push(span);
  });
  return out;
}

// 把元素文本按"字"切分（用于副标题逐字入场）
function splitChars(el) {
  const text = el.textContent ?? '';
  el.textContent = '';
  const out = [];
  for (const ch of Array.from(text)) {
    const span = document.createElement('span');
    span.className = 'hero-char';
    // 空格也要占位，否则词间距会塌
    span.textContent = ch === ' ' ? '\u00A0' : ch;
    el.appendChild(span);
    out.push(span);
  }
  return out;
}

function initHeroAnim() {
  const hero = document.querySelector('.hero');
  const title = document.querySelector('[data-hero-blur]');
  const sub = document.querySelector('[data-hero-split]');
  const eyebrow = document.querySelector('[data-hero-shiny]');
  const sheen = document.querySelector('[data-shiny-sheen]');
  if (!hero || !title) return;

  const st = (window.__cwHero ||= { wired: false, played: false, tl: null });
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── 切词/切字只做一次（软导航后是同一份 DOM 就不重复切）──
  if (!st.wired) {
    st.wired = true;
    st.words = [];
    title.querySelectorAll('.ht-line').forEach((line) => {
      st.words.push(...splitWords(line));
    });
    st.chars = sub ? splitChars(sub) : [];
  }

  const words = st.words || [];
  const chars = st.chars || [];

  // ── 终态（reduced-motion 或动画结束后都是这个状态）──
  const settle = () => {
    gsap.set(words, { opacity: 1, y: 0, filter: 'blur(0px)' });
    if (chars.length) gsap.set(chars, { opacity: 1, y: 0 });
    if (sub) gsap.set(sub, { opacity: 1 });
    if (sheen) gsap.set(sheen, { opacity: 0 });
  };

  // ── 初始态 ──
  const prime = () => {
    gsap.set(words, { opacity: 0, y: 20, filter: 'blur(10px)' });
    if (chars.length) gsap.set(chars, { opacity: 0, y: 40 });
    if (sub) gsap.set(sub, { opacity: 1 }); // 容器透明由每个字承担，避免整块闪
    if (sheen) gsap.set(sheen, { opacity: 0, xPercent: -120 });
  };

  const play = () => {
    if (st.played) return;
    st.played = true;

    if (reduced()) { settle(); return; }

    if (st.tl) { st.tl.kill(); st.tl = null; }
    const tl = gsap.timeline();
    st.tl = tl;

    // 主标题：逐词模糊渐现（80ms 一词、0.8s、规格缓动）
    tl.to(words, {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      duration: 0.8,
      ease: EASE_BLUR,
      stagger: 0.08,
    });
    // 副标题：逐字入场（每字 50ms）
    if (chars.length) {
      tl.to(
        chars,
        { opacity: 1, y: 0, duration: 0.6, ease: EASE_SPLIT, stagger: 0.05 },
        '>-0.35',
      );
    }
    // Eyebrow：微光扫过，4s 循环
    if (sheen) {
      tl.fromTo(
        sheen,
        { opacity: 0.9, xPercent: -120 },
        { xPercent: 260, duration: 1.1, ease: 'power2.inOut' },
        0,
      );
      tl.set(sheen, { opacity: 0 });
      // 循环：每 4s 再扫一次
      st.interval = window.setInterval(() => {
        if (reduced()) return;
        gsap.fromTo(
          sheen,
          { opacity: 0.9, xPercent: -120 },
          { xPercent: 260, duration: 1.1, ease: 'power2.inOut', onComplete: () => gsap.set(sheen, { opacity: 0 }) },
        );
      }, 4000);
    }
  };

  if (reduced()) settle();
  else prime();

  // ── IntersectionObserver 触发（进入视口才开始）──
  if (!st.observed && 'IntersectionObserver' in window) {
    st.observed = true;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            play();
            io.disconnect();
          }
        });
      },
      { threshold: 0.15 },
    );
    io.observe(hero);
  } else {
    // 不支持 IO：直接播（避免内容一直不可见）
    play();
  }

  // 软导航回首页时重播
  if (!st.replayBound) {
    st.replayBound = true;
    document.addEventListener('astro:page-load', () => {
      st.played = false;
      if (reduced()) { settle(); return; }
      prime();
      play();
    });
  }
}

function boot() {
  try { initHeroAnim(); } catch (e) { /* 单个失败不影响其他 */ }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
document.addEventListener('astro:page-load', boot);
