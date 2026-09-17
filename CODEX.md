# CODEX 交接指南 — CloudWing / 云翼

> 仓库内**简版硬规则**。给 Codex（或任何接手开发者）先读这一份，够你安全动代码。
> 需要完整背景（症状→根因→修法、验证手法、遗留待决项）时读 [`docs/HANDOFF.md`](./docs/HANDOFF.md)。
> 两份冲突时**以 `docs/HANDOFF.md` 为准**。

## 项目一句话

Astro 7 静态个人档案站，**暗色电影感 + 玻璃拟态 UI，只有一套暗色主题**
（没有浅色主题、没有主题开关 —— 见「主题机制」）。源码在 GitHub `CloudWingX/cloudwing`，
Cloudflare Pages 自动构建部署到 `https://cloudwing.pages.dev`。

## 立即能跑

```bash
cd D:\deep seek workplace\endfield-blog       # Windows 本机路径
npm install                                   # 依赖已装好（node_modules 在仓库里）
npm run build                                 # astro build && pagefind --site dist
npm run build:fast                            # 只 astro build（改样式时更快）
npm run preview -- --port 4321 --host 127.0.0.1
node scripts/smoke.mjs                        # 自检入口（当前基线 45/45）
```

> 导航栏与首页 Hero 在 2026-09-18 照用户给的参考文件整体重做过
> （`position: fixed`、不再下滑收起、二级菜单已移除、Hero 是静态版式）。
> **改这两块之前先读 `docs/HANDOFF.md` §33**，那里记了形态取值与一批真实踩坑。

## 七条硬规则

1. **ReactBits 原码不动**：`src/components/ReactBits/*` 是官方原码。要改视觉 → 新建宿主组件
   （`src/components/*.jsx`）传 props / 覆盖 CSS。唯一例外已在文件内注明
   （`VariableProximity.css` 删掉了失效的 Google Fonts `@import`）。
2. **软导航会重建 DOM，但页面脚本不会重跑**：站内用 `<ClientRouter />`。任何交互必须写成
   **document 级事件委托 + `window` 上的单例状态**，并在 `astro:page-load` 里重新绑定。
3. **事件挂在 `document` 上，不是 `window`**：`astro:page-load` / `astro:after-swap`
   在 document 上派发**且不冒泡**，挂 window 永远收不到（已踩坑两次）。
4. **常驻小岛一律 `client:idle`**：`client:visible` 与软导航的水合时机冲突，会抛
   `React error #424`（水合不匹配，控制台无诊断信息）。不要用 `client:visible`。
   ⚠️ **本站在"线上"仍会间歇性（约 1/3 轮次）抛 #424，本地永远复现不了**；
   已排除缓存与代码改动，详见 `docs/HANDOFF.md` §32，别误判成自己改坏了。
5. **玻璃材质走令牌，不在组件里写死数值**：`--glass-blur` / `--line-2` / `--r-s|m|l` /
   `--glass*` / `--glass-panel`。页面与组件的 `<style>` 是作用域样式，**优先级高于 global.css**，
   写死 `1px solid …` 会局部盖掉全局令牌。边框只写 `1px` 或 `2px`（Blink 把 1.5px 取整成 1px）。
6. **改底色要改两处**：`global.css` 的 `:root` 与 `motion.css` 里 `html[data-theme='dark'] body`
   （后者会整条覆盖前者）。只改一处不生效。
7. **隐私红线**：不得出现真实姓名、学校、企业名（作者身份统一为 `CloudWing_X`）；
   不要把简历 / 课业 / 个人文档放进仓库或 `public/`。

## 主题机制（只有暗色）

- 站点**恒为暗色**。`Base.astro` 首屏内联脚本先于渲染写死 `<html data-theme="dark">`（防闪烁）；
  `ui.js` 的 `lockDarkTheme()` 在每次 `astro:page-load` 后写回（ClientRouter 会用新文档的
  `<html>` 覆写属性）。
- **不存在** `cw-theme-pref`、`.theme-toggle`、`applyPref()`、`html[data-theme='light']` 规则 ——
  这些已全部删除（2026-09-15）。别再"修"它们。
- 强调色是雾蓝 `--accent: #9FD3E8`（取自背景视频的 192° 青蓝）。
- 自检：`node scripts/verify-theme.mjs`（单主题不变量，11 项）。

## 构建 / 部署坑（重要）

