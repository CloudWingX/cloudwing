# CloudWing 云翼 · 项目交接文档（HANDOFF）

> 写给**接手这个站点的开发者 / 下一个 agent**。
>
> **本文件有两个位置，内容一致，改完请两边同步**：
> - 仓库内（随项目走、GitHub 可见）：`endfield-blog/docs/HANDOFF.md` ← 你正在看的这份
> - 开发机工作区根目录：`<工作区>/HANDOFF.md`（不随仓库发布）
>
> 相关文档：`CODEX.md`（仓库内简版硬规则）、`README.md`（面向访客的项目说明）。
> 文中的本机路径（`D:\deep seek workplace\...`、Edge 路径、代理端口）来自开发机，换机器请按实际情况替换。
>
> 最后更新：2026-09-15（HEAD `d81147b`，已推送、线上已验证；Cloudflare 自动构建部署）。
> 自检入口：`cd endfield-blog && node scripts/smoke.mjs` → 最近一次 48/48 通过（本地与线上均通过）。

---

## 0. 一句话现状

个人作品档案站「云翼 / CloudWing」，**Astro 7 静态站 + React 岛 + 磨砂玻璃 UI**，源码在 `endfield-blog/`，
线上 <https://cloudwing.pages.dev>，仓库 <https://github.com/CloudWingX/cloudwing>（公开），
推 `main` 即由 Cloudflare Pages 自动构建部署。站点内容、样式、交互当前都处于**可用且已验证**的状态。

---

## 1. 五分钟上手

```powershell
cd 'D:\deep seek workplace\endfield-blog'

npm install                 # 依赖已装好（node_modules 在仓库里，412MB）
npm run build               # astro build && pagefind --site dist
npm run preview -- --port 4321 --host 127.0.0.1   # 本地预览 http://127.0.0.1:4321
npm run build:fast          # 只 astro build，跳过 pagefind（改样式时更快）
npm run og                  # 重新生成分享图（scripts/gen-og.mjs）
```

**改完必须做的三件事**：① `npm run build` 无报错；② 本地预览实测（别只看 HTML）；
③ `git add -A && git commit && git push origin main`，然后**轮询线上确认真上线**（见 §7.4）。

---

## 2. 环境与硬性约束（踩过坑，别改）

| 约束 | 原因 / 说明 |
|---|---|
| Node v24 / npm 11（本机实测） | Cloudflare 用 node 22 + npm 10 构建，两者都要能过 |
| **不要提交 `package-lock.json`** | 已写进 `.gitignore`。Windows 生成的 lock 缺平台相关可选依赖（`@emnapi/*`），CF 上 `npm ci` 会失败 |
| `react` / `react-dom` **精确锁 19.2.8** | 浮动版本会解析到 19.3，与 `@react-three/fiber@9.7` 的 peer `>=19 <19.3` 冲突，CF 构建 ERESOLVE |
| `.npmrc` 里 `legacy-peer-deps=true` | 同上，保留 |
| **`IMG_CDN = ''`（`src/site.ts`）** | 图片走本地相对路径随 dist 分发（CF 自带 CDN）。**不要改回 jsDelivr**：国内不稳，曾经整站图片打不开 |
| 构建脚本保留 `plugins/vite-cjs-inline-shim.mjs` | 删了会构建失败 |
| **git 走代理**（仓库级配置） | `git config --local http.proxy http://127.0.0.1:33210`（https 同）。**git 不读 Windows 系统代理设置**，代理没开时这里会超时，要改成直连：`git config --local --unset http.proxy` |
| GitHub 直连时通时断 | 推送失败就重试（本仓库实测最多重试 12 次才成功）；开了代理基本一次过 |

**没有云端凭据**：仓库里没有任何 token/密钥；Cloudflare 是 Git 集成自动构建，改不了就去看 CF 控制台的 Build log。

---

## 3. 目录结构（谁负责什么）

```
endfield-blog/
├─ astro.config.mjs          # 集成：react / sitemap / ClientRouter(软导航)；vite 插件 shim
├─ package.json              # build = astro build && pagefind --site dist├─ src/site.ts               # 站点全站配置：站点名/作者/链接/GISCUS/IMG_CDN/WEATHER_CITY
├─ src/content.config.ts     # 三个内容集合：works / shots / changelog
├─ src/layouts/
│   ├─ Base.astro            # 全站骨架：head meta、主题早应用脚本、头部、粒子背景、页脚；
│   │                        #   属性 sidebar=true 时渲染三栏壳层（侧栏在 <main> 之外）
│   ├─ SidebarLayout.astro   # 薄封装：<Base sidebar>，子页面用它
│   └─ WorkLayout.astro      # 作品详情：标题/元信息表/封面/正文目录/上下篇/giscus
├─ src/components/
│   ├─ Header.astro          # 顶部导航：品牌、导航项+分类二级菜单、主题开关、搜索、汉堡抽屉
│   ├─ SidebarNav.astro      # 左栏：个人信息卡 + 天气卡 + 导航树（作品库/分类/站点/画廊）
│   ├─ SidebarWidgets.astro  # 右栏：站点统计 / 更新日历 / 最近更新 / 今日一言
│   ├─ SidebarStatValue.jsx  # 宿主：统计数字的计数动画（包 ReactBits/CountUp，见 §6.15）
│   ├─ HomeStrokeTitle.jsx   # 宿主：首页大标题描边动画（包 ReactBits/StrokeText，见 §6.18）
│   ├─ MusicPlayer.astro     # 左栏底部音乐播放器（歌曲在 site.ts 的 MUSIC，见 §6.17）
│   ├─ WeatherCard.astro     # 天气卡骨架（数据由 ui.js 在浏览器端填）
│   ├─ GiscusComments.astro  # 留言板/评论区（主题跟随、防重复注入）
│   ├─ WorkCard.astro 等     # 作品卡、HexMark、页脚、打字机等小件
│   ├─ ReactBits/            # React Bits 官方组件原码（见 §5 铁律三）
│   ├─ SearchModal.astro     # 全站搜索悬浮窗（Pagefind，首次打开才加载 JS/CSS，见 §6.20）
│   └─ *.jsx                 # 宿主层：Particles 背景、Lanyard、ProximityText、CardSwap…
├─ src/pages/                # 首页 / 作品库 / 作品详情 / 画廊 / 关于 / 互动 / 404 / rss.xml
│                            #   ★搜索已不再是一个页面★，改成悬浮窗（SearchModal.astro）
├─ src/scripts/ui.js         # ★全站交互中枢：1547 行，所有动效与交互都在这（见 §6 各条）
├─ src/styles/global.css     # 设计令牌 + 基础版式（浅色为默认，深色在 motion.css 覆盖）
├─ src/styles/motion.css     # 动效与深色主题令牌
├─ src/styles/shell.css      # 三栏壳层 + 侧栏各卡片样式（909 行）
├─ src/content/{works,shots,changelog}/   # 内容
├─ public/                   # covers / lanyard / og / shots / favicon*.svg / robots.txt（**没有** _headers、没有自托管字体）
└─ scripts/                  # smoke.mjs（★冒烟测试，见 §7.3）、gen-og.mjs（分享图）、seed-changelog.mjs（更新记录落盘）
```

**唯一的"大脑"是 `src/scripts/ui.js`**：软导航后所有功能都靠它重新接管，改交互基本都在这。

---

## 4. 内容怎么加

### 作品（`/works/`）
`src/content/works/wXXX-name.md`：
```yaml
---
title: 简易图书管理系统
summary: 一句话摘要（作品详情页会显示；列表页不显示）
date: 2025-07-01
order: 3                     # 决定编号 W-003 与排序
tags: [课程设计, Web]         # ★会出现在顶部导航「作品库」二级菜单里
tools: [Spring Boot, MySQL]
state: 已公开                 # 含"进行/开发"→黄色点，含"停/废弃"→红点
cover: /covers/w003.svg
link: https://github.com/...  # 可选
---
正文 markdown（h2/h3 会生成详情页顶部目录）
```

