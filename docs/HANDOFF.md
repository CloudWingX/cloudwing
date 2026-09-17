# CloudWing 云翼 · 项目交接文档（HANDOFF）

> 写给**接手这个站点的开发者 / 下一个 agent**。
>
> **本文件有两个位置，内容一致，改完请两边同步**：
> - 仓库内（随项目走、GitHub 可见）：`endfield-blog/docs/HANDOFF.md` ← 你正在看的这份
> - 开发机工作区根目录：`<工作区>/HANDOFF.md`（不随仓库发布）
>
> 相关文档：`CODEX.md`（仓库内简版硬规则 —— 已按当前实现重写，与旧的"双主题"说法无关）、
> `README.md`（面向访客的项目说明）。
> 文中的本机路径（`D:\deep seek workplace\...`、Edge 路径、代理端口）来自开发机，换机器请按实际情况替换。
>
> 最后更新：2026-09-18（导航栏 + 首页 Hero 照参考文件整体重做，已推送）；
> Cloudflare 自动构建部署。
> 自检入口：`cd endfield-blog && node scripts/smoke.mjs` → 最近一次 **45/45** 通过（本地与线上均通过）。
> 全套验证脚本与用法见 **§7.2**；本机调试浏览器起法见 **§7.1**。
> ⚠️ **验证脚本必须串行跑**（并发会大面积假失败，见 §7.1 第 6 条 / §32）。
> ⚠️ **改过导航/Hero 的轮次**请先读 **§33**（形态、被删的旧结构、以及一批真实踩坑）。

---

## 0. 一句话现状

个人作品档案站「云翼 / CloudWing」，**Astro 7 静态站 + React 岛 + 暗色电影感玻璃 UI**，源码在 `endfield-blog/`，
线上 <https://cloudwing.pages.dev>，仓库 <https://github.com/CloudWingX/cloudwing>（公开），
推 `main` 即由 Cloudflare Pages 自动构建部署。**站点处于可用且已验证的状态**：
11 个验证脚本全绿、可读性 0 处不达标、7 个页面 0 JS 异常、手机端 0 横向溢出。

### 0.1 上一轮（2026-09-15）做了什么 —— 交接摘要

> 全部已提交、已推送、线上已验证。详细条目编号见 §6 / §23–§31。

| 主题 | 结果 | 关键位置 |
|---|---|---|
| **整站视觉重构**：暗色电影感 + 玻璃拟态 | 视频成为画面主角，UI 全部改为悬浮玻璃片；令牌集中在 `:root` | §24 |
| **亮色主题彻底删除** | 渲染恒为暗色；主题开关、`#1a1a2e`/`#555` 浅色分支全清 | §27 |
| **全站背景视频** | 15.5MB mp4 自托管（不走外链）＋ 上浅下深渐变遮罩 ＋ poster 降级；`transition:persist` 防软导航重建 | §23 |
| **导航形态**：贴顶通栏 → 滚动收成胶囊 ＋ 移动端汉堡 | `padding-top 0→16`、`1280→1120`、`64→52`、圆角 `0→999px` | §31 |
| **新品牌标志** | "云生翼"纯矢量标志（横版字标 + 图标），导航/页脚/404/favicon 全换 | §28 |
| **首页 Hero 重做** | eyebrow 玻璃胶囊 ＋ 两行标题 BlurText ＋ 逐字副标题 ＋ GradientText；**49 项规格断言** | §30 |
| **首页改版**：入口目录 → 内容橱窗 | 四层结构（Hero / 最新作品 / 精选影像 / 关于预览），删掉 01/02/03 编号卡 | §25 |
| **搜索改成悬浮窗** | `<dialog>` ＋ Pagefind 首次打开才加载；删掉 `/search/` 页面 | §20 |
| **作品库补 4 篇档案** | W-003…W-006，order 3–6 | — |

**这一轮反复出现的两条主线**（下次改视觉时先看）：
1. **用户给的配色规格常是浅色版**，与站点的暗色方向冲突（`#1a1a2e`/`#555`/白色玻璃）。
   已确认多次：**保持暗色**，只取规格里的雾蓝 `#9FD3E8` 作强调色。
   布局/尺寸/动画参数照规格实现，颜色做暗色映射 —— 别默默把浅色加回来。
2. **本机调试浏览器会累积标签页**，跑几十次验证后会大面积假失败（见 §7.1 第 4 条）。
   冒烟"失败"时先重启 9222 再下结论。

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
│   ├─ Header.astro          # 顶部导航：品牌标 / 链接组 / 指示线 / 搜索 / 动效暂停 / 汉堡（见 §26 §31）
│   ├─ BrandMark.astro       # ★品牌标志（横版字标 + 纯图标，见 §28）—— 改 logo 只改这里
│   ├─ VideoBackground.astro # ★全站背景视频 + 渐变遮罩 + poster 降级（见 §23）
│   ├─ SearchModal.astro     # 全站搜索悬浮窗（Pagefind，首次打开才加载 JS/CSS，见 §20）
│   ├─ SidebarNav.astro      # 左栏：个人信息卡 + 天气卡 + 导航树（作品库/分类/站点/画廊）
│   ├─ SidebarWidgets.astro  # 右栏：站点统计 / 更新日历 / 最近更新 / 今日一言
│   ├─ SidebarStatValue.jsx  # 宿主：统计数字的计数动画（包 ReactBits/CountUp，见 §6.15）
│   ├─ MusicPlayer.astro     # 左栏底部音乐播放器（歌曲在 site.ts 的 MUSIC，见 §6.17）
│   ├─ WeatherCard.astro     # 天气卡骨架（数据由 ui.js 在浏览器端填）
│   ├─ GiscusComments.astro  # 留言板/评论区（主题跟随、防重复注入）
│   ├─ WorkCard.astro 等     # 作品卡、页脚、打字机等小件
│   ├─ ReactBits/            # React Bits 官方组件原码（见 §5 铁律三）
│   └─ *.jsx                 # 宿主层：Particles 背景、Lanyard、ProximityText…
│                            #   ⚠️ HomeStrokeTitle / HomeWorksCardSwap / HomeGalleryAccordion
│                            #      已删除（首页改版后不再使用，见 §25 §30）
├─ src/pages/                # 首页 / 作品库 / 作品详情 / 画廊 / 关于 / 互动 / 404 / rss.xml
│                            #   ★搜索已不再是一个页面★，改成悬浮窗（SearchModal.astro）
├─ src/scripts/ui.js         # ★全站交互中枢（约 2000 行）：所有动效与交互都在这（见 §6 各条）
├─ src/scripts/hero-anim.js  # 首页 Hero 四个动画（ShinyText/BlurText/GradientText/逐字，见 §30）
├─ src/scripts/nav-mobile.js # 导航：汉堡菜单 + 顶部两条指示线（见 §31）
├─ src/styles/global.css     # 设计令牌 + 基础版式（★:root 即暗色，见 §24）
├─ src/styles/motion.css     # 动效令牌 + html[data-theme='dark'] 同步块
├─ src/styles/shell.css      # 三栏壳层 + 侧栏各卡片样式
├─ src/content/{works,shots,changelog}/   # 内容
├─ public/                   # covers / lanyard / og / shots / media(背景视频) / favicon*.svg / robots.txt
│                            #   （**没有** _headers、没有自托管字体）
└─ scripts/                  # 见 §7.2 的全套验证脚本；gen-og.mjs（分享图）；seed-changelog.mjs
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
       要"两行依次出现"，只能在**宿主层**让后一行延迟挂载（`setTimeout` 后才渲染）。
       **注意：首页大标题现在已不再使用 `<StrokeText />`**（§25 改版 → §30 重做 Hero），
       本条的"动效分层"经验仍适用于其他多层动效叠加的场景。
    首页大标题的动效分层（**改这里前先读**）：外层 `<h1>` 是 3D 光标跟随的宿主
    （ui.js 的 `startTitleTilt` 下发 `--bkx/--bky/--frx/--fry`）；
    各行动效层只负责"画字/入场"，**不碰 transform** —— 与宿主互不干扰。

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
    > ⚠️ **Hero（第 ① 层）后来被 §30 又重做了一版**（加了 eyebrow 胶囊、两行标题、
    > BlurText/ShinyText/逐字入场）。下面关于 ① 的描述是**旧版**，②③④ 仍然准确。
    - ① Hero：~~静态主标题 + 定位语 + 技术胶囊 + 两个 CTA~~ → 见 §30。
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

