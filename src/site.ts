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

export const SITE = {
  // 站点名（正文里显示，中文）
  title: '云翼',
  // 拉丁大字标题 / 英文品牌（hero 用，建议全大写短词）
  latin: 'CloudWing',
  // 一句话定位（hero 副标题）
  tagline: 'CloudWing（云翼）—— 个人学习与作品档案空间 · 磨砂玻璃扁平化设计',
  author: 'CloudWing_X',
  email: '246459267@qq.com',
  github: 'https://github.com/CloudWingX',
  bilibili: 'https://space.bilibili.com/470179349',
  // 关于页与 footer 使用的备注
  notice:
    '本站为个人学习与作品档案空间，采用磨砂玻璃扁平化 UI（浅色通透），设计、文案与素材均为本人产出。',
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