### 截图（`/gallery/`）
1. 图片放 `public/shots/mc/mc-041.webp`（1600w q78 约 80KB 内）；
2. `src/content/shots/mc-041-shot.md`：`title / date / game / image: /shots/mc/mc-041.webp / note / aspect`。
   `game` 会出现在顶部导航「画廊」二级菜单里。

### 站点更新记录（驱动侧栏「更新日历」）
`src/content/changelog/YYYY-MM-DD.md`，一天一个文件：
```yaml
---
date: 2026-09-15
items:
  - kind: '优化'            # 上线 / 优化 / 修复 / 内容 …（自己起名）
    title: '做了什么'
    note: '一句话说明（可选）'
---
```
侧栏日历会把 changelog + 作品 + 截图按日期聚合：有记录的日子可点开看当天明细。

---

## 5. 三条铁律（违反必出 bug）

### 铁律一：软导航会重建 DOM，但**页面脚本不会重跑**
`Base.astro` 用了 `<ClientRouter />`（Astro 软导航）。切页时 body 被换掉，页面级 `<script>` 不再执行，
所以**任何交互都必须写成「document 级事件委托 + window 上的单例状态」**，并在
`document.addEventListener('astro:page-load', ...)` 里重新绑定/重算。

### 铁律二：`astro:page-load` / `astro:after-swap` 在 **document** 上派发，且不冒泡
挂到 `window` 上**永远收不到**。本项目已因此踩坑两次（拉丁词字重效果消失、作品库筛选在点击导航分类后失效）。

### 铁律三：`src/components/ReactBits/*` 是官方原码，只允许在宿主层改
要改视觉效果 → 新建宿主组件（如 `PageParticlesBackground.jsx`、`ProximityText.jsx`）传 props / 覆盖 CSS，
不要把官方组件改成自己的。唯一例外已在文件里注明（`VariableProximity.css` 删掉了失效的 Google Fonts `@import`）。

---

## 6. 已踩过的坑（症状 → 根因 → 修法）

> 这一节最值钱。改到相关代码前先读一遍。

1. **`html.js` 类在切页后丢失** → 所有动效（`.sli` `[data-ent]` `main.page-enter`）失效。
   Astro 软导航按新文档覆写 `<html>` 属性。修法：`ui.js` 在 `astro:after-swap` 与 `pageEnter()` 里补回。

2. **一次性滚动的元素永久 `opacity:0`** → IntersectionObserver 只报跨阈值，页面加载时已在视口内又没跨阈值的元素不会被唤醒。
   修法：`scrollFade()/scanReveals()` 里加滚动兜底扫描。

3. **粒子背景鼠标一动就抛 `RangeError: Maximum call stack size exceeded`**（每次移动都抛！）
   宿主把 `mousemove` 合成事件派发到 `.particles-container`，而合成事件 `bubbles:true` 会冒泡回 `window`，
   再次触发同一监听器 → 无限递归。修法：`if (!e.isTrusted) return;` 只转发真实事件。

4. **侧栏内部滚动条 vs 两栏同步**（连续迭代三轮才定位）：
   - 用户要求"去掉侧栏滚动条，随页面滚到底就停" → 改成 `sticky` + JS 计算 `--side-top`（栏比视口高时取负值，先滚再停）。
   - 但两栏**高度不同** → sticky 可滑动余量 = 网格行高 − 本栏高度，两者余量不同 → 内容短的页面
     （`/works/` 主 864 vs 右栏 841、`/search/`、404）高栏先被容器顶走、矮栏还贴着，**最多错位 140px**。
     修法：`sideSticky()` 里把两栏**补成等高**（`min-height`=较高者，测量前先清空以便能缩回）→ 实测 0 差异帧。
   - 导航栏收起/滑回时侧栏要"让位"，回程过渡用 0.06s（去程 0.16s），否则长栏会在半路从导航栏底下钻出来。

5. **导航栏与侧栏重叠** → 侧栏吸顶值取负值时内容会钻到半透明导航栏底下。修法：
   导航栏可见时吸顶值**恒为 82px 且不允许负值**；导航栏收起后（延迟 280ms，等它滑走）才放开滚动范围。
   逐帧采样确认「侧栏被钉在导航栏下方」= 0 帧。

6. **静态站读不到查询串** → 画廊的 `?game=` 过滤写在构建期（`Astro.url.searchParams`），构建时没有查询串 → 永远不生效。
   修法：过滤一律放浏览器端（读 `location.search`），页面只渲染全量 + `data-*` 属性。

7. **Cloudflare 上 `npm ci` 报 `Missing @emnapi/*`** → Windows lock 与 Linux 平台可选依赖差异。修法：不提交 lock（§2）。

8. **推送成功了但线上没变** → ① 部署还没跑完（CF 约 30~90 秒，最慢遇到过 26 分钟"看起来没触发"，其实是没连上）；
   ② **本地与线上 chunk 哈希不同**（`npm install` 解析差异）→ 不能用哈希判断部署，要用**内容特征**判断（见 §7.4）。

9. **PowerShell `Set-Content` 会把文件写成非 UTF-8**（本项目因此损坏过 4 个 .astro 文件）。
   改文件用编辑工具；非要用脚本就 `[System.IO.File]::WriteAllText($p, $s, (New-Object System.Text.UTF8Encoding($false)))`，改完校验。

10. **失效的第三方字体外链**：`cdn.jsdelivr.net/gh/TPCTang/MiSans-Webfont@latest/fonts.css`（仓库已 404，字体从未生效，
    却是个阻塞渲染的跨域请求）→ 已删除；中文改走系统字体（PingFang SC / 微软雅黑…）。

11. **关于页吊牌（Lanyard）**：三栏壳层下中栏只有 725px，牌子贴右上角会压住标题。
    现状（用户指定）＝**牌子绝对定位浮在正文之上**（`z-index:3`，不占布局），标题收小后吊绳也不会划过名字；
    拖拽下拉切换白日/夜间可用（`window.__cwLanyardPull` 单例 + document 委托）。

12. **首页/其他页的"入场动效"与 `center` 版式**：`.center-page` 会把标题居中；三栏壳层里已改成左对齐
    （`shell.css` 的 `@media (min-width:1200px)` 段），移动端仍居中。

13. **浅色页底色改了却不生效**（2026-09 亮色主题优化时踩到）：`global.css` 里 `body` 的背景**被
    `motion.css` 的 V16 规则整条覆盖**（`motion.css` 的 `body { background: linear-gradient(115deg, …) }`）。
    即**浅色页面底色的真实取值在 `motion.css`**：只改 `global.css` 的 `--bg` 不会改变渲染结果
    （`--bg` 当时只被页脚等少量地方用到）。深色同理，`html[data-theme='dark'] body` 也在 `motion.css`。
    **改底色必须两处一起改**；排查时先看 `getComputedStyle(document.body).backgroundImage` 里
    有没有新底色特征（如 `120% 80%`）。

14. **亮色主题三级文字曾经完全不达标**：`--ink-3` 原为 `#9a9ca3`，对玻璃卡实测仅 **2.49:1**
    （WCAG AA 小字要求 4.5:1），全站 32 处（kicker / 日期 / 编号 / 画廊编号 / 页脚…）都看不清。
    已压深到 `#63656d`（页底 4.87:1、玻璃 5.56:1），`--ink-2` 同步 `#55575e → #45474e`（7.77:1）；
    暗色 `--ink-3` 由 `#818389`（3.93:1）提到 `#8e9096`（4.66:1）。**不要再往浅了调。**

15. **ReactBits 的动画组件「只在挂载时触发一次」**（2026-09 接 CountUp 时踩到）：
    `<CountUp />` 的入场动画由 `useInView(ref, { once: true })` 驱动，**只在组件挂载时跑一次**；
    而侧栏在 Astro 软导航时不一定重建 → 不处理就只会在首次进入时数一遍。
    现方案：宿主 `src/components/SidebarStatValue.jsx` 监听 `astro:page-load` / `astro:after-swap`，
    用递增的 `key` 强制重挂载 → 每次加载 / 刷新 / 软导航都重放。
    **其它"进场一次"的 ReactBits 动画（DomeGallery/ShapeGrid 之类）若要每次重放，用同一套写法。**
    CountUp 自己不要改（官方原码）；单位（`1.8k` 的 k、`623 天` 的天）必须**单独渲染**，
    不能塞进 `to`，否则动画会去数一个非数字。自检：`node scripts/verify-countup.mjs [url]`。

