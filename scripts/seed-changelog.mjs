// 生成「站点更新记录」内容文件：一天一个 md，items 写当天做了什么。
// 数据来自仓库真实的提交历史（git log），只做归纳，不编造。
import fs from 'node:fs';
import path from 'node:path';

const days = [
  {
    date: '2026-09-14',
    items: [
      { kind: '上线', title: '子页面统一三栏侧栏', note: '作品库 / 作品详情 / 画廊 / 关于 / 互动 / 搜索 / 404 全部改为 左导航树 + 内容 + 右挂件' },
      { kind: '上线', title: '侧栏个人信息卡', note: '横幅 + 圆形头像（取自关于页头像），头像点击直达关于页' },
      { kind: '优化', title: '两栏滚动统一', note: '去掉侧栏内部滚动条，左右两栏共用同一吸顶值；左栏分组默认折叠' },
      { kind: '优化', title: '导航栏下滑自动收起', note: '0.28s 动画，收起后侧栏占满可用高度，两者不再重叠' },
      { kind: '修复', title: '粒子背景递归报错', note: '鼠标每次移动都抛 RangeError: Maximum call stack size exceeded' },
      { kind: '优化', title: '关于页吊牌浮于文字之上', note: '吊牌脱离文档流，标题回到页面顶部，版面恢复正常流' },
    ],
  },
  {
    date: '2026-09-11',
    items: [
      { kind: '优化', title: '移除失效的 MiSans 字体外链', note: '上游仓库已 404，字体从未生效，却是一个阻塞渲染的跨域请求' },
      { kind: '上线', title: '正文拉丁词邻近可变字重', note: '关于页正文里的英文/数字随光标变重，中文排版完全不动' },
      { kind: '上线', title: '标题接入 React Bits VariableProximity', note: '与正文效果同一套参数（wght 400 → 900）' },
      { kind: '优化', title: '互动页背景与全站统一', note: '改用全站粒子层，去掉单独的 GridScan 深色背景' },
      { kind: '修复', title: '互动页背景高度不足', note: 'GridScan 只铺 670px，补了 resize 重测与 ResizeObserver' },
    ],
  },
  {
    date: '2026-09-10',
    items: [
      { kind: '上线', title: '首页滚动显现 + 各页入场动效', note: '滑块显现、整页淡入、自动错峰延迟' },
      { kind: '上线', title: '关于页挂绳工牌', note: '贴右上角垂下，向下拖拽切换白日/夜间' },
      { kind: '上线', title: 'SEO：sitemap 与社交分享图', note: 'sitemap-index.xml、og:image、Twitter 卡片、canonical' },
      { kind: '上线', title: '作品页上下篇导航 + 评论区', note: 'giscus 讨论区（公共组件，主题跟随站点）' },
      { kind: '上线', title: '/rss.xml 订阅源', note: '作品档案更新自动发现' },
      { kind: '修复', title: 'Cloudflare 构建 ERESOLVE', note: '锁定 react/react-dom 19.2.8 + .npmrc legacy-peer-deps' },
    ],
  },
  {
    date: '2026-09-09',
    items: [
      { kind: '内容', title: '首页 01 板块展示真实作品', note: 'CardSwap 改为读取内容集合里最新 3 件' },
      { kind: '内容', title: '补齐联系方式', note: '邮箱与 B 站链接' },
    ],
  },
  {
    date: '2026-09-08',
    items: [{ kind: '内容', title: 'CODEX.md 交接文档', note: '记录硬规则与构建注意事项，同步 README 与站点 URL' }],
  },
  {
    date: '2026-09-07',
    items: [
      { kind: '上线', title: '作品库分类筛选', note: '单条磨砂玻璃分段控件，document 事件委托保证软导航后可用' },
      { kind: '内容', title: '新增 W-002《本站搭建与部署记录》', note: '含仓库链接字段与按钮' },
      { kind: '修复', title: '汉堡菜单软导航后失效', note: '改 document 级事件委托 + window 单例状态' },
      { kind: '优化', title: '图片改回本地相对路径', note: 'jsDelivr 国内不稳，随 dist 由 Cloudflare 分发' },
      { kind: '优化', title: '图片瘦身 180MB → 约 3MB', note: 'PNG 全部转 webp' },
      { kind: '上线', title: '站点初版', note: 'Astro 静态站 + 磨砂玻璃扁平化 UI' },
    ],
  },
];

const outDir = 'src/content/changelog';
fs.mkdirSync(outDir, { recursive: true });
const yamlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
for (const d of days) {
  const body = [
    '---',
    `date: ${d.date}`,
    'items:',
    ...d.items.flatMap((it) => [
      `  - kind: ${yamlStr(it.kind)}`,
      `    title: ${yamlStr(it.title)}`,
      ...(it.note ? [`    note: ${yamlStr(it.note)}`] : []),
    ]),
    '---',
    '',
    `<!-- ${d.date} 的更新记录：一天一个文件，追加 items 即可，侧栏「更新日历」会自动聚合。 -->`,
    '',
  ].join('\n');
  const file = path.join(outDir, `${d.date}.md`);
  fs.writeFileSync(file, body, 'utf8');
  console.log(`${file}  ${d.items.length} 条`);
}