26. **导航栏形态演进（第一版）** —— **已被 §31 取代**，此处仅保留仍成立的结论：
    导航的**配色与尺寸全部集中在 `Header.astro` 顶部的 `--nav-*` 令牌块**，
    结构/尺寸/交互与配色解耦，换配色只改那一块。
    - 当前尺寸与滚动形态见 §31（贴着顶部通栏 → 滚动收成胶囊），
      §31 之前的"常驻 1200×56 悬浮胶囊"已不再是现状。
    - 仍成立的两条经验：
      1. **移动端菜单面板底色必须接近不透明**：它盖在正文之上，半透明会让下方正文透上来
         （实测 0.92 时像重影）。用 `--nav-drawer-bg` 或 `rgba(10,10,15,.95)` 一档。
      2. 暗色站点上白色导航文字需要**更实的底**：胶囊底色太透（<0.5）时文字压在视频上读不清。

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

28. **品牌标志（Brand Identity）**（2026-09-15，用户提供品牌稿 preview.html）：
    标志在 `components/BrandMark.astro`，纯矢量 path、**零字体依赖**（字标已转路径）。
    - 造型：几何平底云 + 三根向上掠出的羽翼，共用一个藏在云内的根部 ——「云生翼」；
      羽翼的斜向笔势同时呼应 `</>` 写法。
    - 配色令牌（`global.css`）：`--brand-cloud`（云体/CLOUD，暗底用纸白 `#F4F7FA`）、
      `--brand-wing`（羽翼/WING，雾蓝 `#9FD3E8`）、`--brand-ink`（深空墨 `#1A1A2E`，浅底用）、
      `--brand-mute`（雾灰 `#7A8296`）。组件支持 `cloud` / `wing` 覆盖，方便浅底场景。
    - 两种形态：`variant="horizontal"`（横版字标，355.06×58，导航栏用）、
      `variant="icon"`（纯图标，64×64，页脚/404/favicon 用）。
    - 用法：`<BrandMark variant="horizontal" height={30} />`。
      **尺寸靠 height 反解宽高比**；移动端在 `Header.astro` 的 media query 里用
      `:global(.brandmark) { height: 20px/18px }` 覆盖（viewBox 会等比缩放）。
    - 已替换的位置：导航栏（横版字标 + 中文站名，≤1180px 隐藏站名）、
      页脚（图标版 20px）、`404.astro`（图标版 22px）、
      `public/favicon.svg`（浅底：深空墨云体）与 `public/favicon-dark.svg`（深底：纸白云体）。
    - 旧组件 `HexMark.astro`（六边形）与其样式已删除 —— 全仓已无引用。
    - 自检：`node scripts/verify-brand.mjs [url]`（10 项：导航/页脚是否用上新标志、
      viewBox 是否为横版字标、云体/羽翼取值是否等于品牌稿色值、旧六边形是否清除、
      标志尺寸是否在 24–40px、是否超出导航胶囊、无横向溢出）。

29. ~~ReactBits 风格侧边菜单（StaggeredMenu）~~ —— **已废弃，被 §31 取代**（2026-09-15 当天）
    这套实现（`nav-staggered.js`、`.sm-*` 样式、`verify-nav-rb.mjs`）**已全部删除**，
    导航现在由 §31 的"滚动收缩 + 移动端汉堡"承担。留着这一条只为两点参考价值：
    - **ReactBits 的原参数**（若以后要复刻别的 reactbits 组件，这套节奏可直接借用）：
      预层 `xPercent 100→0` 每层延迟 0.07s / `0.5s power4.out`；菜单项
      `yPercent 140→0 + rotate 10→0 + opacity 0→1`，`duration 1`，
      **stagger each 0.1 from 'start'**，`power4.out`；图标 `rotate 0→225`、`0.8s power4.out`；
      关闭用 `power3.in`。
    - **一个仍然成立的通用坑**：`.site-header` 带 `will-change: transform`，会让它成为
      fixed/absolute 后代的**包含块** —— 任何"挂在导航上的浮层/面板"若放在 `</header>` 内，
      会按 header 的高度（约 64–72px）定位而不是视口。要么放到 `</header>` 之外，
      要么别给它 fixed 定位。同理，浮层用到的自定义属性若定义在 `.site-header` 上，
      它（在 header 之外时）**继承不到**，会退化成 `auto` 或透明 —— 必须定义在 `:root`。

30. **首页 Hero 板块（严格按规格实现）**（2026-09-15）：
    `src/pages/index.astro` 的 `.hero` 段 + `src/scripts/hero-anim.js`。
    **布局/尺寸/间距/断点/动画参数逐条对应规格**；另有一份 49 项的
    `scripts/verify-hero.mjs` 把每条规格都变成断言（改 Hero 后跑它）。
    - 结构：`.hero-inner` 内依次是 `.hero-eyebrow`（玻璃胶囊）→ `.hero-title`（两行）→
      `.hero-sub` → `.hero-cta`。
    - 四个动画：Eyebrow 的 **ShinyText**（4s 循环扫光）、主标题 **BlurText**
      （`blur(10px)+y20+opacity0` → 终态，逐词 80ms、0.8s、`cubic-bezier(.16,1,.3,1)`）、
      clouds/wings **GradientText**（`#9FD3E8→#c4e8f5→#9FD3E8`，200% 循环）、
      副标题 **按字入场**（y40→0，每字 50ms）。
    - 触发用 **IntersectionObserver**（threshold .15）；`prefers-reduced-motion` 直接落终态。
      只动画 `transform/opacity/filter`。
    - **★颜色是暗色映射，不是规格原文★**：规格给的 `#1a1a2e` 标题 / `#555` 副标题 /
      `rgba(255,255,255,.6)` 白胶囊是**浅色版**，压在暗色视频背景上约 1.2:1 不可读。
      已与用户确认保持暗色，故映射为：标题纯白、副标题 `#c9d1d9`、胶囊 `rgba(9,12,16,.55)`、
      按钮 `rgba(255,255,255,.18)/.08`。**不要再把 #1a1a2e / #555 加回 Hero。**
    - **★切词必须显式保留空白★**：把词包进 inline-block 的 span 后，源码里的空格会被折叠，
      "code on clouds" 会变成 "codeonclouds"。做法是把词间空白建成独立的 `\u00A0` 文本节点。
      另外 `\s` 不匹配 `\u00A0`，正则里要显式写 `[\s\u00A0]`。
    - **★逐条验证的价值★**：这套断言抓出了两个真实布局 bug ——
      ① 中间档（1000–1180px）导航胶囊内容放不下，`.acts` 被挤出胶囊 35px（已在 ≤1100px 收起链接组）；
      ② 侧边菜单关闭态停在视口外，让文档 `scrollWidth` 多出 5px（`.sm-root` 加 `overflow:hidden`）。
    - 旧的 `HomeStrokeTitle` 已彻底不参与首页（组件与验证脚本此前已删）。

