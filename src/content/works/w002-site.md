---
title: CloudWing 云翼 · 本站的诞生与部署
summary: 用 Astro 从零搭建个人档案站、压缩图片资产、推上 GitHub，并接到 Cloudflare Pages 自动部署的全过程记录——也就是你现在正在浏览的这个网站本身。
date: 2026-09-07
order: 2
tags: [网站, 部署]
tools: [Astro, React, GitHub, Cloudflare Pages, npm]
state: 已公开
cover: /covers/w002-site.svg
link: https://github.com/CloudWingX/cloudwing
---

## 这个作品是什么

这不是一次性的项目交付，而是一个"会继续生长的站点"：本站（CloudWing / 云翼）从创建、静态构建、图片瘦身，到发布 GitHub、接入 Cloudflare Pages 免费托管与自动部署，全程留档在这里，作为"过程可追溯"的第一条案例。

## 关键节点

### 1. 技术与结构

- **Astro 7.3 静态站**（`output: 'static'`，目录式路由 `format: 'directory'`），部署目标是 Cloudflare Pages。
- React 生态（`@astrojs/react`）承载交互组件：React Bits 组件按 **JS+CSS 官方原版**引入（`src/components/ReactBits/`），宿主层只做定位/主题适配，不改动组件核心逻辑。
- 版块：首页（hero + 01/02/03 板块）· 作品库（卡片 → 详情页）· 画廊（玻璃卡网格 + 大图）· 关于（履历 + MagicBento + Lanyard）· 互动（留言板）。

### 2. 图片资产瘦身（180MB → 约 3MB）

- 影集最初是 40 张 PNG，合计 **180MB**；用 sharp 批量转 **webp**（1600w / q78），降到约 **3MB**，首页与画廊加载体验显著提升。
- 原 PNG 不进入仓库（本地单独备份），仓库只保留压缩后的 webp。

### 3. 发布 GitHub

- 本地 `git init` → 分支 `main` → 首提交后推送到公开仓库 [`CloudWingX/cloudwing`](https://github.com/CloudWingX/cloudwing)。
- `.gitignore` 排除构建产物（`dist/`、`node_modules/`）与内部交接文档，公开仓库只包含可展示的源码与资源。

### 4. 部署到 Cloudflare Pages

- 在 Cloudflare 控制台用 **Pages → Connect to Git** 接入 GitHub 仓库，授权后每次 `git push` 自动触发构建。
- 构建设置：Build command `npm run build`、输出目录 `dist`、生产分支 `main`。
- 免费子域名：**cloudwing.pages.dev**。

## 踩坑记录（这段同样值得留档）

- **lockfile 平台差异**：Windows 生成的 `package-lock.json` 会让 Cloudflare 的 Linux `npm ci` 报 `Missing @emnapi/*`；解法是仓库不提交 lockfile，让云端用 `npm install` 按当前平台解析（或改用无 lock 环境）。
- **软导航后交互失效**：Astro `<ClientRouter/>` 页面切换会重建导航栏，原把监听绑在首屏 DOM 上的写法会让移动端汉堡菜单失效；改用 **document 级事件委托 + 只挂载一次** 后，任意页面往返都正常。
- **第三方 CDN 不稳**：画廊图片一度走 jsDelivr，国内访问偶发不显示；最终改回图片随站点打包，由 Cloudflare Pages 自带 CDN 服务，稳定优先。

## 仓库链接

完整源码：<https://github.com/CloudWingX/cloudwing>

欢迎查看、提 issue 或直接 fork 改造成自己的个人站。
