// 首页 01「作品库」板块右下角堆叠卡片（CardSwap，React Bits 原码）
// 卡片内容来自 works 集合（index.astro 传入真实作品，按日期取最新 3 篇）。
import CardSwap, { Card } from './ReactBits/CardSwap.jsx';

export default function HomeWorksCardSwap({ items = [] }) {
  if (!items.length) return null;
  const box = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    padding: '18px 20px',
    boxSizing: 'border-box',
    color: 'var(--ink)',
    fontFamily: "'Outfit','MiSans','PingFang SC','Microsoft YaHei',sans-serif",
    textDecoration: 'none',
  };
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
      {items.map((w) => (
        <Card key={w.no}>
          <a style={box} href={w.url} aria-label={`查看作品：${w.title}`}>
            {w.cover && (
              <span
                style={{
                  display: 'block',
                  width: '100%',
                  height: '62%',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: 'rgba(127,127,132,0.14)',
                }}
              >
                <img
                  src={w.cover}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    filter: 'saturate(0.92)',
                  }}
                  loading="lazy"
                />
              </span>
            )}
            <span style={{ display: 'block', marginTop: '4px' }}>
              <span style={{ display: 'block', fontSize: 15, letterSpacing: '0.18em', opacity: 0.6 }}>
                {w.no}
                {w.tags?.length ? ` · ${w.tags[0]}` : ''}
              </span>
              <span style={{ display: 'block', fontSize: 32, fontWeight: 700, margin: '4px 0 2px' }}>
                {w.title}
              </span>
              <span style={{ display: 'block', fontSize: 16, opacity: 0.6 }}>查看档案 →</span>
            </span>
          </a>
        </Card>
      ))}
    </CardSwap>
  );
}