31. **★导航改为"滚动收缩"形态★ + 移动端改回汉堡**（2026-09-15，用户提供 ReactBits 的
    shrink-effect 实现并要求照做，含移动端）：
    之前那套"常驻悬浮胶囊 + 侧边 StaggeredMenu 面板"**已被替换**（`nav-staggered.js`、
    `verify-nav-rb.mjs`、`verify-nav-capsule.mjs` 均已删除）。
    - **形态**（照 ReactBits，只改 `Header.astro` 的 `--nav-*` 令牌与 `[data-scrolled]` 规则）：
      | | 未滚动 | 滚动 >80px |
      |---|---|---|
      | 外层 `padding-top` | 0 | 16px（下沉） |
      | 容器 `max-width` | 1280 | 1120 |
      | 容器高 | 64 | 52 |
      | 圆角 | 0 | 999px |
      | 背景 | 透明 | `rgba(9,12,16,.7)` |
      | 模糊 | none | `blur(12px) saturate(1.8)` |
      | 阴影 / 边框 | none / 透明 | `0 4px 20px` / `rgba(255,255,255,.2)` |
      | 左右内边距 | 32px | 22px |
      | 链接字号 / 内距 | 14px / 14px | 13px / 11px |
      | 顶栏控件高 | 40px | 34px |
      过渡 `0.4s cubic-bezier(0.4,0,0.2,1)`，**只切 `html[data-scrolled]`**（见 ui.js 的 `setMaterial`）。
    - **移动端**（≤768px）：汉堡按钮（3 条线，打开变叉号）+ 顶部下拉玻璃菜单
      （`rgba(10,10,15,.95)` + `blur(20px)`、`translateY(-10px)→0` 淡入、圆角见 CSS）。
      逻辑在 `src/scripts/nav-mobile.js`（含保留下来的顶部两条指示线）。
    - **★排查记录★**：`autoHideHeader` 会"下滑收起导航"，所以**验证脚本不能在下滑后量导航**：
      要"先滚下去让胶囊成型、再上滑一点让导航滑回来"（否则量到 `top = -53`）。
      `verify-nav.mjs` / `verify-redesign.mjs` 原来都在页面顶部断言"胶囊已成型"，
      现在顶部是**刻意透明贴顶**的，那两个脚本已改为滚动后采样。
    - 自检：`node scripts/verify-nav-shrink.mjs [url]`（37 项：顶部/滚动/回顶三态逐项尺寸、
      形态过渡、指示线、移动端汉堡与下拉菜单）。

32. **★接手前复核：文案缺陷 + 并发假失败 + 文档同步★**（本次接手时发现，改文档或写验证脚本前先读）
    - **复核结论**：14 个脚本全部复跑通过，基线与本文件一致（本地与线上 `smoke.mjs` 均 **45/45**，
      hero 49/49、home 25/25、nav-shrink 37/37、nav 15/15、brand 10/10、theme 11/11、
      redesign 14/14、search 17/17、videobg 15/15、videobg-global 25/25、mobile-shots 15/15、
      diag-errors 7 页全 0）。**站点本身没有回归。**
    - **★并发跑验证脚本会得到大批假失败★**（§7.1 只写了"标签页累积"，没写这条）：
      把 3 个脚本与线上冒烟**同时**跑时实测 `verify-theme` 8/11、`verify-hero` 48/49、
      `verify-videobg-global` 多项失败（含 `InvalidStateError: Transition was aborted … Document hidden`）。
      重启浏览器、**串行**重跑后全部通过。**同一浏览器上任何时刻只跑一个验证脚本。**
      判断依据：`verify-videobg-global` 报"视频被重建"时，先确认源码里
      `VideoBackground.astro` 的 `transition:persist="video-bg"` 还在、且构建产物里
      `data-astro-transition-persist="video-bg"` 存在 —— 在就基本是并发/后台标签页的假象。
    - **★线上 `React error #424` 是间歇性的，本地永远复现不了（已实测定量）★**：
      `smoke.mjs` 打**线上** 8 轮里约 **3 轮**报 #424（每次 2~4 条，命中"交互过程无 JS 异常"
      与"软导航一圈后仍无 JS 异常"），同一浏览器同一时段打**本地**连跑 **10 轮全绿 45/45**；
      本地 4399 上跑的**改动前版本**（`git worktree` 检出 `d9646a0`）连跑 **5 轮也全绿**。
      已排除的因素：① 缓存 —— 用 `Network.setCacheDisabled` + 每次全新 `--user-data-dir` 仍复现；
      ② 部署不完整 —— 线上 HTML 引用的 6 个 `_/astro/*` 资源逐个 HEAD 全是 200，无 404；
      ③ 本次改动 —— 改的只是 `site.ts` 里的**纯文本**，两份本地构建（改前/改后）各 5 轮全绿。
      用当前 `smoke.mjs` 的捕获方式**抓不到任何诊断信息**（只有一句 `Minified React error #424`）。
      我另写了一份抓完整上下文的诊断脚本（`RemoteObject.description` + 栈 + 逐页归属），
      在线上一圈软导航里**一条异常都没抓到** —— 说明它依赖具体时序，不是必现页面错误。
      **结论：这是"仅线上 + 间歇"的环境/时序问题，疑似与软导航水合和线上网络时序有关；
      基线版本同样存在，不是某一轮的改动引入的。** 下次再遇到，别先改代码。
      ⚠️ **旧版本对照法现在不好用了**：`https://<commit短哈希>.cloudwing.pages.dev` 实测**返回 404**
      （§7.1 第 5 条推荐的这个三步法里那一步已失效）。要拿基线，用
      `git worktree add --detach .baseline-wt <commit>` + 单独端口起预览（本次就是这么做的：
      `node_modules` 可以用 `mklink /J` 软链复用，不必重装 412MB）。
    - **★文案缺陷曾带上线，而所有验证脚本都抓不到★**（真实 bug，已修）：
      `src/site.ts` 的 `SITE.notice` 写着「采用磨砂玻璃扁平化 UI（**浅色通透**）」，
      另 `SITE.tagline` 写「磨砂玻璃扁平化设计」。两处在**线上首页与关于页可见**
      （`Footer.astro` 的 `title`+文本、`about.astro` 的 `.note`）。
      站点早在 §24/§27 就改成"只有一套暗色"，**文案却留着浅色主题的描述**。
      **为什么没被任何脚本发现**：验证脚本只验颜色/尺寸/几何，**不验文案内容**。
      凡是"改动主题/视觉方向"的轮次，交出去之前顺手核一遍**用户可见的文案**
      （`src/site.ts` 的 `tagline` / `notice`、各页元描述、页脚）。
    - **端口 4321 曾被无关项目占着**：另一个已废弃项目（`mc-wiki-static`）的 Astro 预览
      进程仍占 `[::1]:4321`，本项目占 `127.0.0.1:4321`。本站用 `127.0.0.1` 所以验证不受影响，
      但 `http://localhost:4321` 会因解析顺序随机落到那一个（返回的是别的站点）。
      本次已结束该进程，现在 4321 只有本项目的监听。
    - **文档同步**：仓库内这份比工作区根目录那份新（6 个 commit 只改了仓库这份），
      工作区那份的头部落后（`HEAD d81147b`、`48/48`、写死本机路径），正文虽一致但少 2 行。
      本次已把工作区那份的头部对齐（含"最后更新"一行），两边正文保持逐字节一致。
    - **`CODEX.md` 与 `README.md` 已重写/修正**：原 `CODEX.md` 仍在教**已删除的浅/深双主题**
      （`cw-theme-pref`、`.theme-toggle`）、`/search/` 独立搜索页、工牌"下拉切换白日/夜间"，
      照它改会直接踩坑；已重写为与当前实现一致的简版硬规则（含七条硬规则、
      "串行跑验证脚本"、当前 14 项基线表）。`README.md` 首行的「浅色通透、黑白灰强调」
      与上线前清单（邮箱/`site:` 占位）也已按实际状态更正。