16. **侧栏变高会踩到"侧栏压在导航栏下"**（2026-09 加音乐播放器时踩到，冒烟测试抓出来的）：
    `sideSticky()` 在导航栏收起时算出的 `--side-top` 可以是**负值**（栏比视口高才能滚到底）。
    **回程**（导航栏要滑回来）如果给侧栏一个 0.06s 的 top 过渡，它会从 -45px 沿路经过
    0~82px，而导航栏要 0.28s 才滑下来 → 中途有 2 帧侧栏压在导航栏下半透明区里。
    栏越高越容易触发（矮栏时负值很小，看不出问题）。
    修法：**回程用 `--side-dur: 0s` 瞬间归位**（去程仍 0.16s）。
    ⚠️ 往左栏加卡片/改高度后，务必跑 `smoke.mjs` 的 `[2] 侧栏吸顶同步`——它会逐帧抓这个。

17. **`<audio>` 与侧栏一起被换掉就断播**（音乐播放器的核心坑）：软导航会整个替换侧栏 DOM，
    把 `<audio>` 写在侧栏组件里，切页瞬间音乐就断。现方案（`ui.js` 的 `musicPlayer()`）：
    音频元素挂在 `document.body` 上并在 `window.__cwMusic` 里存单例，
    控制按钮走 document 事件委托 → 切页不断播、按钮也不失效。
    **任何"跨页连续"的媒体/状态都该用这个模式。** 自检：`node scripts/verify-music.mjs [url]`。

18. **接 ReactBits 的 SVG 动画组件（以 StrokeText 为例，2026-09-15 接）**：三个具体坑。
    1. **配色可以传 `var(--…)`**：SVG 表现属性（`stroke=` / `fill=`）里写 CSS 变量，
       Chrome 会解析（实测 computed 得到真实 rgb）。所以宿主直接传
       `strokeColor="var(--ink)"` 就能跟随深浅主题，**不必**引入官方默认的紫色（与本站黑白灰冲突）。
    2. **GSAP 把 `stroke-dasharray/offset` 设在每个 `<tspan>` 上，不是外层 `<text>`**。
       验证/排查时盯 `<text>` 会看到 `dasharray: none` 而误判"没有描边动画"（我踩过）。
       自检脚本要取 `[data-stroke-char]` 的 computed 值。
    3. **动画在挂载后 1~2s 就画完**：脚本里事后采样只能看到终态。
       要验过程就在 `Page.addScriptToEvaluateOnNewDocument` 里装按帧记录器，
       而且**必须在首次导航之前注入**（之后注入只能等第二次加载才有数据）。
       另外别在记录器装好后再 `Page.navigate` 一次 —— 会变成第二次加载，数据反而为空。
    另外：组件量测用的是**内部坐标系**（本项目 fontSize=1000 提高精度），
    视觉大小由外部 `font-size` 决定 —— 所以把 SVG 高度从官方写死的 `fontSize*1.3`
    覆盖成 `1em`（`.stroke-line .stroke-text__svg`），它就会跟相邻行一起随 `clamp()` 缩放。
    **大标题字号**：统一走 `--display-size`（`global.css` 的 `:root`，当前 `clamp(3rem,10vw,7.5rem)`），
    `.display` 与 `.stroke-line` 都读它 —— 改字号只改这一处。
    5. **★量测完成前会"错位"一下★**（2026-09-15 修）：官方在 `box` 为 `null` 时用兜底
       viewBox「`0 -fontSize 600 fontSize*1.3`」渲染，于是**首帧字形被 preserveAspectRatio
       缩成极小尺寸**（实测 13 个字形挤在一小块），量测完才跳回正常大小 ——
       观感就是"大标题加载出来之前错位"。修法：宿主在量测完成前把 SVG 设
       `visibility: hidden`（`box ? 'visible' : 'hidden'`），量测后立刻可见，动画逻辑不动。
       同时第二行"延迟挂载"的占位要 `min-height: 1em`，否则挂载瞬间会把下方内容顶下去。
    4. **`delay` 形参声明了但组件内部没用**（2026-09-15 接两行时发现）：
       时间线固定 `paused: true` + `play(0)`，传 `delay` 不会有任何效果。
       要"两行依次出现"，只能在**宿主层**让后一行延迟挂载（`HomeStrokeTitle.jsx` 的做法：
       `setTimeout` 后才渲染 `<StrokeText>`，挂载即开始画）。
       首页现在是**两行都走 StrokeText**（`lines={['HELLO THIS IS', lastWord]}`，
       第二行延后 0.9s），各自带 `.line1` / `.stroke` 类名，所以两套视差、3D 倾斜照旧。
    首页大标题的动效分层（**改这里前先读**）：外层 `<h1 class="display display-tilt">` 是
    3D 光标跟随的宿主（ui.js 的 `startTitleTilt` 下发 `--bkx/--bky/--frx/--fry`）；
    `.line1` 与 `.stroke` 各自吃一套视差变量做前后分层；`<StrokeText />` 只负责"画字"，
    **不碰 transform** —— 三者互不干扰。
    自检：`node scripts/verify-stroke.mjs [url]`（两行是否都渲染、几何是否齐、
    两行描边/填充动画是否都在跑、第二行是否确实晚于第一行）。

19. **★`client:visible` + 软导航会抛 `React error #424`（水合不匹配）★**（2026-09-15 定位）
    **症状**：软导航几圈后，每个 `client:visible` 实例抛一次
    `Minified React error #424`，**控制台没有任何诊断信息**（window.onerror 也抓不到，
    只能在无头浏览器里监听 `Runtime.exceptionThrown` 才看得到）。
    **定位过程**（可作为同类问题的套路）：
    1. 先做"不经过首页"的最小序列 → 仍然报错 → 排除当轮新增的首页组件；
    2. 把可疑岛的渲染换成纯 `<span>`（去掉 motion）→ **仍然报错** → 排除第三方库；
    3. 直接注释掉岛 → 异常归零 → 锁定到该组件；
    4. 换挂载指令 `client:visible → client:idle` → **异常归零**。
    **结论**：`client:visible`（IntersectionObserver 触发）在软导航时与 Astro 岛的
    水合时机冲突，导致 React 水合不匹配。**本项目所有"侧栏/常驻的小岛"一律用 `client:idle`。**
    CountUp 的"滚到才计数"由它自己的 `useInView` 负责，换指令不影响观感。
    另：宿主在 `astro:page-load` 里 `setState` 也会打断水合，必须用 `mounted` ref 兜住
    （见 `SidebarStatValue.jsx`）。

20. **搜索从独立页面改成悬浮窗**（2026-09-15，用户要求）：`src/pages/search.astro` 已删除，
    改为 `components/SearchModal.astro`（`<dialog>`）+ `ui.js` 的 `searchModal()`。
    触发点：顶栏搜索按钮、移动端抽屉、侧栏导航树、`⌘/Ctrl + K`（四个都用
    `data-search-open` 委托）。
    要点：
    1. **Pagefind 的 JS/CSS 改成首次打开时才加载**（原先搜索页一进去就拉）——
       任何页面都不再为搜索付首屏成本。
    2. **`<dialog>` 在软导航后会被换掉**：不能缓存节点引用，对旧节点调 `showModal()`
       会抛 `InvalidStateError: The element is not in a Document`（实测踩到）。
       每次 `open()` 重新 `querySelector`，`close`/`cancel` 监听也对比"当前"节点。
    3. 面板用 `--glass-panel`（比 `--glass-strong` 更实）：纯玻璃会让背后正文透进来、
       读数打架。遮罩用 `::backdrop`（深色 0.72 / 浅色 0.5）。
    4. sitemap 的 `filter` 排除规则已移除（搜索页不存在了）。
    自检：`node scripts/verify-search.mjs [url]`（17 项：懒加载、开关、结果、快捷键、
    软导航后仍可用）。