1. **不要提交 `package-lock.json`**（已在 `.gitignore`）：Windows 生成的 lock 缺平台相关可选依赖
   （`@emnapi/*`），云端 Linux `npm ci` 会失败；无 lock 时 Cloudflare 自动 `npm install`。
   本机需要它，所以别删本地那个文件。
2. **`react` / `react-dom` 精确锁 `19.2.8`**，不要改成 `^`：浮动会解析到 19.3，与
   `@react-three/fiber@9.7` 的 peer `>=19 <19.3` 冲突 → 云端 ERESOLVE 构建失败。
   `.npmrc` 的 `legacy-peer-deps=true` 是兜底，保留。
3. **构建 shim 勿删**：`plugins/vite-cjs-inline-shim.mjs` 修 Node 24 + Astro 7.3 的
   `require is not defined`（picomatch CJS）。不要改 `node_modules`。
4. **`IMG_CDN = ''`（`src/site.ts`）**：图片走本地相对路径随 dist 分发。
   **不要改回 jsDelivr** —— 国内不稳，曾导致整站图片打不开。
5. **`backdrop-filter` 书写顺序**：必须 `-webkit-` 在前。标准属性在前时构建压缩会把整条丢掉
   （计算值直接变 `none`，模糊消失）。改完模糊没效果先去构建产物里搜这条规则还在不在。
6. **推送后要轮询线上确认**：CF 构建约 30~90 秒。**不要用 chunk 哈希判断部署**
   （本地与线上哈希可能不同），用**内容特征**去线上 HTML/CSS 里找。
7. **git 走代理**（仓库级配置）：`http.proxy = http://127.0.0.1:33210`。git 不读 Windows 系统代理；
   代理没开时会超时，改成直连：`git config --local --unset http.proxy`。

## 目录速览

```text
src/
  site.ts                  ← 站点信息 / NAV / IMG_CDN / GISCUS / MUSIC / VIDEO_BG / WEATHER_CITY
  content.config.ts        ← 三个集合 schema：works / shots / changelog
  content/works/*.md       ← 作品（每件 1 个 md → 卡片 + 详情页）
  content/shots/*.md       ← 影集条目（40 个，对应 public/shots/mc/*.webp）
  content/changelog/*.md   ← 一天一个文件，驱动侧栏「更新日历」
  layouts/Base.astro       ← 全站壳：暗色引导 / Header / Footer / 背景视频 / Particles
  layouts/WorkLayout.astro ← 作品详情页布局（含上下篇导航）
  pages/                   ← index / works / gallery / about / account / 404 / rss.xml
                             （★搜索不是页面★，是 components/SearchModal.astro 悬浮窗）
  components/ReactBits/    ← React Bits 官方原码，勿改核心
  components/*.jsx         ← 宿主层（Particles / Lanyard / ProximityText 的适配）
  scripts/ui.js            ← ★全站交互中枢（软导航后一切功能都靠它重新接管）
  scripts/hero-anim.js     ← 首页 Hero 四个动画
  scripts/nav-mobile.js    ← 汉堡菜单 + 顶部指示线
  styles/global.css        ← 设计 token + 玻璃基础（★:root 即暗色）
  styles/motion.css        ← 动效 token + html[data-theme='dark'] 镜像块
  styles/shell.css         ← 三栏壳层 + 侧栏卡片
public/                    ← covers / lanyard / og / shots / media(bg-loop.mp4) / favicon
```

**死代码 / 易误记**：`DriftWallBackground.astro`、`HomeShapeGrid.jsx` 已无引用；
`motion.css` 里的 `.topbar{…}` 是死代码（顶栏真实类名是 `.hd` / `.hd-glass`）。

## 页面

| 路由 | 文件 | 说明 |
|---|---|---|
| `/` | `pages/index.astro` | Hero（徽标 + 两行大字 + 副标题 + 两个统计 + 技术标签 ｜ 右侧展示卡片，照参考复刻）+ 最新作品 / 精选影像 / 关于预览 |
| `/works/` | `pages/works/index.astro` | 卡片网格 + 分类筛选（浏览器端读 `location.search`） |
| `/works/[slug]/` | `pages/works/[slug].astro` | 详情（WorkLayout + Markdown 目录 + giscus + 上下篇） |
| `/gallery/` | `pages/gallery/index.astro` | 40 图玻璃网格 + `<dialog>` 大图；`?game=` 浏览器端过滤 |
| `/about/` | `pages/about.astro` | 履历时间线 + MagicBento + Lanyard 工牌 + ProximityText 标题 |
| `/account/` | `pages/account.astro` | 互动：giscus 留言板 |
| `/404` | `pages/404.astro` | — |
| `/rss.xml` | `pages/rss.xml.ts` | 作品档案 RSS |

