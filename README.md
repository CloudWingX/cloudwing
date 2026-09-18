# CloudWing / 云翼

个人学习与作品档案站 —— Astro 静态站，**暗色电影感 + 玻璃拟态**（雾蓝强调色、全站背景视频、磨砂玻璃卡片）。
记录代码、图集与学习轨迹，按编号留存、过程可追溯。

> 🔧 **给接手开发者的首读文件：[`docs/HANDOFF.md`](./docs/HANDOFF.md)** —— 完整交接文档：环境硬约束、
> 目录职责、三条铁律、踩坑记录（症状→根因→修法）、验证与部署手法、遗留待决项。
> 简版硬规则见 [`CODEX.md`](./CODEX.md)；下面是概览。

## 现状速览

| 项 | 现状 |
|---|---|
| 线上 | <https://cloudwing.pages.dev>（推 `main` → Cloudflare Pages 自动构建，约 30–90 秒） |
| 仓库 | GitHub `CloudWingX/cloudwing`（公开，分支 `main`） |
| 技术栈 | Astro 7.3（静态输出）+ React 岛 + gsap；React Bits 组件**原码**放 `src/components/ReactBits/` |
| 主题 | **只有一套暗色**：亮色主题与切换按钮已删除 |
| 导航 | `fixed` 通栏 → 滚动收成胶囊（容器 1300 / 1140），**不再下滑收起、没有二级菜单** |
| 分类入口 | 只在**左栏导航树**（子页三栏）；手机端（<1200px 侧栏隐藏）目前没有分类入口 |
| 搜索 | **悬浮窗**（Pagefind），入口：`⌘/Ctrl + K`、左栏、移动端菜单（非独立页面） |
| 背景 | 自托管视频 `public/media/bg-loop.mp4` + React Bits Particles 粒子层 |
| 首页 | Hero（两行大标题 + 副标题 + 统计 + 技术标签 ｜ 右侧**磨砂玻璃代码卡片**，底部 5 个强调色预设）+ 最新作品 / 精选影像 / 关于预览 |
| 强调色 | 5 套预设（雾蓝 / 镜蓝 / 极光 / 余烬 / 紫晶）：点一下**同步**换强调色 + 整页色调 + 代码高亮，900ms 中间色过渡 |
| 子页面 | 三栏布局（左导航树 + 内容 + 右挂件）、更新日历、天气卡、音乐播放器 |
| 订阅 | 作品档案 **RSS** → `/rss.xml`（head 自动发现 + 页脚入口） |

## 本地运行

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # astro build + pagefind 索引
npm run build:fast # 只 astro build（改样式时更快）
npm run preview    # 本地预览产物
npm run og         # 重新生成分享图
```

> 注意：Node 24 + Astro 7.3 下构建依赖项目内插件 **`plugins/vite-cjs-inline-shim.mjs`**
> （解决 picomatch 的 `require is not defined`）。**不要**改动 `node_modules`。

## 目录速览

```text
src/
  site.ts                  ← 站点信息 / NAV / IMG_CDN 图床开关 / GISCUS / MUSIC / WEATHER_CITY
  content.config.ts        ← works（作品）/ shots（影集）/ changelog（更新记录）schema
  content/works/*.md       ← 每件作品一个 Markdown → 自动生成卡片与详情页
  content/shots/*.md       ← 影集条目（title/date/game/image/aspect）
  content/changelog/*.md   ← 一天一个文件，驱动侧栏「更新日历」
  pages/                   ← index / works / gallery / about / account / 404 / rss.xml
  components/ReactBits/    ← React Bits 官方原码（**只允许在宿主层改**，见铁律三）
  components/*.jsx         ← 宿主层（Particles / Lanyard / 强调色等适配）
  layouts/Base.astro       ← 全局壳：暗色引导、Header/Footer、背景视频、Particles
  scripts/ui.js            ← 全站交互中枢（动效 / 侧栏 / 搜索 / 音乐都在这）
  scripts/hero-theme.js    ← 首页强调色预设（补间 + 换色）
  styles/global.css        ← 设计 token + 玻璃基础；styles/motion.css ← 动效 token
plugins/                   ← 构建期插件（CJS shim、React 安全卸载），勿删
public/
  shots/mc/*.webp          ← 影集 40 张（已转 webp，共 ~3MB）
  covers/                  ← 作品封面
  media/bg-loop.mp4        ← 背景视频（约 15.5MB，随站点打包）
  favicon.svg / favicon-dark.svg
```

## 图片 / 图床

- 影集原图已从 PNG（共 180MB）压缩为 **webp**（1600w q78，共 ~3MB），存于 `public/shots/mc/`。
  （原 PNG 备份已随工作区清理删除，仓库里的 webp 是当前唯一副本。）
- 页面图片统一走 `src/site.ts` 的 `imgUrl()`；当前 `IMG_CDN = ''`，走本地相对路径
  （图片随 `dist` 由 Cloudflare Pages 自带 CDN 服务）。**不要改回 jsDelivr 图床**——国内访问不稳，已踩坑回退。

## 内容怎么加

- **作品**：复制 `src/content/works/w001-lib.md` → 改 frontmatter（title/summary/date/**order**/tags/tools/state/cover/link）与正文；封面放 `public/covers/`。`order` 决定编号（W-00x）与排序，`tags` 进入左栏分类。
- **影集**：webp 放 `public/shots/mc/`，在 `src/content/shots/` 加一条 md（image 指向 `/shots/mc/mc-xxx.webp`）。
- **更新记录**：`src/content/changelog/YYYY-MM-DD.md`（一天一个文件，`items[]` 写 kind/title/note），侧栏「更新日历」会自动聚合。
- **留言板**：`site.ts` 的 `GISCUS` 填 repo/repoId/categoryId 后重建。

