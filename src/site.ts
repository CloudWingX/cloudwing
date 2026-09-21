// 站点全局信息 —— 所有页面统一从这里读取，改这里即可全站生效。

/* ▍强调色预设（首页代码卡片下方那排色卡）
   机制照参考站（reactbits.dev 的 Nebula/Aurora/Ember/Ice）：点一下同时改
   ① 强调色（按钮/图标/高亮字）② 整页颜色滤镜（叠一层带混合模式的色膜，**不动背景视频**）
   ③ 代码卡片的语法配色。
   本站比参考多加了两点：① 颜色之间用中间色**缓慢过渡**（参考只换变量、不补间）；
   ② 预设整体贴着背景视频的青蓝（实测 192°）来选，所以切换后画面不会"跳色"。
   `base` 必须与 global.css 的 --accent 一致，这样默认态（雾蓝）等于"什么都没改"。 */
export type AccentPreset = {
  key: string;
  label: string; // 色卡上的名字
  base: string; // = global.css 的 --accent
  deep: string; // = --accent-deep（更亮一档，用于链接/悬停）
  soft: string; // = --accent-soft
  rgb: string; // 强调色的 "r, g, b"（给 rgba() 用）
  tint: string; // 色膜颜色
  tintA: number; // 色膜浓度
  hue: number; // 背景视频的色相旋转（deg）—— 让视频的色调与强调色同族
  sat: number; // 背景视频的饱和度倍数
};

/* hue/sat 为什么需要：背景视频本身是稳定的青蓝（192°），
   单靠叠色膜实测只能把画面推到 186~190°，永远"暖"不起来
   （色膜再厚也会被视频的青色拉回去，还会把画面洗灰）。
   所以这里对视频层加 filter: hue-rotate() —— 它改的是**颜色，不是背景本身**：
   视频文件、透明度、遮罩、层级全都不动，只是整体转个色相。
   这样"余烬"真的能变成暖调，而且转色是线性缩放，中间过渡很顺。 */
export const ACCENTS: AccentPreset[] = [
  {
    key: 'mist',
    label: '雾蓝',
    base: '#9fd3e8', deep: '#bfe4f2', soft: 'rgba(159, 211, 232, 0.14)',
    rgb: '159, 211, 232', tint: '#9fd3e8', tintA: 0, hue: 0, sat: 1,
  },
  {
    key: 'polar',
    label: '镜蓝',
    base: '#8ec2f2', deep: '#b4d8fb', soft: 'rgba(142, 194, 242, 0.14)',
    rgb: '142, 194, 242', tint: '#8ec2f2', tintA: 0.16, hue: 25, sat: 1.08,
  },
  {
    key: 'aurora',
    label: '极光',
    base: '#86d6b4', deep: '#b0e8cd', soft: 'rgba(134, 214, 180, 0.14)',
    rgb: '134, 214, 180', tint: '#86d6b4', tintA: 0.16, hue: -22, sat: 1.05,
  },
  {
    key: 'ember',
    label: '余烬',
    base: '#e0c084', deep: '#f2dcb0', soft: 'rgba(224, 192, 132, 0.14)',
    rgb: '224, 192, 132', tint: '#e0c084', tintA: 0.20, hue: -157, sat: 1.02,
  },
  {
    key: 'violet',
    label: '紫晶',
    base: '#b9a8ec', deep: '#d6cbfa', soft: 'rgba(185, 168, 236, 0.14)',
    rgb: '185, 168, 236', tint: '#b9a8ec', tintA: 0.16, hue: 78, sat: 1.05,
  },
];

export const ACCENT_DEFAULT = ACCENTS[0].key;


