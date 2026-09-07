// 首页 02「影像收藏」—— AccordionGallery 手风琴画廊（React Bits 原码，仅提供精选图源）
// 精选 6 张跨时段 MC 截图，均用 webp 缩略（≈35-140KB/张），保证首页轻快流畅；
// grayscale=false 保持图片原色（与全站“图片保留原色”口径一致）。
// 图片路径经 imgUrl() 统一走 IMG_CDN 图床开关（'' = 本地相对路径）。
import AccordionGallery from './ReactBits/AccordionGallery.jsx';
import { imgUrl } from '../site';

const PICKS = [
  { image: imgUrl('/shots/mc/mc-001.webp'), label: '2024-06-25' },
  { image: imgUrl('/shots/mc/mc-015.webp'), label: '2024-06-27' },
  { image: imgUrl('/shots/mc/mc-022.webp'), label: '2024-06-29' },
  { image: imgUrl('/shots/mc/mc-024.webp'), label: '2024-10-06' },
  { image: imgUrl('/shots/mc/mc-026.webp'), label: '2026-08-15' },
  { image: imgUrl('/shots/mc/mc-037.webp'), label: '2026-08-18' },
];

export default function HomeGalleryAccordion() {
  return <AccordionGallery items={PICKS} defaultIndex={2} grayscale={false} />;
}
