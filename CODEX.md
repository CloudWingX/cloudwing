# CODEX 交接指南 — CloudWing / 云翼

> 给 Codex（或任何接手开发者）的第一份文档。请先读本文件再动代码。

## 项目一句话
Astro 7 静态个人档案站（磨砂玻璃扁平化 UI，黑白灰体系，浅/深双主题）。当前已上线：源码在 GitHub `CloudWingX/cloudwing`，站点由 Cloudflare Pages 自动构建部署到 `https://cloudwing.pages.dev`。

## 立即能跑
```bash
cd D:\deep seek workplace\endfield-blog   # Windows 本机路径
$env:npm_config_cache = 'D:\deep seek workplace\.npm-cache'
npm install
npm run dev          # http://localhost:4321
npm run build        # 产物 → dist/
npm run preview      # 预览 dist（--port 4321 --host 127.0.0.1）
```

## 目录速览
```
src/
  site.ts               ← 站点信息 / NAV / IMG_CDN 图床开关 / GISCUS 配置 / imgUrl()
  content.config.ts     ← works / shots 集合 schema
  content/works/*.md    ← 作品（每件 1 个 md，自动生成卡片+详情页）
  content/shots/*.md    ← 影集条目（40 个，对应 public/shots/mc/*.webp）
  layouts/Base.astro    ← 全站壳：主题引导 / Header / Footer / Particles / fonts
  layouts/WorkLayout.astro ← 作品详情页布局（含 ext-link 仓库按钮）
  pages/                ← index / works / gallery / about / account / 404
  components/ReactBits/ ← React Bits 官方原码（gsap/three/ogl），勿改核心
  scripts/ui.js         ← 全局动效 / 主题切换事件
  styles/global.css     ← 设计 token + 玻璃基础
  styles/motion.css     ← 动效 + html[data-theme='dark'] 深色 token 覆盖
public/                 ← shots/mc/*.webp(40) + covers/*.svg + favicon + lanyard
plugins/vite-cjs-inline-shim.mjs ← 构建 shim（勿删，见“构建坑”）
```

## 页面与 bodyClass
| 路由 | 文件 | bodyClass | 说明 |
|---|---|---|---|
| `/` | pages/index.astro | `home-route` | hero + 01作品库/02画廊/03关于 三板块（左右交错文字）|
| `/works/` | pages/works/index.astro | — | 卡片网格 + 玻璃分段单选分类（01/02 板块数据源）|
| `/works/[slug]/` | pages/works/[slug].astro | — | 详情（WorkLayout + Markdown）|
| `/gallery/` | pages/gallery/index.astro | — | 40 图玻璃卡网格 + `<dialog>` 大图 |
| `/about/` | pages/about.astro | `about-route` | 履历时间线 + MagicBento + Lanyard 工牌 + **VariableProximity 文字**（h1 与两个小节标题：光标邻近可变字重） |
| `/account/` | pages/account.astro | — | 互动：giscus 留言板（配置为空时占位）+ **全站粒子背景**（V53 起与其它页统一，GridScan/深色令牌已移除） |
| `/404` | pages/404.astro | — | — |

## 三条硬规则
1. **ReactBits 原码不动**：`src/components/ReactBits/*` 是官方 JS/CSS 原版。只允许：宿主组件（`src/components/*.jsx`）改 props / 包尺寸 / 定位 / 主题适配。改核心前先确认。
2. **隐私红线**：About / README / 作品正文不得出现真实姓名、学校、企业名（用户明确要求）。
3. **软导航陷阱**：站内用 Astro `<ClientRouter/>`。任何「点按钮/标签要生效」的交互**不要**把监听绑到首屏 DOM 元素上，要绑 `document` + 幂等标记（参考 `Header.astro` 汉堡菜单、`works/index.astro` 分类，均用 `window.__cw…Wired` + document 委托，并在 `astro:page-load` 兜底）。
4. **ReactBits 组件用法限制（VariableProximity）**：`/about/` 的标题文字用了 `VariableProximity`（宿主 `src/components/ProximityText.jsx`，依赖 `motion`）。它把文本按**空格**分词、每个词 `nowrap` → **中文长句会被当成一个不可换行的词导致溢出，切勿用于中文长段落**，只适合短文本 / 拉丁标题。宿主已用内联 `fontFamily: var(--font-display)` 覆盖组件默认的 Roboto Flex，保持全站字体一致（Outfit 支持 wght 可变轴，效果照常）。

## 主题机制（浅/深）
- Base 内联脚本首屏读 `cw-theme-pref`（localStorage→session→cookie）设 `html[data-theme]`。
- `ui.js` `.theme-toggle` 事件委托：白日/夜间两态，落盘三通道。
- 组件适配看 `html[data-theme]`（全局 CSS 或宿主 JS 里 MutationObserver）。
- **背景已全站统一**（V53）：所有页面（含 `/account/`、`/search/`）都用 `PageParticlesBackground` 粒子层，`Base.astro` 的 `withParticles` 恒为 `true`；页面级 `auth-route` 深色令牌与其判断逻辑已删除。新增页面无需再处理背景。