// 图片图床开关：'' = 走本地相对路径（图片随 dist 打包，由 Cloudflare Pages 自带 CDN 服务，最稳）；
// 若要改用 GitHub + jsDelivr 图床（仓库 CloudWingX/cloudwing，需 push 且为公开后生效），填：
//   'https://cdn.jsdelivr.net/gh/CloudWingX/cloudwing@main/public'
export const IMG_CDN = '';
export const imgUrl = (p: string) => (p && p.startsWith('/') && IMG_CDN ? IMG_CDN + p : p);

// 侧栏天气卡片（数据来自 uapis.cn，无需 key）：
//   '' = 按访客 IP 自动定位（每位访客看到自己所在城市，不暴露站点所在地，默认推荐）
//   填城市名则可固定城市，例如 '北京'
export const WEATHER_CITY = '';

// 左侧栏底部音乐播放器（见 components/MusicPlayer.astro）与音乐子页面（pages/music）。
// ★2026-09-22 音乐导入（§67）：四首曲目由 D:\Download\music 的无损 FLAC 转码而来
//   （CF Pages 单文件 25MB 上限 → 320kbps MP3，8.8~13MB/首），封面为自制生成图
//   （源 FLAC 无内嵌封面），想换真实封面直接覆盖 public/music/covers/<id>.jpg。
// 歌词约定（零配置）：把 <id>.lrc 放进 public/music/lyrics/ 即自动启用同步歌词，
//   不需要改这里的任何字段；纯音乐曲目标 instrumental: true，歌词面板会显示「纯音乐」。
export type MusicTrack = {
  id: string; // 曲目 slug：封面 /music/covers/<id>.jpg、歌词 /music/lyrics/<id>.lrc 都跟它同名
  title: string;
  artist?: string;
  album?: string;
  src: string; // 音频路径（public 下，建议英文/数字文件名）
  cover?: string; // 专辑封面（音乐页唱片盘芯 + 曲目列表缩略图）
  instrumental?: boolean; // 纯音乐（无歌词，面板显示「纯音乐，请欣赏」）
  duration?: number; // 秒（静态展示用；实际播放以音频元数据为准）
  sizeMB?: number; // 转码后文件体积
  bitrate?: number; // kbps
  origin?: string; // 音源说明（无损转码链路）
};
export const MUSIC: MusicTrack[] = [
  {
    id: 'evolution-era',
    title: 'Evolution Era',
    artist: 'V.K克',
    album: '『Deemo』Song Collection',
    src: '/music/evolution-era.mp3',
    cover: '/music/covers/evolution-era.jpg',
    instrumental: true,
    duration: 292.11, // MP3 实测（源 FLAC 标称 280.9s，以浏览器元数据口径为准）
    sizeMB: 11.15,
    bitrate: 320,
    origin: 'FLAC 24bit/192kHz → MP3 320kbps',
  },
  {
    id: 'into-the-sky',
    title: 'Into the Sky <MODv>',
    artist: 'SawanoHiroyuki[nZk]',
    album: 'Avid / Hands Up to the Sky',
    src: '/music/into-the-sky.mp3',
    cover: '/music/covers/into-the-sky.jpg',
    duration: 229.8,
    sizeMB: 8.77,
    bitrate: 320,
    origin: 'FLAC 24bit/192kHz → MP3 320kbps',
  },
  {
    id: 'wings-of-piano',
    title: 'Wings of Piano',
    artist: 'V.K克',
    album: '『Deemo』Song Collection',
    src: '/music/wings-of-piano.mp3',
    cover: '/music/covers/wings-of-piano.jpg',
    instrumental: true,
    duration: 340.31, // MP3 实测（源 FLAC 标称 331.5s）
    sizeMB: 12.98,
    bitrate: 320,
    origin: 'FLAC 24bit/192kHz → MP3 320kbps',
  },
  {
    id: 'starry-night',
    title: '星が瞬くこんな夜に',
    artist: 'supercell',
    album: '魔法使いの夜 オリジナルサウンドトラック',
    src: '/music/starry-night.mp3',
    cover: '/music/covers/starry-night.jpg',
    duration: 230.5,
    sizeMB: 8.8,
    bitrate: 320,
    origin: 'FLAC 24bit/192kHz → MP3 320kbps',
  },
];

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
  // ★2026-09-18 三轮：0.5 → 0.45★（中途试过 0.34，露出下面的兜底底图后画面反而更亮，最终定 0.45）
  // 视频之上原本还有一层"上浅下深"的黑色遮罩（VIDEO_BG.scrimTop/Mid/Bottom），
  // 因为用户连续三轮都能看见它（"标题后方的黑色矩形" → "首页两边有瑕疵" →
  // "在导航栏和主容器两侧能看见边缘"），已**整块删除**（见 VideoBackground.astro 的注释）。
  // 压暗改到**视频自己的浓度**上：视频半透明叠在页面深色底上，调它就等于在它自己的
  // 图层里压暗 —— 整屏一致、没有任何边界。0.5 → 0.34 正好补回去掉遮罩后损失的那点对比度。
  opacityDark: 0.45,
  opacityLight: 0.3,
  // ★视频自身的亮度系数（2026-09-18 三轮新增）★
  // 这是**替代那层被删掉的遮罩**的手段：`filter: brightness()` 作用在视频自身上，
  // 等于在它自己的图层里压暗 —— 整屏一致、不会出现任何"薄膜边缘"，
  // 也不会多出一层盖在内容上的东西（那层东西用户已经指出三次）。
  // 素材中心有一块亮核（原像素最亮 rgb(251,255,255)），配合下面的兜底深色底
  // （VideoBackground.astro 的 `.video-bg { background: #05080c }`）一起压：
  // 实测跨 8 帧最差：标题 6.0（需 3）、副标题 5.3（需 4.5）。
  // ⚠️ 与 accent 色卡的 `--vid-hue/--vid-sat` 是**同一条 filter**，改这里时别把它们冲掉。
  // ⚠️ 改 opacity/dim 前先想清楚：`--vid-opacity-dark` 越低越会露出**下面的兜底底色**，
  //    所以"调低透明度"不等于"压暗"（实测越低越亮，见 VideoBackground.astro 的注释）。
  dim: 0.85,
  // ---- 下面 4 个 scrim* 令牌已废弃（2026-09-18 三轮）----
  // 它们驱动的 `.video-bg::after` 遮罩层已整块删除（用户三轮都说看得见那层）。
  // 保留字段只为兼容（旧代码/旧截图文档里还有引用），**不要再接回样式里**。
  scrimTop: 0.45,
  scrimMid: 0.75,
  scrimBottom: 0.82,
  scrimLight: 0.55,
};