33. **★导航栏 + 首页 Hero 按参考文件整体重做★**（2026-09-18，用户提供 `code_20260918.html`
    并要求"像素级复刻，网页背景不变，导航栏全局生效"）——**改导航或 Hero 前必读**。
    - **参考文件与实测值**：用户给的单页文件已存到 `_shots/ref-reactbits.html`（工作区临时件）。
      复刻前先用无头浏览器把它渲染出来量了一遍（`_shots/ref-measure.json`），
      关键值：容器 **1280→(滚动)1120**、高 **64→56**、左右内距 **32→24**、
      圆角 **0→9999**、两栏 gap **80→(≤1024)40→(≤768)48**、
      标题 **64/48/36**（1440/1024/768）、卡片 **520→440→100%**。
    - **颜色没有照搬**：参考的紫/粉/红渐变按用户要求换成站点雾蓝（见下一条"可读性"）。
    - **导航形态**：`position: fixed`（不再 sticky）—— 这才让 Hero 从 `y=0` 开始，与参考一致；
      **子页面靠 `.shell` 的 `padding-top` 让位**（`shell.css` 的 `--shell-pad-top`，
      取值 = 导航高 + 原呼吸位）。`.hd` / `.hd-glass` 两层结构已删除。
    - **不再下滑收起**：参考的导航只有"贴顶通栏 ↔ 滚动胶囊"，
      所以 `ui.js` 的 `autoHideHeader()` 只保留 `setMaterial()`，`.hd-hidden` 与
      `html[data-hd]` / `data-hdSide` 全部废弃。`sideSticky()` 改成**现量导航栏高度**
      （64 ↔ 56 ↔ 52），不再假设 64。
    - **二级菜单已移除**：参考导航没有下拉，分类入口改由**左栏导航树**承担
      （`?tag=` 链接仍在，`smoke.mjs` 与 `verify-nav.mjs` 已改为点左栏）。
      `ui.js` 的 `navSub()`、`.nav-sub` / `data-nav-caret` / `nav-ind` 指示线一并删除。
    - **顶栏搜索入口已按用户要求去掉**：搜索悬浮窗仍在（`Base.astro` 挂 `SearchModal`），
      入口剩 **⌘/Ctrl+K**、左栏导航树的搜索按钮、移动端下拉菜单里的搜索按钮。
      ⚠️ 这条是**可访问性上的取舍**（少了可见入口），要加回来只需在 `.nav-actions` 里放
      一个 `data-search-open` 按钮 —— 但那会与"照参考"冲突，先说一声。
    - **首页 Hero 结构**：`.hero-content`（badge → 两行标题 → 副标题 → 两个统计 → 技术标签）
      + 右侧展示卡片（参考的 code-card 位）。
      **标题文案（2026-09-18 用户指定）**：第一行 `Code on clouds, life on wings`（纯白）、
      第二行 `Hello this is CloudWing`（雾蓝渐变）；副标题 `记录我的学习，折腾和胡思乱想`。
      ⚠️ **标题字号不是 64px，而是按"最长行必须放得下"反解的
      `clamp(27px, 1.9vw, 42px)`**：第一行 28 字符在 64px 下要 **844px**，
      而左栏只有 560px（实测）。要保住"严格两行"就必须缩字号（上限 42px 才放得下）。
      两行 PC 上 `nowrap`；手机端第一行放开换行（容器只有 280–374px，怎么缩都放不下），
      手机端字号反而回到 36px。**想恢复大标题就得改文案或放宽左栏，二选一，先说一声。**
      另外 `@media (max-width:1024px)` 里**不要再写死 `.hero-title` 字号** ——
      写死会盖掉 clamp 下限，把两行 nowrap 顶出容器（踩过）。
      **卡片内容是一段关键连续代码**（`index.astro` 的 `codeSample`）：展示本站
      "雾蓝强调色 + 玻璃材质"这套设计令牌怎么落到背景视频层上，纯展示、不参与运行。
      高亮类名沿用参考（`code-keyword` / `code-string` / `code-function` / `code-component` /
      `code-prop` / `code-number` / `code-comment`），**颜色换成站点令牌**（雾蓝/灰绿/冷蓝），
      每个 token 在卡片底色上都 ≥7.6:1。
      ⚠️ 两个改这段时必踩的点：① 高亮 span 是 `set:html` 注入的，**没有 Astro 作用域属性**，
      CSS 必须写 `.code-body :global(.code-keyword)`，否则高亮整个失效；
      ② `.code-body` 必须显式 `text-align: left` —— hero 在移动端是 `center`，会被继承，
      代码一居中"缩进"在视觉上就没了（看起来像没缩进）。
      旧的 `hero-eyebrow` / `hero-inner` / `hero-cta` / `.ht-line` 式入场动画与
      `scripts/hero-anim.js` **已不再参与首页**（Hero 现在是静态版式）。
    - **★手机端（≤768px）照参考站手机端优化过★**（2026-09-18，用户要求"只改手机端"）：
      先把 reactbits.dev 拉到 390/360/768 三个宽度量了一遍，再照它的行为改。
      参考手机端实测：**标题与正文仍是左对齐**（`text-align: start`）、
      顶部留白约 96px、代码窗给出足够行宽（不出现读到一半截断）。
      据此改了四处（全部写在 `(max-width:768px)` 里，桌面一行未动）：
      1. 整块从居中 → **左对齐**（`.hero` / `.hero-content` / 统计 / 标签组）；
         `.hero` 加 `align-items: stretch`，左栏不再被居中拉伸。
      2. 垂直节奏：上内边距 `120px → 96px`、内容与卡片间距 `48px → 32px`。
      3. **代码卡片不再横向滚动**：390px 下原本要滚 93px、360px 下 123px。
         现在按"容器实测宽度 ÷ 最长行字数"反解字号
         （`min(11.5px, calc((100vw - 40px - 32px) / (47 * 0.55)))`，
         0.55 = 等宽字体每字符推进宽度/字号，实测 13px→7.1475px），
         390/414 取 11.5px、360 取 11.14px，横向滚动 = 0。
      4. `codeSample` 的最长行从 62 字符压到 **47**（否则字号只能缩到 9.3px，反而更难读）。
         **改这段代码时不要超过 47 字符**，超了手机端就会横向滚动。
      ⚠️ 复核过桌面未受影响：1440 下内边距 32px、gap 80px、标题 64px、
      卡片 520×591、代码 13px —— 与改动前完全一致。
      自检：`verify-hero.mjs` 的"768：堆叠（参考手机端行为）"段（6 项）、
      `mobile-shots.mjs`（三机型 × 5 页，当前全部 0 横向溢出）。
    - **★改版过程中真实修掉的一批问题★**（都值得记住）：
      1. **`Page.addStyleTag` 在本机 Edge（153 / 协议 1.3）不存在**，调用返回
         `-32601 ... wasn't found` 并被静默忽略 —— `verify-videobg.mjs` 里"冻结动画/隐藏文字"
         两次注入其实一直没生效。**验证脚本要注入样式，必须用 `document.createElement('style')`。**
      2. **对比度取样必须把字形真的移出 DOM**：渐变标题用 `background-clip:text`，
         `visibility:hidden` 会留下字形层、`opacity:0` 也可能被旧帧绕过；实测只有
         **把节点 `remove()` 掉**再截图，背景才是干净的（否则一根 2~3px 宽的字形亮条
         就被当成"底色"，报出假 1.00）。
      3. **`contrast-audit.mjs` 的渐变近似原本是失效的**：它只认 `rgb()/rgba()`，
         而现代 Chrome 把 `color-mix()` 算成 `color(srgb r g b)` → 一个停靠点都取不到，
         于是渐变文字被报成 `rgba(0,0,0,0) ... 1:1`。已改成解析 `color(srgb …)`
         并**逐个停靠点取最差**（平均值会掩盖最亮那一档）。
      4. **两处真实对比度缺陷**（审计与像素取样各抓到一处）：
         `.btn-pro`（Bilibili）原本是"深色字压 82% 半透明雾蓝"，合成后近黑 → **1:1**，
         改为不透明雾蓝底；Hero 标签 `.tag.active` 原本是"雾蓝字压半透明雾蓝底" → **1:1**，
         改为不透明浅雾蓝底 + 近黑字。
      5. **Hero 柔光浓度必须很低**：参考的紫/粉 radial 柔光直接压在文字后面，
         实测 15% 的雾蓝柔光就能把底色抬到 `rgb(156,207,228)`；已压到 6%/4%。
         同时把视频遮罩中段 0.42→0.58、底部 0.72→0.82，白字在视频亮帧上才稳过 3:1。
      6. **移动端汉堡一度完全失效**：重写 `Header.astro` 时漏掉了
         `<script>import '../scripts/nav-mobile.js'</script>` —— 该文件**只在这里被引用**，
         丢了就没人绑事件。`verify-nav-shrink.mjs` 的移动端断言抓到了。
      7. **`Page.addStyleTag` 那类"静默失败"要警惕**：CDP 方法不存在时返回 error 但不抛异常，
         脚本照跑，于是"验证通过"其实是没验。**新写的注入类操作要回读确认生效。**
    - **自检**：`verify-hero.mjs`（44 项，几何/断点全部对齐参考实测值）、
      `verify-nav-shrink.mjs`（36 项）、`verify-nav.mjs`（14 项）、
      `verify-videobg.mjs`（17 项，含 hero 文字在视频上的真实像素对比度）。

