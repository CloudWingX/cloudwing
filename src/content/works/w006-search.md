---
title: 云翼 · 搜索从独立页面改成悬浮窗
summary: 全站搜索原本是一个独立路由（点搜索就跳页）。改成页内浮层：顶栏按钮、侧栏入口、手机抽屉、⌘/Ctrl+K 都能唤出，Esc 或点遮罩关闭。顺带把 Pagefind 的脚本与样式改成首次打开才加载——任何页面都不再为搜索付首屏成本。
date: 2026-09-15
order: 6
tags: [网站, 交互]
tools: [Astro, Pagefind, dialog, 事件委托]
state: 已公开
cover: /covers/w006-search.svg
link: https://cloudwing.pages.dev
---

## 为什么改

搜索做成独立路由有两个别扭的地方：点一下要**跳页**，搜完还得退回来；而且只要进过搜索页，Pagefind 的脚本与样式就会被加载。

改成悬浮窗之后，搜索变成"随时可以唤出、随时可以关掉"的动作，不打断当前浏览的页面。

## 实现

- 新增 `SearchModal.astro`：用原生 `<dialog>` 承载，天然有焦点管理与 Esc 关闭。
- 检索后端仍是 **Pagefind**（构建时生成索引，运行时无后端），只是换了个容器。
- **四个触发点**全部走 `data-search-open` 事件委托：顶栏搜索按钮、侧栏导航树、手机端汉堡抽屉、以及新增的全局快捷键 **⌘/Ctrl + K**。
- **懒加载**：Pagefind 的 JS 与 CSS 改成**首次打开浮层时**才插入，之后复用。
- 删除 `src/pages/search.astro`，sitemap 里的排除规则也一并去掉。

## 样式上的一个取舍

浮层新增了 `--glass-panel` 令牌（比卡片面更实、接近不透明）。一开始沿用站点的玻璃质感，结果**背后正文透进浮层、和搜索结果的字打架**。浮层这类"要盖住下面内容"的面，必须比内容卡更实。遮罩用 `::backdrop`（深色 0.72 / 浅色 0.5）。

## 踩到的坑

**`<dialog>` 在软导航换页时会被整个换掉。** 我原先缓存了节点引用，换页后再打开就抛：

```
InvalidStateError: Failed to execute 'showModal' on HTMLDialogElement:
The element is not in a Document
```

改成每次 `open()` 都重新查询节点，`close` / `cancel` 监听也比对"当前"节点，而不是跟缓存的旧引用比较。

## 结果

搜索弹窗 17 项验证全过（懒加载、开关、出结果、快捷键、换页后仍可用），冒烟测试补了"弹窗可开 / 可关"两条断言。
