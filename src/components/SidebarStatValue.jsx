// 宿主层：把 ReactBits <CountUp /> 用在侧栏「站点统计」的数字上。
//
// 官方组件零改动（ReactBits/CountUp.jsx 保持原码），这里只做三件事：
//   1) 读当前主题：浅色下等宽数字会按 数字/冒号/点的宽度对齐，可能把右侧撑出 1~2px，
//      统计格用 flex 两端对齐，数字一换宽就会轻微抖动 → 固定 tabular-nums（已在 CSS 里）；
//   2) 后缀（"1.8" 的 k 没有、天数后面的「天」）单独渲染，不参与计数动画；
//   3) ★每次加载 / 刷新 / 软导航都重放★：CountUp 的入场动画由 useInView(once) 驱动，
//      只在挂载时触发一次。侧栏在软导航时不一定重建，所以这里监听
//      astro:page-load / astro:after-swap，用递增的 key 强制重挂载 → 每次都重新计数。
import { useEffect, useState } from 'react';
import CountUp from './ReactBits/CountUp';

export default function SidebarStatValue({ value, suffix = '', duration = 1.1 }) {
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    const replay = () => setRunId((n) => n + 1);
    // 软导航换页 / 首屏加载（astro:page-load 两者都会派发）
    document.addEventListener('astro:page-load', replay);
    document.addEventListener('astro:after-swap', replay);
    return () => {
      document.removeEventListener('astro:page-load', replay);
      document.removeEventListener('astro:after-swap', replay);
    };
  }, []);

  return (
    <span className="v">
      {/* key 变化 → 重新挂载 → CountUp 重新从 from 计到 to。
          小数位数由 CountUp 自己按 to 推断（1.8 → 保留 1 位）。 */}
      <CountUp key={runId} from={0} to={value} duration={duration} separator="," />
      {suffix ? <span className="v-suffix">{suffix}</span> : null}
    </span>
  );
}