21. **CardSwap（首页作品卡片）的尺寸约定**（2026-09-15 修显示 bug）：这个组件的几何很反直觉，
    改它之前务必先读这条。
    - CardSwap 把 `width`/`height` 同时当作**容器尺寸**与**单卡的内联尺寸**，
      而卡片是绝对定位在容器**中心**、再按 ±`cardDistance`/±`verticalDistance` 铺开的。
      所以"容器 = 单卡"时，卡片必然伸出容器；容器 CSS 是 `overflow:visible`、
      外层 `.works-block` 又是 `overflow:clip` → **伸出的部分直接被切掉**（原 bug：右侧缺一条、
      后排顶进导航栏）。
    - 现约定：**容器按整叠尺寸给**（`.works-deck-inner` = 卡宽 + 2×distX，高同理由组件算），
      再用 `index.astro` 里 `.card { width/height: var(--deck-card-w/h) !important }`
      把单卡压回"容器 − 2×dist"（`!important` 必须有，内联样式优先级更高）。
    - 卡片内容：封面在上、**文字块绝对定位在左下角**。前排卡片会把后排这块盖住，
      所以后排只露封面，不会出现两个标题叠在一起。
    - **卡面必须不透明**（用 `--paper-1/2/3`，不要用 `--glass-strong`）：半透明会让后排文字透出来，
      看起来就像"两行字压在一起"。
    - 位置：卡片堆放在 `.wrap` 内的两栏栅格里（`.wb-copy` / `.wb-deck`），
      与页面栅格天然对齐；**不要再改回 `position:absolute` 挂在板块右下角**（那正是跑出内容列的原因）。
    - 组件按容器实测宽度反解所有尺寸与字号（`HomeWorksCardSwap.jsx` 的 `R` 比例表），
      所以换列宽/断点都不用改数值。自检：`node scripts/verify-deck.mjs [url]`。

22. **导航栏/下拉的玻璃与两个 CSS 陷阱**（2026-09-15）：
    - **`.topbar` 是死代码**：motion.css 里有 3 处 `.topbar{…}`（背景/边框/模糊都在那儿），
      但 Header 的标记早就是 `.hd` + `.hd-glass`，所以那些规则一条都不生效 ——
      顶栏曾经因此**完全没有背景/边框/模糊**。改顶栏外观要改 `.hd` / `.hd-glass`。
    - **`backdrop-filter` 的书写顺序会影响构建产物**：写成
      `backdrop-filter: …; -webkit-backdrop-filter: …;`（标准属性在前）时，
      构建时的 CSS 压缩会把这条**整个丢掉**（实测计算值直接是 `none`，页面看起来没模糊）。
      按 `-webkit-` 在前的顺序写就正常保留。**凡是改完模糊没效果，先去构建产物里搜一下
      这条规则还在不在。**
    - 结构约定：`.hd` 是**通栏**容器（`position:relative` + `isolation:isolate`，`display:block`），
      `.hd-glass` 是绝对定位、铺满整条的玻璃层（`z-index:-1`，底边框 + `--glass-panel` + 模糊），
      `.hd-in` 是内部内容列（`max-width` + `--gutter` 居中，与页面内容对齐）。
      **不要给 `.hd` 加 `overflow:hidden`**，`.nav-sub`（二级菜单）是它的绝对定位后代，会被裁掉。
      通栏后不用「四边圆角描边」（那只在悬浮胶囊上成立），改用**底边一条实线**做界定。
      `--glass-panel`（近不透明）用于所有"浮在正文之上、必须盖住底下内容"的面：
      顶栏 / 二级菜单 / 手机抽屉 / 搜索悬浮窗。自检：`node scripts/verify-nav.mjs [url] [light|dark]`。

23. **全站背景视频**（2026-09-15，用户要求）：`components/VideoBackground.astro` +
    `site.ts` 的 `VIDEO_BG`，视频放 `public/media/bg-loop.mp4`（**随站点打包，不走外部 CDN**
    —— 与当初弃用 jsDelivr 同一个理由：第三方随时可能挂/被墙）。
    - **层次**（z-index）：视频 `-5` → 遮罩 `-4` → 光斑 `-3` → 光晕 `-2` → 粒子 `-1` → 内容。
    - **可读性是靠"视频半透明 + 遮罩"解决的，不是靠改文字颜色**：
      视频 `opacity` 暗 0.42 / 浅 0.30，再加一层遮罩（暗色黑膜 0.45 / 浅色白膜 0.55）压住素材高光。
      这样两套主题的文字色都继续成立。**调 `site.ts` 里的 4 个数值就会改变观感与可读性**：
      视频更明显 → 对比度下降；浅色主题尤其敏感（深色文字压在亮素材上最容易不达标）。
    - 健壮性：`prefers-reduced-motion` 时只显示首帧不播放；自动播放被拦（省电模式）时保持首帧；
      标签页切到后台自动暂停；`body.has-video-bg` 会停掉底色位移动画（避免和视频争抢重绘）。
    - **★测 hero 文字对比度时的三个取样陷阱★**（`verify-videobg.mjs` 里都处理了）：
      1. 打字机是逐字推进的，字形在"取坐标"与"截图"之间会横移 →
         左右两侧取样会偶发落到字形上，算出 1.x 的**假失败**；只在**上下方**取样。
      2. 入场动画没跑完就截图 → 文字只显示一半，看起来像"标题没渲染"，容易被误判成颜色 bug。
      3. 大标题描边动画（约 2s）没跑完就冻结 → 第二行停在"只有轮廓没填色"，
         看起来也像文字丢失。**先等 dashoffset 归零，再注入 `animation:none` 截图**。
    - 自检：`node scripts/verify-videobg.mjs [url] [light|dark]`（16 项：播放/层级/透明度/
      遮罩/无溢出/hero 两组文字在视频上的实际对比度）。关掉视频只需把 `VIDEO_BG.src` 置为 `''`。
    - **★必须带 `transition:persist`★**（2026-09-15 修用户报的"切页就失效"）：
      Astro 的 ClientRouter 是按 `data-astro-transition-persist` 匹配元素的
      （见 `astro/dist/transitions/swap-functions.js`）。没这个属性的元素在软导航时会被
      **整棵换掉** → 视频被重新 new 一个 `<video>`、`readyState` 归零、重新起播，
      表现就是"一切换页面视频就闪一下、像没生效"。
      实测：加之前 `seq 1→2、readyState 4→0`；加了之后 `seq` 不变、`readyState` 一直是 4。
      **凡是 `Base.astro` 里要跨页常驻的重型节点（视频/音频/canvas），都要考虑加这条。**
    - **层次**（用户要求"保留旧背景但同步加载"，故视频不放在最底）：
      视频放 `-4`（压在页面底色之上），旧的光晕 `-2`、粒子 `-1` 仍在视频之上保留；
      导航栏的玻璃层改用 `--glass-nav`（半透明，约 0.66/0.5），否则接近不透明的
      `--glass-panel` 会让"导航栏区域的视频等于没有"（实测像素贡献只有 1.44，换掉后 8.14，
      与内容区的 9.8 同量级）。
    - 自检（全站一致性）：`node scripts/verify-videobg-global.mjs [url] [light|dark]`
      （25 项：逐页硬刷新 + 软导航一圈，校验视频存在/在播/层级/透明度、旧背景仍在、
      以及软导航时视频节点**未被重建**）。