> ⚠️ `ProximityText`（ReactBits `VariableProximity` 宿主）按**空格**分词且每词 `nowrap`：
> **中文长句会被当成一个不可换行的词导致溢出，切勿用于中文段落**，只适合短文本 / 拉丁标题。

## 内容怎么加

- **作品**：复制 `src/content/works/w00X-*.md` → 改 frontmatter
  （`title / summary / date / order(→W-00x 编号) / tags[] / tools[] / state / cover / link?`）。
  `tags` 会出现在顶部导航「作品库」二级菜单。
- **影集**：webp 放 `public/shots/mc/`（1600w q78，约 80KB 内）+ `src/content/shots/` 加一条 md
  （`title / date / game / image / note / aspect`）。`game` 会出现在导航「画廊」二级菜单。
- **更新记录**：`src/content/changelog/YYYY-MM-DD.md`，一天一个文件，`items[]` 里写
  `kind / title / note?`。
- 新增作品后跑 `npm run og` 重新生成分享图（`scripts/gen-og.mjs`，基于 sharp）。

## 验证 — 三条铁律

全部脚本在 `scripts/`，用法 `node scripts/<名>.mjs [url] [light|dark]`。
前置：**预览 4321 已起 + 无头浏览器 9222 已起**。退出码 0=全过 / 1=有失败 / 2=环境没起。

1. **用轮询等待，不要固定 `sleep`**：无头浏览器渲染快慢不定，固定等待会读到还没渲染的文档 →
   `undefined` 的**假失败**（同一份脚本实测能出现 5/14 与 14/14 两种结果）。
2. **别让标签页开两次**：用 `json/new?about:blank` 开空白页再 `Page.navigate` 一次。
3. **★串行跑，不要并发★**：多个脚本同时占用同一个调试浏览器会互相干扰，产生大面积假失败
   （实测并发时 `verify-theme` 8/11、`verify-hero` 48/49、`verify-videobg-global` 多项失败，
   重启浏览器串行重跑全部通过）。另外每跑几十次要重启浏览器（标签页会累积到拖垮布局等待）。

### 基线（改动后应当仍是这些数字）

| 脚本 | 覆盖 | 基线 |
|---|---|---|
| `smoke.mjs` | 总入口：溢出 / 异常 / 侧栏同步 / 软导航 / 手机端 | **45/45** |
| `verify-hero.mjs` | 首页 Hero 几何/排版/断点（照参考实测值） | **44/44** |
| `verify-home.mjs` | 首页四层结构 / 图片策略 / SEO | **23/23** |
| `verify-nav-shrink.mjs` | 导航三态 + 移动端汉堡 | **36/36** |
| `verify-nav.mjs` | 导航几何 / 分类入口在左栏 / 无遗留二级菜单 | **14/14** |
| `verify-brand.mjs` | 品牌标志 | **10/10** |
| `verify-theme.mjs` | 单主题不变量 | **11/11** |
| `verify-redesign.mjs` | 玻璃令牌 / 暂停按钮 / 导航过渡 | **14/14** |
| `verify-search.mjs` | 搜索悬浮窗 | **17/17** |
| `verify-videobg.mjs` | 背景视频 + hero 实际像素对比度 | **17/17** |
| `verify-videobg-global.mjs` | 全站视频一致性 + 软导航不重建 | **25/25** |
| `contrast-audit.mjs` | WCAG 对比度审计（渐变文字逐停靠点取最差） | 暗色 **0 处不达标** |
| `mobile-shots.mjs` | 三机型 × 5 页截图 + 溢出 | **15/15 无溢出** |
| `diag-errors.mjs` | 逐页 JS 异常计数 | 7 页全 **0** |

改完对应模块就跑它；`smoke.mjs` 是每次都要跑的总入口。

## 改完必须做的三件事

1. `npm run build` 无报错；
2. 本地预览**实测**（别只看 HTML），跑 `node scripts/smoke.mjs`；
3. `git add -A && git commit && git push origin main`，然后**轮询线上确认真上线**
   （用内容特征，别用哈希）。