34. **★强调色预设（色卡切换）★**（2026-09-18，用户要求"参考 reactbits 首页代码卡片下方
    按钮的切换主题与强调色效果"，并明确**不要更换背景**、要求**有中间色的缓慢过渡**）。
    - **先摸清了参考的实现**（`_shots/rb-presets.json` 是实测记录）：
      点一下只改 **5 个 CSS 变量**（`--pro-base / -dark / -light / -glow / -fg`）；
      背景 shader 自己缓动、**代码高亮完全不参与过渡**（实测切完就跳）。
      所以"参考怎么做"只能算一半答案 —— 过渡和代码换色是我们自己加的。
    - **本站实现**：`src/site.ts` 的 `ACCENTS`（5 套：雾蓝/镜蓝/极光/余烬/紫晶）
      → `index.astro` 把它内联成 JSON + 渲染 `.code-footer > .code-preset`
      → `src/scripts/hero-theme.js` 负责补间。
      切换时同时改三样：**强调色**（`--accent` 系 + `--accent-rgb`）、
      **背景色调**、**代码高亮**（`--code-*`）。
    - **★背景是"换色"不是"换背景"★**：视频文件/透明度/遮罩/层级全都不动，
      用的是两层颜色手段：
      1. `.tint-layer`（`VideoBackground.astro`）——一层纯色 + `mix-blend-mode: color`，
         给包括视频在内的整个画面调整色调；
      2. `.video-bg__el` 的 `filter: hue-rotate(var(--vid-hue)) saturate(var(--vid-sat))`
         —— 旋转背景视频的色相。
      **为什么两层都要**：实测单靠色膜最多只能把画面推到 186~190°
      （视频本身是稳定青蓝 192°，色膜再厚也会被拉回去，加厚还会把画面洗灰）；
      而"余烬"这类暖色预设要的是 ~35°，光靠叠色根本到不了。
      `hue-rotate` 是纯颜色变换、线性可插值，所以暖色预设能真的暖起来而且过渡很顺。
    - **过渡**：`hero-theme.js` 用 `requestAnimationFrame` + easeInOutCubic 补间 900ms，
      补的是**颜色值**（不是 CSS 变量 —— 变量默认不可动画，`@property` 注册要逐个写类型）。
      实测过渡帧：`#9fd3e8 → #a6d1dd → #c2c9b2 → #d2c49a → #e0c084`，确实经过中间色。
      `prefers-reduced-motion` 下直接落终态，不补间。
    - **默认态必须是"零改动"**：雾蓝预设的 `tintA=0 / hue=0 / sat=1`，
      而且脚本只在"存过非默认选择"时才写变量 —— 首次访问的画面与加这个功能之前**完全一致**
      （自检断言会验这一点）。
    - **两个坑**：
      1. 选中态**不能**用"强调色文字 + 强调色半透明底"（实测 1:1）——
         所以强调色只落在圆点上，文字用纸白。
      2. 选中态底色写成 `rgba(var(--accent-rgb), .16)` 而**不是**
         `color-mix(in srgb, var(--accent) 16%, transparent)` —— 后者会被
         `contrast-audit.mjs` 当成"不透明的强调色"，算出假的 1.5:1（踩过）。
    - **自检**：
      `verify-hero.mjs`（61 项，含色卡数量/唯一选中态/默认零改动/**过渡≥3 个不同中间帧**/
      强调色与代码色都变/色相被旋转/无溢出）；
      想核对某个预设下的整体对比度：`$env:ACCENT='ember'; node scripts/contrast-audit.mjs <url> dark`
      —— 五套预设当前都是 **0 处不达标**。

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
   飙到 18s、断言开始大面积假失败（当时冒烟从 48/48 掉到 45/47；现在冒烟总数是 45）。
   **症状**：多处 `布局等待 1x s` + 元素查不到。**处理**：杀掉 9222 进程重启浏览器即可，
   不是站点问题。长时间验证时记得隔一阵重启一次。

