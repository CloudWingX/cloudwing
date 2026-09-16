// 宿主层：把 ReactBits <StrokeText /> 用在首页大标题第二行（"CLOUDWING"）。
//
// 官方组件零改动（ReactBits/StrokeText.jsx 保持原码），这里只做适配：
//   1) 配色接站点令牌：描边色/填充色都用 var(--…)，深色浅色自动成立，
//      不引入紫色（官方默认 #A78BFA 与本站黑白灰体系冲突）。
//      SVG 表现属性支持 var()（实测 Chrome 会解析成 computed 值）。
//   2) 尺寸跟随大标题：font-size 继承 CSS（见 index.astro 的 .stroke-line），
//      fontSize 内部基准放大到 1000 保证描边/量测精度，视觉大小由外部 font-size 决定。
//   3) 与既有动效并存：外层 h1 仍是 3D 倾斜/视差的宿主（--frx/--fry 作用在本组件根节点上），
//      本组件只负责"画一遍字"，不动 transform。
//   4) 支持重播：软导航回首页时 remount 一次，效果重新画（trigger='mount' 只在挂载时跑）。
import { useEffect, useState } from 'react';
import StrokeText from './ReactBits/StrokeText';

export default function HomeStrokeTitle({
  text = 'CloudWing',
  fontSize = 1000,
  strokeWidth = 1.4,
  drawDuration = 1.4,
  fillDelay = 0.15,
  stagger = 0.05,
}) {
  // 软导航切回首页时重挂载，让"画字"重放一次（与 CountUp 用的是同一套思路）
  const [runId, setRunId] = useState(0);
  useEffect(() => {
    const replay = () => setRunId((n) => n + 1);
    document.addEventListener('astro:page-load', replay);
    return () => document.removeEventListener('astro:page-load', replay);
  }, []);

  return (
    <StrokeText
      key={runId}
      className="stroke-line"
      text={text}
      // 描边用中性墨色（浅色下深线、深色下浅线），填充用正文墨色
      strokeColor="var(--ink, #101013)"
      fillColor="var(--ink, #101013)"
      strokeWidth={strokeWidth}
      drawDuration={drawDuration}
      fillDelay={fillDelay}
      stagger={stagger}
      ease="power2.out"
      trigger="mount"
      fillMode="wipe"
      fontSize={fontSize}
      fontWeight={800}
      // 与大标题的 letter-spacing: -0.015em 对齐（按内部基准字号换算）
      letterSpacing={fontSize * -0.015}
    />
  );
}
