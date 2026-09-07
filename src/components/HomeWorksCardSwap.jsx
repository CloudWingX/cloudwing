// 首页 01「作品库」板块右下角堆叠卡片（CardSwap，React Bits 原码，仅提供示例卡片内容）
import CardSwap, { Card } from './ReactBits/CardSwap.jsx';

const SAMPLE = [
  { no: 'W-001', title: '晨昏边境', tag: '概念合成' },
  { no: 'W-002', title: '静默监视', tag: '界面概念' },
  { no: 'W-003', title: '星轨测算', tag: '数据实验' },
];

const box = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  width: '100%',
  height: '100%',
  padding: '16px 18px',
  boxSizing: 'border-box',
  color: 'var(--ink)', // 随主题色（玻璃卡内文字）
  fontFamily: "'Outfit','MiSans','PingFang SC','Microsoft YaHei',sans-serif",
};

export default function HomeWorksCardSwap() {
  return (
    <CardSwap
      width={660}
      height={480}
      cardDistance={78}
      verticalDistance={92}
      delay={4200}
      pauseOnHover
      skewAmount={6}
      easing="elastic"
    >
      {SAMPLE.map((s) => (
        <Card key={s.no}>
          <div style={box}>
            <span style={{ fontSize: 15, letterSpacing: '0.18em', opacity: 0.6 }}>{s.no}</span>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, margin: '8px 0 5px' }}>{s.title}</div>
              <div style={{ fontSize: 17, opacity: 0.55 }}>{s.tag}</div>
            </div>
          </div>
        </Card>
      ))}
    </CardSwap>
  );
}
