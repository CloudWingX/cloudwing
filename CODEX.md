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
| `/about/` | pages/about.astro | `about-route` | 履历时间线 + MagicBento + Lanyard 工牌 |
| `/account/` | pages/account.astro | `auth-route` | 互动：giscus 留言板（配置为空时占位）+ GridScan 背景 |
| `/404` | pages/404.astro | — | — |

## 三条硬规则
1. **ReactBits 原码不动**：`src/components/ReactBits/*` 是官方 JS/CSS 原版。只允许：宿主组件（`src/components/*.jsx`）改 props / 包尺寸 / 定位 / 主题适配。改核心前先确认。
2. **隐私红线**：About / README / 作品正文不得出现真实姓名、学校、企业名（用户明确要求）。
3. **软导航陷阱**：站内用 Astro `<ClientRouter/>`。任何「点按钮/标签要生效」的交互**不要**把监听绑到首屏 DOM 元素上，要绑 `document` + 幂等标记（参考 `Header.astro` 汉堡菜单、`works/index.astro` 分类，均用 `window.__cw…Wired` + document 委托，并在 `astro:page-load` 兜底）。

## 主题机制（浅/深）
- Base 内联脚本首屏读 `cw-theme-pref`（localStorage→session→cookie）设 `html[data-theme]`。
- `ui.js` `.theme-toggle` 事件委托：白日/夜间两态，落盘三通道。
- 组件适配看 `html[data-theme]`（全局 CSS 或宿主 JS 里 MutationObserver）。

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
1. **不要在仓库提交 `package-lock.json`**：它是 Windows 生成、会让 Cloudflare Linux `npm ci` 报 `Missing @emnapi/*`。仓库无 lock → 云端自动 `npm install`（已在 .gitignore 排除 lock）。
2. **构建 shim**：`plugins/vite-cjs-inline-shim.mjs` 修复 Node24+Astro7.3 的 `require is not defined`（picomatch CJS）。不要删，也不要改 node_modules。
3. 改动后必须 `npm run build`；Cloudflare 检测到 push 到 `main` 自动重建部署（约 1–2 分钟）。
4. 预览旧进程可能残留：port 4321 已占用时 `astro preview stop` 或复用现有实例；本机无公网时本地截图用 CDP（headless Edge :9222，见 SESSION_HANDOFF 或本地脚本习惯）。

## 下一步建议（按需）
- `site.ts` `GISCUS` 还是空的：互动页留言板要启用需填 repo/repoId/categoryId 后重建。
- 联系方式已填：邮箱 `246459267@qq.com`、GitHub `CloudWingX`、Bilibili `https://space.bilibili.com/470179349`。
- 首页 01「作品库」板块仍是 CardSwap 示例卡（W-001..003 演示文案），可改成真实最新作品轮播。
- 03「关于本站」首页块是静态简介卡，可考虑读取 content 或保持文案一致。
- works 目前 2 篇为「图书管理系统」「本站诞生部署记」，继续补充作品即可。

## 验证方式备忘
- 上线地址：`https://cloudwing.pages.dev`（Cloudflare Pages 项目名 cloudwing，Git 自动部署）
- 仓库：`https://github.com/CloudWingX/cloudwing`（公开）
- 本机预览：`http://localhost:4321`；移动端菜单/软导航测试在无痕窗口最准
