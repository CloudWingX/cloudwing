// 宿主包装：把 React Bits <Particles /> 用作全站（除 /account/）固定全屏背景层。
// 原组件零改动，仅传 props；容器 pointer-events:none 不拦截内容，
// 鼠标悬浮由 window 级 mousemove 转发到 .particles-container 驱动。
//
// 主题适配（仅宿主层）：粒子的明度必须跟随主题 —— 浅色底上用深灰
// (#52525b) 会像一层悬浮的"灰尘"、且与近乎全白的页面互抢注意力；
// 这里按 html[data-theme] 切换粒子色与数量（浅色更少更淡）。
// ReactBits/Particles.jsx 本身不动。
import { useEffect, useRef, useState } from 'react';
import Particles from './ReactBits/Particles.jsx';

// 主题 → 粒子参数
const PRESETS = {
  light: {
    particleColors: ['#8b8d95'],
    particleCount: 140,
  },
  dark: {
    particleColors: ['#52525b'],
    particleCount: 200,
  },
};

// 其余参数（示例即默认展示观感；speed/size/hover 与主题无关）
const BASE_PROPS = {
  particleSpread: 10,
  speed: 0.1,
  particleBaseSize: 100,
  sizeRandomness: 1,
  cameraDistance: 20,
  alphaParticles: false,
  disableRotation: false,
  moveParticlesOnHover: true,
  particleHoverFactor: 0.8,
  pixelRatio: 1.5,
};

// 读当前主题（Base.astro 首屏内联脚本会设 html[data-theme]）
function currentTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export default function PageParticlesBackground() {
  const layerRef = useRef(null);
  const [theme, setTheme] = useState(currentTheme);

  // 跟随主题切换（含软导航后 html 属性被覆写的情况）
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setTheme(currentTheme());
    sync();
    // 属性变化（主题开关写入 data-theme）
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    // 软导航换页后属性可能被新文档覆写，astro:page-load 时再兜一次
    document.addEventListener('astro:page-load', sync);
    document.addEventListener('astro:after-swap', sync);
    return () => {
      mo.disconnect();
      document.removeEventListener('astro:page-load', sync);
      document.removeEventListener('astro:after-swap', sync);
    };
  }, []);

  // 窗口级指针转发：容器 pointer-events:none 后收不到真实事件，
  // 把全局 mousemove 以合成事件投递到内部粒子容器，驱动 hover 视差。
  // 必须跳过自己合成的（isTrusted=false）事件：合成事件会冒泡回 window，
  // 又触发本监听器再投递一遍 → 无限递归（实测鼠标一动就抛
  // RangeError: Maximum call stack size exceeded）。
  useEffect(() => {
    const findTarget = () => layerRef.current?.querySelector('.particles-container');
    const onMove = (e) => {
      if (!e.isTrusted) return; // 只转发真实指针事件
      const target = findTarget();
      if (!target) return;
      target.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: e.clientX,
          clientY: e.clientY,
          bubbles: true,
        })
      );
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const preset = PRESETS[theme] ?? PRESETS.light;

  return (
    <div ref={layerRef} className="pparticles-layer" aria-hidden="true">
      {/* key 让主题切换时重建粒子实例，确保颜色/数量真正生效 */}
      <Particles key={theme} {...BASE_PROPS} {...preset} />
    </div>
  );
}
