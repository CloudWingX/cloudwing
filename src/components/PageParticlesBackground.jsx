// 宿主包装：把 React Bits <Particles /> 用作全站（除 /account/）固定全屏背景层。
// 粒子颜色与用法示例保持一致（particleColors ["#52525b"]，不做黑白化干预）。
// 原组件零改动，仅传 props；容器 pointer-events:none 不拦截内容，
// 鼠标悬浮由 window 级 mousemove 转发到 .particles-container 驱动。
import { useEffect, useRef } from 'react';
import Particles from './ReactBits/Particles.jsx';

// 粒子参数（示例即默认展示观感）
const PROPS = {
  particleColors: ['#52525b'],
  particleCount: 200,
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

export default function PageParticlesBackground() {
  const layerRef = useRef(null);

  // 窗口级指针转发：容器 pointer-events:none 后收不到真实事件，
  // 把全局 mousemove 以合成事件投递到内部粒子容器，驱动 hover 视差。
  useEffect(() => {
    const findTarget = () => layerRef.current?.querySelector('.particles-container');
    const onMove = (e) => {
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

  return (
    <div ref={layerRef} className="pparticles-layer" aria-hidden="true">
      <Particles {...PROPS} />
    </div>
  );
}