## 图片与图床
- 图片统一经 `src/site.ts` 的 `imgUrl()`：`IMG_CDN=''`（当前）走本地相对路径，图片随 `dist` 由 Cloudflare Pages CDN 服务——**稳定，勿改回 jsDelivr**（国内不稳踩过坑）。
- 影集 40 张原 PNG 已转 webp（约 3MB）。原 PNG 备份于工作区外 `D:\deep seek workplace\mc-originals-backup\`（不在仓库）。
- 加新影集：webp 放 `public/shots/mc/` + `src/content/shots/` 加一条 md（`image: /shots/mc/mc-xxx.webp`）。

## 作品（works）怎么加
复制 `src/content/works/w001-lib.md` 或 `w002-site.md`：
```yaml
title / summary / date / order(→W-00x 编号) / tags[] / tools[] / state / cover / link?
```
- `link`（可选）会在详情页元信息显示「仓库/地址 ↗」胶囊按钮。
- 列表自动出现 + 分类分段自动统计，无需改代码。

## 构建 / 部署坑（重要）
1. **不要在仓库提交 `package-lock.json`**：Windows 生成的 lock 会让云端 Linux `npm ci` 报 `Missing @emnapi/*`；仓库无 lock 时云端自动 `npm install`（已在 .gitignore 排除）。
2. **依赖版本要 pin 关键 peer**：`react` / `react-dom` 已固定为精确 `19.2.8`（`@react-three/fiber@9.7` 的 peer 是 `>=19 <19.3`，用 `^` 会解析到 19.3 导致云端 ERESOLVE 构建失败）。另有 `.npmrc` `legacy-peer-deps=true` 兜底。
3. **构建 shim**：`plugins/vite-cjs-inline-shim.mjs` 修复 Node24+Astro7.3 的 `require is not defined`（picomatch CJS）。不要删，也不要改 node_modules。
4. 改动后必须 `npm run build`；Cloudflare 检测到 push 到 `main` 自动重建部署（约 1–2 分钟）。
5. 预览旧进程可能残留：port 4321 被占时 `astro preview stop` 或复用现有实例；本地截图用 CDP（headless Edge :9222）。

## 下一步建议（按需）
- ✅ giscus 留言板已启用（`src/components/GiscusComments.astro` 公共组件，互动页 + **作品详情页**共用；主题随站点浅/深）；首条评论由登录用户发出时自动创建 discussion。
- ✅ RSS 已加：`/rss.xml`（`src/pages/rss.xml.ts`，依赖 `@astrojs/rss`），Base head 有 auto-discovery、Footer 有入口。
- ✅ 作品详情页有**上/下篇导航**（`[slug].astro` 计算相邻条目 → WorkLayout `newer`/`older` props）。
- ✅ **全站搜索**：Pagefind（`npm run build` = `astro build && pagefind --site dist`），UI 在 `/search/`，Header 有搜索入口；`build:fast` 可跳过索引。
- ✅ 首页 01 板块已接**真实最新 3 篇作品**（读 works 集合，卡片可点进详情）。
- ✅ 联系方式已填（邮箱 / GitHub / Bilibili）。
- ✅ **sitemap**：`@astrojs/sitemap` 生成 `sitemap-index.xml` / `sitemap-0.xml`（已排除 `/search/`），`public/robots.txt` 已声明 Sitemap 地址。
- ✅ **og:image**：Base 输出 og:image / twitter:summary_large_image / canonical；默认图 `public/og/default.png`，作品页自动用 `/og/<id>.png`（不存在则回退默认）。新增作品后跑 `npm run og` 重新生成分享图（脚本 `scripts/gen-og.mjs`，基于 sharp）。
- ✅ **关于页工牌 = 拉绳开关**：桌面端工牌贴在页面右上边缘（`.ly-floater` 绝对定位 `top:0; right:0`，430×720），**向下拖拽 96px 切换白日/夜间主题**，带“灯闪”反馈；手势 pointerdown 限定在工牌内、move/up 挂 window（拖拽可超出容器，不受范围限制）；仅 ≥1025px 启用（避免移动端滚动误触）。
- ✅ **动效系统（V51）**：
  - 首页：hero 用 `[data-ent]`（加载入场）；**下方三个板块改为滚动显现**（`.sli`，进入视口时上滑 56px 淡入，逐项错峰 70ms）——由 `ui.js` 的 `scrollFade()` 驱动，选择器含 `.home-block .wrap > * / .acc-holder / .ph-card`。
  - 其他页面：进入时 `main` 整体淡入上浮（`main.page-enter`），`[data-ent]` 元素**自动按 DOM 顺序排入场延迟**（未手写 `--ad` 时，最多 8 档 × 70ms），作品详情页也已补齐入场。
- ⚠️ **互动页 GridScan 背景铺满（V52 已修）**：GridScan 只在挂载时按 `container.clientHeight` 测量一次、之后仅 `window.resize` 重测；Astro 岛水合早于布局稳定时会测得偏小（实测 670px vs 视口 900px）→ 网格只覆盖上半屏。`account.astro` 已加：水合后分档延时触发 `resize` 重测 + `ResizeObserver` 监听容器 + CSS 兜底（`.gs-fixed .gridscan/canvas { width/height:100% !important }`）。同类 fixed 全屏 canvas 组件如有此问题可复用该模式。
  - ⚠️ 两个已修坑：① Astro 软导航会按新文档 `<html>` 覆写属性，**客户端加的 `js` 类会丢**（所有 `html.js .sli/[data-ent]` 规则随之失效）→ 在 `astro:after-swap` 与 `pageEnter()` 里补回；② `IntersectionObserver` 只在跨阈值时回调，**一次性跳转滚动**（End/PageDown/锚点）会让元素从下方直接到上方而不回调 → 加滚动节流兜底扫描（`r` top < 94%vh 或 bottom < 0 即显现）。
- 可选后续：画廊二次分类、作品正文图片灯箱、暗色下 giscus 主题微调、评论数展示。
- works 目前 2 篇（图书管理系统、本站诞生部署记），继续补作品即可；03「关于本站」首页块仍是静态简介卡。

## 验证方式备忘
- 上线地址：`https://cloudwing.pages.dev`（Cloudflare Pages 项目名 cloudwing，Git 自动部署）
- 仓库：`https://github.com/CloudWingX/cloudwing`（公开）
- 本机预览：`http://localhost:4321`；移动端菜单/软导航测试在无痕窗口最准