## 验证

全部脚本在 `scripts/`，用法 `node scripts/<名>.mjs [url]`（前置：本地预览已起 + 无头浏览器 9222 已起）。
⚠️ **必须串行跑**，并发会产生大面积假失败。

| 脚本 | 覆盖 | 基线 |
|---|---|---|
| `smoke.mjs` | 总入口：溢出 / 异常 / 侧栏同步 / 软导航 / 手机端 | **45/45** |
| `verify-hero.mjs` | 首页 Hero 几何、与主栅格对齐、两行标题、强调色预设、**代码卡片磨砂玻璃** | **88/88** |
| `verify-home.mjs` | 首页四层结构 / 图片策略 / SEO | **23/23** |
| `verify-nav-shrink.mjs` | 导航三态 + 移动端汉堡（含"抽屉已无分类入口"） | **42/42** |
| `verify-nav.mjs` | 导航几何、无遗留二级菜单 | **14/14** |
| `verify-brand.mjs` | 品牌标志 | **10/10** |
| `verify-theme.mjs` | 单主题不变量（恒为暗色） | **11/11** |
| `verify-redesign.mjs` | 玻璃令牌、减少动态、导航过渡 | **16/16** |
| `verify-search.mjs` | 搜索悬浮窗（懒加载 / 快捷键 / 软导航后可用） | **17/17** |
| `verify-videobg.mjs` | 背景视频 + hero 文字真实像素对比度 + 容器无分界线 | **22/22** |
| `verify-videobg-global.mjs` | 全站视频一致性、软导航不重建 | **25/25** |
| `contrast-audit.mjs` | WCAG 对比度审计 | **0 处不达标** |
| `mobile-shots.mjs` | 三机型 × 5 页截图 + 横向溢出 | **15/15 无溢出** |
| `diag-errors.mjs` | 逐页 JS 异常计数 | **7 页 0 异常** |
| `diag-424.mjs` | React `error #424` 诊断（含压力复现开关） | **0 命中** |

## 发布到 GitHub + Cloudflare Pages

- 仓库已配置：origin = `https://github.com/CloudWingX/cloudwing.git`（公开，分支 `main`）。
- 每次 `git push origin main` → Cloudflare Pages 自动构建部署（build `npm run build`，产物 `dist`）。
- 推送后**用内容特征确认上线**（不要用 chunk 哈希）：
  `node scripts/poll-deploy.mjs --have '<正则>' --not '<正则>'`。
- ⚠️ **不要提交 `package-lock.json`**（已在 .gitignore）：Windows 生成的 lock 会让云端 Linux `npm ci` 报错；
  仓库无 lock 时 Cloudflare 自动用 `npm install`。

## 上线前清单

- [x] 站点信息 / NAV 已配置；GitHub 已填 `CloudWingX`
- [x] `site.ts` 邮箱 / Bilibili 已填
- [x] `astro.config.mjs`：`site` = `https://cloudwing.pages.dev`（SEO/canonical），已接 `@astrojs/sitemap`
- [x] 隐私确认：About 页与 README 不出现真实姓名 / 学校 / 企业
