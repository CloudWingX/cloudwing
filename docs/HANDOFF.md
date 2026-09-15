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
│   ├─ WeatherCard.astro     # 天气卡骨架（数据由 ui.js 在浏览器端填）
│   ├─ GiscusComments.astro  # 留言板/评论区（主题跟随、防重复注入）
│   ├─ WorkCard.astro 等     # 作品卡、HexMark、页脚、打字机等小件
│   ├─ ReactBits/            # React Bits 官方组件原码（见 §5 铁律三）
│   └─ *.jsx                 # 宿主层：Particles 背景、Lanyard、ProximityText、CardSwap…
├─ src/pages/                # 首页 / 作品库 / 作品详情 / 画廊 / 关于 / 互动 / 搜索 / 404 / rss.xml
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

### 7.2 视觉/像素取证（vision 工具可能被限流或关闭，本仓库一律用本地手段）
- 截某区域做**密度图**（把 PNG 裁一块降采样成 ASCII）→ 看清布局与元素占位；
- `sharp` 统计（本机 `endfield-blog/node_modules/sharp` 可用）：算均值/标准差、做像素差分、算贴图保真（PSNR）；
- 几何断言优于肉眼：直接量矩形、比较是否重叠、`scrollWidth - clientWidth` 判横向溢出。
- **已脚本化的三个取证工具**（2026-09 加，改版式/配色时直接用）：
  - `node scripts/contrast-audit.mjs [url]` — 亮色主题**可读性审计**：每个可见文字节点算
    「前景 vs 实际合成背景」的 WCAG 对比度，列出不达标项（含渐变裁切文字近似）。
    退出码 0=无问题 / 1=有不达标 / 2=环境没起。**当前基线：0 处不达标。**
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
□ 软导航一圈（首页↔作品库↔详情↔画廊↔关于↔互动↔搜索）后：交互仍可用、无 JS 异常
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
  → 天气卡 → 导航树（作品库/分类/站点/画廊四组，默认折叠，当前项高亮）。
- **右栏**：站点统计 / 更新日历（可点日期看当天记录）/ 最近更新（单行 4 条）/ 今日一言。
- **导航栏**：`Header.astro`，下滑超 140px 自动收起（0.28s 动画，上滑滑回；移动端抽屉打开时不收），
  作品库与画廊有**分类二级菜单**（数据来自内容集合：作品 tags / 截图 game）。

---

## 9. 主题、字体、令牌

- 主题：`html[data-theme=light|dark]`，偏好三通道持久化 `cw-theme-pref`（localStorage→sessionStorage→Cookie），
  `Base.astro` 头部内联脚本**先于渲染**应用，避免闪烁；切换由 `ui.js` 的 `initThemeToggle()` 委托处理。
- 配色：黑白灰 + 玻璃（`--accent` 浅色近黑、深色近白；`--accent-grad` 复用做横幅/按钮），
  令牌集中在 `global.css` 的 `:root`，深色覆盖在 `motion.css` 的 `html[data-theme='dark']`。**不要引入新配色**。
- **边框（2026-09-15 加粗，别调回去）**：三档颜色 + 三档粗细，全站统一走令牌，不要写死 1px：
  | 令牌 | 浅色 | 深色 | 对比度 | 用途 |
  |---|---|---|---|---|
  | `--line-1` | `rgba(12,12,14,.30)` | `rgba(255,255,255,.26)` | ≈2.0:1 / 2.25:1 | 行分隔、区块分隔（保持低调） |
  | `--line-2` | `rgba(12,12,14,.50)` | `rgba(255,255,255,.44)` | ≈3.5:1 / 4.6:1 | 卡片、胶囊、控件的实边框 |
  | `--line-glass` | `rgba(255,255,255,.72)` | `rgba(255,255,255,.36)` | 玻璃面内白描边 | 玻璃卡外框、顶栏、按钮 |
  | `--line-w` | `2px` | — | — | 按钮 / 标签 / 顶栏 / 侧栏卡 / 目录 |
  | `--line-w-card` | `1.5px` | — | — | 内容卡（作品卡 / plate / feat / step / door-row） |
  | `--line-w-pill` | `1.5px` | — | — | 小胶囊（标签 / 联系方式 / 日历格 / 统计格）——**不要用 2px**，会把「GitHub/Bilibili/邮箱」那排挤到换行 |
  原值（`--line-1` 1.32:1、`--line-2` 1.84:1）低于非文字 UI 的 3:1 可见性门槛，元素边界糊在一起很费眼。
- 字体：**西文 Outfit 走 Google Fonts**（`Base.astro` 里 preconnect + `css2?family=Outfit:wght@400..900`；国内可能连不上，
  断网/受限时回退系统字体）；中文走系统字体（PingFang SC / 微软雅黑…）；代码块用 `--font-code`。
  MiSans 那条 jsDelivr 外链已删除（仓库 404、字体从未生效）。详见 §13「做过但被取消的优化」。
- 动效：统一在 `prefers-reduced-motion` 下关闭（`.sli`/`[data-ent]`/`page-enter`/粒子/WX 脉冲等）。

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