24. **★暗色电影感 + 玻璃拟态重构★**（2026-09-15，用户要求；改样式前必读）：
    - **全站只有一套暗色主题**。`:root` 就是暗色；`html[data-theme='dark']` 重复同一组值。
      **主题开关不再切换浅色**：渲染恒为 `dark`，用户选择只记在
      `dataset.themePref` + localStorage（供开关显示）。原因：浅色玻璃 + 白字在物理上
      无法同时成立 —— 强行保留浅色路径实测有 **70 处对比度不达标**，全是"白字白底"。
      改动点：`Base.astro` 的头部脚本恒写 `dark`；`ui.js` 的 `applyPref()` 恒写 `dark`。
    - **玻璃材质统一走令牌**，不要在组件里写死数值：
      `--glass-blur: blur(20px) saturate(1.2)`、`--line-2: rgba(255,255,255,.2)`、
      `--r-s/m/l: 12/18/24px`、`--glass*`（rgba 深色底）。
      移动端（≤640px）在 `global.css` 里把 `--glass-blur` 降到 `blur(12px) saturate(1.1)`
      —— **一处生效**，不必逐个组件改；交互控件同时抬到 44px 触控高度。
    - **强调色取自背景视频**：实测视频色相稳定在 **192°（青蓝）**，故按用户规则取
      "科技抽象"档的冷色：`--accent: #7fd4e8` / `--accent-deep: #9fe2f0`，
      另有 `--accent-2`（雾蓝）`--accent-3`（灰绿）备用。**换视频素材要重取色相。**
    - 排版：字体改为 **Inter / Helvetica Neue**（Google Fonts 只取 300–500 三档）；
      **全站 font-weight 已全部压到 500 以内**（原 40 处 600–900）。
      主标题只保留**一行**（`lines={[\`HELLO THIS IS ${lastWord}\`]}`），字号 `--display-size` 48–72px。
    - 交互：hover 统一为 `scale(1.02)` + 边框提亮（`--line-hover`），**不用位移/弹跳**；
      首页堆叠卡片缓动由 `elastic` 改为 `smooth`、`delay` 提到 5.6s。
    - 导航栏：默认 `--glass-nav`（近乎透明，露出视频），离开顶部 24px 后由
      `html[data-scrolled='1']` 换成 `--glass-nav-solid`（半透明暗色）。逻辑在 `ui.js` 的 `autoHideHeader`。
    - **可访问性**：导航栏有「暂停背景动态」按钮（`[data-motion-toggle]`，WCAG 2.2.2），
      由 `ui.js` 的 `motionToggle()` 接管，调 `window.__cwVideoToggle()`；
      同时 `prefers-reduced-motion` 会让视频只显示首帧、并在 `global.css` 里收敛所有 CSS 动效。
      视频加载失败 → 藏掉 `<video>`，用 `public/media/bg-poster.jpg` + 深色渐变兜底。
    - 自检：`node scripts/verify-redesign.mjs`（13 项：单主题、玻璃令牌取值、暂停按钮、
      导航栏滚动过渡）。
    - **已知未改**：作品封面 SVG（`public/covers/*.svg`）当初是按浅色底设计的，
      在暗色站上偏亮；属于内容资产，需要时可重画。

25. **首页 = 内容橱窗**（2026-09-15，用户要求从"入口目录"改成"内容橱窗"）：
    `src/pages/index.astro` 已整体重写为四层结构，**不再有 01/02/03 编号入口卡片**。
    - ① Hero：静态主标题 `code on clouds, life on wings.`（全小写；`clouds/wings` 用
      `--accent` 雾蓝、`on` 用 `color-mix(--ink 45%)` 半透明）、定位语、三个技术胶囊、两个 CTA。
      **标题的描边动画已按要求移除** —— 随之删除了 `HomeStrokeTitle.jsx` 与
      `scripts/verify-stroke.mjs`（组件不存在了，验证脚本同步删除）。
    - ② 最新作品：3 张卡片（封面 / 编号 / 标题 / 一句话说明 / 标签），读 `works` 集合最新 3 篇。
    - ③ 精选影像：6 张网格，读 `shots` 集合最新 6 张；悬停放大 + 元信息淡入，**手机上元信息常显**
      （触屏没有 hover）。
    - ④ 关于预览：2 句 + 「查看完整档案 →」进 `/about/`。
    - 同时删除了首页不再使用的 `HomeWorksCardSwap.jsx` / `HomeGalleryAccordion.jsx`
      （卡片堆的 `--deck-*` 令牌与 `.wb-grid` 样式也已不在首页）。
    - 性能/SEO（用户规范）：**每张图都包在固定宽高比容器里**（`.wc-cover` / `.shot-frame`，16:9）
      以防 CLS；首屏图 `eager`、其余 `lazy`；`alt` 全覆盖；每页独立 title/description。
    - 区块间距 `padding: clamp(80px, 11vh, 132px) 0`（规范要求 ≥80px）。
      卡片阴影用用户指定值：`0 1px 3px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.04)`。
    - **★规范冲突已确认★**：用户同时给了"标题 #1a1a2e / 正文 #555"与"保留暗色视频背景"。
      深色文字压在暗色视频上只有 1.2:1 / 3.4:1，读不出来。已与用户确认：**保持暗色**，
      文字用白/浅灰，只把 `#9FD3E8` 雾蓝用作强调色。**不要再把 #1a1a2e / #555 加回来。**
    - 自检：`node scripts/verify-home.mjs [url]`（25 项：四层结构、雾蓝强调、描边已移除、
      图片策略、防 CLS 容器、alt、区块间距、SEO、移动端单列）。

26. **导航栏 = 顶部悬浮玻璃胶囊**（2026-09-15，用户要求"高级、轻盈、通透"）：
    不再是全宽实色条。**改动集中在 `Header.astro` 顶部的「导航胶囊令牌」块** ——
    结构/尺寸/交互与配色解耦，换配色只改那一块。
    - 尺寸：宽 `min(1200px, calc(100% - 40px))`、距顶 16px、高 56px（滚动后 52px）、圆角 999px；
      **移动端 ≤640px 宽改为 `calc(100% - 32px)`**（规格要求左右各 16px，比桌面的 20px 窄）。
    - 滚动行为：`ui.js` 的 `SCROLL_MATERIAL_AT = 80`，超过就切 `html[data-scrolled='1']`
      → 高度 52px + 玻璃加深 + 阴影加重。**用属性/class 切换，不硬切 position。**
    - 链接：14px / 500 / `padding 8px 14px` / 圆角 10px；hover 换背景+文字色；
      **当前页用底部 2px 雾蓝短横线（`::after`），不整块高亮**。
      Logo：15px / 600 / `letter-spacing: -0.01em`。
    - 移动端菜单：从顶部下拉的玻璃面板（圆角 20px、blur(24px)、`nav-in` 淡入+下移）。
      **面板底色必须接近不透明**（`--nav-drawer-bg` 用 0.99/0.97 渐变）：它盖在正文之上，
      半透明会让下方正文透上来（实测 0.92 时像重影）。
    - ★踩过的坑★：`--nav-blur` 刻意与全站 `--glass-blur` **分开**
      （导航是规格指定的 `blur(20px) saturate(1.4)`，全站玻璃是 `saturate(1.2)`）。
      导航胶囊底色也从最初照规格的"近乎全透"提到 `rgba(9,12,16,.55)` —— 太透时
      导航文字压在视频/正文上读不清（暗色站点上白色文字需要更实的底）。
    - 自检：`node scripts/verify-nav-capsule.mjs [url]`（22 项：胶囊尺寸/居中/距顶/圆角、
      模糊与边框、滚动阈值 80px 与 56→52 切换、当前页短横线、链接与 Logo 规格、
      移动端左右 16px、下拉面板）。另有 `scripts/verify-nav.mjs`（15 项，几何与可点击性）。

27. **★亮色主题已彻底删除★**（2026-09-15，用户要求"删除亮色主题与切换主题按钮"）：
    站点只有**一套暗色**。改动清单（改主题相关代码前先看这条）：
    - `Header.astro`：删掉 `.theme-toggle` 按钮（日/月图标）与其样式；
      `global.css` / `motion.css` 里的 `.theme-toggle*` 规则一并移除。
    - `ui.js`：删除 `initThemeToggle` / `syncThemeButtons` / `applyPref` / `applyDefault` /
      `readPref` / `storeGet` / `storeSet` / 主题常量与媒体查询监听；
      新增极简的 `lockDarkTheme()`（只在软导航后把 `data-theme` 写回 `dark`，
      因为 ClientRouter 会用新文档的 `<html>` 覆写属性）。
    - `Base.astro` 首屏内联脚本简化为"直接写 dark + 同步 theme-color"，
      不再读偏好、不再写 `themePref`。
    - `about.astro`：工牌原本是"往下拉切换白日/夜间"的开关，随主题一并删除
      （`triggerLights` / `onTap` / `.cw-lights-flash` 灯闪 / `.ly-hint` 提示 / `hintText`）。
      **保留了拖拽的装饰手感**（`is-pulling` 跟手 + 松手回弹）。
    - 全站 `html[data-theme='light']` 规则共删除 11 条（三个组件 + about + gallery）。
    - `scripts/verify-theme.mjs` 已重写为**单主题不变量**验证（11 项）：
      默认暗色 / 系统浅色仍暗色 / 历史 `cw-theme-pref=light` 无法切回浅色 /
      页面无 `.theme-toggle` / 无日月光标 / theme-color 深色 / 软导航后仍暗色 / 首屏逐帧无浅色帧。
    - **注意**：若以后真要加回浅色，不能只加个开关 —— 需要一整套独立配色，
      并对 `prefers-color-scheme` 之外的静态审计重新跑对比度（浅色玻璃 + 白字无法同时成立）。

