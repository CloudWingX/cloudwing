// 宿主包装：React Bits <VariableProximity /> —— 关于页文字的光标邻近可变字重效果
// 说明：
// - 组件本体零改动（仅传 props 与提供 containerRef 作为相对坐标容器）
// - 字体覆盖为站点字体（Outfit 支持 wght 400..900 可变轴），避免页面出现两种字体
// - 仅用于「有空格分词」的短文本 / 拉丁标题：组件按空格切词且每个词 nowrap，
//   中文无空格长句会被当成一个不可换行的词，长段落不要用它
import { useRef } from 'react';
import VariableProximity from './ReactBits/VariableProximity.jsx';

export default function ProximityText({
  label = '',
  className = '',
  radius = 150,
  falloff = 'gaussian',
  fromFontVariationSettings = "'wght' 400",
  toFontVariationSettings = "'wght' 900",
  color,
  style,
}) {
  const ref = useRef(null);
  return (
    <span ref={ref} className={`px-host ${className}`.trim()} style={{ display: 'block', position: 'relative', ...style }}>
      <VariableProximity
        label={label}
        containerRef={ref}
        radius={radius}
        falloff={falloff}
        fromFontVariationSettings={fromFontVariationSettings}
        toFontVariationSettings={toFontVariationSettings}
        // 内联覆盖组件默认字体（Roboto Flex）→ 用站点字体，保持全站一致；
        // Outfit 是可变字重字体（wght 400..900），所以 wght 轴的变化依然生效
        style={{
          fontFamily: 'var(--font-display)',
          ...(color ? { color } : null),
        }}
      />
    </span>
  );
}
