// 站点全局信息 —— 所有页面统一从这里读取，改这里即可全站生效。

// 图片图床开关：'' = 走本地相对路径（图片随 dist 打包，由 Cloudflare Pages 自带 CDN 服务，最稳）；
// 若要改用 GitHub + jsDelivr 图床（仓库 CloudWingX/cloudwing，需 push 且为公开后生效），填：
//   'https://cdn.jsdelivr.net/gh/CloudWingX/cloudwing@main/public'
export const IMG_CDN = '';
export const imgUrl = (p: string) => (p && p.startsWith('/') && IMG_CDN ? IMG_CDN + p : p);

// 侧栏天气卡片（数据来自 uapis.cn，无需 key）：
//   '' = 按访客 IP 自动定位（每位访客看到自己所在城市，不暴露站点所在地，默认推荐）
//   填城市名则可固定城市，例如 '北京'
export const WEATHER_CITY = '';

// 左侧栏底部音乐播放器（见 components/MusicPlayer.astro）。
// 歌曲暂定：数组为空时播放器显示「待添加」占位，不发任何网络请求。
// 加歌只需往里加一条（音频建议放 public/music/，文件名用英文/数字）：
//   { title: '曲名', artist: '作者（可选）', src: '/music/song.mp3' }
// 也可填外部直链（注意跨域与稳定性）。多条即为播放列表，支持上一首/下一首。
export const MUSIC: { title: string; artist?: string; src: string }[] = [];

// 全站背景视频（见 components/VideoBackground.astro）。
// 文件放在 public/media/ 随站点打包（不走外部 CDN，避免第三方挂掉/被墙）。
// 置为 '' 即关闭视频背景，恢复原来的渐变底。
//   mute: 必为静音（浏览器只允许静音视频自动播放）
//   scrim: 视频之上的遮罩浓度 0~1，调大=文字更清楚、视频更淡
export const VIDEO_BG = {
  src: '/media/bg-loop.mp4',
  // 视频加载失败 / 减少动态时显示的静态兜底图（留空则用下面的 --bg 深色渐变）。
  // 建议放一张从视频里截的静帧（同目录，jpg/webp 都行）。
  poster: '/media/bg-poster.jpg',
  // 视频层浓度 0~1（越小越淡）
  opacityDark: 0.5,
  opacityLight: 0.3,
  // 视频之上的**渐变遮罩**浓度：顶部较浅、底部较深、中心适当留亮。
  // 这样白色文字在上下两端都有足够对比，中间仍能看清画面。
  scrimTop: 0.35,
  scrimMid: 0.42,
  scrimBottom: 0.72,
  scrimLight: 0.55, // 兜底（万一切到浅色态）
};

export const SITE = {
  // 站点名（正文里显示，中文）
  title: '云翼',
  // 拉丁大字标题 / 英文品牌（hero 用，建议全大写短词）
  latin: 'CloudWing',
  // 一句话定位（hero 副标题）
  tagline: 'CloudWing（云翼）—— 个人学习与作品档案空间 · 暗色电影感玻璃设计',
  author: 'CloudWing_X',
  email: '246459267@qq.com',
  github: 'https://github.com/CloudWingX',
  bilibili: 'https://space.bilibili.com/470179349',
  // 关于页与 footer 使用的备注
  notice:
    '本站为个人学习与作品档案空间，采用暗色电影感玻璃 UI，设计、文案与素材均为本人产出。',
  since: 2025,
};

export const NAV = [
  { href: '/', label: '首页', no: '00' },
  { href: '/works/', label: '作品库', no: '01' },
  { href: '/gallery/', label: '画廊', no: '02' },
  { href: '/about/', label: '关于', no: '03' },
  { href: '/account/', label: '互动', no: '04' },
];

// 互动页留言板（giscus / GitHub Discussions）。已启用：
// 仓库需开启 Discussions 并安装 giscus app（CloudWingX/cloudwing 已配置）。
export const GISCUS = {
  repo: 'CloudWingX/cloudwing',
  repoId: 'R_kgDOUQ6_uw',
  category: 'Announcements',
  categoryId: 'DIC_kwDOUQ6_u84DFQ8u',
  mapping: 'pathname', // 常用：pathname / og:title
  reactionsEnabled: '1',
  inputPosition: 'bottom',
  lang: 'zh-CN',
};