---

## 7. 验证与调试

### 7.1 无头浏览器（CDP）
本机 Edge 路径：`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
```powershell
# 注意：--user-data-dir 路径不能带空格，否则 Edge 会把它当多个 URL 直接退出
$ud = Join-Path $env:TEMP 'cwcdp'
Start-Process 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' `
  -ArgumentList @('--headless=new','--remote-debugging-port=9222','--remote-allow-origins=*',"--user-data-dir=$ud",'--no-first-run','--disable-extensions')
```
Node 脚本模板（本项目一直在用这种方式验证，比截图更可靠）：
```js
const CDP = 'http://127.0.0.1:9222';
const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(url), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
// send('Page.navigate'|'Runtime.evaluate'|'Input.dispatchMouseEvent'|'Emulation.setDeviceMetricsOverride')
//   · 断言 DOM：Runtime.evaluate + returnByValue
//   · 模拟指针：Input.dispatchMouseEvent（产生 isTrusted 事件，才能测到粒子转发）
//   · 逐帧检查：页面内 requestAnimationFrame 采样，把异常帧存 window.__x，事后读取
```

**写验证脚本的三条铁律**（2026-09-15 反复踩到，直接照做能省很多时间）：
1. **一律用「轮询等待」，不要用固定 `sleep`**。无头浏览器里页面渲染快慢不定，
   固定等待会读到还没渲染的文档 → 得到 `undefined`/`null` 的**假失败**。
   实测同一份脚本：第一遍 5/14、第二遍 14/14，就是这个原因。等到"目标元素存在且有高度"再断言。
2. **别让标签页开两次**：用 `json/new?about:blank` 开空白页，再 `Page.navigate` 一次。
   若开页时就指向目标地址、随后又导航，会变成两次加载，出现"时而查不到 DOM、时而采不到帧"的抽风。
3. **开局先清干净**：共用一个调试浏览器时，上一次脚本留下的
   `cw-theme-pref` 之类的存储会让"默认值"类断言整片误判；清完要**回读确认**。
4. **调试浏览器要定期重启**：每个验证脚本都会 `json/new` 开新标签页（多数不关），
   跑几十次后实测累积到 **55 个标签页 / 74 个 Edge 进程**，于是所有页面布局等待
   飙到 18s、断言开始大面积假失败（冒烟从 48/48 掉到 45/47）。
   **症状**：多处 `布局等待 1x s` + 元素查不到。**处理**：杀掉 9222 进程重启浏览器即可，
   不是站点问题。长时间验证时记得隔一阵重启一次。

### 7.2 视觉/像素取证（vision 工具可能被限流或关闭，本仓库一律用本地手段）
- 截某区域做**密度图**（把 PNG 裁一块降采样成 ASCII）→ 看清布局与元素占位；
- `sharp` 统计（本机 `endfield-blog/node_modules/sharp` 可用）：算均值/标准差、做像素差分、算贴图保真（PSNR）；
- 几何断言优于肉眼：直接量矩形、比较是否重叠、`scrollWidth - clientWidth` 判横向溢出。
- **已脚本化的三个取证工具**（2026-09 加，改版式/配色时直接用）：
  - `node scripts/contrast-audit.mjs [url] [light|dark]` — 主题**可读性审计**：每个可见文字节点算
    「前景 vs 实际合成背景」的 WCAG 对比度，列出不达标项（含渐变裁切文字近似）。
    **两种主题都要跑**（第二参数切换，默认 light）。退出码 0=无问题 / 1=有不达标 / 2=环境没起。
    当前基线：**亮色与暗色都 0 处不达标**。
  - `node scripts/shots-theme.mjs [url] [outDir]` — 用 CDP 强制 light/dark 各截一遍
    （无头浏览器 `prefers-color-scheme` 默认 dark，必须显式 `Emulation.setEmulatedMedia`，
    否则你会以为自己在看浅色其实在审深色）。
  - `node scripts/imgstats.mjs <png...>` / `node scripts/imgpix.mjs <png...>` — 亮度分位数、
    过曝占比、四角采点。亮色主题优化前基线：`/works/` 均值 0.914、**62.4% 像素亮度 ≥0.94**。

### 7.3 冒烟测试（已写成脚本，改完必跑）
`endfield-blog/scripts/smoke.mjs` 会跑 48 项断言：各页面横向溢出/控制台异常/侧栏存在性与等高、
长页面两栏逐帧同步与"不钉在导航栏下"、软导航往返后的分类筛选与更新日历交互、手机视口侧栏隐藏。
```powershell
# 前置：预览 4321 已起 + 无头浏览器 9222 已起（§7.1）
node scripts/smoke.mjs                        # 测本地
node scripts/smoke.mjs https://cloudwing.pages.dev   # 测线上
# 退出码 0=全过 / 1=有失败项 / 2=环境没起
```
最近一次结果：**48/48 通过**（本地，HEAD `d81147b` 之后；线上同版本亦通过 47/48，唯一失败项是脚本自身的竞态，见下）。

### 7.3.1 接管复核记录（2026-09-15，HEAD `b4358c1`）
新会话接手时按本文件 §7 复核了一遍环境与线上，结论：**站点与线上均处于可用状态，无需修复**。
```powershell
git -C endfield-blog log --oneline -1     # b4358c1，工作区干净
git rev-parse HEAD; git rev-parse origin/main   # 两者相同（已推送、无未推提交）
npm run build                             # 退出码 0（astro build + pagefind，9 页/793 词）
node scripts/smoke.mjs                    # 48/48 通过，退出码 0
```
- 前置：预览 `http://127.0.0.1:4321`（旧常驻实例，重建 dist 后自动反映新产物）与无头 Edge `:9222` 都已在跑；
- 线上对比：抓 `https://cloudwing.pages.dev/works/` 与本地 `dist/works/index.html` 逐字符比对，
  **除三处构建指纹外完全相同**——`generator` 版本号（本地 astro 7.3.1 vs 构建机 7.3.2，`npm outdated`
  显示本地落后一个 patch）与 `astro-island uid`（每次构建随机）。**内容层面线上 = 本地，部署没落下**；
- 约束复核：`IMG_CDN=''`、`WEATHER_CITY=''`、`react`/`react-dom` 精确锁 19.2.8、`package-lock.json`
  确在 `.gitignore`、仓库级 git 代理 `127.0.0.1:33210` 在线可用——`git fetch` 一次成功；
- 待决项：§10 的「侧栏分类分组」经用户确认**暂时保留不改**。

### 7.3.2 跑线上时冒烟脚本的竞态（2026-09-15 修）
`smoke.mjs` 原来全靠**固定 sleep**，本地够用，跑线上会误报（**站点没问题**）。已改成轮询等待：
1. **手机视口段**用 `.shell > .main-content` 取中栏宽 —— 单列布局下它不是 `.shell` 的直接子元素，
   竞态时 `querySelector` 返回 `null` 后 `getBoundingClientRect()` 抛 `TypeError`，
   整个脚本以"冒烟测试自身出错"失败。已放宽选择器 + 空值容错，并补了一条
   **「手机端单列（中栏可见）」** 断言（断言数 47 → 48）。