export const SITE = {
  // 站点名（正文里显示，中文）
  title: '云翼',
  // 拉丁大字标题 / 英文品牌（hero 用，建议全大写短词）
  latin: 'CloudWing',
  // 一句话定位（hero 副标题）
  tagline: 'CloudWing（云翼）· 记录学习与折腾的过程',
  author: 'CloudWing_X',
  email: '246459267@qq.com',
  github: 'https://github.com/CloudWingX',
  bilibili: 'https://space.bilibili.com/470179349',
  // 关于页与 footer 使用的备注
  notice:
    '个人博客，设计与代码均为本人产出。',
  since: 2025,
};

/* ▍顶部导航（site.ts 是唯一数据源，Header.astro 渲染桌面顶栏 + 移动端抽屉）
   2026-09-19 晚：站长要求把「文章 / 归档 / 日志」三个子页面收进「记录」一个入口，
   鼠标悬停时浮出二级菜单（桌面端 hover + 键盘 focus-within；移动端抽屉里是分组标题 + 三个链接）。
   - 有 children 的项：桌面上是「记录 ▾」悬停下拉；父项 href 仍然可点（落到 /posts/）。
   - 当前路由落在任一 child 时，父项也亮（Header 的 isActive 已处理）。 */
export type NavItem = {
  href: string;
  label: string;
  no?: string;
  children?: { href: string; label: string }[];
};

