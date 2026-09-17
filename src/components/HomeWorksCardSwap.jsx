// 首页 01「作品库」板块的堆叠卡片（CardSwap，React Bits 原码）。
// 卡片内容来自 works 集合（index.astro 传入真实作品，按日期取最新 3 篇）。
//
// ⚠️ 尺寸必须由**容器实测宽度**推算，不能写死：
// CardSwap 把每张卡绝对定位在容器**中心**，再按 cardDistance / verticalDistance 向外铺开
// （前排往右下、后排往左上）。所以容器的宽高必须比"单张卡"更大，否则卡片会被容器的
// overflow / 板块的 overflow:clip 切掉 —— 之前的显示 bug 就是这么来的
// （容器 660×480，而单卡 660×549，上下左右全被切）。
// 这里由外层 .works-deck 给出可用宽度，内部按比例算卡片尺寸、间距与字号，保证整叠永远装得下。
import { useEffect, useRef, useState } from 'react';
import CardSwap, { Card } from './ReactBits/CardSwap.jsx';

// 以"卡宽"为基准的比例。
// distX/distY 同时决定"整叠范围"与"文字是否互相压到"：
//   卡片从容器中心按 ±dist 铺开，间距越大越能看到后排，但也越容易让后排的标题
//   压到前排正文上（实测 distX=0.29 时后排文字正好落在前排标题区）。
//   这里收到 0.14 / 0.16：后排只露出封面边缘，文字不再打架。
const R = {
  h: 0.8,          // 卡高 = 卡宽 × 0.8
  distX: 0.14,     // 左右铺开间距
  distY: 0.16,     // 上下铺开间距
  padX: 0.027,     // 卡内水平内边距 = 卡宽 × 0.027
  padY: 0.033,
  bodyH: 0.52,     // 文字区高度占卡高比例（封面 = 1 − bodyH − 内边距）
  fsMeta: 0.023,   // 编号行字号
  fsTitle: 0.042,  // 标题字号
  fsCta: 0.021,    // 「查看档案」字号
};

export default function HomeWorksCardSwap({ items = [] }) {
  const hostRef = useRef(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const measure = () => setW(Math.round(host.clientWidth));
    measure();
    if (typeof ResizeObserver === 'function') {
      const ro = new ResizeObserver(measure);
      ro.observe(host);
      return () => ro.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  if (!items.length) return null;

  // 可用宽度 → 容器与卡片尺寸。
  // 几何约束（这段是修显示 bug 的关键）：
  //   CardSwap 把每张卡绝对定位在**容器中心**，再按 ±distX/±distY 铺开；
  //   容器由 CardSwap 的 width/height 决定，而它同时也会把这两个值当作**单卡**的
  //   inline width/height 写进 <Card>。也就是说"容器 = 单卡" —— 但卡片要往外铺，
  //   必然伸出容器；CSS 里容器是 overflow:visible、外层 .works-block 又是 overflow:clip，
  //   于是伸出的部分被切掉（右侧缺一条、后排还顶进上方导航）。
  // 修法：让容器按**整叠**尺寸给（含 2×dist），再用 CSS 把单卡压回"容器 − 2×dist"
  //   （见 index.astro 里 .card 的 width/height !important）。
  const totalW = w || 520;
  const stackW = totalW;
  const stackH = Math.round(totalW * R.h);
  const cardW = Math.round(stackW / (1 + 2 * R.distX));
  const cardH = Math.min(Math.round(cardW * R.h), Math.round(stackH / (1 + 2 * R.distY)));
  const distX = Math.round(cardW * R.distX);
  const distY = Math.round(cardH * R.distY);
  const px = (k2) => Math.max(9, Math.round(cardW * k2));

  const box = {
    position: 'relative',
    display: 'block',
    width: '100%',
    height: '100%',
    padding: `${px(R.padY)}px ${px(R.padX)}px`,
    boxSizing: 'border-box',
    color: 'var(--ink)',
    fontFamily: "'Outfit','MiSans','PingFang SC','Microsoft YaHei',sans-serif",
    textDecoration: 'none',
  };
  // 文字块贴着卡片**左下角**：前排卡片会把后排的这块区域盖住，
  // 于是后排只露出封面与右/上边缘，不会出现两行标题压在一起。
  const caption = {
    position: 'absolute',
    left: px(R.padX),
    right: px(R.padX),
    bottom: px(R.padY),
    display: 'block',
    overflow: 'hidden',
  };

  return (
    <div ref={hostRef} className="works-deck-host" style={{ width: '100%', height: stackH }}>
      {w > 0 && (
        <div
          className="works-deck-inner"
          style={{
            width: stackW,
            height: stackH,
            margin: '0 auto',
            // 供 CSS 把单卡压到"容器 − 2×dist"（否则卡片会伸出容器被裁）
            '--deck-card-w': `${cardW}px`,
            '--deck-card-h': `${cardH}px`,
          }}
        >
          <CardSwap
            width={cardW}
            height={cardH}
            cardDistance={distX}
            verticalDistance={distY}
            delay={5600}
            pauseOnHover
            skewAmount={4}
            easing="smooth"
          >
          {items.map((it) => (
            <Card key={it.no}>
              <a style={box} href={it.url} aria-label={`查看作品：${it.title}`}>
                {it.cover && (
                  <span
                    style={{
                      display: 'block',
                      width: '100%',
                      height: `${Math.round((1 - R.bodyH) * 100)}%`,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      background: 'rgba(127,127,132,0.14)',
                    }}
                  >
                    <img
                      src={it.cover}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'saturate(0.92)' }}
                      loading="lazy"
                    />
                  </span>
                )}
                {/* 文字块绝对定位在左下角（见 caption）：前排会盖住后排这块，
                    所以后排只露出封面，不会出现两个标题叠在一起 */}
                <span style={caption}>
                  <span
                    style={{
                      display: 'block',
                      fontSize: px(R.fsMeta),
                      letterSpacing: '0.16em',
                      opacity: 0.6,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {it.no}
                    {it.tags?.length ? ` · ${it.tags[0]}` : ''}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: px(R.fsTitle),
                      fontWeight: 700,
                      lineHeight: 1.25,
                      margin: '3px 0 2px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {it.title}
                  </span>
                  <span style={{ display: 'block', fontSize: px(R.fsCta), opacity: 0.6 }}>查看档案 →</span>
                </span>
              </a>
            </Card>
          ))}
          </CardSwap>
        </div>
      )}
    </div>
  );
}