2. **`/account/` 冷启动很慢**：该页内嵌 giscus 第三方 iframe，实测线上 6s 后仍可能是
   `readyState=loading`、三栏壳层还没渲染 → 侧栏高度测成 0，误报"子页面有侧栏"失败。
   已改为 `waitForLayout()` 轮询（最多 40s，超时会打印 ⚠️ 提示）。
3. **`/404.html` 有等高中间态**：`sideSticky()` 补等高前会先出现 `左 661 / 右 841`，
   约 1s 后才补齐到 `841/841`。不等它就会误报"两栏不等高"。已加 `waitForEqualSidebars()`。
4. **软导航分类筛选**同样要轮询到"隐藏项 >0 且回显条出现"，固定等待会读到中间态。

> 判读方式：若某条断言只偶尔挂、且加了 ⚠️ 超时提示，先怀疑等待不足，重跑一次再判断，
> **不要据此改样式**。修完后本地与线上均连续 `48/48 通过`。

### 7.4 手动断言清单（脚本没覆盖到的也照这个查）
```
□ 各页面：横向溢出 = 0
□ 三栏页：两栏 top 逐帧相等（不同步帧 = 0）、等高、无"钉在导航栏下方"的帧
□ 软导航一圈（首页↔作品库↔详情↔画廊↔关于↔互动）后：交互仍可用、无 JS 异常
□ 搜索悬浮窗：顶栏/侧栏/抽屉/⌘K 四种触发都能开，Esc 与关闭按钮都能关，换页后仍可用
□ Console 里无异常（尤其移动指针时——粒子转发曾无限递归）
□ 手机视口（414/1024）：侧栏 display:none、单列、标题居中
□ 首页：无侧栏、无 HTML 变化破坏
```

### 7.5 部署确认（别用 chunk 哈希！）
```powershell
# 用内容特征判断：把改动的样式/类名拿到线上 HTML 或 CSS 里找
$html = (Invoke-WebRequest 'https://cloudwing.pages.dev/works/' -UseBasicParsing).Content
$css  = ([regex]::Matches($html,'href="(/_astro/[^"]+\.css)"') | % { $_.Groups[1].Value } |
         % { (Invoke-WebRequest ("https://cloudwing.pages.dev" + $_)).Content }) -join ''
"新样式上线: " + [bool]($css -match 'clamp\(1\.45rem')     # ← 换成你这次改动的特征
```
CF 构建通常 30~90 秒；超过 5 分钟没动静就先确认推送是否真的成功（`git ls-remote origin main`）。

---

## 8. 三栏侧栏系统（当前成品形态）

- **布局**：`SidebarLayout` → `Base.astro` 的 `sidebar` 分支渲染 `<div class="shell">`：
  `SidebarNav(260px) | <main>(自适应) | SidebarWidgets(280px)`，`max-width:100rem` 居中，
  两侧栏在 `<main>` **之外**（切页时不被整页入场动画带着闪）。
  断点 **≥1200px** 才出三栏（1025px 时扣掉两条定宽栏后正文只剩 312px，不可用）；首页不套壳层。
- **滚动**：两栏共用同一 `--side-top`（`ui.js` 的 `sideSticky()`）：
  导航栏可见 → 恒 82px 且不许负值；导航栏收起 → 按「栏高 vs 视口高」算（可为负，长栏能滚到底）；
  两栏 `min-height` 补成等高保证行程一致；过渡按方向分 0.16s / 0.06s。
- **左栏**：个人信息卡（横幅 `PROFILE_BANNER` 待定，头像取关于页 `avatar-card.jpg` 转 160/320 webp）
  → 天气卡 → 导航树（作品库/分类/站点/画廊四组，默认折叠，当前项高亮）→ **音乐播放器**（§6.17）。
- **右栏**：站点统计（数字带计数动画，§6.15）/ 更新日历（可点日期看当天记录）/ 最近更新（单行 4 条）/ 今日一言。
- **导航栏**：`Header.astro`，下滑超 140px 自动收起（0.28s 动画，上滑滑回；移动端抽屉打开时不收），
  作品库与画廊有**分类二级菜单**（数据来自内容集合：作品 tags / 截图 game）。

---

## 9. 主题、字体、令牌

- 主题：`html[data-theme=light|dark]`，偏好三通道持久化 `cw-theme-pref`（localStorage→sessionStorage→Cookie），
  `Base.astro` 头部内联脚本**先于渲染**应用，避免闪烁；切换由 `ui.js` 的 `initThemeToggle()` 委托处理。
- **默认主题 = 夜间（dark）**（2026-09-15 改，用户指定）：没有存过偏好时一律渲染暗色，**不跟随系统**。
  规则很简单：**只有显式存过 `light` 才是白日，其余（无偏好 / 历史 `auto`）全部归夜间。**
  ⚠️ 默认值写在**两处**，改一处必须同时改另一处，否则会出现"首屏暗、水合后跳成亮"的闪动：
  - `Base.astro` 首屏内联脚本（`resolved = mode === 'light' ? 'light' : 'dark'`）
  - `ui.js` 的 `THEME_DEFAULT` + `applyDefault()`
  用户点过开关后按其选择走（`applyPref` 落盘），系统偏好变化不再影响已选用户。
  另外内联脚本会按**实际解析出的主题**改写 `<meta name="theme-color">` —— 默认夜间时，
  系统是白日的手机访客不该拿到浅色地址栏。自检：`node scripts/verify-theme.mjs [url]`。
- 配色：黑白灰 + 玻璃（`--accent` 浅色近黑、深色近白；`--accent-grad` 复用做横幅/按钮），
  令牌集中在 `global.css` 的 `:root`，深色覆盖在 `motion.css` 的 `html[data-theme='dark']`。**不要引入新配色**。
- **边框（2026-09-15 加粗，别调回去）**：三档颜色 + 三档粗细，全站统一走令牌，不要写死 1px：
  | 令牌 | 浅色 | 深色 | 对比度 | 用途 |
  |---|---|---|---|---|
  | `--line-1` | `rgba(12,12,14,.30)` | `rgba(255,255,255,.26)` | ≈2.0:1 / 2.25:1 | 行分隔、区块分隔（保持低调） |
  | `--line-2` | `rgba(12,12,14,.50)` | `rgba(255,255,255,.44)` | ≈3.5:1 / 4.6:1 | 卡片、胶囊、控件的实边框 |
  | `--line-glass` | `rgba(255,255,255,.72)` | `rgba(255,255,255,.36)` | 玻璃面内白描边 | 玻璃卡外框、顶栏、按钮 |
  | `--line-w` | `2px` | — | — | 按钮 / 标签 / 顶栏 / 侧栏卡 / 目录 |
  | `--line-w-card` | `2px` | — | — | 内容卡（作品卡 / plate / feat / step / door-row） |
  | `--line-w-pill` | `2px` | — | — | 小胶囊（标签 / 联系方式 / 日历格 / 统计格） |
  两个坑（2026-09-15 都踩过）：
  1. **不要用 `1.5px`**：Blink 会把 1.5px 向下取整渲染成 **1px**（实测 devicePixelRatio 1 与 3 都是 1px），
     等于加粗没生效。要加粗就写 `2px`。
  2. **Astro 页面/组件里的 `<style>` 是作用域样式，优先级高于 global.css / motion.css**：
     `Header.astro`（顶栏 `.pill`/`.theme-toggle`/`.burger`）等 6 个文件里写死的
     `1px solid var(--line-2)` 会把全局加粗**局部盖掉**。这类写死值已全部换成 `var(--line-w)`；
     以后加粗不合预期，先查页面/组件里的作用域样式（`grep -r "1px solid" src/`）。
     自检脚本：`node scripts/border-check.mjs [url] [light|dark]` 直接打印各元素**实际生效**的
     边框宽度/颜色；`node scripts/card-separation.mjs [url] [light|dark]` 量"卡面 vs 页面底色"分离度。
  3. **`--line-glass` 在两种主题下必须是相反的颜色**（2026-09-15 修）：它原来是硬编码的
     `rgba(255,255,255,.72)`（白线）——在深色主题下正确，但**浅色主题下等于没有轮廓**，
     作品卡"没有边框、卡片不明显"就是这么来的（侧栏卡用的是 `--line-2` 深灰线，所以它一直看得见）。
     现在：**浅色基值 = `var(--line-2)`（深灰线）**，深色令牌块里覆盖成 `rgba(255,255,255,.4)`。
     凡是"浅色下某个面没有边界"的问题，先确认它用的是 `--line-glass` 还是 `--line-2`。
  4. **内容卡的面用 `--glass-card`**（比 `--glass` 更实一档）：通过
     `.wk-card, .plate, .feat, .step, .door-row, .shot-card { --glass: var(--glass-card) }`
     重定义变量来生效（这些规则的 `background: var(--glass)` 会跟着变）。
     侧栏卡 `.sidecard` 不在其中，保持原玻璃质感。实测卡面 vs 底色 1.29:1（浅）/1.25:1（深）。
  原值（`--line-1` 1.32:1、`--line-2` 1.84:1）低于非文字 UI 的 3:1 可见性门槛，元素边界糊在一起很费眼。
