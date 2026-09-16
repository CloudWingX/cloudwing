---
title: 云翼 · 三处交互动效（计数 / 描边大标题 / 音乐播放器）
summary: 用 React Bits 的组件原码给站点加了三处动效：侧栏统计数字的滚动计数、首页大标题的"先描边画出再填满"、以及侧栏底部的音乐播放器。三处都不改官方组件源码，只在宿主层做适配——也因此踩到了几个只有实测才能发现的坑。
date: 2026-09-15
order: 5
tags: [网站, 前端, 动效]
tools: [React, Astro, React Bits, GSAP, motion, Web Audio]
state: 已公开
cover: /covers/w005-motion.svg
link: https://cloudwing.pages.dev
---

## 三处动效

### 1. 侧栏统计数字滚动（CountUp）

侧栏「站点统计」的 5 个数字每次加载 / 刷新 / 软导航都重新数一遍。
实测计数过程（每 250ms 采样）：作品 `0→2`、截图 `0→40`、分类 `0→4`、字数 `0.1k→1.8k`、运行 `0→623 天`。

### 2. 首页大标题描边动画（StrokeText）

整行大标题「HELLO THIS IS / CLOUDWING」都会**先一笔一笔画出轮廓、再从左往右填满**，第二行晚 0.9s 形成级联。动画结束后回落到实心字，与改造前观感一致。

大标题上原本已经叠了三层动效，所以关键是**不冲突**：

- 外层 `<h1>` 仍是 3D 光标跟随的宿主；
- 两行各自吃一套视差变量做前后分层；
- StrokeText 只负责"画字"，**不碰 transform**。

### 3. 侧栏音乐播放器

播放 / 暂停、上一首 / 下一首、进度条可点击跳转（键盘 ←/→ 各 5 秒），播放位置记在 `sessionStorage`，刷新后可接着播。歌曲列表是配置项，当前为空 → 显示「歌曲待添加」并给出放置说明。

## 踩到的坑（都是实测才能发现的）

**官方组件的 `delay` 形参声明了但内部从未使用** —— 所以"两行依次出现"只能在宿主层用延迟挂载实现。

**GSAP 把 `stroke-dasharray/offset` 设在每个 `<tspan>` 上**，不是外层 `<text>`。排查时盯 `<text>` 会看到 `dasharray: none`，从而误判"没有描边动画"。

**量测完成前会错位一下**：组件在 `getBBox()` 返回前用兜底 viewBox 渲染，首帧字形被 `preserveAspectRatio` **缩成极小尺寸**，量测完才跳回正常大小。修法是量测完成前先 `visibility: hidden`。

**`<audio>` 不能写在侧栏组件里**：软导航会整个替换侧栏 DOM，切页瞬间音乐就断。改成把音频元素挂在 `document.body`、状态存 `window` 单例、按钮走 document 委托 —— 切页不断播、按钮也不失效。

**`client:visible` + 软导航会抛 `React error #424`**（水合不匹配），而且**控制台没有任何诊断信息**、`window.onerror` 也抓不到。定位套路：造一段"不经过首页"的最小软导航序列 → 仍报错（排除新组件）→ 把可疑组件渲染换成纯 `<span>` → 仍报错（排除第三方库）→ 注释掉该组件 → 异常归零 → 换挂载指令 `client:visible → client:idle` → 归零。结论：常驻的小岛一律用 `client:idle`。

## 结果

三处动效都已上线；冒烟、对比度审计、以及针对每处动效写的专项验证脚本（`verify-countup.mjs`、`verify-stroke.mjs`、`verify-music.mjs`）全部通过。