5. **★旧 profile 的缓存会让"仅线上"出现 `React error #424`★**（2026-09-15 交接前踩到）：
   同一个调试浏览器 profile 长期访问 `cloudwing.pages.dev`、跨多次部署之后，
   线上冒烟会间歇报 `React error #424`（水合不匹配）—— **本地永远复现不了**，
   很容易误判成"站点有 bug"。**三步确认它是缓存假象而不是真 bug**：
   - `Network.setCacheDisabled` + `Network.clearBrowserCache` 后重跑 → 异常归零；
   - 拿**旧部署**（`https://<旧commit短哈希>.cloudwing.pages.dev`）跑同一路径 → 也干净；
   - **换全新 `--user-data-dir` 起浏览器** → 当前线上连跑 6 轮 0 异常。
   排除过程中我对 `PageParticlesBackground` 做过一次禁用二分，本地开关都 0 异常，
   同样证明与它无关。**结论：线上一旦出现只有线上复现的水合异常，先换全新 profile 复核**，
   别急着改代码。

6. **★同一浏览器上只能串行跑验证脚本，不能并发★**（2026-09-17 接手复核时实测）：
   多个脚本同时占用 9222 会互相干扰，产生**大面积假失败** —— 实测并发时
   `verify-theme` 只过 8/11、`verify-hero` 48/49、`verify-videobg-global` 多项失败
   （含 `InvalidStateError: Transition was aborted because of invalid state. Document hidden`，
   是后台标签页真实表现，不是站点问题）。**重启浏览器后串行重跑，全部通过。**
   所以：① 一个脚本跑完再跑下一个；② 看到"视频被重建 / 采不到帧 / 首帧不是 dark"这类
   可疑失败，先按 §7.1 第 4 条重启浏览器、串行复核，再判断是不是真 bug。

### 7.2 验证脚本清单（改完对应模块就跑它）
**全部脚本都在 `endfield-blog/scripts/`，统一用法 `node scripts/<名>.mjs [url] [light|dark]`。
前置：预览 4321 已起 + 无头浏览器 9222 已起（§7.1）。退出码 0=全过 / 1=有失败 / 2=环境没起。**

| 脚本 | 覆盖什么 | 当前基线 |
|---|---|---|
| `smoke.mjs` | ★总入口：各页横向溢出/控制台异常/侧栏存在与等高、长页两栏逐帧同步、"不钉在导航栏下"、软导航往返后的分类筛选与日历交互、手机端侧栏隐藏 | **45/45** |
| `verify-hero.mjs` | 首页 Hero：几何/排版/断点 + 两行标题 + 强调色预设（数量/唯一选中/默认零改动/过渡中间帧/代码换色/色相旋转） | **61/61** |
| `verify-home.mjs` | 首页四层结构、图片策略、防 CLS 容器、alt、区块间距、SEO、移动端单列 | **23/23** |
| `verify-nav-shrink.mjs` | 导航三态（贴顶通栏/滚动胶囊/回顶）+ 形态过渡 + 移动端汉堡菜单 | **36/36** |
| `verify-nav.mjs` | 导航几何、玻璃、分类入口已迁左栏、无遗留二级菜单 | **14/14** |
| `verify-brand.mjs` | 品牌标志（viewBox、云体/羽翼色值、旧六边形已清、不超导航条） | **10/10** |
| `verify-theme.mjs` | 单主题不变量：默认暗色/系统浅色仍暗色/历史偏好切不回浅色/无开关/首屏逐帧无浅色帧 | **11/11** |
| `verify-redesign.mjs` | 暗色电影感：玻璃令牌取值、暂停背景动态按钮、导航滚动过渡 | **14/14** |
| `verify-search.mjs` | 搜索悬浮窗：懒加载、开关、出结果、快捷键、软导航后仍可用 | **17/17** |
| `verify-videobg.mjs` | 背景视频：播放/层级/透明度/遮罩/hero 文字在视频上的**实际像素**对比度 | **17/17** |
| `verify-videobg-global.mjs` | 全站背景一致性：逐页硬刷新 + 软导航一圈，视频未被重建、旧背景仍在 | **25/25** |
| `contrast-audit.mjs` | WCAG 对比度审计（逐节点"前景 vs 实际合成背景"） | 暗色 **0 处不达标** |
| `mobile-shots.mjs` | 三机型视口 × 5 页截图 + 横向溢出统计 | **15/15 无溢出** |
| `diag-errors.mjs` | 逐页 JS 异常计数 | 7 页全 **0** |
| `border-check.mjs` / `card-separation.mjs` | 实际生效的边框宽度/颜色；卡面与页面底色分离度 | — |
| `imgstats.mjs` / `imgpix.mjs` | 截图亮度分位数、过曝占比、四角采点 | — |
| `shots-theme.mjs` / `shot-*.mjs` | 强制某主题/某状态截图（无头浏览器默认 dark，必须显式 setEmulatedMedia） | — |

> `contrast-audit.mjs` 的第二个参数现在**不再调用站点切主题**（站点只有暗色，见 §27）：
> 它读站点实际渲染的主题来评估；传 `light` 会打印一条"站点解析为 dark，按 dark 评估"的提示。
> 另外它会**跳过 SVG 文字**（`<text>/<tspan>` 的颜色来自 `fill/stroke`，按 `color` 算会得到假 1:1）。

### 7.3 视觉/像素取证（vision 工具可能被限流或关闭，本仓库一律用本地手段）
- 截某区域做**密度图**（把 PNG 裁一块降采样成 ASCII）→ 看清布局与元素占位；
- `sharp` 统计（本机 `endfield-blog/node_modules/sharp` 可用）：算均值/标准差、做像素差分、算贴图保真（PSNR）；
- **几何断言优于肉眼**：直接量矩形、比较是否重叠、`scrollWidth - clientWidth` 判横向溢出。
  注意 `scrollWidth` 会把"故意停在视口外的浮层"也算进去 —— 要么给它的父层加 `overflow:hidden`，
  要么断言时排除它（本项目两次踩到：侧边菜单面板、以及导航在 1000px 档内容超宽）。