- 字体：**西文 Outfit 走 Google Fonts**（`Base.astro` 里 preconnect + `css2?family=Outfit:wght@400..900`；国内可能连不上，
  断网/受限时回退系统字体）；中文走系统字体（PingFang SC / 微软雅黑…）；代码块用 `--font-code`。
  MiSans 那条 jsDelivr 外链已删除（仓库 404、字体从未生效）。详见 §13「做过但被取消的优化」。
- 动效：统一在 `prefers-reduced-motion` 下关闭（`.sli`/`[data-ent]`/`page-enter`/粒子/WX 脉冲等）。

### 9.1 手机端（2026-09-15 优化，改窄屏前先读）
- **三栏侧栏在 <1200px 整体隐藏**（`.shell-left/.shell-right { display:none }`），
  手机端只有单列正文 + 顶栏汉堡抽屉。也就是说手机端**没有**个人信息卡/天气/统计/更新日历/最近更新。
- **画廊在 ≤620px 改两列**（原来单列 40 张 → 整页 1.3 万像素高，约 16 屏；两列后约 4600）。
  `.gal-cover` 的 `aspect-ratio` 是**行内样式**（来自每条内容的 `aspect` 字段），
  窄屏规则只收紧间距与文案，不覆盖比例。
- **工牌（Lanyard）在手机端是文档流里的一块**（桌面端才绝对定位贴右上角）。
  下拉手势仅在 ≥1025px 启用；手机端改为**点一下开关灯**（`onTap`，document 委托），
  提示文案随断点切换：窄屏「点一下工牌 · 开灯 / 关灯」。ReactBits 的 `.lanyard-wrapper`
  自带 `min-height:420px`，窄屏容器必须跟着给到 ≥400px，否则会被裁。
- **顶栏在 ≤620px 收紧**：品牌字号/图标变小并允许省略号，`.acts` 间距 5px，
  `.pill/.theme-toggle/.burger` 高 36px；≤520px 隐藏 GitHub/搜索文字，≤400px 隐藏品牌副标题。
- **首页 01 板块的卡片堆（CardSwap）**：手机端带 3D 旋转的卡片视觉外框比容器宽，
  会被 `.works-block` 的 `overflow:clip` 切掉右边约 11px。容器用 `--deck-dx`（窄屏 -18px）
  把整叠左移，**由 `step()` 读入并写进 transform**（脚本会覆盖 transform，单靠 CSS 位移无效）。
  ⚠️ 该 `@media` 块必须放在基础 `.card-swap-container` 规则**之后**，否则 `--deck-dx:0` 会盖掉负值。
- 自检：`node scripts/mobile-shots.mjs [url] [outDir]` —— 375/390/414 三种视口 ×
  首页/作品库/画廊/关于/互动，输出截图 + 溢出与几何数据（当前全部 0 横向溢出）。

---

## 10. 遗留问题 / 待你决定

| 项 | 说明 |
|---|---|
| 左侧栏「分类」分组 vs 导航二级菜单 | 现在**同一份分类出现两处**（我做过两次询问，未回复）。要删侧栏那组说一声 |
| 作品详情页 summary | 上一轮"删除子页面简介"时**保留了它**（我理解为作品自身摘要而非页面简介）。要删也说一声 |
| 404 页说明文字 | 同上，保留了「你要找的档案不存在…」 |
| 个人信息卡横幅图 | `SidebarNav.astro` 顶部常量 `PROFILE_BANNER = ''`，留空＝主题渐变；填站内图片路径即换成图片 |
| 天气城市 | `src/site.ts` 的 `WEATHER_CITY = ''`＝按访客 IP 自动定位（推荐，不暴露你的位置）；填城市名则固定（等于公开城市） |
| 画廊原图 | 40 张原始 PNG 备份已随工作区清理删除，仓库里的 webp 是唯一副本（详见 §11） |
| `SESSION_HANDOFF.md` | 仓库内 gitignore 的旧交接笔记，内容已过时（引用 `_shots/` 等已删路径），要删/要更新都可以 |

---

## 11. 本次工作区清理（2026-09-15）

工作区从 **6,581MB → 437MB**，现在只剩三项：`endfield-blog/`（437MB，其中 node_modules 412MB）、
`.recode/`（DSH 会话状态）与本文件 `HANDOFF.md`。

- 删除的会话产物/缓存：诊断截图 2.2GB、无头浏览器配置、npm 缓存 859MB、vision 产物缓存、写入测试残留、根目录误建的 `public/`。
- 删除的其他任务文件（用户确认）：`dev-setup` 1.8GB、`.venv` 470MB、`mc-originals-backup` 180MB、`pylibs` 135MB、
  pip 缓存 203MB、`data`(MNIST) 64MB、`dsh-tools` 35MB、参考目录与实验脚本、简历/课业文件、Jupyter 状态等。
- 已同步修正 `CODEX.md` / `README.md` 里指向 `mc-originals-backup/` 的失效路径（提交 `fbba3b6`）。

---

## 12. 隐私红线（务必遵守）

- **站点任何地方不得出现真实姓名、学校、企业名**（作者身份统一为 `CloudWing_X`）。
- 不要把简历、课业、个人文档等放进仓库或 `public/`。
- 天气卡默认按**访客 IP** 定位，不写死站长城市（想写死请用户确认）。
- 提交信息、代码注释里不要带个人信息。

---

## 13. 下一步可以做什么（供参考，未开工）

- 画廊二次分类（多游戏时的分类导航已就绪，只等更多内容）；
- 作品正文图片灯箱 / 图片懒加载与尺寸优化（§6.6 的静态站限制记得绕开）；
- 更新日历支持"点日期跳到当天内容"（现在是指向对应页面的链接）；
- 评论数展示、RSS 里加 changelog；
- 首页与子页面标题体系的进一步统一（当前子页面标题已统一为 34.4px / 详情 32px）。

### 13.1 做过一轮、但用户叫停并已回滚的加载速度优化（可作后续备份方案）
当时**只量了、没上线**，数据可复用（基线：首页传输 802KB / 关于页 3.7MB / 画廊 1156KB；LCP 都是文字）：
- **自托管 Outfit**（本地 woff2 latin 31.5KB + latin-ext 14.5KB，去掉跨域阻塞）——已回滚，现仍走 Google Fonts；
- **`lanyard/card.glb` 贴图压缩**：内嵌 1678×1677 PNG（2241KB）→ 1024 webp，整体 2400KB → 260KB，
  保真 PSNR 29.6dB（肉眼无差）；转码脚本思路：解析 GLB 的 JSON/BIN chunk → sharp 重编码 → 顺序重排 bufferView；
- **截图缩略图**：40 张 1600×900 webp 生成 640/1280 两档（640 平均 15KB、1280 平均 42KB），
  列表卡用缩略图、灯箱仍用原图（首页 667KB → 约 250KB）；
- **岛屿降级**：`client:load` → `client:idle`/`client:visible`，粒子背景在减动效/省流下不挂 WebGL；
- 参考判据与实测手法见 §7（CDP 冷缓存量传输量、sharp 算保真）。
> 用户当时明确要求"终止任务、取消这次优化"，所以这些**不要擅自重做**，要问过再动。
