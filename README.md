# CloudWing / 云翼

个人学习与作品档案站 —— Astro 静态站，暗色电影感玻璃 UI（雾蓝强调色、全站背景视频）。
记录代码、图集与学习轨迹，按编号留存、过程可追溯。

> 🔧 **给接手开发者的首读文件：[`docs/HANDOFF.md`](./docs/HANDOFF.md)** —— 完整交接文档：环境硬约束、
> 目录职责、三条铁律、12 条踩坑记录（症状→根因→修法）、验证与部署手法、遗留待决项。
> 简版硬规则见 [`CODEX.md`](./CODEX.md)；下面是面向访客的概览。

- 技术栈：Astro 7.3（静态输出）、React 岛、gsap、React Bits 组件原码（`src/components/ReactBits/`）
- 页面：首页（Hero + 最新作品 / 精选影像 / 关于预览 四层）、作品库（卡 → 详情；分类在顶部导航的下拉二级菜单里）、画廊（玻璃网格 + 大图，分类同样在导航二级菜单）、关于（履历 + MagicBento + Lanyard 吊牌）、互动（giscus 留言板）
- 搜索：**悬浮窗**（Pagefind，`⌘/Ctrl + K` 或顶栏按钮），不是独立页面
- 订阅：作品档案 **RSS** → `/rss.xml`（head 自动发现 + 页脚入口）
- 背景：自托管**背景视频**（`public/media/bg-loop.mp4`）+ React Bits **Particles** 粒子层（`PageParticlesBackground`）
- 子页面：三栏布局（左导航树 + 内容 + 右挂件）、更新日历、天气卡；顶部导航下滑自动收起 → 滚动收成胶囊
- 自检：`node scripts/smoke.mjs`（45 项断言，测本地或线上）
- 部署：GitHub `CloudWingX/cloudwing`（公开）→ Cloudflare Pages 自动构建 → `https://cloudwing.pages.dev`

## 本地运行

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 输出 dist/
npm run preview    # 本地预览产物
```

> 注意：本机 Node 24 + Astro 7.3 下 build 依赖项目内插件
> `plugins/vite-cjs-inline-shim.mjs`（解决 picomatch 的 `require is not defined`），
> **不要**改动 node_modules。npm 可用自定义缓存：`$env:npm_config_cache='<cache>'`。

## 目录速览

```text
src/
  site.ts                  ← 站点信息 / NAV / IMG_CDN 图床开关 / GISCUS 配置
  content.config.ts        ← works（作品）/ shots（影集）集合 schema
  content/works/*.md       ← 每件作品一个 Markdown → 自动生成卡片与详情页
  content/shots/*.md       ← 影集条目（title/date/game/image/aspect）
  pages/                   ← index / works / gallery / about / account / 404
  components/ReactBits/    ← React Bits 官方原码（**只允许在宿主层改**）
  layouts/Base.astro       ← 全局壳：暗色引导、Header/Footer、背景视频、Particles
  scripts/ui.js            ← 全站交互中枢（动效/侧栏/搜索/音乐都在这）
  styles/global.css        ← token + 玻璃基础；styles/motion.css ← 动效 token
public/
  shots/mc/*.webp          ← 影集 40 张（已转 webp，共 ~3MB）
  covers/                  ← 作品封面
  media/bg-loop.mp4        ← 背景视频（约 15.5MB，随站点打包）
  favicon.svg / favicon-dark.svg
```

## 图片 / 图床

- 影集原图已从 PNG（共 180MB）压缩为 **webp**（1600w q78，共 ~3MB），存于 `public/shots/mc/`。
  （原 PNG 备份 `mc-originals-backup/` 已随工作区清理删除，仓库里的 webp 是当前唯一副本。）
- 页面图片统一经 `src/site.ts` 的 `imgUrl()` 输出；当前 `IMG_CDN = ''`，走本地相对路径
  （图片随 `dist` 由 Cloudflare Pages 自带 CDN 服务）。**不要改回 jsDelivr 图床**——国内访问不稳，已踩坑回退。
- 只影响 `/shots/…` 等静态图；ReactBits 组件原码不动，仅宿主/页面拼前缀。

## 内容怎么加

- **作品**：复制 `src/content/works/w001-lib.md` → 改 frontmatter（title/summary/date/order/tags/tools/state/cover/link）与正文；封面放 `public/covers/`。`link` 可选，详情页会显示仓库/地址按钮。
- **影集**：webp 放 `public/shots/mc/`，在 `src/content/shots/` 加一条 md（image 指向 `/shots/mc/mc-xxx.webp`）。
- **留言板**：`site.ts` 的 `GISCUS` 填 repo/repoId/categoryId 后重建。

## 发布到 GitHub + Cloudflare Pages

- 仓库已配置：origin = `https://github.com/CloudWingX/cloudwing.git`（公开，分支 `main`）。
- 每次 `git push origin main` → Cloudflare Pages 自动构建部署（build `npm run build`，产物 `dist`）。
- 线上地址：`https://cloudwing.pages.dev`
- ⚠️ **不要提交 `package-lock.json`**（已在 .gitignore）：Windows 生成的 lock 会让云端 Linux `npm ci` 报错，仓库无 lock 时 Cloudflare 自动用 `npm install`。

## 上线前清单

- [x] 站点信息 / NAV 已配置；GitHub 已填 `CloudWingX`
- [x] `site.ts` 邮箱 / Bilibili 已填
- [x] `astro.config.mjs`：`site` = `https://cloudwing.pages.dev`（SEO/canonical），已接 `@astrojs/sitemap`
- [x] 隐私确认：About 页与 README 不出现真实姓名 / 学校 / 企业