export const NAV: NavItem[] = [
  { href: '/', label: '首页', no: '00' },
  {
    href: '/posts/',
    label: '记录',
    no: '01',
    children: [
      { href: '/posts/', label: '文章' },
      { href: '/blog/', label: '归档' },
      { href: '/log/', label: '日志' },
      { href: '/calendar/', label: '日历' },
    ],
  },
  { href: '/gallery/', label: '画廊', no: '02' },
  { href: '/music/', label: '音乐', no: '03' },
  { href: '/nav/', label: '导航', no: '04' },
  { href: '/about/', label: '关于', no: '05' },
  { href: '/account/', label: '互动', no: '06' },
];

/* ▍网站导航页（/nav/）的条目 —— 按用途分组的站点收藏夹。
   2026-09-19：条目已按站长给的清单正式填入；分组名/说明/标签都在这里改。
   - 加一个站点：往对应分组的 items 里加一行（http/https 开头的完整地址），
     name / desc / tag 一并写；不需要的条目直接删行，某组删空则该组整块不渲染。
   - ✓ 顺序即页面顺序：**游戏相关刻意排在最下面**（站长要求）。
   - 若临时想先占个位又没定地址，可把 href 写成 '#' 开头的字符串：
     页面会渲染成**不可点击**的虚线卡，不会把假地址带上线，也不会让访客点到死链。
   - 可选 icon：给一个站内图片路径（如 '/nav/cloudflare.png'）即可替换默认的首字母圆牌；
     不给就按 name 首字生成，全程不发外部请求（本站刻意不依赖第三方 favicon 服务）。 */
