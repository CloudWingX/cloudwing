// 宿主层：把 ReactBits <CountUp /> 用在侧栏「站点统计」的数字上。
//
// 官方组件零改动（ReactBits/CountUp.jsx 保持原码），这里只做三件事：
//   1) 数字用等宽数字（tabular-nums，见 shell.css），避免计数时宽度抖动；
//   2) 后缀（"1.8k" 的 k、天数后面的「天」）单独渲染，不参与计数动画；
//   3) ★每次加载 / 刷新 / 软导航都重放★：CountUp 的入场动画由 useInView(once) 驱动，
//      只在挂载时触发一次，所以用递增的 key 强制重挂载。
//
// ⚠️ 挂载指令必须用 `client:idle`，**不要用 `client:visible`**：
//   实测（无头浏览器逐步复现）`client:visible` 配合软导航会让每个实例抛一次
//   `Minified React error #424`（React 水合不匹配；控制台无任何诊断信息，极难定位）。
//   同一段代码换成 `client:idle` 后异常归零。可见性驱动由 CountUp 自己的 useInView
//   负责，所以换指令不影响"滚到才计数"的观感。
import { useEffect, useRef, useState } from 'react';
import CountUp from './ReactBits/CountUp';

export default function SidebarStatValue({ value, suffix = '', duration = 1.1 }) {
  const [runId, setRunId] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    // 等本次水合结束后才允许重播：`astro:page-load` 在软导航时与岛的水合同期派发，
    // 此刻 setState 会打断水合（也是 #424 的成因之一）。
    mounted.current = true;
    const replay = () => {
      if (!mounted.current) return;
      setRunId((n) => n + 1);
    };
    document.addEventListener('astro:page-load', replay);
    document.addEventListener('astro:after-swap', replay);
    return () => {
      mounted.current = false;
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