### 7.4 手动断言清单（脚本没覆盖到的也照这个查）
```
□ 各页面：横向溢出 = 0（注意：故意停在视口外的浮层会被算进 scrollWidth，见 §7.3）
□ 三栏页：两栏 top 逐帧相等（不同步帧 = 0）、等高、无"钉在导航栏下方"的帧
□ 软导航一圈（首页↔作品库↔详情↔画廊↔关于↔互动）后：交互仍可用、无 JS 异常
□ 搜索悬浮窗：顶栏 / 侧栏 / 移动端菜单 / ⌘K 四种触发都能开，Esc 与关闭按钮都能关，换页后仍可用
□ 导航三态：贴顶通栏 → 滚动收成胶囊（下沉 16px）→ 回顶恢复
□ 移动端（≤768px）：汉堡可开合、菜单贴在导航下方、滚动后不被胶囊压住
□ 首页 Hero：四个动画都播完且终态可见（慢网络下逐字入场要等一会儿）
□ 背景视频：在播、滚动后仍在播、切页不重建（`readyState` 不归零）
□ Console 里无异常（尤其移动指针时——粒子转发曾无限递归）
□ 手机视口（414/1024）：侧栏 display:none、单列、标题居中
□ 首页：无侧栏、无 HTML 变化破坏
```

### 7.4.1 本轮交接复核记录（2026-09-15，交接时的 HEAD）
交接前按本文件复核了一遍，结论：**站点、线上、文档三者一致，无需修复**。
```
git log --oneline -1                     # 9b1e6d1；git rev-parse HEAD == git ls-remote origin main
git status --short                       # 干净
npm run build                            # 退出码 0
node scripts/smoke.mjs                   # 45/45
node scripts/verify-hero.mjs             # 49/49      （线上同）
node scripts/verify-nav-shrink.mjs       # 37/37      （线上同）
node scripts/verify-home.mjs             # 25/25
node scripts/verify-nav.mjs              # 15/15
node scripts/verify-brand.mjs            # 10/10
node scripts/verify-theme.mjs            # 11/11
node scripts/verify-redesign.mjs         # 14/14
node scripts/verify-search.mjs           # 17/17
node scripts/verify-videobg.mjs          # 15/15
node scripts/verify-videobg-global.mjs   # 25/25
node scripts/contrast-audit.mjs <url> dark   # 0 处不达标
node scripts/mobile-shots.mjs            # 15/15 无横向溢出
node scripts/diag-errors.mjs             # 7 页全 0 异常
```
另外核对了文档承诺的 **21 个脚本全部存在**；正文与工作区副本逐字节一致、无 `U+FFFD`。

#### 2026-09-17 接手复核（本轮）
按同一套流程复跑，结论：**站点无回归，基线全部命中**（数字与上表完全一致）。
```
node -v / npm -v                         # v24.12.0 / 11.6.2
npm run build                            # 退出码 0
node scripts/smoke.mjs                   # 45/45（本地）
node scripts/smoke.mjs https://cloudwing.pages.dev   # 45/45（线上）
```
14 个脚本逐项复跑全绿：hero 49/49、home 25/25、nav-shrink 37/37、nav 15/15、brand 10/10、
theme 11/11、redesign 14/14、search 17/17、videobg 15/15、videobg-global 25/25、
mobile-shots 15/15（零横向溢出）、diag-errors 7 页全 0。
**复核中唯一发现的问题是文案**（`SITE.notice` / `SITE.tagline` 还写着"浅色通透"，已修并上线，
详见 §32）；另修正了 `CODEX.md` / `README.md` 的过期描述。

### 7.4.2 交接时"要顺手核一遍文案"的检查项（脚本抓不到）
本次的经验：**几何/颜色类断言全绿，也挡不住一句写错的文案上线。** 改完主题/视觉方向后，
交出去之前手动核这几处用户可见文字与当前实现是否一致：
```
□ src/site.ts 的 SITE.tagline     → 首页 hero 副标题 + SEO
□ src/site.ts 的 SITE.notice      → 页脚 title+文本、关于页 .note
□ 各页 <title> / <meta name="description">
□ README.md 首行定位句
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

- **主题：只有一套暗色。**（2026-09-15 删除亮色主题与切换按钮，见 §27）
  `Base.astro` 首屏内联脚本**先于渲染**把 `<html data-theme="dark">` 写死，避免闪烁；
  `ui.js` 的 `lockDarkTheme()` 在每次 `astro:page-load` 后写回（ClientRouter 会用新文档的
  `<html>` 覆写属性）。**没有开关、没有 `cw-theme-pref`、没有 `html[data-theme='light']` 规则。**
  自检：`node scripts/verify-theme.mjs [url]`（单主题不变量，11 项）。
  > 若以后真要加回浅色：**不能只加个开关** —— 需要一整套独立配色，并重新跑全站对比度审计
  > （浅色玻璃 + 白字在物理上无法同时成立）。
- **配色**：暗色电影感 + 玻璃拟态，令牌集中在 `global.css` 的 `:root`（即暗色），
  `motion.css` 的 `html[data-theme='dark']` 是**同一组值的镜像**（保持既有选择器仍有效）。
  强调色是**雾蓝** `--accent: #9FD3E8`（取自背景视频的 192° 青蓝，见 §23）。
  文字白色/浅灰（`--ink` / `--ink-2` / `--ink-3`），**不要引入新色相**。
- **玻璃材质**（全站统一走令牌，别在组件里写死数值）：
  `--glass-blur: blur(20px) saturate(1.2)`（导航另有 `--nav-blur-scrolled`）、
  `--line-2: rgba(255,255,255,.2)`（细边框）、`--line-hover`（悬停提亮）、
  `--r-s/m/l: 12/18/24px`、`--glass*: rgba 深色底`、`--glass-panel`（浮层，近不透明）。
  移动端（≤640px）在 `global.css` 里把 `--glass-blur` 降到 `blur(12px) saturate(1.1)` —— 一处生效。
- **边框宽度：现在是 `1px`**（暗色电影感要"薄边"）。2026-09-15 早些时候曾统一加粗到 `2px`，
  后来随视觉重构改薄。**唯一要记住的坑**：Blink 会把 `1.5px` 向下取整渲染成 **1px**
  （实测 devicePixelRatio 1 与 3 都是 1px），所以要么写 `1px` 要么写 `2px`，别写 1.5px。
- **Astro 页面/组件里的 `<style>` 是作用域样式，优先级高于 global.css / motion.css**：
  组件里写死的 `1px solid …` 会把全局令牌**局部盖掉**（曾因此 15 处加粗无效）。
  加粗/换色不合预期时，先查页面与组件里的作用域样式（`grep -r "1px solid" src/`）。
  自检脚本：`node scripts/border-check.mjs [url]` 打印各元素**实际生效**的边框宽度/颜色；
  `node scripts/card-separation.mjs [url]` 量"卡面 vs 页面底色"分离度。
- **字体：Inter + 系统中文回退**（2026-09-15 从 Outfit 换成 Inter；Google Fonts 只取 300–500 三档，
  因为全站 `font-weight` 已压到 500 以内）。字体栈定义在 `:root` 的 `--font-body` / `--font-display`。
