// 宿主包装：让 React Bits <MagicBento /> 跟随站点日夜主题（V41）。
// - 浅色主题：浅玻璃卡 + 深色文字 + 中灰辉光/粒子；
// - 深色主题：近黑卡 + 白字 + 浅灰辉光（维持原观感）。
// 组件本体零改动，仅按 html[data-theme] 切换传入的 data 卡色与辉光色。
import { useEffect, useState } from 'react';
import MagicBento from './ReactBits/MagicBento.jsx';
import { SITE } from '../site';

const GLOWS = {
  light: '96, 100, 110',
  dark: '200, 200, 205',
};

// 卡片底色不再由 JS 内联指定（避免依赖水合/主题状态），改由 CSS 变量随主题切换
const CARD_DATA = [
  { label: 'Profile', title: 'CloudWing_X', description: '计算机科学与技术 · 本科在读 · 后端/质量方向' },
  { label: 'Works', title: '作品库', description: '编号档案 · 过程可追溯' },
  { label: 'Gallery', title: '影集', description: '40 张截图 · MC 为主' },
  { label: 'Contact', title: '联系', description: '邮件 · GitHub · Bilibili' },
  { label: 'Site', title: '本站', description: `Astro · 玻璃扁平 · 记录可追溯 · EST ${SITE.since}` },
];

const initialTheme = () => {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
};

export default function AboutMagicBento() {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setTheme(root.dataset.theme === 'light' ? 'light' : 'dark');
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  const glow = GLOWS[theme] ?? GLOWS.dark;

  return (
    <MagicBento
      data={CARD_DATA}
      enableStars
      enableSpotlight
      enableBorderGlow
      enableTilt
      clickEffect
      enableMagnetism
      glowColor={glow}
      particleCount={10}
      spotlightRadius={300}
    />
  );
}
