// 宿主包装：让 React Bits <ShapeGrid /> 的线条/悬停色跟随站点日夜主题，
// 并把整个窗口的 mousemove 转发给画布——光标在任何位置（标题、导航上）都会点亮网格。
// 原组件零改动，仅通过外层监听器把坐标投递给组件自己的 mousemove 处理器。
import { useEffect, useRef, useState } from 'react';
import ShapeGrid from './ReactBits/ShapeGrid.jsx';

const THEMES = {
  light: {
    borderColor: 'rgba(14, 14, 17, 0.22)',
    hoverFillColor: 'rgba(0, 0, 0, 0.3)',
  },
  dark: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    hoverFillColor: 'rgba(255, 255, 255, 0.3)',
  },
};

const SHARED = {
  direction: 'diagonal',
  speed: 0.5,
  squareSize: 44,
  shape: 'square',
  hoverTrailAmount: 5,
};

const initialTheme = () => {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
};

export default function HomeShapeGrid() {
  const [theme, setTheme] = useState(initialTheme);
  const canvasRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  // 窗口级转发：任何位置的光标移动都会驱动画布上的悬停点亮/拖尾
  useEffect(() => {
    const findCanvas = () => {
      if (canvasRef.current && canvasRef.current.isConnected) return canvasRef.current;
      // React 根内只渲染一个 shapegrid 画布
      return document.querySelector('canvas.shapegrid-canvas');
    };
    const onMove = (e) => {
      const cv = findCanvas();
      if (!cv) return;
      const rect = cv.getBoundingClientRect();
      const localX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const localY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      // 组件监听原生 mousemove；这里用真实绝对坐标投递
      cv.dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: rect.left + localX,
          clientY: rect.top + localY,
          bubbles: true,
        })
      );
    };
    const onLeave = () => {
      const cv = findCanvas();
      if (!cv) return;
      cv.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const p = THEMES[theme] ?? THEMES.dark;

  return (
    <div ref={canvasRef} style={{ position: 'absolute', inset: 0 }}>
      <ShapeGrid {...SHARED} {...p} />
    </div>
  );
}