### 9.1 手机端（2026-09-15 优化，改窄屏前先读）
- **三栏侧栏在 <1200px 整体隐藏**（`.shell-left/.shell-right { display:none }`），
  手机端只有单列正文 + 顶栏汉堡抽屉。也就是说手机端**没有**个人信息卡/天气/统计/更新日历/最近更新。
- **画廊在 ≤620px 改两列**（原来单列 40 张 → 整页 1.3 万像素高，约 16 屏；两列后约 4600）。
  `.gal-cover` 的 `aspect-ratio` 是**行内样式**（来自每条内容的 `aspect` 字段），
  窄屏规则只收紧间距与文案，不覆盖比例。
- **工牌（Lanyard）在手机端是文档流里的一块**（桌面端才绝对定位贴右上角）。
  下拉手势仅在 ≥1025px 启用；「下拉/点击开关灯」已随亮色主题一起删除（§27），
  现在手机端只保留拖拽的装饰手感。ReactBits 的 `.lanyard-wrapper`
  自带 `min-height:420px`，窄屏容器必须跟着给到 ≥400px，否则会被裁。
- **顶栏在 ≤620px 收紧**：品牌字号/图标变小并允许省略号，`.acts` 间距 5px，
  `.pill/.burger` 高 36px；≤520px 隐藏 GitHub/搜索文字，≤400px 隐藏品牌副标题。
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
| 作品封面 SVG 偏亮 | `public/covers/*.svg` 当初按**浅色底**设计，在现在的暗色站上偏亮。属内容资产，需要时可重画一批暗色版 |
| 背景视频体积 | `public/media/bg-loop.mp4` 约 15.5 MB，每位访客都会下载。嫌重可以：换更短片段 / 压到 8MB 内 / 手机上不加载（见 §23 的 `VIDEO_BG` 令牌） |
| 背景视频主色调 | 素材稳定在 **192° 青蓝**，与站点雾蓝强调色同族。**换素材要重取色相**（`--accent` 系） |
| 工牌交互 | 原来"下拉/点击工牌开关灯"随亮色主题一起删了，现在只剩拖拽的装饰手感（§27）。要不要加别的反馈？ |
| 左栏「分类」分组 vs 导航二级菜单 | **已解决**（2026-09-18）：导航照参考重做后不再有二级菜单，分类只剩左栏一处 |
| 顶栏搜索入口 | 照参考重做导航后，顶栏不再有搜索按钮；搜索只剩 ⌘/Ctrl+K 与左栏/移动端菜单的入口。可访问性上少了可见入口，要不要加回来说一声（见 §33） |
| 作品详情页 summary / 404 说明文字 | 早先"删除子页面简介"时保留了，要删说一声 |
| 个人信息卡横幅图 | `SidebarNav.astro` 顶部常量 `PROFILE_BANNER = ''`，留空＝主题渐变；填站内图片路径即换成图片 |
| 天气城市 | `src/site.ts` 的 `WEATHER_CITY = ''`＝按访客 IP 自动定位（推荐，不暴露你的位置）；填城市名则固定（等于公开城市） |
| 画廊原图 | 40 张原始 PNG 备份已随工作区清理删除，仓库里的 webp 是唯一副本（详见 §11） |
| `SESSION_HANDOFF.md` | **已删除**（交接时清理，见 §11.2） |
| 文案复核机制 | 2026-09-17 修掉了线上"浅色通透"文案（§32），并加了 §7.4.2 的手动检查清单 —— 但**文案仍然没有自动化断言**。要不要给 `SITE.notice` / `tagline` 也加一条脚本断言，避免下次再漂移？ |
| **线上间歇 `React error #424`** | 仅线上、约 1/3 轮次复现，本地（含改动前的基线）连跑 10+ 轮全绿；缓存、部署完整性、本次改动均已排除（详见 §32）。**尚未定位根因**。要不要我专门开一轮来定位它？ |
| 变更记录未写 | 本次修文案与重写文档都**没有**写进 `src/content/changelog/`，所以侧栏「更新日历」看不到这几笔。要补一条 `2026-09-17.md` 说一声 |
| `/account/` 页面很短 | 手机端实测页面高只有 906px（其它页 4000+），目前只有留言板一块，要不要补内容？ |

---

## 11. 工作区清理记录

### 11.1 首轮大清理（2026-09-15，6,581MB → 437MB）

- 删除的会话产物/缓存：诊断截图 2.2GB、无头浏览器配置、npm 缓存 859MB、vision 产物缓存、写入测试残留、根目录误建的 `public/`。
- 删除的其他任务文件（用户确认）：`dev-setup` 1.8GB、`.venv` 470MB、`mc-originals-backup` 180MB、`pylibs` 135MB、
  pip 缓存 203MB、`data`(MNIST) 64MB、`dsh-tools` 35MB、参考目录与实验脚本、简历/课业文件、Jupyter 状态等。
- 已同步修正 `CODEX.md` / `README.md` 里指向 `mc-originals-backup/` 的失效路径（提交 `fbba3b6`）。

### 11.2 交接前例行清理（2026-09-15 晚，释放 112MB）

清理后工作区 **486MB**，只有 4 项：`endfield-blog/`、`.recode/`、`_shots/`（空）、`HANDOFF.md`。

| 删除 | 原因 |
|---|---|
| `_shots/`（84 张，108.6MB） | 调试截图。**全部由验证脚本现场生成，可直接删** |
| `_shots-before/`（6 张，3.3MB） | 亮色主题对比基线，主题已删（§27）→ 无意义 |
| `endfield-blog/SESSION_HANDOFF.md` | gitignore 的旧交接笔记，内容已过时（引用 `_shots-before` 等失效路径） |
| `_shots/_vid-off.png`、`_vid-on.png` | 0 字节空文件（当时截图失败留下的） |

> **关于 `_shots/`**：这是**验证脚本的输出目录**（13 个脚本按绝对路径写入
> `D:\deep seek workplace\_shots\`），已保留为空目录。
> ⚠️ 其中**多数脚本不会自建目录**（只有 `mobile-shots.mjs` / `shot-countup.mjs` /
> `shots-theme.mjs` / `sweep-light.mjs` 有 `mkdirSync`）—— **别把这个目录整个删掉**，
> 否则那 9 个脚本会因写盘失败而中断。删图可以，删目录不行。
> 里面的图随时可重新生成，不需要备份。

**没有动的东西**（评估后保留）：`node_modules/`（412MB，本机依赖，删了要重装）、
`dist/`（26MB，预览服务器正在用，且 `start-cloudwing.cmd -n` 依赖它）、
`.git/`（25MB）、`.astro/`（构建缓存，0MB）。
另外 `package-lock.json` 虽然被 gitignore（§2 说明为何不能提交），**但本机装依赖需要它，别删**。

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
- **岛屿降级**：`client:load` → `client:idle`/`client:visible`
  —— ⚠️ **`client:visible` 会与软导航冲突并抛 `React error #424`**（§6.19），
  常驻小岛要用 `client:idle`，别用 `visible`；
- 参考判据与实测手法见 §7（CDP 冷缓存量传输量、sharp 算保真）。
> 用户当时明确要求"终止任务、取消这次优化"，所以这些**不要擅自重做**，要问过再动。
