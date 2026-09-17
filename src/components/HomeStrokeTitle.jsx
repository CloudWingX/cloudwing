// 宿主层：把 ReactBits <StrokeText /> 用在首页大标题的**两行**上。
//
// 官方组件零改动（ReactBits/StrokeText.jsx 保持原码），这里只做适配：
//   1) 配色接站点令牌：stroke/fill 都用 var(--…)，深浅主题自动成立；
//      ★不引入官方默认的紫色★（与本站黑白灰体系冲突）。
//   2) 尺寸跟随大标题：font-size 由 CSS 给（index.astro 的 .stroke-line），
//      内部基准字号放大到 1000 以保证量测/描边精度；视觉大小由外部 font-size 决定。
//   3) 与既有动效并存：外层 h1 仍是 3D 倾斜宿主，两行各自吃一套视差变量；
//      本组件只"画字"，不动 transform。
//   4) 两行级联：官方组件的 `delay` 形参**声明了但没被使用**（时间线固定为暂停+play(0)），
//      所以级联只能由宿主实现 —— 第二行延迟挂载，挂载即开始画。
//   5) 软导航回首页时重挂载，动画重放。
import { useEffect, useRef, useState } from 'react';
import StrokeText from './ReactBits/StrokeText';

const BASE = {
  strokeWidth: 1.4,
  drawDuration: 1.4,
  fillDelay: 0.15,
  stagger: 0.05,
  // 内部基准字号：放大以保证量测与描边精度（视觉大小由外部 font-size 决定）
  fontSize: 1000,
};

function Line({ text, delay = 0, className, lineKey }) {
  // 延迟挂载：到点才渲染 StrokeText，于是它的"画字"从这一刻开始 —— 实现两行级联。
  const [on, setOn] = useState(delay <= 0);
  useEffect(() => {
    if (delay <= 0) { setOn(true); return undefined; }
    const t = setTimeout(() => setOn(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  // 占位与正式渲染用同一个容器、同一套 CSS（高度由 .stroke-line 的 1em 决定），
  // 所以第二行延迟挂载时下方内容不会被顶动。
  const cls = `stroke-line ${className}`.trim();
  if (!on) return <span className={cls} aria-hidden="true" />;

  return (
    <StrokeText
      key={lineKey}
      className={cls}
      text={text}
      strokeColor="var(--ink, #101013)"
      fillColor="var(--ink, #101013)"
      strokeWidth={BASE.strokeWidth}
      drawDuration={BASE.drawDuration}
      fillDelay={BASE.fillDelay}
      stagger={BASE.stagger}
      ease="power2.out"
      trigger="mount"
      fillMode="wipe"
      fontSize={BASE.fontSize}
      fontWeight={500}
      // 与大标题的 letter-spacing: -0.015em 对齐（按内部基准字号换算）
      letterSpacing={BASE.fontSize * -0.015}
    />
  );
}

export default function HomeStrokeTitle({ lines = [], cascade = 0.9 }) {
  // 软导航切回首页时重挂载，让"画字"重放一次。
  //
  // ⚠️ 与 SidebarStatValue 同一个坑：`astro:page-load` 在软导航换页时**与 Astro 岛的
  // 水合同时发生**，此刻 setState 会抛 `Minified React error #424`（水合不匹配）。
  // 用 mounted ref 保证"本次水合结束后"才允许重播。
  const [runId, setRunId] = useState(0);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    const replay = () => {
      if (!mounted.current) return;
      setRunId((n) => n + 1);
    };
    document.addEventListener('astro:page-load', replay);
    return () => {
      mounted.current = false;
      document.removeEventListener('astro:page-load', replay);
    };
  }, []);

  return (
    <>
      {lines.map((text, i) => (
        <Line
          // key 里带 runId：重播时强制重建，动画从头开始
          key={`${runId}-${i}`}
          lineKey={`${runId}-${i}`}
          text={text}
          delay={i === 0 ? 0 : cascade * i}
          // 第二行沿用原来的 .stroke（它带实心感/投影等既有观感）
          className={i === 0 ? 'line1' : 'stroke'}
        />
      ))}
    </>
  );
}