export const SITE_NAV: {
  group: string;
  hint?: string;
  items: { name: string; href: string; desc?: string; tag?: string; icon?: string }[];
}[] = [
  {
    group: 'AI 与云服务',
    hint: '模型接口与站点后台',
    items: [
      { name: 'DeepSeek 对话', href: 'https://chat.deepseek.com/', desc: '官方网页对话入口，写作与代码问答', tag: '对话', icon: '/nav/deepseek.svg' },
      { name: 'Kimi 开放平台', href: 'https://platform.kimi.com/console/api-keys', desc: '大模型 API 控制台，管理密钥与用量', tag: 'API', icon: '/nav/kimi.png' },
      { name: 'APINebula', href: 'https://apinebula.ai/', desc: '第三方模型中转，一个密钥接多家；需充值', tag: '中转', icon: '/nav/apinebula.svg' },
      // ⚠️ 原来的地址带账户 ID（dash.cloudflare.com/<32 位 hash>/...），那是账号凭据的一部分，
      //    公开页面上不放；要直达项目就自己在浏览器里存书签。
      { name: 'Cloudflare Pages', href: 'https://dash.cloudflare.com/', desc: '本站的托管控制台，登录后进入', tag: '部署', icon: '/nav/cloudflare.png' },
    ],
  },
  {
    group: '开发与工具',
    hint: '写代码时会打开的那几个',
    items: [
      { name: 'React Bits', href: 'https://www.reactbits.dev/', desc: '200+ 可直接复制的 React 动效与背景组件', tag: '组件', icon: '/nav/reactbits.png' },
      // 该站自身图标取不到：其 TLS 证书已过期（Node 与浏览器两侧一致报 CERT_HAS_EXPIRED），
      //    http 路径 404、备用路径同样证书失败。已按站长意见改用**通用 logo**：
      //    GitHub 官方 mark（simple-icons CC0 矢量，取白色版 —— 默认 #181717 在暗色卡上不可见）。
      { name: 'GitHub Proxy', href: 'https://github.akams.cn/', desc: 'GitHub 下载加速，支持 Clone / Releases / Raw', tag: '加速', icon: '/nav/github.svg' },
    ],
  },
  {
    group: '学习与刷题',
    hint: '练手与补基础',
    items: [
      { name: '力扣 LeetCode', href: 'https://leetcode.cn/', desc: '中文算法题库，周赛与题解社区', tag: '算法', icon: '/nav/leetcode.png' },
      { name: '柏码', href: 'https://www.itbaima.cn/zh-CN', desc: '计算机系列视频课程，基础资源免费', tag: '课程', icon: '/nav/itbaima.png' },
    ],
  },
  {
    group: '设计与素材',
    hint: '字体、模型、可商用资源',
    items: [
      { name: '找字体网 ZFONT', href: 'https://www.zfont.cn/', desc: '免费可商用中文字体下载，更新频繁', tag: '字体', icon: '/nav/zfont.png' },
      { name: '模之屋 PlayBox', href: 'https://www.aplaybox.com/', desc: '3D 模型、动作与插画创作分享社区', tag: '模型', icon: '/nav/aplaybox.png' },
    ],
  },
  {
    group: '效率与阅读',
    hint: '顺手会用到的',
    items: [
      { name: '打字鸭', href: 'https://daziya.com/', desc: '盲打指法、拼音与代码打字练习', tag: '练习', icon: '/nav/daziya.svg' },
      { name: '星辰云博客', href: 'https://blog.xingchencloud.top/p/19901205.html', desc: '《Github 镜像加速站点收集》，汇总可用镜像', tag: '文章', icon: '/nav/xingchen.png' },
    ],
  },
  {
    group: '游戏与游戏开发',
    hint: '平时逛得最多的那一类',
    items: [
      { name: 'Godot 引擎', href: 'https://godotengine.org/zh-cn/', desc: '免费开源 2D / 3D 游戏引擎与文档', tag: '引擎', icon: '/nav/godot.svg' },
      { name: '中文 Minecraft Wiki', href: 'https://zh.minecraft.wiki/', desc: '官方授权中文百科，方块 / 生物 / 红石 / 版本', tag: '百科', icon: '/nav/mcwiki.png' },
      { name: 'MC 百科', href: 'https://www.mcmod.cn/', desc: '国内最大的 MC 模组中文百科与教程', tag: '百科', icon: '/nav/mcmod.png' },
      // 该站自身图标取不到：Cloudflare 机器人防护对非浏览器请求一律 403，CDP 真实浏览器
      //    等 12s 仍未过 JS 挑战（标题停在"请稍候…"）。已按站长意见改用**通用 logo**：
      //    CurseForge 官方 mark（simple-icons CC0 矢量，保留其品牌橙 #F16436）。
      { name: 'CurseForge', href: 'https://www.curseforge.com/minecraft', desc: '全球最大的 MC 模组与整合包托管平台', tag: '模组', icon: '/nav/curseforge.svg' },
      { name: 'MinecraftShader', href: 'https://minecraftshader.com/', desc: 'MC 光影、材质包与模组资源，附安装教程', tag: '光影', icon: '/nav/minecraftshader.png' },
      { name: 'NameMC', href: 'https://zh-cn.namemc.com/minecraft-skins', desc: 'MC 皮肤库与玩家 ID 查询', tag: '皮肤', icon: '/nav/namemc.png' },
      { name: '地形师茶馆', href: 'https://terratea.cc/', desc: 'MC 地形创作社区，WorldMachine / WorldPainter 教程', tag: '地形', icon: '/nav/terratea.png' },
      { name: '方块小镇 Yuushya', href: 'https://yuushya.com/townscape/', desc: 'MC 建筑向模组，1000+ 建材与方块建模系统', tag: '建筑', icon: '/nav/yuushya.png' },
      { name: 'Mooncell', href: 'https://fgo.wiki/w/%E8%8B%B1%E7%81%B5%E5%9B%BE%E9%89%B4', desc: 'FGO 中文 Wiki，英灵图鉴与数值检索', tag: '图鉴', icon: '/nav/fgo.png' },
    ],
  },
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
