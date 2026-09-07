// 站点全局信息 —— 所有页面统一从这里读取，改这里即可全站生效。
// TODO: 把下面的占位内容换成你自己的真实信息。

// 图片图床开关：'' = 走本地相对路径（public/ 随站点部署，Cloudflare Pages 自带 CDN）；
// 若要改用 GitHub + jsDelivr 图床，填：
//   export const IMG_CDN = 'https://cdn.jsdelivr.net/gh/CloudWingX/cloudwing@main/public';
// 页面图片统一走 imgUrl()：非空时拼到 /shots/... 等以 / 开头的路径前。
// 注意：jsDelivr 需要仓库已 push 且为公开；国内部分网络访问 jsDelivr 不稳定，可随时置回 ''。
export const IMG_CDN = '';
export const imgUrl = (p: string) => (p && p.startsWith('/') && IMG_CDN ? IMG_CDN + p : p);

export const SITE = {
  // 站点名（正文里显示，中文）
  title: '云翼',
  // 拉丁大字标题 / 英文品牌（hero 用，建议全大写短词）
  latin: 'CloudWing',
  // 一句话定位（hero 副标题）
  tagline: 'CloudWing（云翼）—— 个人学习与作品档案空间 · 磨砂玻璃扁平化设计',
  author: 'CloudWing_X',
  email: 'you@example.com',
  github: 'https://github.com/yourname',
  bilibili: 'https://space.bilibili.com/yourid',
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

// 互动页留言板（giscus / GitHub Discussions）。启用步骤：
// 1) 仓库开启 Discussions 并安装 giscus app；
// 2) 在 https://giscus.app 生成配置，把下面字段填上（repo/repoId/categoryId 等）；
//    留空时页面显示“待配置”提示，不会加载第三方脚本。
export const GISCUS = {
  repo: '', // 例如 'owner/repo'
  repoId: '',
  category: 'Announcements',
  categoryId: '',
  mapping: 'pathname', // 常用：pathname / og:title
  reactionsEnabled: '1',
  inputPosition: 'top',
  lang: 'zh-CN',
};
