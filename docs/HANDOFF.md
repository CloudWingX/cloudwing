# CloudWing 云翼 · 项目交接文档（HANDOFF）

> 写给**接手这个站点的开发者 / 下一个 agent**。
>
> **本文件有两个位置，内容一致，改完请两边同步**：
> - 仓库内（随项目走、GitHub 可见）：`endfield-blog/docs/HANDOFF.md` ← 你正在看的这份
> - 开发机工作区根目录：`<工作区>/HANDOFF.md`（不随仓库发布）
>
> 相关文档：`README.md`（面向访客的项目说明）。原仓库根的 `CODEX.md` 已于 2026-09-19 删除
> （见 §43.1），其"简版硬规则"职责并入本文件。
> 文中的本机路径（`D:\deep seek workplace\...`、Edge 路径、代理端口）来自开发机，换机器请按实际情况替换。
>
> 最后更新：2026-09-22 凌晨 **全站统一 1300 网格（§66）：子页面壳层 1600 → 1300、
> 内容内边距对齐导航（--pad-align 32/24/20），导航与内容逐像素同位；Header 一行未动**；
> 此前深夜 **新增「Peak」图集（PEAK 截图 18 张全尺寸，画廊 40 → 58，见 §65）**；
> 同日晚 **新增「日历」子页面 /calendar/（农历+节气+2025/2026 法定节假日与调休+站点更新叠加，smoke 64 → 73，见 §64）**；
> 同日傍晚 **交接完善：全篇基线数字刷新（21 脚本 / 21/21 / smoke 58/58）、
> §57 章节地图与阅读路径、09-20 changelog 补录（4 条）**；
> 同日下午 **右栏新增「GitHub 热榜」卡（日/周/月/年四周期，时间桶缓存
> 实现「24 点自动换新」，新第 21 号脚本 verify-ghhot，见 §56）**；
> 同日中午 **归档页标题下新增「更新热力图」（GitHub contributions 风格，
> 按日更新条数着色，见 §55；顺带修掉 `--accent-rgb` 只在首页定义、其它页 rgba() 静默失效的坑）**；
> 同日凌晨第三轮 **顶栏「记录」点击不再跳转——只开合二级菜单
> （捕获阶段拦截 + stopPropagation 压过 ClientRouter，见 §54）**；
> 同日凌晨第二轮 **「记录」三页（文章/归档/日志）+ 档案页与其余子页面壳层统一：
> 标题→内容间距全站 1.6rem、档案页页头改「PROFILE / 档案 + h1 档案」（ProximityText 特效保留），见 §53**；
> 同日凌晨 **壳层统一：子页面页头格式统一（kicker「EN / 中文」、删标题下描述）、
> 内容列顶部与侧栏首卡顶边全页对齐（偏差 0），见 §52**；
> 2026-09-19 深夜 **顶栏新增「记录」悬停下拉——文章/归档/日志收进一个入口，见 §51**；
> 同日晚 **新增「日志」子页面 `/log/`——changelog 的完整展开版，见 §50**；
> 同日下午 **确立全站交互策略（禁鼠标拖选 / 点击不出轮廓 / 键盘轮廓保留，见 §49；
> 文章正文按站长裁决仍可复制，见 §49.3）**，
> 并**修掉导航卡"真实图标与首字圆牌重叠"（见 §48.6）**、
> **把两个取不到图标的站改用通用 logo 并补上"暗底可读性"断言（见 §48.7）**；
> 同日 **确立测试分层策略（见 §47：全量回归不再每次跑）**；
> 同日 **新增「网站导航」子页面 `/nav/`（毛玻璃卡片网格，见 §44）**，
> 并把站点条目**填实为 6 组 21 个**（见 §46）；同日完成**线上终检 27/27**（见 §45）；
> 稍早 **删除 `CODEX.md`；纠正"删除类改动是否上线"的确认手法（见 §43）**；
> 更早 **清死资产 + 文案自动化断言 + 文档纠偏（见 §42）**；
> 同日凌晨（移除页脚 / 去 AI 味文案 / 加载与按钮动效，见 §41）。
> 前一日的五轮：**定位并修掉间歇出现的 `React error #424`**（见 §37）；
> 同日四轮（删掉首页最后一层"只铺在容器盒里"的装饰薄膜，
> 见 §36.3；三轮把"大标题＋代码卡片"整块竖向居中、标题 48 → 52px，见 §36.2；
> 二轮把 PC 主容器与导航容器收到 **1300**，见 §36.1）；
> 更早一轮的整轮重做（导航 / 首页 Hero / 代码卡片 / 强调色预设）见 §33–§36。
> 部署：Cloudflare 自动构建 —— 推 `main` → 构建 `npm run build` → 线上 <https://cloudwing.pages.dev>。
> ⚠️ **新写像素/几何断言之前先读 §7.6**（三条硬要求：单位口径、扫描范围必须覆盖被怀疑的边界、
> 并**证明它在缺陷态下会红**）—— 本文件里已经有过"断言恒真、连过两轮都没抓到真瑕疵"的教训。
> ★**测试分层：不要每改一个子页面就跑全量回归**（2026-09-19 站长明确要求，见 **§47**）★：
> 单页/组件 → 只跑该页冒烟 e2e（`node scripts/smoke.mjs`）+ 该模块脚本；
> 功能模块 → 相关模块脚本 + 关键路径 e2e；
> **全量回归 `run-regress.mjs` 只在 PR 前 / 合并前 / 发布前 / 站长明确要求时跑，且优先交给 CI**。
> 自检入口仍为 `cd endfield-blog && node scripts/run-regress.mjs`（**现为 21 个脚本**一次批跑）→
> 最近一次 **21/21 全绿**（2026-09-20 下午，GitHub 热榜卡 + 新脚本 verify-ghhot 加入后的发布前全量，见 §56；
> 此前 20/20 见 §53 / §54）；
> 单入口 `node scripts/smoke.mjs` 为 **73/73**（2026-09-20 晚，日历子页面：壳层 +5 + 功能断言 +4，见 §64；此前画廊文件夹视图回归段 +3，见 §59）。
> ✅ **文案漂移现在有断言了**（2026-09-19）：`scripts/verify-copy.mjs`（31 条，见 §7.2 / §42.2）——
> §32 那种"几何全绿却带着错文案上线"的缺陷类已被堵住。
> ✅ **`React error #424` 已于 2026-09-18 定位并修掉**（见 §37）：根因是软导航时
> Astro 对**尚未水合**的 React 岛调用 `root.unmount()` —— 与本站组件代码无关，是时序竞态。
> 修法是构建期插件 `plugins/vite-react-safe-unmount.mjs`；
> 要复现/验收用 `scripts/diag-424.mjs`（修复前 2 轮命中 7 次、修复后 0 次）。
> 全套验证脚本与用法见 **§7.2**；本机调试浏览器起法见 **§7.1**。
> ⚠️ **验证脚本必须串行跑**（并发会大面积假失败，见 §7.1 第 6 条 / §32）。
> ⚠️ **不要在 bash 里做删除**（沙箱删除钩子会连带删掉整个父目录，见 §2 / §42）。
> ⚠️ **改导航 / Hero / 强调色 / 容器宽度前先读 §33–§36，首页版式还要读 §36.1 / §36.2**（形态取值与实测踩坑都在那里）。

---

## 0. 一句话现状

个人博客与档案站「云翼 / CloudWing」，**Astro 7 静态站 + React 岛 + 暗色电影感玻璃 UI**，源码在 `endfield-blog/`，
线上 <https://cloudwing.pages.dev>，仓库 <https://github.com/CloudWingX/cloudwing>（公开），
推 `main` 即由 Cloudflare Pages 自动构建部署。**站点处于可用且已验证的状态**：
验证脚本现为 **21 个**（批跑队列见 `scripts/run-regress.mjs`；单入口 `smoke.mjs` **58/58**），
最近一次发布前全量 **21/21**（2026-09-20 下午，见 §56.4）；可读性 0 处不达标、
8 个页面 0 JS 异常、手机端 0 横向溢出（三机型 × 7 页）。
（另有若干**工具/诊断脚本**：`diag-edges` / `probe-point` / `diag-424` / `poll-deploy` /
`border-check` / `imgstats` / `shot-*` 等——不在批跑队列但不是死代码，清单见 §7.2 表尾。）
⚠️ **"一键批跑"不等于"每次改动都要跑"** —— 测试按 §47 分层，全量只在 PR/合并/发布/明确要求时跑。

> **接手第一件事**：`cd endfield-blog && npm run build && node scripts/smoke.mjs`（期望 **64/64**）。
> ⚠️ 必须用 `npm run build`（= `astro build && pagefind --site dist`）——只跑 astro build
> 不会生成 pagefind 索引，verify-search 会全红。⚠️ 回归前确认 4321 服务是**新起的**
> （陈旧的 preview 会让你测一小时的旧 dist，见 §41）。
> 改导航 / 首页 Hero / 强调色 / 容器宽度之前，**先读 §33–§36**（这四块在 2026-09-18 被连续重做过，
> 里面的"形态取值、被删的旧结构、踩过的坑"都是实测结论，不看会重复踩）。

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

### 0.2 本轮（2026-09-18）做了什么 —— 交接摘要

> HEAD `480a907`（本次代码提交；文档提交在其后），全部已提交、已推送、线上已验证
> （1440 / 1600 / 1920 均实测）。详细见 §33–§36，本轮复核记录见 §7.4.3。

| 主题 | 结果 | 关键位置 |
|---|---|---|
| **修线上文案缺陷** | `site.ts` 的 notice/tagline 还写着"浅色通透"，而站点早已是暗色；**14 个脚本都抓不到文案** | §32 |
| **文档纠错** | `CODEX.md` 重写（原版还在教已删除的双主题/`/search/`页/工牌开灯）；`README` 修正 | §32 |
| **导航照参考重做（全局）** | `fixed` 定位、滚动收缩 1280→1120 / 64→56 / 32→24、去掉下滑收起与二级菜单、顶栏搜索入口移除 | §33 |
| **首页 Hero 照参考复刻** | 徽标 + 两行标题 + 副标题 + 两个统计 + 技术标签 ｜ 右侧卡片；旧的 eyebrow/CTA/描边全删 | §33 |
| **手机端优化** | 左对齐（原居中）、96px 顶呼吸位、gap 32、**代码卡不再横向滚动**（原滚 93–123px） | §33 |
| **两行大标题 + 新副标题** | 第一行纯白、第二行雾蓝渐变；字号按最长行反解（48px 上限） | §35 |
| **代码卡片：参考风格** | 词法类名与参考一致 + **会随色卡变色的色值胶囊**；卡片缩到 440；标题与卡片顶齐平 | §34 |
| **强调色预设（色卡）** | 5 套（雾蓝/镜蓝/极光/余烬/紫晶），同步改强调色 + 整页色调 + 代码高亮，**900ms 中间色补间** | §34 |
| **全局容器加宽** | `--w-max` 1140 → 1428（内容净宽 **1324**，与参考一致）；hero 对齐同一栅格 | §36 |
| **PC 容器收窄到 1300**（二轮） | `--w-max` 1428 → **1300**（净宽 1196）、导航同宽 1300（收缩态 1140）、hero 两栏 gap 80 → **112**；逐值比对证明移动端 0 变化 | §36.1 |
| **首页整块竖向居中 + 标题加大**（三轮） | 大标题＋代码卡片整体挪到屏幕竖直中心（`align-content: center` + `flex-wrap`）；标题 48 → **52px**（左栏 645 → **700**、卡片 440 → **400**、gap **96**） | §36.2 |
| **删掉首页最后一层装饰薄膜**（四轮） | `.hero::before` 强调色柔光**整块删除** —— 它是"只铺在 1300px 容器盒里"的装饰层，被 `overflow:hidden` 沿容器左右边缘切断，在**导航条带左侧**与**代码卡片右侧**各留一条竖分界线（8bit 灰度口径 +1.87 / −1.37）；删掉后首页背景与子页面逐项一致 | §36.3 |

**本轮的几条主线**（下次接手先看）：
1. **"参考"要当数据量，不要当感觉猜**：每次改前都先把参考站渲染出来量（几何/字号/容器宽），
   改完再逐项对比。§34–§36 里的数值全是这么来的。
2. **参考的做法只解决一半问题**：色卡切换在参考里只换 5 个 CSS 变量、代码高亮**不参与过渡**；
   我们要求的"中间色缓慢过渡 + 代码随之变色"是自己补的。别把"参考没做"当成"不该做"。
3. **验证脚本本身会骗人**：本轮抓到三类"假验证/假失败"——`Page.addStyleTag` 在本机 Edge 不存在
   （静默失效）、并发跑脚本大面积假失败、以及"隐藏文字后采样"因回流把别的元素采进来。
   **看到可疑失败先怀疑测量方法**（§32/§34）。
4. **文案和"是否还在用"要人工核**：脚本能保证几何与对比度，但保证不了"文案是否过期"
   和"这个结构是否还被引用"（本轮删掉的旧类名/令牌就有几处是脚本管不到的）。

### 0.3 本轮（2026-09-19 凌晨）做了什么 —— 交接摘要

> 代码提交 `9736241`（文档 `2fedbef`），全部已提交、已推送、线上已验证。详细见 §41。

| 主题 | 结果 | 关键位置 |
|---|---|---|
| **移除页脚** | `Footer.astro` 组件与全部 `.site-footer` 样式（global/motion/首页内联）删除；`verify-brand` 断言改为「页脚已移除」 | §41 |
| **小标题极简化** | /posts/ 与 /blog/ 删 `.head-sub` 介绍行，只留 kicker + 标题 | §41 |
| **文章与关于页去 AI 味** | 12 篇文章全部口语化重写（9 篇站点日志由 changelog 生成对应日）；关于页、Bento 卡、Sidebar 引言、`SITE.tagline/notice` 同步改写 | §41 |
| **加载动画** | `page-enter` 入场强化（淡入上浮＋模糊转清晰）；首页三区块 `.rv` 滚动显现 | §41 |
| **按钮微交互** | hover 轻抬 / active 按压 / 箭头位移 / 热力图色块按压；`prefers-reduced-motion` 下整体关闭 | §41 |

**本轮的三条环境教训**（下次接手先看）：
1. **bash 内联 node 脚本里不要写 `$1`**：会被 bash 展开成空串，静默吃掉替换文本
   （本轮把 motion.css 的 `@media` 行吞了，构建报 Invalid empty selector）。
2. **回归前先确认 4321 服务的新旧**：挂着旧 `astro preview` 时 15 个脚本测的是旧 dist，
   本轮 3 个"失败"里 2 个是假象。查启动时间或直接重启。
3. **构建必须 `npm run build`**：漏掉 pagefind 索引时 verify-search 的 3 条断言全红
   （症状是"输入框不挂载"，像前端坏了，其实是索引没生成）。

### 0.4 本轮（2026-09-19 下午）做了什么 —— 交接摘要

> 本轮**没有改任何页面代码**（`src/` 一行未动），只做三件事：清死资产、给文案加断言、修文档。
> 详细见 §42。

| 主题 | 结果 | 关键位置 |
|---|---|---|
| **清死资产** | 删 `public/covers/`（12 个零引用 SVG，33KB）与 `scripts/verify-deck.mjs`（验收对象已删） | §42 |
| **文案自动化断言** | 新增 `scripts/verify-copy.mjs`（**31 条**）并接入 `run-regress.mjs`（脚本总数 15 → **16**）：禁用词 / 占位词 / 文案锚点三类，按 §7.6 验证过"缺陷态会红"（29/31） | §42 / §7.2 |
| **文档纠偏** | HANDOFF 修正 8 处口径偏差（§3 目录树、§0 基线、§7.2 基线表、§7.4.2 清单、§9.1/§10 失效项、§14 清单）+ §2 新增两条环境硬约束 | §42 |
| **回归** | 改动后 `npm run build` + `run-regress` **16/16 全绿**；另用"改动前后逐值快照"证明**页面观感零变化** | §42 |

**本轮的三条经验**（下次接手先看）：
1. **不要在 bash 里做删除**：沙箱的 `safe-delete-bulk` 钩子会连带删掉**整个父目录**
   （本轮 `git rm` 把 `public/` 与 `scripts/` 一起删了，靠 `git restore --worktree .` 无损还原）。
2. **文案断言必须只扫"页面固定文案 + meta"**：历史文章正文里合法会出现"浅色主题""作品库"
   （那是内容记录），把这些词一律拉黑会得到一堆假失败。
3. **长期没被引用的东西要定期清**：本轮一次就找出 7 处（covers、verify-deck、hero-anim.js、
   DriftWallBackground、HomeShapeGrid、TextType、Ticker）——几何断言永远抓不到"没人用了"。

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
| ★代理没开又要推送时的兜底（2026-09-18 实测成功）★ | 症状：直连 `github.com` 超时（**DNS 解析到的那个 IP 被墙**），但同一域名的**其它 A 记录直连可达**（实测 `140.82.112.4` / `140.82.113.4` / `140.82.114.4` / `20.201.28.151` 通，`20.205.243.166` 不通）。办法：**起一个本地 TCP 隧道**，把 git 发出的 `CONNECT github.com:443` 转发到可达 IP —— TLS 仍是端到端的 github.com 证书（SNI/Host 不变），**不需要关 sslVerify**。步骤：① `node <工作区>/.workbuddy/gh-tunnel.mjs 39210 140.82.112.4`；② `http_proxy= https_proxy= HTTP_PROXY= HTTPS_PROXY= git -c http.proxy=http://127.0.0.1:39210 push origin main`（必须清空环境代理变量，否则会走那个不放行 github 的代理返回 502）；③ 推完停掉隧道。⚠️ `http.curloptResolve` 这条路走不通：本机 git 是 schannel 后端，会报 `Unsupported SSL backend 'openssl'` |
| GitHub 直连时通时断 | 推送失败就重试（本仓库实测最多重试 12 次才成功）；开了代理基本一次过 |
| ★**不要在 bash 里做删除**（2026-09-19 实测事故）★ | 本机 bash 的删除被沙箱的 `safe-delete-bulk` 钩子接管，而它的辅助脚本链是**坏的**（`dirname` / `safe-delete-common.sh` 都不存在）。实测执行 `git rm -r public/covers scripts/verify-deck.mjs` 时，**整个 `public/` 与整个 `scripts/` 被一起删掉**（只有 `.gitignore` 的产物幸免）。恢复：`git restore --worktree .`（全部是已提交文件，可无损还原）。**规避**：删除一律走"**移到同卷中转目录**"（`Move-Item -Force` 到 `D:\_WorkBuddy待清理_<日期>\`），再用 `git add -A` 记录删除；**不要用 `rm` / `rm -r` / `git rm`**。删完务必 `git status --short` + "逐文件比对索引"确认没有连带删除 |
| ★**bash 里 `npm` / `npx` 不可用**（2026-09-19）★ | 本机 bash 的 npm 是 shim，会报 `/usr/bin/env: 'bash': No such file or directory`。另外 bash 的 `node` 解析到 **22.22.2**（托管版），不是文档口径的 v24。**构建/脚本一律用绝对路径的 node 直接跑入口**：`node ./node_modules/astro/bin/astro.mjs build`、`node ./node_modules/pagefind/lib/runner/bin.cjs --site dist`、`node scripts/run-regress.mjs`。要走 `npm run xxx` 就用 PowerShell 工具 |

**没有云端凭据**：仓库里没有任何 token/密钥；Cloudflare 是 Git 集成自动构建，改不了就去看 CF 控制台的 Build log。

---

## 3. 目录结构（谁负责什么）

```
endfield-blog/
├─ astro.config.mjs          # 集成：react / sitemap / ClientRouter(软导航)；vite 插件 shim
├─ package.json              # build = astro build && pagefind --site dist├─ src/site.ts               # 站点全站配置：站点名/作者/链接/GISCUS/IMG_CDN/WEATHER_CITY
├─ src/content.config.ts     # 三个内容集合：posts / shots / changelog（works 已于 §40 删除）
├─ src/layouts/
│   ├─ Base.astro            # 全站骨架：head meta、主题早应用脚本、头部、粒子背景；
│   │                        #   属性 sidebar=true 时渲染三栏壳层（侧栏在 <main> 之外）
│   ├─ SidebarLayout.astro   # 薄封装：<Base sidebar>，子页面用它
├─ src/components/
│   ├─ Header.astro          # 顶部导航：品牌标 / 链接组 / 搜索 / 汉堡（见 §26 §31 §33）
│   │                        #   ⚠️「暂停背景动态」按钮已于 2026-09-18 删除（§24）
│   ├─ BrandMark.astro       # ★品牌标志（横版字标 + 纯图标，见 §28）—— 改 logo 只改这里
│   ├─ VideoBackground.astro # ★全站背景视频 + 渐变遮罩 + poster 降级（见 §23）
│   ├─ SearchModal.astro     # 全站搜索悬浮窗（Pagefind，首次打开才加载 JS/CSS，见 §20）
│   ├─ SidebarNav.astro      # 左栏：个人信息卡 + 天气卡 + 导航树（文章 / 站点 等分组）
│   ├─ SidebarWidgets.astro  # 右栏：站点统计 / 活跃热力图 / 最近更新 / 今日一言
│   ├─ SidebarStatValue.jsx  # 宿主：统计数字的计数动画（包 ReactBits/CountUp，见 §6.15）
│   ├─ MusicPlayer.astro     # 左栏底部音乐播放器（歌曲在 site.ts 的 MUSIC，见 §6.17）
│   ├─ WeatherCard.astro     # 天气卡骨架（数据由 ui.js 在浏览器端填）
│   ├─ GiscusComments.astro  # 留言板/评论区（主题跟随、防重复注入）
│   ├─ TextType.astro / Ticker.astro  # 打字机 / 跑马灯小件
│   ├─ ReactBits/            # React Bits 官方组件原码（见 §5 铁律三）
│   └─ *.jsx                 # 宿主层：Particles 背景、ProximityText、AboutMagicBento…
│                            #   ⚠️ 已删除：HomeStrokeTitle / HomeWorksCardSwap / HomeGalleryAccordion
│                            #      （首页改版后不再使用，见 §25 §30）、WorkCard / Footer（§40 §41）
│                            #   ⚠️ 仍在仓库但**零引用**（死代码，见 §42）：DriftWallBackground.astro、
│                            #      HomeShapeGrid.jsx、TextType.astro、Ticker.astro
├─ src/pages/                # 首页 / 文章列表 / 文章详情 / 归档 / 画廊 / 关于 / 互动 / 404 / rss.xml
│                            #   ★搜索已不再是一个页面★，改成悬浮窗（SearchModal.astro）
├─ src/scripts/ui.js         # ★全站交互中枢（约 2000 行）：所有动效与交互都在这（见 §6 各条）
├─ src/scripts/hero-theme.js # 首页强调色预设：色卡切换的补间（见 §34）
├─ src/scripts/hero-anim.js  # ⚠️ 死代码：首页 Hero 已改静态版式，index.astro **不再加载它**（见 §33）
├─ src/scripts/nav-mobile.js # 导航：汉堡菜单 + 顶部两条指示线（见 §31）
├─ src/styles/global.css     # 设计令牌 + 基础版式（★:root 即暗色，见 §24）
├─ src/styles/motion.css     # 动效令牌 + html[data-theme='dark'] 同步块
├─ src/styles/shell.css      # 三栏壳层 + 侧栏各卡片样式
├─ src/content/{posts,shots,changelog}/   # 内容
├─ public/                   # lanyard / og / shots / media(背景视频) / music / favicon*.svg / robots.txt
│                            #   （**没有** _headers、没有自托管字体；covers 已于 §42 删除）
└─ scripts/                  # 见 §7.2 的全套验证脚本（16 个）+ run-regress.mjs（批跑）
                             #   + gen-og.mjs（分享图）/ seed-changelog.mjs / 诊断与截图工具
```

**唯一的"大脑"是 `src/scripts/ui.js`**：软导航后所有功能都靠它重新接管，改交互基本都在这。

---

## 4. 内容怎么加

### 文章（`/posts/` 列表 + `/posts/[slug]/` 详情 + `/blog/` 归档）
`src/content/posts/YYYY-MM-DD-slug.md`：
```yaml
---
title: 一篇文章的标题
date: 2026-09-19
tags: [站点日志, 折腾]        # 出现在列表页标签与首页「技术标签」
summary: 一句话摘要（列表页与首页卡片会显示）
link: https://...             # 可选：填了就只跳外链、不生成详情页
---
正文 markdown（h2/h3 会进详情页正文样式）
```
> ⚠️ **作品（`/works/`）已于 2026-09-19 整体下线**（§40）：`content/works/`、
> `WorkCard.astro`、`WorkLayout.astro` 都已删除，**不要再照着旧文档往 `content/works/` 加内容**
> —— 集合不存在时构建会打 WARN「collection does not exist」。
> （历史上的作品条目长这样，仅供理解旧数据：`order` 决定 W-00x 编号、`cover` 指向
> `public/covers/*.svg` —— 这些封面文件也已在 §42 删除。）

### 每日日志帖（与 changelog 配套）
`changelog` 的每一天都有一篇对应文章（`src/content/posts/YYYY-MM-DD-log.md`，
标题「站点日志 · MM.DD 主题」，tags 含「站点日志」），正文 = 当天 items 逐条展开。
归档时间线的每一条文字都链到当天的日志/主题文章。
### 截图（`/gallery/`）
1. 图片放 `public/shots/mc/mc-041.webp`（1600w q78 约 80KB 内）；
2. `src/content/shots/mc-041-shot.md`：`title / date / game / image: /shots/mc/mc-041.webp / note / aspect`。
   `game` 用于画廊的 `?game=` 过滤（浏览器端读 `location.search`，见 §6.6）。
   > ⚠️ 顶部导航的**二级菜单已不存在**（§33）——分类入口只有桌面左栏导航树一处。

### 站点更新记录（驱动侧栏「活跃热力图」）
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
侧栏热力图会把 changelog + 文章 + 截图按日期聚合：色块强度按当天事件数分 5 档，
点色块浮出当天按类型的计数（见 §40.3）。

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
      所以换列宽/断点都不用改数值。自检：~~`node scripts/verify-deck.mjs [url]`~~
      ⚠️ **该脚本已于 2026-09-19 删除**（它的验收对象 CardSwap 早已不参与首页，见 §25；
      脚本留着就是一条指向不存在组件的死代码）。

22. **导航栏/下拉的玻璃与两个 CSS 陷阱**（2026-09-15）：
    - **`.topbar` 是死代码**：motion.css 里有 3 处 `.topbar{…}`（背景/边框/模糊都在那儿），
      但 Header 的标记早就是 `.hd` + `.hd-glass`，所以那些规则一条都不生效 ——
      顶栏曾经因此**完全没有背景/边框/模糊**。改顶栏外观要改 `.hd` / `.hd-glass`。
    - **`backdrop-filter` 的书写顺序会影响构建产物**：写成
      `backdrop-filter: …; -webkit-backdrop-filter: …;`（标准属性在前）时，
      构建时的 CSS 压缩会把这条**整个丢掉**（实测计算值直接是 `none`，页面看起来没模糊）。
      按 `-webkit-` 在前的顺序写就正常保留。
      ⚠️ **2026-09-18 修订**：当前构建链（Astro 7.3 的 CSS 压缩）**会剥掉 `-webkit-` 前缀** ——
      即使把两条写成不同写法（`saturate(1.4)` / `saturate(140%)`）也只留无前缀那条
      （已核对 `dist/_astro/*.css`）。影响：Safari（<18）拿不到模糊。
      这是**全站既有状况**（导航胶囊、作品卡等玻璃面同样只有无前缀版），不是新引入的；
      源码里仍建议保留有前缀那条，等换构建链/降级目标时会自动生效。**凡是改完模糊没效果，先去构建产物里搜一下
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
    - 自检：`node scripts/verify-videobg.mjs [url] [light|dark]`（17 项：播放/层级/透明度/
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
    - **可访问性（2026-09-18 变更）**：★导航栏的「暂停背景动态」按钮**已按用户要求删除**★
      —— 背景视频**默认播放**，不再提供手动暂停入口。同时删除的还有 `Header.astro` 的
      `.motion-toggle` 样式块、`ui.js` 的 `motionToggle()`（及其在 `boot()` 里的调用）、
      `VideoBackground.astro` 的 `window.__cwVideoToggle` / `__cwVideoPaused` 与 `userPaused` 分支。
      ⚠️ **取舍要记得**：这是 WCAG 2.2.2 的显式暂停入口，删掉后只剩
      **`prefers-reduced-motion`** 这一个"不播"条件（它仍会让视频只显示首帧，并在
      `global.css` 里收敛所有 CSS 动效）。要加回入口，只需在 `.nav-actions` 里放一个
      `data-motion-toggle` 按钮 + 在 `VideoBackground.astro` 重新暴露 `__cwVideoToggle()`。
      视频加载失败 → 藏掉 `<video>`，用深色兜底底图（见 §36.2 的兜底底改动）。
    - 自检：`node scripts/verify-redesign.mjs`（16 项：单主题、玻璃令牌取值、
      **无暂停按钮 / 视频默认在播 / 旧暂停接口已移除 / reduced-motion 仍不播 / 恢复偏好后重播**、
      导航栏滚动过渡）。
    - **已知未改**：~~作品封面 SVG（`public/covers/*.svg`）当初是按浅色底设计的，
      在暗色站上偏亮；属于内容资产，需要时可重画。~~ **→ 已于 2026-09-19 整批删除（§42）**：
      作品库下线后它们零引用，不再是"待重画"而是"已不存在"。

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
      （`rgba(10,10,15,.95)` + `blur(20px)`、`translateY(-16px)→0` 淡入）。
      ★2026-09-18 改形 + 精简★：菜单从"与导航同宽的通栏（只有底边框）"改成
      **四周内缩的圆角矩形浮层**——左右各 `12px`、圆角 `18px`（≤620px 为 16px）、
      四边 `1px` 描边 + `0 12px 32px rgba(0,0,0,.35)` 投影，内边距 `14/18`、行间距 `12`（更紧凑）。
      内容也一并精简：**只留 5 个一级页面入口** —— 两组分类（作品库/画廊）与底部外链
      （GitHub / Bilibili / RSS，`.mm-actions` / `.mm-btn`）都已按用户要求删除，
      桌面端顶栏与页脚仍有这些入口。
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
     5. **★卡片必须"按内容展开"★**（2026-09-18 修"手机端代码卡片像是被收起"）：
        基础规则里 `.code-card` 是 `flex: 1 1 0` —— 在**行向**布局里它管的是宽度（正确），
        但 ≤768px 是 `flex-direction: column`，主轴变竖直，于是这条把卡片的**高度基准变成 0**，
        它只能分到剩余空间；内容一多就被压扁，再被卡片自己的 `overflow:hidden` 切掉
        （实测 390px：卡高 351 / 代码体需要 355，被裁 88px，看着就像"收起来了"）。
        修法：`@media (max-width:768px)` 里显式写 `flex: 0 0 auto`（不伸不缩、高度随内容）。
        hero 是 `min-height:100vh`，内容变高时会自己长高，不会切顶。
        自检见 `verify-hero.mjs` 的"手机端代码卡片按内容展开"。
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
         实测 15% 的雾蓝柔光就能把底色抬到 `rgb(156,207,228)`；~~已压到 6%/4%~~
         **→ 四轮已整块删除**（6%/4% 照样在容器边缘留下可见分界线，见 §36.3）。
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
    - **★代码段与卡片（2026-09-18 二次调整）★**：用户要求"代码做成参考卡片那种效果、
      随色卡变化的对应部分要有动画过渡、顺便缩小卡片、大标题与卡片顶部齐平"。
      - **代码段的写法照参考**：类名用 keyword / string / function / component / attr /
        number / punc / comment；**行内带一个"色值胶囊"**（`.ln-val` = 小色块 `.ln-swatch`
        + `#hex` 文本 `.ln-var`），色块走 `var(--accent)`、胶囊底走 `rgba(var(--accent-rgb),.16)`，
        所以它和其余高亮**一起平滑变色**；另外 3 个 `.ln-num` 数值由脚本按预设改写
        （照参考"每个数值都随预设变"）。文字值在补间结束时才落定（色块是连续的）。
      - **卡片缩小**：`max-width` 520 → **440**，实测 440×470（1440）。
      - **大标题与卡片顶部齐平**：`.hero` 由 `align-items:center` 改 `flex-start`，
        卡片加 `margin-top: var(--card-align)`；这个值由 `hero-theme.js` 的 `alignCard()`
        **实测写入**（= 标题顶 − hero 内容区顶；不要用 `badge.bottom` 当目标 ——
        徽标底是 32 而标题顶是 60，差在徽标的 28px 下边距，踩过）。
        窗口 resize 与字体加载后会重算；窄屏堆叠时归零。
      - **竖排节奏**：`.hero` 改成 `padding: 96px 32px 48px` + `justify-content:center` ——
        96px 是"最小呼吸位"，内容比视口矮时居中、比视口高时靠它保证徽标不被固定导航栏压住。
        ⚠️ 1024 档只能改 `padding-left/right`：写成 `padding: 0 24px` 会把 96px 清掉，
        徽标立刻被压住（实测 badge.top 掉到 0）。
      - **代码行高**走 `--code-lh`（1.55，不是参考的 1.7）：卡片缩到 440 后代码行数变多，
        1.7 会让卡片高到把 hero 顶出视口。**改代码行数或卡片宽度时先量 1440 下卡片高。**
    - **★`verify-videobg.mjs` 取"文字背后底色"的正确姿势★**（试错四轮才定，别再走弯路）：
      在当前页上试图隐藏文字**都不可行** ——
      `visibility/opacity` 去不掉 `background-clip:text` 的字形层；
      `color:transparent + background:none` 也一样；
      `text-indent:-9999px` 同样不行（背景层按元素自身盒定位）；
      而 **`remove()` 节点会让布局回流**，徽标/统计顶进标题原来的框里，采到的还是白字。
      **正解：另开一个 tab，在首次导航之前就注入"文字 visibility:hidden"，
      页面从一开始就不含字形；并且显式 `setDeviceMetricsOverride`（新 tab 不继承覆盖，
      否则按移动端渲染、框坐标与真实页对不上）。脚本还会把对照页的文字框和真实页逐一比对，
      确认版式一致后才取样** —— 这条自检本身就是防"假失败"的保险。
    - **自检**：`verify-hero.mjs`（70 项：另有色值胶囊、随预设变色、词法覆盖 ≥6 类、
      卡片已缩小、标题与卡片齐平；比例与栅格对齐见 §35/§36）。
      想核对某个预设下的整体对比度：`$env:ACCENT='ember'; node scripts/contrast-audit.mjs <url> dark`
      —— 五套预设当前都是 **0 处不达标**。

35. **★首页元素比例照参考站重定★**（2026-09-18，用户要求"参考 reactbits 首页大标题字号、
    左右元素的相对比例大小"来调）。**改首页尺寸前先读这条。**
    - **参考站实测比例**（1440）：hero 容器 1425（基本占满视口）、内容列 1324、
      **左栏 645 / 代码卡 520 / 两栏间距 ≈111**（比例 55% : 45%），
      **h1 = 66px**（1024 → 48px、768 → 46px），字距 -2px，字重 500。
      也就是"标题字号 ≈ 左栏宽 ÷ 9.8"。
    - **本站改动**：左栏 `max-width` 560 → **645**；两栏改为 `flex: 1 1 0`（按比例分配剩余宽度）；
      1024 档 gap 40 → **72**；768 档 gap 32 → **40**；统计数字 28 → **clamp(22,1.8vw,26)**、
      说明 14 → **clamp(13,0.9vw,13.5)**（对齐参考的"标题 66 配数字 26 / 说明 13"比例）。
      ⚠️ **后续（§34）又把卡片缩到 440 并把 `.hero` 改成顶对齐 + 居中**，
      所以现在 1440 下实测是 **左栏 ≈645 / 卡片 440 / 标题与卡片顶齐平**，
      不再是这里的 616/520 —— 以 §34 的实测为准。
    - **★标题字号只能是 48px 左右，不是参考的 66px★** —— 这是文案长度决定的，不是没对齐：
      参考那句 "React components for / creative developers" 短；我们第一行 28 字符，
      实测**每字号宽 13.19px**，66px 需要 **870px**，而左栏只有 616px。
      同样栏宽下要保两行，字号上限就是 ≈48px。
      **想要参考那种 66px 大标题**：把 `.ht-l1` 的 `nowrap` 去掉，标题会自己折成 3 行。
    - **字号是反解出来的**：`max(30px, min(48px, calc((100vw - 680px) / 13.19)))`
      —— 左栏每窄 1px 字号就少 1/13.19，上限 48、下限 30（下限之后靠自动换行兜住）。
    - **★两个 flex 坑（都踩过）★**：
      1. `flex: 1 1 0` 必须配 **`min-width: 0`**。flex 项默认 `min-width: auto` 会拿
         min-content 当不可缩底线，标题 nowrap 时 min-content ≈ 870px →
         左栏永远占满、卡片被挤到 491（1440）甚至 249（1024）。
      2. `nowrap` 只在**真的放得下**时才好：`@media (min-width:1200px)` 才锁两行。
         更窄时左栏被压缩，锁 nowrap 会把文字顶出容器
         （实测 1152 档：633px 文字塞进 498px 栏）。
    - **已知的良性偏差**：1440 下第一行实宽 633 > 左栏 616，会多出约 17px
      （`document.scrollWidth − clientWidth` 仍是 0，因为视频/光晕层是 fixed 且铺满视口）。
      这是"保 48px 字号 + 两行"的取舍，不是漏改；要严格不越界就把上限降到 46px。
    - 自检：`verify-hero.mjs`（63 项，含左栏 ≈645、字号 40–48 区间、
      **统计数字/说明相对标题的比例**等）。

36. **★全局主内容容器加宽到与参考站一致★**（2026-09-18，用户要求"内容向左右扩展、
    减少两边留白、最大宽度与 reactbits 首页主容器一致；不要动内部布局/间距/移动端；
    不要用负 margin 或绝对定位"）。
    - **参考站实测**：主内容容器 `max-width: 1324px`（`ln-hero-content`），
      **1440 与 1920 下都稳定是 1324**；它的导航条另有 1680 的上限。
    - **改动**：`global.css` 的 `--w-max` **1140 → 1428**。
      1428 = 1324 + 左右各 52（本站 `--gutter` 的上限），这样**内容净宽正好 1324**，
      与参考一致。（参考那 1324 含 24px 内边距，`.wrap` 的内边距是 52px，所以不能直接写 1324。）
      实测：1440 与 1920 下内容净宽都是 **1324**，`.wrap` 左右留白对应收缩。
    - **顺带把 hero 对齐到同一栅格**：hero 原本是自己的 `max-width:1280` + 写死 32px 内边距，
      容器一加宽就比下方区块窄 80px（实测量过 left 差 −80）。
      现在 hero 用 `max-width: var(--w-max)` + `padding: … var(--gutter) …`，
      并把 `justify-content` 从 center 改成 **flex-start** ——
      改完两处"内容左缘"精确重合（Δ=0，1440 与 1920 都验过）。
      竖向仍由 `padding-top: 96px` + `min-height:100vh` 兜住。
    - **内部组件一个没动**（已逐项复核）：hero 左栏仍 645、代码卡仍 440、gap 仍 80；
      作品卡仍是 3 列各 ~424、间距 25.6；`/works/` 三栏仍是 260/725/280（1920 下中栏 895）；
      移动端仍是 390 单列 / 768 两列，横向溢出 0。
      未使用任何负 margin 或绝对定位。
    - **自检**：`verify-hero.mjs`（70 项，新增"hero 与区块同宽/同内边距/内容左缘重合"三项）；
      另外手工在 **1440 与 1920** 两档核对过容器、栅格、三栏页与移动端（见 §7.4.2 的方法）。
    - ⚠️ **本条已被 36.1 覆盖**：容器宽度在下一轮从 1428 改成了 **1300**（净宽 1196），
      两栏 gap 从 80 改成 112。下面的 36.1 是当前值。

36.1 **★PC 端主内容容器 1428 → 1300（= 用户说的"≈1300"）★**（2026-09-18 二轮，
     用户要求"减少 PC 端左右多余留白、主内容向两侧扩展但**必须水平居中、左右留白对称**；
     参考 React Bits 官网 PC 布局；导航栏本身仍 `width:100%`；
     header / main / footer 主容器同宽；不要用负 margin / 绝对定位 / transform 硬挪；
     移动端不要改"）。
     - **这一轮改了三处，都是"同一个容器宽"**：
       1. `global.css` 的 `--w-max`：**1428 → 1300**（`.wrap` 的 max-width 跟着变）。
          1300 是**容器盒**宽（含 `.wrap` 自己的左右内边距 `--gutter` = 52），
          所以大屏下"内容净宽" = 1300 − 52×2 = **1196**（上一版是 1324）。
          **不要再按"1324 + 2×52 = 1428"去理解这个值了**：用户这次点名写 `max-width: 1300px`。
       2. `Header.astro` 的 `.header-container`：**1280 → 1300**（写的是字面 px，
          原因见文件里的注释：Astro 作用域编译会把 `var()` 变成 `calc(%)`）。
          滚动收缩态同步 **1120 → 1140**（保持"收起一圈"的幅度不变，差仍是 160）。
          ⚠️ **这条是必须一起改的**：只改 `--w-max` 的话，1440 下导航容器左缘 75、
          正文容器左缘 65 —— 导航会比正文**多出 54px 内容内缩**（量过）。
          现在两者**容器盒同宽、同左缘、各自居中**（实测 Δ=0）。
          导航内部左内边距是 32、`.wrap` 是 52，所以"内容左缘"仍差 20px ——
          **这是本来就有的**（参考也是"同容器宽、内容各自内缩"），不是 bug。
       3. `index.astro` 的 `.hero` gap：**80px → 112px**（用户要求"容器加宽后顺便加大
          大标题与右侧代码卡片的间隔"）。112 是**可达上限**：
          净宽 1196 − 左栏 645 − 卡片 440 = 111，再大卡片就会被压窄
          （`verify-hero` 有一条 380–442 的卡片宽度断言会挂）。
     - **没动的东西**：hero 左栏 645 / 代码卡 440 / 卡片圆角 12 / 断点（1024 的 gap 72、
       768 的 40）/ 三栏壳层 `/works/` 的 `--shell-max: 100rem`（见下）/ 全部移动端。
     - **三栏壳层（`.shell`）刻意保持 100rem**：它是"壳层"不是主内容容器
       （里面的 `.wrap` 被 shell.css 改成 `max-width:none`）。
       用户这次点名的是 header/main/footer 的主容器，改壳层会产生**可读性回归**：
       1200px 视口下中间正文会掉到 ~399px（shell.css 里写着 485px 是它的可读下限）。
       合计口径：1920 下壳层 1600 / 主内容 1300；1440 下壳层 1316 / 主内容 1300（差 16px，肉眼看不出）。
     - **实测（改后）**：

       | 视口 | 主容器盒宽 | 左右偏移 | 内容净宽 | 导航容器 | hero 左栏 | 卡片 | 标题→卡片间隔 | 横向溢出 |
       |---|---|---|---|---|---|---|---|---|
       | 1440 | 1300 | 65 / 65（差 0） | 1196 | 1300，左缘 65 | 644（标题实宽 633，仍严格两行） | 440（右侧余量 0） | 112 | 0 |
       | 1920 | 1300 | 305 / 305（差 0） | 1196 | 1300，左缘 305 | 644 | 440 | 112 | 0 |
       | 1366 | 1300 | 28 / 28 | 1196 | 1300 | 644 | 440 | 112 | 0 |

       标题字号在 1440/1920/1366 都是 48（上限），`39.4px @1200`、`42.5px @1240`，
       都仍然"严格两行、放得进左栏"。
     - **★"移动端没改"是逐值比对出来的，不是肉眼看的★**：
       改前 / 改后各在 **9 个视口 × 5 个页面**（1280/1200/1024/900/768/620/414/390/360）
       采了一份几何快照（元素位置/宽高/字号/gap/内边距/对齐/溢出，共 **2484 个值**），
       逐值 diff：**差异只有 18 处，全部落在 `home@1200` 与 `home@1280` 的 hero 上**
       （gap 80→112、左栏 645→614/534），**≤1024 与 390/360 全部 0 差异**。
       1200 档的联动是必然的：hero 是 flex，gap 一加大左栏就被挤窄
       （那里 tag 会从 1 行变 2 行）；这是桌面端 gapline，不影响任何移动端断点。
     - **自检**：`verify-hero.mjs` **81/81**（这一轮新增 10 条：
       主容器 max-width = 1300、居中等偏 ≤1px、hero/header/footer 与主容器同宽同左缘 +
       1920 档整组复测）；`verify-nav-shrink.mjs` **39/39**（新增 3 条：
       导航容器与主内容容器同宽 / 同左缘 / 自身居中）；`verify-nav.mjs` 14/14。
       全套脚本串行重跑：smoke 45/45、home 23/23、brand 10/10、theme 11/11、
       redesign 14/14、search 17/17、videobg 17/17、videobg-global 25/25、
       mobile-shots 零溢出、diag-errors 7 页 0 异常、contrast-audit 0 处不达标。
     - **两个采样坑（写这类断言会踩）**：
       1. 三栏页的 `.shell .wrap` 被 shell.css 改成 `max-width: none`，
          用 `document.querySelector('.wrap')` 取样会**先命中它**，量出来的宽度是栅格列宽
          （1440 下 725）不是主容器宽 1300 → "导航与主容器同宽"会假失败。
          正确取法：遍历 `.wrap` 取第一个 `maxWidth !== 'none'` 的。
       2. 首页的 `<footer class="site-footer">` 被 `display:none`（`body.home-route`），
          量到的页脚容器宽度是 0 → 首页断言里要跳过页脚，页脚对齐改在 `/works/` 上验。

36.2 **★首页 Hero"整块竖向居中" + 大标题加大★**（2026-09-18 三轮，用户要求"把首页整个板块
     （大标题＋代码卡片）的位置移到整个屏幕的正中心，现在太靠顶部了；顺便增加一点大标题字号"）。
     - **改前实测（1440×900）**：左栏内容 [96, 459]、卡片 [156, 626] —— 顶部只留 96px、
       卡片下方空 274px，整块明显偏上。
     - **竖向居中怎么做的（★试了三版，前两版都错，别再走）★**：
       1. ❌ `align-items: center` —— **无效**。flex 会把单行的行盒高度收缩成内容高度，
          "居中"退化成没有效果（实测卡片仍停在 294）。
       2. ❌ 给卡片加 `margin-top`（老做法 `--card-align`）—— **正反馈灾难**：
          外边距参与行盒高度计算，行盒被撑高后居中结果又整体下移，
          实测 5 轮里 `--card-align` 从 60 一路漂到 218、卡片跑到 438 并溢出视口。
       3. ✅ **正解**：`.hero` 用 `align-items: flex-start` + **`align-content: center`**
          + **`flex-wrap: wrap`** —— 行盒被单独居中放进 hero 的**整个内容盒**里，
          再用 `padding-top: 96px` 保证"内容盒高度 ≥ 视口高 − 144"，视口再高也不会跑偏；
          卡片与标题的"顶齐平"改成**不参与布局**的视觉位移：
          `.code-card { position: relative; top: var(--card-shift, 0px) }`，
          位移量由 `hero-theme.js` 的 `alignCard()` 实测写入（它现在算的是
          "当前位移 + (标题顶 − 卡片顶)"，天然收敛，不用管上一轮补了多少）。
          ⚠️ `--card-align` 这个旧变量已经**不存在**了，改成 `--card-shift`。
     - **横向不动**：仍 `justify-content: flex-start` + `max-width: var(--w-max)` + `--gutter`，
       所以左缘照旧与下方区块重合（这是二轮就定下的，别顺手改成 center）。
     - **大标题 48 → 52px**，同时把版面从「645 / 112 / 440」调成「**700 / 96 / 400**」：
       三块是联动的（左栏 + gap + 卡片 = 1196 容器净宽），改一个必须同时改另两个。
       为什么要动左栏：标题第一行 28 字符**在 52px 下实宽 686px**，645 的栏塞不下（会折成 3 行）；
       700 是"能放下那一行"的最小值。字号公式相应改成
       `max(30px, min(52px, calc((100vw - 730px) / 13.7)))`
       （上限 48→52、分母 13.19→13.7；分母是照"1440 下 52px 要放得下"反解出来的）。
     - **实测（改后，1440×900 / 1920×1080）**：

       | 项目 | 1440×900 | 1920×1080 |
       |---|---|---|
       | 主内容块 | [239, 610]，中心 **424**（视口中心 450） | [329, 701]，中心 515（中心 540） |
       | 标题顶 / 卡片底 | 299 / 769（上下都留白，不再贴顶） | 389 / 859 |
       | 卡片 | 400×470，顶与标题顶齐平（`--card-shift: 60px`） | 同 |
       | 标题 | **51.82px**，第一行实宽 683（左栏 700，严格两行） | **52px**，686 |
       | 标题→卡片间隔 | 96px | 96px |
       | 横向溢出 / 卡内滚动 | 0 / 0 | 0 / 0 |

       另测了 1600/1440/1366/1300/1280/1240/1200/1196/1152/1100/1025 各档：
       卡片恒为 400×470、gap 恒 96、标题始终放得进左栏、无溢出、无卡内滚动；
       `≤1024` 走既有的 72px 与整宽卡片，`≤768` 仍是列向堆叠（**移动端一行没动**）。
     - ⚠️ **卡片高度是硬约束**：470（视口 ≥780 时）在 1440×900 下上下各留 299/131；
       视口高 780 时卡片底到 710，仍不出屏；再矮（<740 左右）会贴底 ——
       这与改动前一样（原来卡片底就在 626）。改卡片内容行数/字号前先量这个高度。
     - **★整块下移后暴露出的真实可读性缺陷（已修，值得记住）★**：
       背景视频在中段有一条**移动的亮带**。字幕原来在 y≈290 正好躲开，
       整块下移到竖直中心后落到 y≈432，压在亮带上 → `verify-videobg` 实测
       **最差底色 rgb(133,133,142)、对比只有 3.66**（18px 正文要 4.5）。
       这是真缺陷，不是假失败（用"隐藏文字的对照页"跨 6 帧采样复现过：均值 34、
       最亮 133，而且 6 帧里有 4 帧都会打到）。
       三种修法里选了第三种：① 改 `VIDEO_BG` 的 scrim 中段浓度 = 全站背景一起变暗，
       代价太大；② 给字幕加 `text-shadow` = 采样量的是**底色**，既不改变底色也不改变测量，
       等于没修；③ 在 hero 之上叠一层压暗膜。
       ★★ 第三种**最终被证明是错的，已经彻底删掉**（用户连续三轮指出：
       "标题后方有一层黑色矩形" → "首页两边有瑕疵" →
       "遮罩变成白色的了，在导航栏和主容器两侧能看见边缘"）★★。
       **三轮里最值钱的结论：只要在内容层之上再盖一层东西，无论浓淡都会被看出来。**
       **最终方案（现在线上就是这个）：页面上不再有任何"薄膜/遮罩"层，
       压暗全部做在被压对象自己的图层里 ——**
       · `VideoBackground.astro` 的 `.video-bg::after`（上浅下深的黑遮罩）**整块删除**；
       · `.video-bg` 的兜底底**从"poster 静帧 + 亮 radial 渐变"改成纯深色 `#05080c`**；
       · 压暗交给 `filter: brightness(var(--vid-dim))`（`VIDEO_BG.dim = 0.85`）
         —— brightness 作用在 video 自身上，整屏一致、零边界；
       · `VIDEO_BG.opacityDark` 0.34 → **0.45**；副标题 `.hero-subtitle` 的 `.7` → **`.92`**。
       - **★根因（三轮才发现，非常反直觉）★**：`.video-bg` 的 `background` 里原来有一张
         `bg-poster.jpg` + 一层偏亮的 radial 渐变，它们**在 video 之下**，
         而 video 是半透明的 —— 兜底底图会透过 video 参与合成，把画面洗成高亮青色。
         实测：标题正后方 rgb(115,174,195)，白字对比 **2.45**（需 3 / 副标题 4.5）。
         这也解释了为什么"调低 video 的 opacity 反而更亮"（越低越露出下面的亮底图）。
         换成纯深色底后，同一位置 rgb(7,27,36)、对比 **17+**。
         **教训：半透明图层下面那层的颜色，和上面那层一样重要。**
       - **怎么验"确实没有矩形/暗带"**：`verify-videobg.mjs` 新增两条断言 ——
         扫"容器两侧留白带"内的逐列均值最大阶跃，要求 ≤3（实测 0.00；唯一的大阶跃是滚动条）。
         另外全屏扫描下，1440/1920 现在只剩"代码卡自己的边框"（x=1314/1554），无其他硬边。
       - **★另一条测试缺陷（顺手修了，不然会一直自欺）★**：`verify-videobg.mjs` 原来
         从 `getComputedStyle().color` 里只取 rgb、**忽略 alpha**，而副标题是
         `rgba(255,255,255,.7)` —— 等于按"不透明白字"算对比度，把标准放松了。
         现已按 alpha 把字形合成到底色上再算（输出里会标注"文字 alpha=0.92，已按合成色计算"）。
         修正后跨 12 帧最差：副标题 5+（需 4.5）、标题 4+（需 3）。
       ⚠️ 若以后把 hero 内容再上下挪，**必须重跑 `verify-videobg.mjs`** ——
       它采样的是"文字框里的真实像素"，位置一变就可能重新压到亮带上。
     - **自检**：`verify-hero.mjs` **85/85**（新增/改写 6 条：主内容块中心 ≈ 视口中心、
       卡片与主内容块同级居中、标题顶留白 ≥120px、标题顶与卡片底都在视口内、
       gap 96、字号区间 45–53、卡片 ≤410、左栏 ≈700；"宽"那组断言仍是 81 项里的原样）。
       全套脚本串行重跑：smoke 45/45、nav-shrink 39/39、nav 14/14、home 23/23、brand 10/10、
       theme 11/11、redesign 14/14、search 17/17、videobg **17/17**、videobg-global 25/25、
       mobile-shots 零溢出、diag-errors 0 异常、contrast-audit 0 处不达标。


 36.3 **★首页"导航栏两侧 + 代码卡片右侧"的竖分界线：真凶是 `.hero::before` 柔光（已删）★**
      （2026-09-18 四轮，用户报"首页代码卡片右侧、导航栏左右侧依然存在一个分界线，
      移除他，我要求背景要像其他子页面一样干净"）。
      - **现象**：首页在**导航条带左侧**和**代码卡片右侧（卡片所在的那几百行）**各有一条
        竖着的明暗分界线；子页面完全没有。用户的原话把两处都点到了，这不是错觉。
      - **真凶**：`index.astro` 里 `.hero::before` 的强调色柔光（雾蓝 6% + 灰绿 4%）。
        它 `position: absolute; inset: 0` —— **包含块就是 1300px 的 `.hero` 盒**，
        而 `.hero` 又带 `overflow: hidden` → 两个 radial-gradient 的尾巴被**沿容器左右边缘切断**。
        浓度虽低，却是**一整列像素的系统性偏置**，在暗背景上肉眼可见。
      - **实测 A/B（1440×900，`scripts/diag-edges.mjs`，跨容器边缘取 4 列均值；8bit 灰度口径）**：

        | 带 | 左缘（容器内 − 容器外） | 右缘 |
        |---|---|---|
        | 导航条带 y6-58 | **+1.87**（柔光在）/ -0.25（去掉） | -0.07 / -0.07 |
        | 卡片行 y300-630 | +0.14 / +0.10 | **-1.37**（柔光在）/ -0.27（去掉） |
        | 整屏 y4-896 | +0.31 / +0.12 | **-1.38**（柔光在）/ -0.26（去掉） |

        ⚠️ 注意"整屏"那一行的左缘只有 **+0.31**（看着合格），而分段后导航条带是 **+1.87**
        —— 这就是下面第 3 条测试缺陷。
      - **修法：整块删除 `.hero::before`**，不做"改铺到全屏"。
        理由与三轮 `.hero::after` 的结论同源：**铺到全屏就变成"盖在内容上的一层膜"，
        前三轮已经为这件事返工三次**。删掉后首页背景与子页面**逐项一致**
        （视频 + 色调层 + 网格 + 粒子，没有任何额外层）。
        ★**可以当规则记：任何"只铺在容器盒里"的装饰层，都会在容器边缘留下边界线。**★
        背景的亮度/浓度只允许在**视频自己的图层**上调（`src/site.ts` 的 `VIDEO_BG`）。
      - **修后实测**：1440 下容器左右缘各段偏差 ≤**0.36**/255、1920 下 ≤**0.29**/255
        （阈值 0.5）；原先跨 248 行的 x=1364 竖线从"长竖线"名单里消失。
        首页导航条带的边缘数值与 `/works/`、`/posts/` **完全相同**（左 -0.07、右 -0.02）。
      - **★这一轮最值钱的东西是"测试为什么连过两轮都没抓到"（4 个独立缺陷）★**
        1. **单位错 → 断言是空的**：`verify-videobg.mjs` 的"留白带逐列阶跃 ≤3"里
           `lum()` 返回 **0..1**，阈值却写 **3.0** —— 永远成立，等于没测
           （注释里"正常 ≤1.0 / 异常 20~40"是 **/255** 口径的实测值，单位没跟着改）。
           现已引入 `gray()`（0..255）统一口径。
        2. **扫描范围绕开了分界线**：留白带只扫容器**外面**（x 0..65），
           而分界线正好落在容器边缘 x=65/1365 上 —— 典型盲区。现已补上"容器边缘偏差"断言。
        3. **"整屏平均"会互相抵消**：柔光左右两条尾巴符号相反，
           整屏平均后左缘只剩 +0.31/255（看着合格），**按 72px 分段才是 +1.87/255**。
           所以新断言是**分段**的（每段 72px，逐段看 |内−外| ≤0.5/255）。
        4. **★一个设计上就不成立的新断言（写完才发现，已删）★**：一开始还写了一条
           "在纯背景列上扫 1px 灰度差"，结果**视频画面自身的竖直纹理**被当成瑕疵：
           实测 x=1091,y=152 报 4.98/255、x=871,y=152 报 1.70/255，
           而用 `document.elementsFromPoint` 查这两点时**只有 `.hero`（没有任何元素在画）**，
           说明是视频内容；**视频纹理（1.70）比真凶柔光（1.37）还大**，
           任何阈值都分不开 → 这条像素断言不成立，删掉，改**结构判定**：
           "宽度等于主容器宽的元素，不得有画着渐变的 `position:absolute` 伪元素"。
           （`body::before` 是 `fixed; inset:0` 的全屏层，安全，不在规则内。）
           ⚠️ 用"三帧取最小"能进一步压掉视频纹理（同一格取 3 帧最小值：
           静态 CSS 边缘三帧都在，视频纹理不会三帧都落同一格），新断言都带了这个处理。
      - **★新断言必须验证"它真的会失败"★**（不然又是一条空断言，前两轮就是这么翻车的）：
        把柔光 CSS 注入 `dist/index.html` 后重跑 `verify-videobg.mjs` ——
        三条新断言**全部变红**（左缘 1.60/255、右缘 -1.81/255、结构判定指名
        `section#top.hero::before pos=absolute inset=0px`，结果 19/22）；
        恢复后回到 **22/22**。**以后新增像素断言，必须先证明它在缺陷态下会红。**
      - 自检：`verify-videobg.mjs` **22/22**（原 19 条 + 新增 3 条）；
        全套串行重跑（四轮）：smoke 45/45、hero 85/85、nav-shrink 39/39、nav 14/14、
        home 23/23、brand 10/10、theme 11/11、redesign 14/14、search 17/17、
        videobg **22/22**、videobg-global 25/25、mobile-shots 15/15 无溢出、
        diag-errors 7 页全 0、contrast-audit 0 处不达标。
        另外单独量了 **1920×1080**（容器边缘各段 ≤0.29/255）与 **1600×900**，都干净。
        新增两个诊断工具：`scripts/diag-edges.mjs`（容器边缘逐段偏差 + 长竖线名单 +
        结构判定，支持 `EXTRA_CSS` 注入做 A/B、`W`/`H` 环境变量换视口）、
        `scripts/probe-point.mjs`（把像素坐标翻译成 DOM，判定是"视频内容"还是"CSS 层"）。
        旧的 `scripts/diag-bands.mjs` 已删（它的度量正好漏掉容器边缘，是盲区的源头）。
      - **踩坑记录（工具层面）**：**不要用 PowerShell 的 `Get-Content` / `Set-Content`
        往返改这个仓库里带中文的源文件** —— 本机 PowerShell 读 UTF-8 无 BOM 文件时按 GBK 解码，
        写回时又按 UTF-8 编码，`verify-videobg.mjs` 曾整file 变成乱码（中文注释全毁、
        部分行还被合并），最后只能整file 重写。要动文件用编辑工具 / `write`，
        或至少用 `[System.IO.File]::ReadAllText($p,[Text.Encoding]::UTF8)` +
        `WriteAllText(..., New-Object Text.UTF8Encoding($false))`。

---

## 37. ★`React error #424` 根因定位与修复（2026-09-18 五轮）★

> 这是本文件里挂了很久的"线上间歇、本地复现不出来"的未决项，本轮定位到根因并修掉。

### 37.1 结论（一句话）

**不是本站组件代码的问题。** 软导航换页时 Astro 会把旧页面的 React 岛**整批 `root.unmount()`**；
只要某个岛**还没水合完**（`client:idle` 的岛 + CPU/网络慢 + 连续快速换页），React 就把这次卸载
当成"水合之前塞进来的早期更新" → 抛 #424 并**整根降级为客户端渲染**。

### 37.2 定位过程（这套手法可以复用）

1. **先把压缩错误还原成原文**：`react.dev/errors/424` =
   *"This root received an early update, before anything was able to hydrate.
   Switched the entire root to client rendering."*
2. **抓完整栈**（`smoke.mjs` 只保留描述的前 90 字符，信息全丢，所以之前一直查不动）：
   新增 `scripts/diag-424.mjs`。关键技巧 —— react-dom 在**模块求值那一刻**就把兜底函数
   抓进局部变量（`var ci = typeof reportError === 'function' ? reportError : <ErrorEvent 兜底>`），
   **页面加载完再改 `window.reportError` 没用**，必须用 `Page.addScriptToEvaluateOnNewDocument`
   在文档创建前注入；注入时保留并继续调用原实现，这样 `Runtime.exceptionThrown` 的口径不变。
   脚本自带**注入自检**（故意 `reportError(new Error('__cw424_probe__'))` 再回读）——
   否则"0 命中"可能只是钩子没装上（本轮一开始就差点被这个骗过去）。
3. **对构建产物反查触发点**：在 `dist/_astro/client.*.js` 里搜 `Error(s(424))`，
   上下文是 `updateHostRoot` 的
   `if (a.isDehydrated) { … if (r !== i) { i = Ai(Error(424)); … } }`
   —— 即**根仍处于脱水态时，root 级元素变了**（`nextChildren !== prevChildren`）。
4. **用栈认人**：命中栈的最内层是 `Ip.unmount.Fp.unmount` → 触发者是 **`root.unmount()`**，
   不是 setState（这一条直接否掉了"是我们组件里 setState 太早"的猜想）。
5. **还原调用链**：`astro/dist/runtime/server/astro-island.js` 在岛元素被移出 DOM 时派发
   `astro:unmount`（**每次软导航都会发生**）→ `@astrojs/react/dist/client.js` 里
   `element.addEventListener("astro:unmount", () => r.unmount(), { once: true })` 立刻卸载。

### 37.3 为什么它是"间歇"的

命中条件是"**移出 DOM 早于水合完成**"，而水合是被推迟的：
`client:idle` 走 `requestIdleCallback`、线上还要等岛的 JS chunk 下载、CPU 忙时 idle 更晚。
所以：本地瞬时加载 + 慢速点击 → 几乎不出现；**连续快速换页 / CPU 降速 / 多标签争抢调度** → 必现。

复现命令（本机实测）：
```powershell
$env:STRESS='1'; $env:HOPS='16'; $env:GAP='350'; $env:LOAD='6'; $env:CPU='2'
node scripts/diag-424.mjs http://127.0.0.1:4321 2
Remove-Item Env:\STRESS,Env:\HOPS,Env:\GAP,Env:\LOAD,Env:\CPU
```

### 37.4 修法（不改动 node_modules）

新增构建期插件 `plugins/vite-react-safe-unmount.mjs`（已在 `astro.config.mjs` 里注册），
把上游那句 unmount 换成"**先等水合、再卸载**"：
- 已水合（或读不到内部状态）→ 立刻 `unmount()`，**行为与原来完全一致**；
- 仍在脱水（`root._internalRoot.current.memoizedState.isDehydrated`）→ 每 30ms 轮询，水合完再卸载；
- 1.5s 仍未水合（后台标签页等极端情况）→ 放弃卸载：未水合的根没跑过 `useEffect`，不会留下监听器。

A/B 开关：`CW_DISABLE_SAFE_UNMOUNT=1` 重新构建即可关掉补丁做对照。
⚠️ 插件靠**精确字符串**改上游文件；匹配不上会**大声告警**（不静默跳过）——
升级 `@astrojs/react` 后务必看一眼构建日志里有没有那条警告。

### 37.5 实测

| 版本 | 条件（完全相同） | #424 命中 |
|---|---|---|
| 修复前 | STRESS(16 跳/350ms) + CPU×2 + 6 个标签争抢，2 轮 | **7 次**（栈均指向 `root.unmount`） |
| 修复后 | 同参数，2 轮 | **0 次** |
| 关掉补丁（A/B 反证） | 同参数，2 轮 | **2 次**（证实是补丁消除了它，不是环境漂移） |
| 修复后最终版 | 同参数，3 轮 | **0 次** |

回归（本地、串行）：`smoke` 45/45、`verify-hero` 85/85、`verify-nav-shrink` 39/39、
`verify-search` 17/17、`verify-home` 23/23、`diag-errors` 7 页 0 异常、
`verify-countup` 首屏 / 软导航 / 硬刷新三种情况**都正常重放**（说明岛照旧水合）。

**线上复验（推送后）**：
- `poll-deploy` 三项正向（`.code-card{...flex:none`、`border-radius:18px`）+ 三项反向
  （`motion-toggle` / `mm-actions` / `mm-group` 线上查不到）**全部成立** → 线上已是本次构建；
- 线上 JS chunk `client.B08QaFNc.js` 里 `astro:unmount → v(t)` + 安全卸载函数 `function v(e){…_internalRoot…}`
  存在 → **#424 补丁确实上了线**（`poll-deploy` 只查 HTML/CSS，JS 要另查，见 §7.5）；
- 线上 `diag-424.mjs` 3 轮 **0 命中**；线上 `smoke` **45/45**（含"软导航一圈后仍无 JS 异常"）。
⚠️ `verify-search` 依赖 pagefind 索引：**只跑 `astro build` 不跑 pagefind 会 14/17**，
跑完整 `npm run build`（含 `pagefind --site dist`）才是 17/17。

### 37.6 顺带纠正的两条旧结论

1. §32 说"#424 **仅线上**、本地永远复现不了" —— **不成立**：本地同样能复现，只是概率低
   （接手当天 `smoke` 就命中过一次 43/45）。它是时序竞态，不是部署/缓存/环境的锅。
2. §6.19 说"`client:visible` 会导致 #424，换 `client:idle` 后归零" —— 归因方向对但不彻底：
   真正的变量是"**水合被推迟多久**"。`client:idle` 只是让它通常赶在换页前完成，
   一旦 CPU/网络慢或连点，照样命中。**常驻小岛仍应继续用 `client:idle`**（见 §6.19），
   但别以为换了指令就根治了。

---

## 39. ★首页代码卡片：磨砂玻璃材质★（2026-09-18）

原来只有"半透明底 + `blur(10px)`"，观感像一层灰膜。改成四层叠加：

| 层 | 做法 | 作用 |
|---|---|---|
| ① 渐变高光 | `linear-gradient(165deg, rgba(255,255,255,.10) → 0)` 叠在半透明底上 | 模拟玻璃受光（上沿更亮） |
| ② 模糊 + 提饱和 | `blur(22px) saturate(1.4)`（原 10px、无饱和） | 把背后的视频揉成雾面，不灰 |
| ③ 更细更亮的边 | `1px solid rgba(255,255,255,.14)`（原 `--line-2` = .2 偏重） | 收边更精致 |
| ④ 分层投影 + 内侧高光 | `0 24px 64px / 0 6px 18px` + `inset 0 1px 0 rgba(255,255,255,.14)` | 远/近两层投影给纵深，**内侧 1px 顶部高光是"玻璃厚度"的关键** |

- 卡片标题栏同步：一层自上而下收掉的亮部 + 更淡的分隔线（`.09`）。
- 圆角保持 **12px**（几何真值，`verify-hero` 有断言）；底色/模糊不影响任何几何。
- 实测：卡内高频能量 **0.135** vs 紧邻的卡外背景 **0.639** → 背后的视频确实被揉开了约 4.7 倍。
- 断言：`verify-hero` 新增 2 条（模糊 ≥16px 且提饱和 / 多层玻璃 = 渐变+半透明底+内侧高光），
  **基线 86 → 88**。
- ⚠️ 有前缀的 `-webkit-backdrop-filter` 会被当前构建链剥掉（见 §22 修订）。
- ✅ **已推送上线**（`2ee2e16..6483164`）。线上确认特征：
  `--have 'blur\(22px\)saturate\(1\.4\)' --have 'inset 0 1px #ffffff24' --not '#12121ab3'`
  （CF 约 56 秒完成）；线上复跑 `verify-hero` **88/88**、`smoke` **45/45**。

---

## 40. ★内容结构调整：移除作品库 → 新增博客归档 + 活跃热力图★（2026-09-19）

### 40.1 移除作品库

- 删除：`src/pages/works/`（列表 + 详情）、`src/content/works/`（6 篇）、
  `src/layouts/WorkLayout.astro`、`src/components/WorkCard.astro`。
- 连带更新：`site.ts`（NAV 作品库→博客、tagline/notice 措辞）、`index.astro`
  （②区块改为**最新博客** 3 篇，卡片无封面 → 日期徽标占位，同样锁 16:9 防跳版；
  hero 统计「篇作品档案」→「篇博客文章」，技术标签改由博客 tags 现算）、
  `SidebarNav`（作品库/分类两组 → **博客**一组）、`SidebarWidgets`（统计与事件里的作品 → 博客）、
  `rss.xml.ts`（订阅源改为博客）、`Base.astro`（RSS 标题）、`404.astro` 与 `about.astro` 的链接、
  `AboutMagicBento`（Works 卡 → Blog 卡）、`ui.js` 搜索占位文案。
- `content.config.ts`：移除 `works` 集合。⚠️ 集合删了但还有地方 `getCollection('works')` 时，
  构建会报 WARN「collection does not exist」—— 出现这个警告就说明还有引用没清干净（Header.astro 里就藏了一处）。

### 40.2 文章子页面 `/posts/` + 博客归档 `/blog/`

- `posts` 集合：title/date/tags/summary 必填，`link` 可选（外链文章直接跳转）。
- **每日日志帖**：changelog 的每一天都有一篇对应的日志文章
  （`src/content/posts/YYYY-MM-DD-log.md`，标题「站点日志 · MM.DD 主题」，tags 含「站点日志」），
  内容 = 当天 items 逐条展开（kind + title + note）。09-19 当天的日志由主题文章
  《把作品站改造成博客归档》承担，不重复建。
- **`/posts/`（文章列表）**：每篇一行卡片（日期 + 标题 + 摘要 + 标签），点标题进详情。
- **`/posts/[slug]/`（文章详情）**：`render()` 渲染正文（prose 样式齐：h2/h3/code/pre/blockquote）、
  上下篇导航、giscus 评论、返回归档链接。纯外链文章（有 `link`）不生成详情页。
- **`/blog/`（归档时间线）**：见 40.3；时间线上的文字链到当天的日志/主题文章（`/posts/[slug]/`）。
- 左栏导航树：「文章」分组列出全部文章（/posts/ 与每篇详情）；「站点」分组含归档时间线（/blog/）；RSS 改订阅文章详情。

### 40.3 侧栏「活跃热力图」（GitHub contributions 风格）

- 替换原来的月历：**近 26 周**（列 = 周、行 = 周日→周六），格子尺寸随容器自适应；
  强度按当天事件数（博客 + 截图 + changelog）分 **5 档**（0–4），
  颜色用 `rgba(var(--accent-rgb), α)` 阶梯 → **跟随色卡换色**。
- 月份标签已移除（2026-09-19，用户要求）；左侧星期标签一/三/五；图例「少 → 多」；
  今天有描边。
- ⚠️ 点色块**不再打开下方详情面板**（面板已删）：改为在色块上方浮出简短信息 ——
  「这天有 上线 2 次、修复 1 次」式的按类型计数，由 ui.js 的 `calPanel()` 重写实现
  （挂 body 的 `.heat-tip`，fixed 定位在色块上方居中、钳在视口内；再点同格 /
  点别处 / 滚动 / Esc 收起）。数据仍读 `data-cal-data` 内联 JSON。
- 两栏吸顶不受影响：`sideSticky()` 会把左右栏补成等高（实测 941/941）。

### 40.4 断言与基线

- `verify-nav`：「分类入口」→「博客归档入口在左栏」；`verify-redesign`：玻璃卡选择器
  `.wk-card` → `.post`（作品卡已不存在）；`smoke`：分类筛选块 → 博客归档入口跳转 +
  按年份分组断言，SHELL_PAGES 去掉作品页。
- 基线更新：smoke 45→**47**、home 23→**24**、videobg-global 25→**29**、mobile 15→**18**、
  diag-errors 7 页（/posts/ 加入覆盖）、其余不变
  （hero 88、nav-shrink 42、nav 14、brand 10、theme 11、redesign 16、
  search 17、videobg 22、contrast 0、diag-424 0）。
- ⚠️ `diag-424.mjs` 的轮数参数解析有坑：`Number(argv[3] || 4)` 在 argv[3] 传了
  `'dark'`（主题参数）时是 NaN —— 必须写 `Number(argv[3]) || 4`。
- ⚠️ `verify-nav-shrink` 的抽屉断言、`verify-redesign` 的玻璃卡选择器（`.wk-card` → `.pcard`，
  测量页 /blog/ → /posts/）要跟着导航与页面结构调整 —— 每次加/删子页面后这三处必查。

---

## 41. ★极简化 + 去 AI 味 + 动效（2026-09-19 四轮）★

**需求**：① 移除页脚、各子页小标题极简（删介绍行）；② 文章与关于页文案去 AI 味；
③ 页面加载动画 + 按钮微交互。已全部上线（commit `9736241`）。

- **页脚**：`Footer.astro` 已删除，Base.astro 不再引用；`.site-footer` 样式
  （global.css / motion.css 暗色规则 / index.astro 内联隐藏规则）全部清掉。
  `verify-brand` 的页脚断言改为「页脚已移除」。
- **小标题**：/posts/ 与 /blog/ 的 `.head-sub` 介绍行与对应样式已删，只留 kicker + h1。
- **去 AI 味**：12 篇文章全部重写为口语化短句（9 篇站点日志 + 3 篇主题文章）；
  关于页、AboutMagicBento 卡片、Sidebar 引言、`SITE.tagline/notice` 同步改写。
- **动效**：`page-enter` 入场强化（filter blur→clear）、首页三区块 `.rv` 滚动显现、
  motion.css 末尾新增按钮/链接微交互（hover 轻抬、active 按压、箭头位移、
  热力图色块按压），`prefers-reduced-motion` 下整体关闭。
- **⚠️ 构建坑（shell 变量吞代码）**：用 bash 内联 node 往 CSS 插入 `$1` 引用，
  `$1` 被 bash 展开成空串，把 motion.css 里 `@media (prefers-reduced-motion: reduce) {`
  连同注释一起吃掉 → lightningcss "Invalid empty selector" 构建失败。
  教训：内联脚本里不要写 `$N`，插入文本用数组 join 或转义。
- **⚠️ 陈旧服务坑**：4321 端口挂着一个 13.5 小时前的 `astro preview`，
  回归脚本全在测旧 dist —— 三个"失败"里两个是假象。回归前先确认
  4321 服务的启动时间（或重启 preview）。
- **⚠️ 构建必须用 `npm run build`**（= `astro build && pagefind --site dist`）。
  手动只跑 astro build 不会生成 pagefind 索引，verify-search 的 3 条断言全红
  （输入框不挂载、搜不出结果）。pagefind 单独补跑：
  `node node_modules/pagefind/lib/runner/bin.cjs --site dist`。
- **回归脚本新增**：`scripts/run-regress.mjs` 批跑 15 个脚本、汇总 PASS/FAIL
  （bash 缺 tail/ls，批处理一律走 Node）。
- 本轮基线：smoke 48、hero 88、home 24、nav-shrink 40（shell 页退化为
  导航居中校验，3 条 wrap 对齐断言按页型二选一）、nav 14、brand 10、
  theme 11、redesign 16、search 17、videobg 22、videobg-global 29、
  contrast 0 处、mobile 18、diag-errors 0、diag-424 0 —— **15 个脚本全绿**。

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

> ★**怎么选脚本：按 §47 的分层策略，不是每次都跑全套**★
> 改一个子页面 → `smoke.mjs` + 该页对应的一条脚本；
> 改一个功能模块 → 本表里相关的那几条；
> **全套 `node scripts/run-regress.mjs`（21 个脚本串行 + 汇总 PASS/FAIL）只在
> PR 前 / 合并前 / 发布前 / 站长明确要求时跑，且优先交给 CI。**
> `verify-copy.mjs` 与 `verify-nav-icons.mjs` 是**不需要无头浏览器**的两个
> （只读源码 / 已构建的 `dist/`；`verify-copy` 也可直接给线上 URL 走 sitemap 枚举），
> 所以它们能独立于 9222 跑 —— 也因此被排在批跑队列最前。

| 脚本 | 覆盖什么 | 当前基线 |
|---|---|---|
| `smoke.mjs` | ★总入口：各页横向溢出/控制台异常/侧栏存在与等高、长页两栏逐帧同步、"不钉在导航栏下"、软导航往返后的文章列表/详情跳转与热力图浮层交互、**软导航一圈后画廊大图开/关（§58）+ 画廊文件夹墙/进图集/返回（§59）**、手机端侧栏隐藏（含 `/log/`） | **64/64**（2026-09-20 傍晚画廊文件夹视图段 +3，见 §59） |
| `verify-hero.mjs` | 首页 Hero：几何/比例 + 与主栅格对齐（同宽/同内边距/内容左缘重合）+ 两行标题 + 强调色预设 + **整块竖向居中/容器居中/标题字号/`--card-shift`** + **手机端代码卡片按内容展开（未被压扁裁切）** + **代码卡片磨砂玻璃（模糊 ≥16px 且提饱和 / 多层玻璃）** | **88/88**（2026-09-18：修手机端卡片被裁 85 → 86，加磨砂玻璃 2 条 → 88） |
| `verify-home.mjs` | 首页四层结构（最新**博客**）、图片策略、防 CLS 容器、alt、区块间距、SEO（6 页）、移动端单列 | **26/26**（2026-09-19 晚 `/log/` 加入后 +1） |
| `verify-nav-shrink.mjs` | 导航三态（贴顶通栏/滚动胶囊/回顶）+ 形态过渡 + 移动端汉堡菜单（**含"抽屉一级 5 链接 + 记录组 3 链接共 8"、"记录"分组存在且无 ?tag=/?game= 分类链接"、"已无外链按钮"、"左右各内缩 12px"、"四角圆角 ≥12px 且一致"**）+ **导航容器与主内容容器同宽、同左缘、自身居中** | **40/40**（2026-09-19 深夜「记录」下拉改断言，条数不变） |
| `verify-nav.mjs` | 导航几何、玻璃、**「记录」悬停下拉**（§51：存在且仅 1 个、悬停浮出/移开收回、含 文章/归档/日志 三项且 href 一一对应、浮层在视口内）、**博客归档入口在左栏**、无遗留旧版二级菜单开关 | **21/21**（2026-09-19 深夜「记录」下拉后 14 → 21） |
| `verify-brand.mjs` | 品牌标志（viewBox、云体/羽翼色值、旧六边形已清、不超导航条） | **10/10** |
| `verify-theme.mjs` | 单主题不变量：默认暗色/系统浅色仍暗色/历史偏好切不回浅色/无开关/首屏逐帧无浅色帧 | **11/11** |
| `verify-redesign.mjs` | 暗色电影感：玻璃令牌取值、**无暂停按钮 + 视频默认在播 + 旧暂停接口已移除 + reduced-motion 仍不播**、导航滚动过渡 | **16/16**（2026-09-18 暂停按钮删除后由 14 条改为此 6 条） |
| `verify-search.mjs` | 搜索悬浮窗：懒加载、开关、出结果、快捷键、软导航后仍可用 | **17/17** |
| `verify-videobg.mjs` | 背景视频：播放/层级/透明度/遮罩 + hero 文字在视频上的**实际像素**对比度（用"隐藏文字的对照页"取样，并自检对照页版式与真实页一致）+ **主容器左右边缘无分界线（逐 72px 段、8bit 灰度口径、三帧取最小）** + **结构判定：与容器同宽的元素不得有绝对定位的渐变伪元素** + **降级底断言（§62 迁移）：底色渐变由 body::after 承载、html 持有不透明深色画布** | **23/23**（2026-09-21 早 §62 断言迁移 22 → 23） |
| `verify-videobg-global.mjs` | 全站背景一致性：逐页硬刷新 + 软导航一圈，视频未被重建、旧背景仍在（含 `/nav/` 与 `/log/`） | **37/37**（2026-09-19 晚 `/log/` 加入后 33 → 37） |
| `verify-copy.mjs` | ★**文案断言**：① 禁用词（浅色通透 / 双主题 / 主题切换 / 开灯… 等"描述已删除功能"的措辞）不得出现在任何页面的可见文案与 meta；② 占位词（TODO/待补/lorem…）不得出现；③ 文案锚点 —— `site.ts` 的 notice/tagline 非空且不含禁用词，notice 必须出现在关于页可见文案、tagline 必须出现在 meta description；④ 每页都有非空 title/description。**只扫页面固定文案与 meta，不扫文章正文**（历史文章合法会提"浅色主题/作品库"） | **31/31** |
| `verify-nav-icons.mjs` | ★**图标静态断言**（纯 Node，不需要浏览器）：① `SITE_NAV` 每个 `icon` 路径在 `public/` 下真实存在且形如 `/nav/<slug>.png\|svg`；② `public/nav/` 无孤儿文件；③ 已构建时每个 icon 都进了 `dist/nav/`、页面引用集合与声明一致；④ **带 `--ico` 的图标位内无文本**（防 §48.6 "图标与首字圆牌重叠"复发）；⑤ **[E] SVG 最亮 `fill` 相对亮度 ≥ 0.12**（防 §48.3 "近黑 logo 在暗卡上等于没画"）。⚠️ ⑤ 只查 SVG，PNG 是已知盲区 | **9/9** |
| `verify-interaction.mjs` | ★**交互基线断言**（§49）：A 鼠标拖过正文选不中 + **A′ 对照组**（放行 `user-select` 后同样拖拽必须能选中，证"拖拽确实生效"；**2026-09-20 起对照文本改用右栏引文 `.sw-quote blockquote`**——标题下描述已按 §52 全站删除）；B 点击头像/导航卡/图标位后无轮廓；C Tab 聚焦必有可见轮廓且不带 `data-pointer-focus`；D 指针点文本输入框仍保留轮廓；E `body=none` / `input=text`；**F 真实文章页拖过 `.pp-md p` 必须选中**（保护 §49.3 刻意保留的例外） | **12/12** |
| `verify-shell.mjs` | ★**壳层一致性断言**（§52/§53）：7 个子页面逐页验 ① 内容顶与侧栏首卡顶对齐（≤1px）；② kicker 是「EN / 中文」格式（无「· 后缀」）；③ 标题下无描述简介（`.txt`/`.sub` 不许是 page-head 直接子元素）；④ **标题→内容间距符合全站 1.6rem 节奏（§53：卡片/区块边界型量盒间距、about 平文型量首文本顶，分页口径表）**；⑤ h1 非空；⑥ 无横向溢出 —— 防页头格式、顶对齐与间距节奏再次漂移 | **50/50** |
| `verify-log.mjs` | ★**日志页断言**（§50）：A 落在 `/log/` 且标题为「日志」；B 结构（年分组新→旧、每日期卡非空、条目徽标+标题、note 与「当天日志 →」链接在、无空态兜底）；C 导航三处注册（顶栏/左栏/当前高亮）；D 玻璃材质（backdrop-filter）+ 无横向溢出；E 运行时 0 异常。断言刻意用**相对计数**（不写死天数/条数），加 changelog 不会误报 | **15/15** |
| `verify-ghhot.mjs` | ★**GitHub 热榜卡断言**（§56）：① 卡片位于 STATS 卡正上方；② 四 tab（日/周/月/年）+ 默认每日；③ 每日榜真实渲染 ≥5 条；④ 条目链接跳转 github.com 仓库；⑤ 条目带 star；⑥ 切每周正常渲染；⑦ 日/周**缓存桶 = 当天/本周一**（「24 点自动换新」的实现依据）；⑧ **软导航换页后热榜卡片仍在、切回「每日」仍生效**（§58 修复回归）。⚠️ 真实调用 api.github.com（无鉴权搜索限流 10 次/分），只实拉日/周两周期，**别在循环里跑** | **11/11**（2026-09-20 深夜软导航回归段 +2，见 §58） |
| `contrast-audit.mjs` | WCAG 对比度审计（逐节点"前景 vs 实际合成背景"） | 暗色 **0 处不达标** |
| `mobile-shots.mjs` | 三机型视口 × 8 页截图 + 横向溢出统计 | **24/24 无溢出**（2026-09-19 晚 `/log/` 后 21 → 24） |
| `diag-errors.mjs` | 逐页 JS 异常计数（含 `/log/`） | 全页 **0** |
| `diag-edges.mjs` | **诊断（不断言）**：容器边缘逐段偏差 + 全屏长竖线名单 + "容器级装饰层"结构判定。支持 `EXTRA_CSS='...'` 做 A/B（把被删的层注回去看断言会不会红）、`W`/`H` 环境变量换视口 | 按需 |
| `probe-point.mjs` | **诊断（不断言）**：`node scripts/probe-point.mjs / 1091 188` 把像素坐标翻译成 DOM（`elementsFromPoint` + 各伪元素的 `backgroundImage/inset`），用来判断某处是"视频内容"还是"CSS 层" | 按需 |
| `diag-424.mjs` | **诊断（不断言）**：抓 `React error #424` 的**完整栈**（文档创建前注入 `reportError` 钩子，并自带注入自检）。支持 `FLOW=smoke`（复刻 smoke [3]）、`STRESS=1`（`HOPS` 次快速换页，`GAP` 间隔）、`CPU=n` 降速、`LOAD=n` 开 n 个标签制造调度竞争 | 修复前 **7 次** / 修复后 **0 次** |
| `poll-deploy.mjs` | **推送后确认上线**：按 `--have` / `--not` 给的内容特征轮询线上（含首页自己引用的全部 CSS chunk），通了才退出 0；`--not` 用于**删除类改动的反向特征** | 按需 |
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

### 7.4.2 交接时"要顺手核一遍文案"的检查项
本次的经验：**几何/颜色类断言全绿，也挡不住一句写错的文案上线。** 改完主题/视觉方向后，
交出去之前核这几处用户可见文字与当前实现是否一致：
```
□ src/site.ts 的 SITE.tagline     → 首页 SEO / 各页 meta description 兜底
□ src/site.ts 的 SITE.notice      → 关于页 .note（★页脚已于 2026-09-19 删除，不再有页脚副本）
□ 各页 <title> / <meta name="description">
□ README.md 首行定位句
```
**2026-09-19 起这份清单已部分自动化**：`node scripts/verify-copy.mjs`（31 条）会扫
禁用词（浅色通透/双主题/主题切换…）、占位词、以及 `notice`/`tagline` 与页面的锚点一致性。
剩下仍需人工核的只有"README 首行 / 各页 meta 是否与实现相符"这类**语义**判断
（脚本管得了"出现了禁用词"，管不了"这句话是否已经过时"）。

#### 2026-09-18 四轮交接复核（本轮）
> 代码提交 `480a907`（文档提交在其后）。本轮改动是**纯 CSS / 纯删除**（没有动任何 React 岛）。
- **本地**：`npm run build` 退出码 0；14 个脚本**串行**全绿 ——
  smoke 45/45、hero 85/85、nav-shrink 39/39、nav 14/14、home 23/23、brand 10/10、
  theme 11/11、redesign 14/14、search 17/17、videobg 22/22、videobg-global 25/25、
  mobile-shots 15/15 无溢出、diag-errors 7 页全 0、contrast-audit 0 处不达标。
- **容器边缘**（四轮新增的断言）：1440 ≤0.36/255、1600 ≤0.25/255、1920 ≤0.29/255（阈值 0.5）。
- **推送 → CF 构建 38 秒完成**。确认方式是**反向特征**（本轮是纯删除，正向特征一个都没有）：
  `--w-max:1300px` 在 ｜ `brightness(var(--vid-dim` 在 ｜ HTML 内联 `--vid-dim:0.85` 在 ｜
  `--scrim-top` **不在** ｜ 柔光渐变 `60% 50% at 30% -10%` **不在** ｜ `hero::before` **不在**。
- **线上**跑同一套：hero 85/85、nav-shrink 39/39（宽 1300 / 收缩 1140 与本地一致）、
  videobg **22/22**（含"容器边缘无分界线"两条新断言）、diag-edges 容器边缘 ≤0.28/255。
- ⚠️ **线上 `smoke` 3 轮 = 43/45 / 45/45 / 42/45**，失败项全部是**已知的间歇 `React error #424`**
  （见 §13 未决项与 §32）；同一时刻本地 45/45，且本轮**没动任何 React 代码** → 与本轮改动无关。
  **不要**把"线上 smoke 全绿"写进交接结论里，它是间歇的。
- ⚠️ **线上 `verify-videobg.mjs` 5 轮 = 22/22 ×4 + 21/22 ×1**（同一时段）。那一次失败项**没有当场记录**
  （被输出过滤掉了），按输出顺序排除已知项后，最可能是同族的"无 JS 异常"（即 #424）那一格 ——
  **不是**三条新的边缘断言（它们每轮都 ✅，线上实测 ±0.28/255）。看到线上偶发 21/22 不要先怀疑新断言。

### 7.5 部署确认（别用 chunk 哈希！）
**首选：用仓库里的轮询脚本**（推送完直接跑，它每 15 秒复测一次，通了才退出 0）：

```powershell
cd 'D:\deep seek workplace\endfield-blog'
# 特征由你自己给（脚本故意不存默认特征 —— 默认值一定会过期）。--have 正向 / --not 反向。
node scripts/poll-deploy.mjs --have '--w-max:\s*1300px' --have 'brightness\(var\(--vid-dim' `
                            --not 'hero::before' --not '60% 50% at 30% ?-10%'
# 超时/失败会打印逐项结果并以退出码 1 结束（可用于脚本里卡住"确认上线"这一步）
```
它自己会抓**首页 HTML + 首页引用的全部 CSS chunk**，所以不会踩"只看 /works/ 的 CSS"那个坑。

**备用：PowerShell 一把梭**（想手工看一眼时用）
```powershell
# 用内容特征判断：把改动的样式/类名拿到线上 HTML 或 CSS 里找
$html = (Invoke-WebRequest 'https://cloudwing.pages.dev/works/' -UseBasicParsing).Content
$css  = ([regex]::Matches($html,'href="(/_astro/[^"]+\.css)"') | % { $_.Groups[1].Value } |
         % { (Invoke-WebRequest ("https://cloudwing.pages.dev" + $_)).Content }) -join ''
"新样式上线: " + [bool]($css -match 'clamp\(1\.45rem')     # ← 换成你这次改动的特征
```
CF 构建通常 30~90 秒（四轮实测 38 秒）；超过 5 分钟没动静就先确认推送是否真的成功（`git ls-remote origin main`）。

**⚠️ 上面那段 PowerShell 只抓 `/works/` 页面的 CSS。** 首页 hero 的样式在**另外的 chunk** 里，
只查 `/works/` 会得出"没上线"的假结论 —— 要确认首页改动，必须抓**首页自己的** CSS：

```powershell
# 2026-09-18 四轮：首页三个特征（正/反各一半，缺一不可）
$html = (Invoke-WebRequest 'https://cloudwing.pages.dev/' -UseBasicParsing).Content
$css  = ([regex]::Matches($html,'href="(/_astro/[^"]+\.css)"') | % { $_.Groups[1].Value } |
         % { (Invoke-WebRequest ("https://cloudwing.pages.dev" + $_)).Content }) -join ''
"① 容器 1300（二轮）: " + [bool]($css -match '--w-max:\s*1300px')
"② 视频压暗已在视频图层内（三轮）: " + [bool]($css -match '--vid-dim')
"③ 柔光已删（四轮，**反向特征**）: " + (-not ($css -match '60% 50% at 30% ?-10%'))
"④ hero 伪元素已不存在（四轮，反向）: " + (-not ($css -match 'hero::before|hero:before'))
```
★**教训**：确认"删掉的东西"要查**反向特征**（某个选择器/数值在线上 CSS 里**找不到**），
而不是找一个"新加的东西"。四轮这次改动是纯删除，正向特征一个都没有。
最硬的确认还是**直接对线上跑同一套断言**（§7.4.3 第 4 步）。

### 7.6 ★写新断言的三条硬要求（本项目已经因此翻车两次）★
本文件 §36.2 / §36.3 记录了两轮"瑕疵明明在、断言却全绿"的事故。归纳成三条，**写像素/几何断言前逐条对**：

1. **单位口径必须自洽**。`lum()` 返回 0..1，阈值就只能是 0..1 量级；
   实测值若是"每 255 多少级"，必须用 `gray()`（0..255）口径。
   四轮的"留白带逐列阶跃 ≤3"里 `lum()` 配阈值 `3.0` —— **恒真**，等于没测，连过两轮。
   → 新断言写完后，先打印**实测值**，确认它离阈值有可解释的余量（本项目取 ≥2 倍）。
2. **扫描范围必须覆盖"你怀疑的那条边界"**。四轮的分界线正好落在容器边缘 x=65/1365，
   而旧断言只扫容器**外面**（0..65）—— 典型的"量了旁边"。另外**别用整屏平均**：
   柔光左右两条尾巴符号相反，整屏平均后左缘只剩 +0.31/255（看着合格），
   按 72px 分段才是 +1.87/255 → **要分段量**。
3. **必须证明"它在缺陷态下会红"**。做法：把被删掉的 CSS/结构用 `diag-edges.mjs` 的
   `EXTRA_CSS` 注回去（或临时注入 `dist/index.html`），重跑断言，**确认它变红**，
   再删掉注入。四轮的三条新断言都这么验过（19/22 红 → 恢复 22/22）。
   ⚠️ 另外：**不要用"扫纯背景像素找竖直边缘"这种通吃式断言** —— 视频画面自身的竖向纹理
   实测能到 1.70/255，比真凶柔光（1.37/255）还大，任何阈值都分不开。
   这类"结构性成因"要用**结构判定**（查 DOM/伪元素的盒子与定位），不要用像素。
   （若确实要量像素，用"同一格取多帧最小值"：静态 CSS 边缘每帧都在，视频纹理会变。）

### 7.7 ⚠️ 工具陷阱：别用 PowerShell 读写带中文的源文件
本机 PowerShell 读 **UTF-8 无 BOM** 文件时按 GBK 解码，`Set-Content -Encoding utf8` 又按 UTF-8 写回 ——
`scripts/verify-videobg.mjs` 曾因此**整file 变成乱码**（中文注释全毁、部分行还被合并），
最后只能整file 重写。安全做法，任选其一：
- 用编辑工具 / `write` 直接改文件（推荐）；
- 非要用 PowerShell，就走 .NET 并显式指定编码：
  `[System.IO.File]::ReadAllText($p,[Text.Encoding]::UTF8)` +
  `[System.IO.File]::WriteAllText($p,$t,(New-Object Text.UTF8Encoding($false)))`；
- 用 `node -e` 做拼接（Node 的 `fs` 默认 UTF-8，本项目改 HANDOFF 时就是这么干的）。
  ⚠️ 拼接时**保留原文件换行风格**（`\r\n` / `\n`），否则整个文件每行都会显示成改动。
- 改完必须核：`HANDOFF.md` 与 `endfield-blog/docs/HANDOFF.md` **逐字节一致**（比对 sha256）。

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
  ⚠️ **2026-09-18 起手机端抽屉里的「作品库分类 / 画廊分类」两组也已按用户要求删除**
  （`Header.astro` 的 `.mm-group` 与相关 `.mm-*` 样式一并移除），所以**手机端目前没有分类入口**
  —— 分类只剩桌面左栏导航树一处。要补的话，建议在 `/gallery/` 页面内加一排筛选 chip
  （该页现在只有"当前分类回显条"，本身没有选择器）。
  > ⚠️ **2026-09-19（§40）作品库已整体下线**（`/works/`、`content/works`、WorkCard/WorkLayout 全删），
  > 所以"在 `/works/` 加 chip"这条已经无处可加；站点现在是**博客 + 归档 + 画廊**的结构。
  同理，手机端抽屉里的 **GitHub / Bilibili / RSS 也已删除**；⚠️ 页脚也在 2026-09-19
  被移除（§41），所以**这三个外链目前手机端没有任何入口**，桌面端只剩左栏。
  要补回移动端入口需另加（如抽屉底部一排图标）。
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
| ~~作品封面 SVG 偏亮~~ | **已作废**：`public/covers/*.svg`（12 个）随作品库下线（§40）沦为**零引用死资产**，已于 2026-09-19 删除（§42） |
| 背景视频体积 | `public/media/bg-loop.mp4` 约 15.5 MB，每位访客都会下载。嫌重可以：换更短片段 / 压到 8MB 内 / 手机上不加载（见 §23 的 `VIDEO_BG` 令牌） |
| 背景视频主色调 | 素材稳定在 **192° 青蓝**，与站点雾蓝强调色同族。**换素材要重取色相**（`--accent` 系） |
| 工牌交互 | 原来"下拉/点击工牌开关灯"随亮色主题一起删了，现在只剩拖拽的装饰手感（§27）。要不要加别的反馈？ |
| 左栏导航树分组 | **已变更**：2026-09-18 导航照参考重做后不再有二级菜单；2026-09-19 作品库下线后，左栏分组改为「文章 / 站点」（§40） |
| 顶栏搜索入口 | 照参考重做导航后，顶栏不再有搜索按钮；搜索只剩 ⌘/Ctrl+K 与左栏/移动端菜单的入口。可访问性上少了可见入口，要不要加回来说一声（见 §33） |
| 手机端入口极简 | 2026-09-18 按用户要求删掉了抽屉里的「作品库分类 / 画廊分类」与底部外链；⚠️ **页脚又在 2026-09-19 删除（§41）**，所以**手机端现在既没有分类入口、也没有 GitHub / Bilibili / RSS 入口**（桌面端只剩左栏）。要补就在 `/gallery/` 内加筛选 chip，或在抽屉底部加一排图标（见 §9.1） |
| ~~作品详情页 summary / 404 说明文字~~ | **已作废**：作品详情页随 §40 整体删除；`/404` 的说明文字仍在，要删说一声 |
| 个人信息卡横幅图 | `SidebarNav.astro` 顶部常量 `PROFILE_BANNER = ''`，留空＝主题渐变；填站内图片路径即换成图片 |
| 天气城市 | `src/site.ts` 的 `WEATHER_CITY = ''`＝按访客 IP 自动定位（推荐，不暴露你的位置）；填城市名则固定（等于公开城市） |
| 画廊原图 | 40 张原始 PNG 备份已随工作区清理删除，仓库里的 webp 是唯一副本（详见 §11） |
| `SESSION_HANDOFF.md` | **已删除**（交接时清理，见 §11.2） |
| ~~文案复核机制~~ | **已解决**（2026-09-19）：新增 `scripts/verify-copy.mjs`（**31 条**，已接入 `run-regress.mjs`）—— 覆盖禁用词 / 占位词 / 文案锚点三类，并按 §7.6 第 3 条验证过"缺陷态会红、健康态全绿"（§42） |
| ~~线上间歇 `React error #424`~~ | **已定位并修复**（2026-09-18 五轮，见 §37）：软导航时 Astro 对**尚未水合**的 React 岛调用 `root.unmount()` 触发。它既不是"仅线上"也不是缓存问题，而是时序竞态（本地也能复现，只是概率低）。修法见 `plugins/vite-react-safe-unmount.mjs`。✅ **已推送上线**（`6a1564f..2ee2e16`），线上复验见 §37.5 |
| 变更记录 | **部分已补**：`src/content/changelog/2026-09-18.md` 已存在（3 条：导航重做 / 强调色预设 / 磨砂玻璃卡片），但该轮的**容器宽度 1300、柔光层删除、#424 修复**三项没写进去；`2026-09-17` 只有文档与文案修正，未建 changelog。要补齐说一声 |
| `/account/` 页面很短 | 手机端实测页面高约 997px（其它页 3000+），目前只有留言板一块，要不要补内容？ |
| ~~首页 Hero 右侧留白（1920）~~ | **已解决**（2026-09-18 三轮）：版面改为 **700 / 96 / 400**，三块正好占满 1196 净宽，不再有右侧余量（§36.2） |
| 大标题字号 vs 参考 | **已更新**：2026-09-18 三轮把上限提到 **52px**（同时把左栏 645 → 700，因为第一行 28 字符在 52px 下实宽 686px）。参考的 66px 仍不可达 —— 要放宽左栏或改文案（§35 / §36.2） |
| 代码卡片高度/行数 | 卡片 **400** 宽 + 代码 15 行时约 470 高；**加长代码段或调 `--code-lh` 前先量 1440 下的卡片高**，否则 hero 会被顶出视口（§34 / §36.2） |
| GitHub 热榜数据口径 | 现为「**期间内新建仓库**按 star 排序」（GitHub Search API，§56）——与 github.com/trending 的"当前热度"不完全等价；且无鉴权搜索限流 10 次/分。要换成更贴近官方 trending 的数据源（如 OSS Insight）需换实现，说一声即可 |
| 短页右栏底部可达性 | 右栏加了热榜卡后更高，/nav/ 这类短页上右栏最底部的「今日一言」**要滚到页底才可见**（§56 附带发现，真实用户可用但脚本坐标要滚页底）。嫌深可以给短页砍右栏卡片或给热榜做折叠 |

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

**2026-09-18 这一轮留下的、最适合接着做的**：
- ~~**补一条 `src/content/changelog/2026-09-18.md`**~~ **已补**（且 09-19 / 09-20 均有对应条目，
  归档/日志页时间线是全的；**注意 09-20 之后的内容仍未写，交手新改动时要随手补 changelog**）；
- ~~**定位线上间歇 `React error #424`**~~ **已完成**（见 §37）。剩下的收尾：推 `main` 上线后
  在**线上**复跑 `node scripts/diag-424.mjs https://cloudwing.pages.dev 3`，确认线上同样归零；
- ~~**给文案加自动化断言**~~ **已完成**（2026-09-19：`scripts/verify-copy.mjs` 31 条，见 §42.2）；
- **首页 Hero 右侧留白**（1920 下 159px）与**代码卡片再瘦身**：都要动内部尺寸，需用户确认（§34/§36）；
- **色域扩展**：色卡现在是 5 套（雾蓝/镜蓝/极光/余烬/紫晶），加一套只需在 `src/site.ts` 的
  `ACCENTS` 里追加一条（含 `hue`/`sat`/`tintA`），其余全自动（§34）。

**2026-09-20 新增的候选**：
- **GitHub 热榜数据源升级**：现为 Search API「期间新建仓库」口径（§56 / §10），要更贴近官方
  trending 可换 OSS Insight 等源（需重做 fetch/解析，缓存桶机制可复用）；
- **验证套件上 CI**：§47 一直说"全量优先交给 CI"，目前 CI 上**还没有**任何 workflow ——
  把 `run-regress.mjs` 搬上去（需解决无头浏览器在 CI 的安装与 4321 预览）是当前最大的工程缺口；
- **短页右栏底部可达性**（§10 新条）：/nav/ 等短页要滚到页底才能看到「今日一言」。

**更早留下的**：
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

---

## 14. 交接自检清单（照抄即可，约 10 分钟）

> ⚠️ 前提：**串行跑**，并先重启一次调试浏览器（§7.1 第 4/6 条）。
> 出现"大面积失败"时先怀疑这两点，不要直接改代码。

```powershell
# 1) 起预览（4321）
cd 'D:\deep seek workplace\endfield-blog'
npm run build                       # 期望退出码 0
Start-Process 'cmd.exe' -ArgumentList @('/c','"D:\deep seek workplace\endfield-blog\node_modules\.bin\astro.cmd" preview --port 4321 --host 127.0.0.1') -WorkingDirectory 'D:\deep seek workplace\endfield-blog' -WindowStyle Hidden

# 2) 起调试浏览器（先杀旧的；--user-data-dir 不能带空格）
Get-Process msedge -ErrorAction SilentlyContinue | Stop-Process -Force
$ud = Join-Path $env:TEMP ("cwcdp-" + (Get-Date -Format 'HHmmss'))
Start-Process 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -ArgumentList @('--headless=new','--remote-debugging-port=9222','--remote-allow-origins=*',"--user-data-dir=$ud",'--no-first-run','--disable-extensions')

# 3) 串行跑全部脚本（当前基线见 §7.2）—— 一条命令搞定
node scripts/run-regress.mjs          # 期望「总结: 21/21 通过」
# （它内部按固定顺序串行 spawn 21 个脚本；不要自己并发跑，见 §7.1 第 6 条）
# 单独重跑某个脚本：node scripts/<名>.mjs http://127.0.0.1:4321 [light|dark]

# 4) 线上同一套（先确认推送成功、CF 构建完成；反向特征检查见 §7.5）
git ls-remote origin main
node scripts/poll-deploy.mjs --have '--w-max:\s*1300px' --not 'hero::before'   # 通了才继续
node scripts/smoke.mjs https://cloudwing.pages.dev                 # 期望 73/73（#424 已修复，见 §37）
node scripts/verify-videobg.mjs https://cloudwing.pages.dev dark   # 期望 23/23（§62 断言迁移 +1，见 §62.2）
node scripts/verify-copy.mjs https://cloudwing.pages.dev           # 期望 31/31（走 sitemap 枚举全站页面）

# 5) 可选：改过 hero / 容器宽度 / 背景层时，量一遍"容器边缘逐段偏差"
node scripts/diag-edges.mjs http://127.0.0.1:4321 /                # 看"容器边缘阶跃"与"容器级装饰层（无）"
$env:EXTRA_CSS='.hero::before{content:"";position:absolute;inset:0;background:radial-gradient(circle,#fff3,#0000)}'
node scripts/diag-edges.mjs http://127.0.0.1:4321 /                # 注入后偏差应明显变大（A/B 自检有效）
Remove-Item Env:\EXTRA_CSS
```

**两件必须手核、脚本管不到的**：
1. **文案是否过期（语义层面）** —— `verify-copy.mjs` 已能抓"出现了禁用词/占位词/锚点脱节"
   （§42），但**抓不了"这句话是否已经过时"**。仍需人工按 §7.4.2 的清单看
   `SITE.notice` / `SITE.tagline` / 各页 meta / README 首行。
   （历史教训：2026-09-17 那个"浅色通透"就是脚本全绿却带着上线的。）
2. **有没有留下没人引用的旧结构** —— `grep -r "<旧类名>" src/`。
   历年实测有过：`.hd`/`.hd-glass`、`navSub()`、`.title-gradient`、`nav-staggered.js`；
   **2026-09-19 实测清单**：`public/covers/`（12 个 SVG，随作品库下线后零引用）、
   `scripts/verify-deck.mjs`（验收对象已删）、`src/scripts/hero-anim.js`、
   `DriftWallBackground.astro`、`HomeShapeGrid.jsx`、`TextType.astro`、`Ticker.astro`
   ——（前两项本轮已删，其余为**待定**：见 §42 的"死代码候选"）。这些脚本都抓不到。

**第三件（2026-09-18 四轮补）**：**新写的断言要证明"它在缺陷态下会红"**（§7.6 第 3 条）。
本文件里已经有过"断言恒真、连过两轮"的事故；只看到绿灯不算验证过。

---

## 42. ★清死资产 + 文案自动化断言 + 文档纠偏（2026-09-19 下午）★

**本轮的需求**：① 修正交接文档里的口径偏差；② 给文案加自动化断言（堵住 §32 那类
"脚本全绿却带着错文案上线"）；③ 清理死资产（`public/covers/` 的 12 个 SVG +
`scripts/verify-deck.mjs`）。**约束：不得改动页面观感。**

### 42.1 删除的两个死资产（附"为什么它确实是死的"的证据）

| 删除项 | 体量 | 判据 |
|---|---|---|
| `public/covers/*.svg`（12 个） | 33.2 KB | `src/` 全树**零引用**；`dist/` 52 个产物文件里引用 `covers` 的 **0 个**。作品库 2026-09-19 下线（§40）后它们就没有任何消费方了（`content/works`、`WorkCard`、`WorkLayout` 都已删） |
| `scripts/verify-deck.mjs` | — | 它的验收对象是首页作品卡片堆 CardSwap，而该组件早在 §25 就从首页删掉了 |

**为什么"零引用"可以先于删除确认**：这两个判据都是**构建产物级**的（不是"看代码像没用"）——
删除后 `dist` 里对应的 12 个文件不再生成，而 52 个产物文件中引用数为 0，
所以**不可能改变任何页面的渲染**。

### 42.2 `scripts/verify-copy.mjs`（新增，31 条断言，已接入批跑）

- **动机**（§32 的真实事故）：站点早已是"只有一套暗色"，`site.ts` 的 notice/tagline 却写着
  「**浅色通透**」，还带上了线、并在线上首页与关于页可见 —— 当时 14 个脚本全绿，
  因为它们只验颜色/尺寸/几何，**不验文案内容**。
- **四组断言**：
  1. **[A] 禁用词**（14 个）：`浅色通透` / `双主题` / `主题切换` / `主题开关` / `明暗切换` /
     `浅色模式` / `亮色模式` / `白天模式` / `夜间模式` / `开灯` / `关灯` / `亮色主题` / `浅色主题` …
     ——「描述本站 UI 是浅色 / 有双主题可切换」的措辞，实现上**早已不存在**（§24/§27）。
  2. **[B] 占位词**（9 个）：`TODO` / `FIXME` / `待补` / `待填` / `待写` / `占位符` /
     `lorem ipsum` / `示例文本` / `XXX`。
  3. **[C] 文案锚点**：`site.ts` 的 `tagline` / `notice` 非空、不含禁用词；
     **`notice` 必须真的出现在关于页的可见文案里**、`tagline` 必须出现在 meta description 里
     —— 防"改了一处、漏了另一处"以及"文案与页面脱节"。
  4. **[D] 每页都要有非空 `<title>` 与 description**。
- **★最关键的一条口径：只扫"页面固定文案 + meta"，不扫文章正文★**。
  原因：历史文章正文里**合法地**会出现"浅色主题"（2026-09-15 大改版那篇）、
  "作品库"（2026-09-19 站改博客那篇）—— 那是内容记录，不是缺陷。
  实测把「浅色」写成禁用词会让健康态直接红（1 页正文命中）。
  所以禁用词表**只收"从无合法用途"的短语**，并去掉 `<script>/<style>/<svg>/注释` 后再匹配。
- **不需要无头浏览器**：默认读本地已构建的 `dist/**/*.html`（19 页全量，含每篇文章）；
  给一个 URL 则走 `sitemap-index.xml` → 子 sitemap 枚举全站页面再逐页抓取
  （线上跑法：`node scripts/verify-copy.mjs https://cloudwing.pages.dev`）。
  这是全套脚本里唯一不依赖 9222 的一个。
- **有效性自检（§7.6 第 3 条，必做）**：把 §32 的真实缺陷注回 `dist` 两个页面
  （关于页文案写成「浅色通透」且与 `site.ts` 脱节、另一页把该词写进 meta），重跑 →
  **29/31 变红**（命中 `/about/(可见)`、`/posts/(meta)`，以及"notice 未出现在关于页"）；
  还原后回到 **31/31**。**证明它不是恒真断言。**
- **顺带发现的既有问题（未改，等你决定）**：除首页外，**其余 17 页的 meta description
  全是同一句 `tagline`**（包括每篇文章详情页也是），属于重复描述、与页面内容不匹配。
  要修的话是给各页/各文传独立 description —— **本轮按"不动页面"的要求没有动**。

### 42.3 文档纠偏（8 处 + 顺带 4 处）

| # | 位置 | 原来的问题 | 现在 |
|---|---|---|---|
| 1 | §3 目录树 | 仍列 `WorkCard.astro`／「页脚」、`src/pages/` 的「作品库/作品详情」、`src/content/{works,…}`、Header 注释仍写「动效暂停」 | 全部按实际改写（内容集合 = posts/shots/changelog；页面 = 首页/文章/归档/画廊/关于/互动/404/rss；并标注死代码） |
| 2 | §0 第 21 行 | 「最近一次 **45/45**」与同节「期望 **48/48**」自相矛盾 | 改为 `run-regress.mjs` → **16/16**，并注明单入口 smoke 为 48/48 |
| 3 | §7.2 基线表 | hero 写 86、nav-shrink 写 42、diag-errors 写「6 页」、videobg-global 写 25、mobile-shots 写 15、home 写 23 | 逐项按实测改正：**88 / 40 / 7 页 / 29 / 18 / 24**，并补 `verify-copy` 行（31/31） |
| 4 | §6.21 | 仍把 `verify-deck.mjs` 当初用脚本推荐 | 标注**已删除**（验收对象早就不存在） |
| 5 | §7.4.2 | `SITE.notice` 的落点写「页脚 + 关于页」 | 页脚已删 → 只剩关于页；并注明该清单已部分自动化 |
| 6 | §9.1 / §10 | 仍提「手机端外链只能从页脚到达」「分类入口在 `/works/` 加 chip」 | 改为：页脚已删 → 手机端**没有任何**外链入口；作品库已下线 → 无处加 chip |
| 7 | §10 | 「作品封面 SVG 偏亮」「作品详情页 summary」「2026-09-18 changelog 未写」等已不成立的遗留项 | 逐条标注**已作废 / 已解决 / 部分已补**（09-18 的 changelog 存在，但缺容器宽度/柔光删除/#424 三项） |
| 8 | §14 自检清单 | 只列 11 个脚本、mobile-shots 写 15/15 | 改为 `node scripts/run-regress.mjs`（16 个），并补第 4 步的线上 `verify-copy` |
| + | §10 三条尺寸类遗留项 | 「Hero 右侧留白 159px」「字号只能 48px」「卡片 440」 | 已被 §36.1/§36.2 取代 → 改为 **700/96/400、字号 52px、无右侧留白** |
| + | §2 环境表 | 缺两项本机实测的硬约束 | 新增「**不要在 bash 里做删除**」与「bash 里 npm 不可用 + node 是 22.22.2」两条 |
| + | §0 | 缺本轮摘要 | 新增 **§0.4** 与本 §42 |
| + | §0 首句 | 仍称"个人**作品**档案站" | 改为"个人博客与档案站"（与 §40 的方向一致） |

### 42.4 怎么证明"页面观感零变化"（本轮的方法，可复用）

本轮只删了死文件和加了断言，改的是文档 —— 但"应该没变"不算证据，所以做了两件事：

1. **改动前后逐值快照对比**（照 §36.1 的"逐值比对"方法）：
   在 **3 个视口 × 6 个页面 = 18 组** 上采集了「全部可视图元的矩形（1 位小数）+ 22 个设计令牌
   + 每页标题/描述/主题 + 元素计数 + 可见文本长度与哈希」，
   改动前后逐值 diff → **应完全一致**（写这份文档时用 `_shots/_flow-snapshot.mjs` 现场抓，
   属临时工具，不入库）。
2. **全套回归 16/16**：几何/对比度/视频/导航/搜索等 15 个原有脚本的断言条数一条没少
   （smoke 48、hero 88、home 24、nav-shrink 40、nav 14、brand 10、theme 11、redesign 16、
   search 17、videobg 22、videobg-global 29、contrast 0、mobile-shots 18、diag-errors 0、diag-424 0），
   新增的 `verify-copy` 31/31。

### 42.5 本轮留下的"死代码候选"（**未删，等你决定**）

以下都是实测**零引用**，但它们要么是 React Bits 官方原码（照 §5 铁律三不宜动），
要么可能是"留着备用"的视觉件，所以没有一并删除：

| 候选 | 性质 |
|---|---|
| `src/scripts/hero-anim.js` | 首页 Hero 改静态版式后 `index.astro` 已不再加载它（§33 有注释说明），文件留在盘上 |
| `src/components/DriftWallBackground.astro` | 零引用 |
| `src/components/HomeShapeGrid.jsx` | 同上 |
| `src/components/TextType.astro` / `Ticker.astro` | 零引用 |
| `src/components/ReactBits/` 里未被宿主使用的原码 | `CardSwap` / `CardNav` / `DomeGallery` / `ShapeGrid` / `GridScan` / `GradientWaves` / `AccordionGallery` / `ProfileCard` / `StrokeText` / `Dither` —— 属"官方组件库"，删了以后想用要重新拉，建议保留 |

> 另注：`scripts/` 里还有一批**按需使用**的工具（`border-check` / `card-separation` /
> `imgstats` / `imgpix` / `shots-theme` / `shot-*` / `sweep-light` / `verify-countup` /
> `verify-music` / `seed-changelog`），它们不在批跑清单里，但**不是死代码**（是手工诊断工具），
> 删之前先确认没有文档引用它们。

---

## 43. ★删除 `CODEX.md` + 纠正"删除类改动是否上线"的确认手法（2026-09-19 下午）★

**本轮的需求**：删除仓库根的 `CODEX.md`。

### 43.1 删除 `CODEX.md`（仓库根）

- **做了什么**：删掉 `endfield-blog/CODEX.md`。它原本是"仓库内简版硬规则"，与 `docs/HANDOFF.md`
  职责重叠，且内容已整体偏旧（§32 起它的口径就要靠 HANDOFF 兜底）。**内容不丢**：
  `git show e21d3e0:CODEX.md` 可取回原文。
- **同步清理的引用**（不清理就会留下指不到文件的指针）：
  - `README.md`：删掉"简版硬规则见 `CODEX.md`"那一行，改成一句说明。
  - 本文件开头"相关文档"一行：去掉 `CODEX.md`。
  - 本文件 §42.5 表格里 `DriftWallBackground.astro` 行的"（CODEX 里也标为死代码）"。
  - `scripts/poll-deploy.mjs` 头注释："见 CODEX「构建 / 部署坑」第 6 条 / HANDOFF §7.5"
    → 只留 HANDOFF；顺带修掉同一段里已失效的 `/works/`（该页 §40 已下线）。
- **刻意不动的历史提及**（它们是"当时发生过什么"的记录，不是活的指针；改掉反而是篡改历史）：
  `src/content/posts/2026-09-08-log.md`、`src/content/changelog/2026-09-08.md`、
  `scripts/seed-changelog.mjs` 的 2026-09-08 条目，以及本文件 §32 / §41 等处的叙述。
- **影响面**：`CODEX.md` 位于仓库根，既不在 `src/` 也不在 `public/`，构建产物里从来没有它 ——
  删除**不可能改变任何页面**（沿用 §42 的"页面零变化"约束）。

### 43.2 【重要】"删除类改动是否上线"被边缘缓存骗过一次 —— 判据纠正

§42 删掉 `public/covers/*.svg` 之后，用 `HEAD /covers/w001.svg` 轮询了约 **10 分钟始终是 200**，
一度判断为"CF 没有触发构建"。**这个判断是错的 —— 新部署其实已经上线。**

**根因**：这些路径命中了 **Cloudflare 边缘缓存**，返回的是**旧部署时期的陈旧副本**：

| 请求 | 状态 | `cf-cache-status` | `age` |
|---|---|---|---|
| `HEAD /covers/w001.svg` | 200 | HIT | 1192s |
| `HEAD /covers/w001-lib.svg` | 200 | HIT | 81141s |
| `HEAD /covers/w004-mobile.svg` | 200 | HIT | **133854s（≈37 小时）** |

缓存条目在被淘汰之前，会持续以 200 供给**源站已经删掉**的资源。更要命的是
`fetch(..., { cache: 'no-store' })` **完全挡不住它** —— 那只是本进程的缓存开关，与 CF 边缘缓存无关。
（`scripts/poll-deploy.mjs` 原来的 `probe()` 踩的是同一个坑。）

**正确判据 —— 加随机 query 强制回源**（query 改变缓存键，绕过边缘缓存）：

| 请求 | 原样 | 加随机 query |
|---|---|---|
| `/covers/w001.svg` | 200（缓存副本） | **404** ← 源站确实已删 |
| `/favicon.svg` | 200 | 200 ← 对照组：证明"带 query 不会误伤存在的资源" |
| `/index.html` | 200 | 200 |
| `/robots.txt` | 200 | 200 |

**结论（判据本身也必须带对照组）**：确认"删除类改动是否上线"，只看**加随机 query 回源**的结果；
`cf-cache-status: HIT` + 大 `age` 就是"这个 200 不是源站给的"的直接证据。
`scripts/poll-deploy.mjs` 已按此加固：页面请求自动带 cache-buster。

> 归类：与 §7.6 铁律二（扫描覆盖边界）同族 —— **你以为在问源站，其实在问缓存**。
> 本文件 §6.8 / §7.5 里"靠轮询某路径变 404 来确认删除上线"的写法，自本轮起按本节修正。

---

## 44. ★新增「网站导航」子页面 `/nav/`（毛玻璃卡片网格）（2026-09-19 下午）★

**本轮的需求**：参考 <https://blog.tsh520.cn/projects/> 加一个"网站导航"子页面；
材质**沿用全站毛玻璃**；**子页内部的网站先占位**，等站长补齐。

> 📌 **后续**：当日下午站长就给了站点清单，条目已全部填入（6 组 21 个站点）——
> 见 **§46**。本节描述的是页面骨架与机制，仍然有效。

### 44.1 页面与数据

- **路由**：`src/pages/nav/index.astro`，用 `SidebarLayout`（与 `/gallery/` 等一致的三栏壳）。
- **数据**：全部来自 `src/site.ts` 新增导出的 `SITE_NAV` —— **页面零硬编码**，
  加站点只改这一个数组（符合 §0 的"改这里即可全站生效"约定）。
  分组初始为 4 组 × 3 个空位；**2026-09-19 下午已按清单改成 6 组 21 个实条目（§46）**。
- **占位怎么表达**：条目的 `href` 以 `#` 开头 = 该位还空着 → 渲染成**不可点击**的虚线卡
  （带"空位"角标、去投影）。这样"骨架态"既不会把假地址带上线，也不会让访客点到死链；
  把 `href` 换成真实地址后**同一个条目自动变成可点的玻璃卡**（多出 ↗ 与域名行）。
- **分组删空即整组不渲染**，不会剩一个孤零零的标题。
- **状态行由数据现算**（"已收录 N 个站点，另有 M 个空位"），**不写死文案** ——
  避免"填满了页面还写着空位"这类漂移（正是 `verify-copy.mjs` 想堵的缺陷类）。

### 44.2 材质与观感（为什么不新调一套色）

- 卡片直接复用全站令牌：`--glass` / `--glass-blur` / `--line-2` / `--r-l` / `--shadow-sm` /
  `--shadow-lg` / `--accent`。因此**强调色 5 套预设、hover 描边、暗色兜底全部自动跟随**，
  新页面不需要单独适配。
- ⚠️ 玻璃元素上 `-webkit-backdrop-filter` 必须写在标准属性**之前**（标准属性在前时整条会被压缩丢掉，§22）。
  但注意 §22 的 **2026-09-18 修订**：当前构建链还会把 `-webkit-` 前缀本身剥掉，
  产物里**只剩无前缀那条**。所以线上看到的 `.nvc` 卡片是 `backdrop-filter:var(--glass-blur)` 单条 ——
  这是**全站既有状况**（首页 scoped 卡片同样 `pre=0`），不是新页面引入的差异，别当成回归去"修"。
  可验证判据：产物中 `-webkit-backdrop-filter` 计数为 0 属正常，只要令牌与消费点齐备即可。
- 图标**不用第三方 favicon 服务**（本站刻意不依赖外部请求，见 `site.ts` 的 `IMG_CDN` 注释），
  默认按站名首字现算圆牌；要真实图标就填 `item.icon` 指向站内图片。
- 窄屏用 `minmax(min(17rem, 100%), 1fr)`，内容列再窄也只退成一列、**不会横向溢出**。

### 44.3 入口（三处都通）

| 位置 | 改法 |
|---|---|
| 顶部胶囊 + 移动端抽屉 | `site.ts` 的 `NAV` 插入 `{ href: '/nav/', label: '导航', no: '04' }`，其后项 `no` 顺延（关于 05 / 互动 06） |
| 左栏导航树「站点」组 | `components/SidebarNav.astro` 的 `SITES` 加 `{ href: '/nav/', label: '网站导航' }` |

### 44.4 断言同步（新增页面**必须**同步的三件事）

1. **`verify-nav-shrink.mjs`**：抽屉一级导航链接数 **6 → 7**（NAV 多一项）。
   这条是硬编码数字，**加任何导航项都必须改**，否则整轮假红。
2. **扫描覆盖边界**（§7.6 铁律二）：把 `/nav/` 加进各脚本的页面枚举 ——
   `smoke`(SHELL_PAGES) / `diag-errors` / `contrast-audit` / `verify-videobg-global` /
   `mobile-shots` / `verify-home`(SEO 循环)。**不覆盖 = 新页面等于没验**。
3. **基线数字**随覆盖扩大而变（见 §7.2 表）。

> ⚠️ 新页面的**固定文案会被 `verify-copy.mjs` 扫**（禁用词 14 个 + 占位词 9 个，含
> `待补`/`待填`/`占位符`/`TODO`）。所以"占位"这件事**不能**用那些词来表达 ——
> 本站改用「空位」；状态行也做成由数据现算，从根上避免出现"待补"字样。
> 另注：该脚本还会扫 **`site.ts` 全文源码**，所以连注释里也不能写 `TODO`/`占位符`。

### 44.5 踩坑：只跑 `astro build` 会清掉 pagefind 索引

Astro 构建会**清空 `dist/`**，所以单独跑 `astro build` 之后 `dist/pagefind/` 直接消失，
`verify-search.mjs` 会全红（§0 第 51 行早有同义提醒，本轮**又**发生了一次 ——
发现时索引已没了，赶在 verify-search 跑到之前补跑才没翻车）。

**规矩**：手工重建一律等价于 `npm run build`（= `astro build && pagefind --site dist`）。
本机 bash 里 npm 不可用，用绝对路径等价命令：

```bash
node ./node_modules/astro/bin/astro.mjs build \
 && node ./node_modules/pagefind/lib/runner/bin.cjs --site dist
```

### 44.6 验证结果（2026-09-19 实测）

- `astro build` **exit 0**，**19 → 20 页**（新增 `/nav/index.html`），无 collection 缺失告警。
- `node scripts/run-regress.mjs` → **16/16 全绿**。受影响脚本的**新旧基线**：

| 脚本 | 旧 | 新 | 为什么变 |
|---|---|---|---|
| `smoke.mjs` | 48 | **53** | SHELL_PAGES 多了 `/nav/`，每页 +5 条 |
| `verify-home.mjs` | 24 | **25** | SEO 循环多了 `/nav/` |
| `verify-videobg-global.mjs` | 29 | **33** | 逐页枚举多了 `/nav/` |
| `mobile-shots.mjs` | 18 | **21** | 三机型 × 6 → 7 页 |
| `diag-errors.mjs` | 7 页 | **8 页** | 逐页枚举多了 `/nav/` |
| `verify-nav-shrink.mjs` | 40 | **40**（条数不变，断言值 6 → 7） | 抽屉一级链接数改为 7 |
| `contrast-audit.mjs` | 0 处 | **0 处**（覆盖 6 → 7 页） | — |
| `verify-copy.mjs` | 31 | **31**（页面变多，条数不变） | — |

- **`/nav/` 自身实测**（CDP 量取，脚本 `_shots/_nav-shot.mjs`）：
  卡片玻璃 `blur(20px) saturate(1.2)`、圆角 `24px`、空位卡 `border-style: dashed`；
  桌面 1440 下 **2 列**（卡宽 355px）、4 个分组、12 张卡 / 12 个空位、横向溢出 **0**；
  三机型手机端（375/390/414）溢出均 **0**（该页页高 1679）。
  （**分组数与条数已被 §46 取代**：现为 6 个分组 21 个条目、无空位；
  几何与材质结论不变，桌面仍是 2 列。）
- 观感截图：`_shots/nav-desktop-top.png` / `nav-desktop-scroll.png` / `nav-mobile.png`。

> 注意：桌面只有 2 列是**壳层决定**的 —— 三栏布局里内容列约 700px，
> `minmax(min(17rem,100%),1fr)` 自然算出 2 列。想要更密就调小 `17rem`，
> 但卡内会开始挤（图标 38 + 文字 + 角标）。

### 44.7 待办（本轮**没做**，等站长）

1. ~~**把空位填上**~~ → ✅ **已完成**，2026-09-19 下午按站长清单填入 6 组 21 个站点，见 §46。
2. ~~空位卡对访客可见~~ → 已不存在：条目全部填实后页面无空位卡（`is-slot` 分支保留为兜底）。

---

## 45. `/nav/` 线上终检（2026-09-19）

`/nav/` 推送后 **56 秒**上线（CF 构建）。线上终检脚本 `_shots/_nav-live-check.mjs`
（全部请求带 cache-buster，见 §43.2）**27/27 全绿**，日志 `_shots/_nav-live.log`。

### 45.1 确认到的线上事实

> 📌 下表是**当时（空位态）**的实测。当日下午条目已填实（21 张实卡、0 空位），
> 其中"4 个分组 / 12 空位 / 空位卡形态"三行**已被 §46 取代**；其余结论仍成立。

| 项 | 线上实测 |
|---|---|
| `/nav/` | 200，`<title>网站导航 — CloudWing</title>`，meta description 已写 |
| 内容 | 4 个分组标题齐全；空位角标 **12** 个 |
| 空位卡形态 | `<div class="nvc is-slot">`，**无 `href`**（不可点击，符合设计） |
| CSS 挂载 | 页面 CSS `index.BPaR1s8n.css` + `Base.pylxBBrF.css` 两份 |
| 玻璃令牌 | `Base.css` 里 `--glass-blur:blur(20px) saturate(1.2)`、`--r-l:24px`、`--glass` |
| 卡片规则 | `.nvc[data-astro-cid-…]` 消费 `var(--glass)` / `var(--glass-blur)` / `var(--r-l)`，hover 抬 `var(--shadow-lg)` |
| 入口 | 首页顶栏有 `/nav/`（标签「导航」）；`/posts/`、`/blog/`、`/gallery/` 侧栏「站点」组有「网站导航」 |
| 旧页面 | `/about/`、`/account/`、`/posts/`、`/blog/`、`/gallery/` 全 200 |
| 对照 | `/covers/w001.svg` 仍 **404**（上一轮删除类特征未被缓存打回） |

### 45.2 三个写错的断言（教训：先确认产物真实形态，再写断言）

本轮终检第一版 **8 项 FAIL**，逐条查证后**全是断言自身写错**，站点无缺陷。

| 写错的断言 | 真相 | 教训 |
|---|---|---|
| 空位卡应有 `href="#slot-*"` | 渲染成 `<div class="nvc is-slot">`，**根本没有 href** | "占位"未必靠 href 表达；`#` 锚点也可以直接不生成 `<a>` |
| 页面 CSS 应含字面量 `blur(20px) saturate(1.2)` | 卡片走 `var(--glass-blur)`，字面量只在 `Base.css` 的令牌定义处 | **令牌值别在消费点找**；要找就去定义处找，消费点只断言 `var(--…)` |
| 页面 CSS 应含 `-webkit-backdrop-filter` | 构建链会剥掉前缀（§22 修订），全站 scoped 卡片都 `pre=0` | 断言要贴**构建后的实际产物**，不能贴源码写法 |
| `/works/`、`/interact/` 应 200 | 这两个路由**不存在**（历史命名），站点实际只有 `/`、`/about/`、`/account/`、`/blog/`、`/gallery/`、`/nav/`、`/posts/**` | 探活路径要**从 `dist` 实际产物列一遍**，别凭记忆写 |

### 45.3 沉淀

- 可复用判据已固化进 §44.2（`pre=0` 属正常，不是回归）。
- "写线上断言前先抓一份产物快照" 这一步，与 §43.2 的 cache-buster 是同一类要求：
  **先确认你测的到底是哪个东西，再判断它好不好。**

---

## 46. 网站导航条目填实：6 组 21 个站点（2026-09-19 下午）

本站长给了站点清单（`D:\Download\网址.txt`，21 条），逐站访问核对后写入 `/nav/`。

### 46.1 数据与分组

- 全部落进 `src/site.ts` 的 `SITE_NAV`，**页面零改动逻辑**（`nav/index.astro` 一行渲染代码都没动）。
- **数组顺序 = 页面顺序**，游戏相关按要求**置底**：

| # | 分组 | 条数 | 内容 |
|---|---|---|---|
| 1 | AI 与云服务 | 4 | DeepSeek 对话 / Kimi 开放平台 / APINebula / Cloudflare Pages |
| 2 | 开发与工具 | 2 | React Bits / GitHub Proxy |
| 3 | 学习与刷题 | 2 | 力扣 LeetCode / 柏码 |
| 4 | 设计与素材 | 2 | 找字体网 ZFONT / 模之屋 PlayBox |
| 5 | 效率与阅读 | 2 | 打字鸭 / 星辰云博客 |
| 6 | **游戏与游戏开发** | 9 | Godot / MC Wiki / MC 百科 / CurseForge / MinecraftShader / NameMC / 地形师茶馆 / 方块小镇 Yuushya / Mooncell(FGO) |

- 状态行**自动跟着数据变** —— 从"骨架已就位…"变成 **「已收录 21 个站点」**
  （`live=21`、`empty=0`，`另有 N 个空位`那半句不再输出）。这正是 §44.1 把它写成"现算"的收益：
  **填数据不需要改文案**。
- `is-slot` 分支（`href` 以 `#` 开头 → 虚线不可点卡）**保留为兜底**，本轮已无条目走这条分支。

### 46.2 三处内容层面的连带调整（都不是排版改动）

1. `nav/index.astro` 的 `META_DESC` 与页头 `txt` —— 原话是"条目陆续往里填"，填实之后**就是文案漂移**，
   改成按分组实况描述。**这类"描述页面状态的句子"最容易在状态变化后忘记改**（§32 同族）。
2. `SITE_NAV` 顶部注释 —— 从"骨架数据，等站长补齐"改为"条目已填实 + 怎么加"。
3. `README.md` 两处：现状速览的「网站导航」行、以及"内容怎么加"里的对应段。

### 46.3 两条安全 / 正确性处理（顺手做掉）

- ⚠️ **删掉了 Cloudflare 条目里的账户 ID**。原链接是
  `dash.cloudflare.com/<32 位 hash>/pages/view/cloudwing`，**那串 hash 是账号凭据的一部分**，
  放进公开导航页等于把它发布出去。已改成 `https://dash.cloudflare.com/`，
  并在 `site.ts` 该行上方留了注释说明"要直达项目就自己存书签"。
- **`platform.moonshot.cn` 换成规范域名 `platform.kimi.com`**：前者现在 302 到后者，
  收录 302 源地址会让访客多一跳，将来还可能失效。

### 46.4 验证

- `astro build` **exit 0**，**20 页**；随后补跑 pagefind（§44.5 的坑）。
- `dist/nav/index.html` 实测：**21 张实卡 / 0 空位 / 6 个分组**，分组顺序与上表一致，
  状态行 `已收录 21 个站点`。
- `verify-copy` **31/31**（20 页）—— `SITE_NAV` 注释与页面文案都没带入禁用词/占位词。
- `run-regress` **15/16**（唯一失败项 `verify-videobg` 经复跑证实为**时序假失败**，见 §46.5）。
  各项基线与既有记录**完全一致，无需改基线**：
  `smoke 53/53`、`verify-home 25/25`、`verify-nav-shrink 40/40`、`verify-videobg-global 33/33`、
  `mobile-shots 21/21`、`contrast-audit 0 处不达标`。
- `assert 覆盖`：本次没有新增页面、也没动导航项，所以**不需要扩充任何脚本的页面枚举**（§7.6 铁律二）——
  但**如果将来在某个分组里加了新页面级的入口，仍要按铁律二补枚举**。

### 46.5 ⚠️ `verify-videobg` 的间歇性假失败（首次记录）
- **现象**：全量回归里报 `hero .hero-subtitle 在视频背景上可读` 失败（21/22）；
  **单独复跑立刻 22/22 通过**，而且余量很大（实测对比 **8.46**，阈值 4.5）。
- **根因**：该脚本把背景视频 `pause()` 后 seek 到固定时间点（`FRAME_TIMES = [1.5, 12, 24]`）再截图取像素。
  连续跑 16 个脚本时机器负载高，**seek 未在 900ms 内落定**，截到的是另一帧画面；
  而不同帧在字幕区的亮度不同 —— 于是"最差底色"偶然变亮，对比度掉到阈值下。
- **判读方法（重要）**：这类失败**先单独复跑一次**。通过且余量大 → 时序假失败，**不要当回归去改代码**；
  真缺陷会稳定复现，且余量贴着阈值。
- **性质**：与 §7.6 铁律三是同一族 —— 断言**依赖了非确定性输入**（视频帧）。
  写这类断言要么把帧固定死并**显式确认已落定**，要么允许有限重试。

### 46.6 线上终检（推送后）

- 提交 `460f20c`，经 `push-via-tunnel.mjs` 推送（`c3a0c94..460f20c`）。
- **CF 构建 43 秒完成**。终检脚本 `_shots/_nav-live2.mjs`（全请求带 cache-buster，§43.2）
  **23/23 全绿**，日志 `_shots/_nav-live2-run.log`。关键几项：

| 检查 | 线上实测 |
|---|---|
| `/nav/` | 200，**实卡 21 张 / 空位 0 张** |
| 状态行 | 「已收录 21 个站点」 |
| 分组 | 6 组，顺序 `AI 与云服务 → 开发与工具 → 学习与刷题 → 设计与素材 → 效率与阅读 → 游戏与游戏开发`，**游戏组确实在最后** |
| 链接抽查 | DeepSeek / React Bits / LeetCode / ZFONT / 打字鸭 / Godot / Mooncell 全部在位 |
| 卡片行为 | 21 张全为 `target="_blank"` + `rel="noreferrer"` |
| 🔒 安全 | **页面不含 Cloudflare 账户 ID** |
| 入口 / 旧页面 | 首页顶栏「导航」在；`/posts/`、`/blog/`、`/gallery/`、`/about/`、`/account/` 全 200 |
| 对照 | `/covers/w001.svg` 仍 404 |

- **几何与材质复量**（`_shots/_nav-shot.mjs`，本地 4321）：
  桌面 1440 **2 列**（卡宽 355 / 卡高 98）、玻璃 `rgba(12,16,20,0.42)` + `blur(20px) saturate(1.2)`、
  圆角 `24px`、6 组 21 卡 0 空位、横向溢出 **0**；
  手机 390 溢出 **0**。页面高：桌面 1679 → **2392**、手机 → **3226**（卡片从 12 增到 21，属预期）。
- 截图：`_shots/nav-desktop-top.png` / `nav-desktop-scroll.png` / `nav-mobile.png`（已按填实后重拍）。

---

## 47. ★测试策略（分层）：不要每改一个子页面就跑全量回归★（2026-09-19 站长要求）

**本节优先级高于本文件里所有"改动后跑全量回归"的历史表述** —— 之前几轮（§41–§46）
每次改动都跑了 16 个脚本的批跑，那是**过度的**，自本节起按下面的分层执行。

### 47.1 三层

| 层 | 触发时机 | 跑什么 |
|---|---|---|
| **L1 单页 / 单组件** | 每完成一个子页面或组件 | lint、typecheck、该组件单测、**该页面冒烟 e2e** |
| **L2 功能模块** | 每完成一个功能模块 | **相关模块回归 + 关键路径 e2e** |
| **L3 全量回归** | **仅** PR 前 / 合并前 / 发布前 / 站长明确要求 | 完整套件（`run-regress.mjs`） |

### 47.2 六条硬约束

1. **全量回归优先交给 CI** —— 本地只读**失败摘要**，不要在本机反复跑全量。
2. **输出只贴：失败用例、错误摘要、`文件:行号`。不贴完整日志。**
3. 改动涉及 **路由 / 全局状态 / 鉴权 / 依赖升级 / 构建配置** → **先提醒站长**，
   由他决定是否扩大测试范围；**不要自行升级到全量回归**。
4. 判断"假失败 vs 真回归"先单独复跑一次（通过且余量大 = 时序假失败，§46.5）。
5. 下层测试缺失时（本项目目前就是），**如实报缺口**，别拿"跑一遍全量回归"顶替。
6. §7.6 的三条硬要求（写新断言时）**仍然独立生效** —— 分层是"跑多少"，§7.6 是"怎么写"。

### 47.3 ⚠️ 本项目工具链的实际缺口（截至 2026-09-19）

**L1 要求的四项里，只有"页面冒烟 e2e"是现成的**，其余三项**根本不存在**：

| L1 要求 | 本项目现状 |
|---|---|
| lint | ❌ **没有** —— 无 eslint / prettier / biome 配置 |
| typecheck | ❌ **没有** —— 有 `tsconfig.json`，但 `@astrojs/check` 与 `typescript` **都没装**，`package.json` 里也没有 `check` 脚本 |
| 组件单测 | ❌ **没有** —— 无 vitest / playwright 等单测框架 |
| 页面冒烟 e2e | ⚠️ **只有 `smoke.mjs`**，但它覆盖的是**全站壳层 6 个子页面**（溢出/异常/侧栏/软导航/手机端），粒度比"该页面冒烟"粗 |

**这意味着**：在不补工具链的前提下，L1 实际只能退化成"`smoke.mjs` + 该模块的脚本"，
而 `smoke.mjs` 本身已经是准全量的壳层检查。**要真正落地 L1，需要先补 lint / typecheck / 单测。**

其余相关现状：
- **没有 CI**（无 `.github/workflows`）。线上部署是 Cloudflare Pages 自动构建，
  **只 build、不跑任何测试** —— 所以 §47.2 第 1 条目前**无处可交**。
- 现有 18 个验证脚本里，多数**依赖本机 Edge + CDP 9222 + 已起的 4321 预览**，且必须**串行**（§7.1 第 6 条），
  **不适合直接搬进 CI**。例外是纯 Node 的 `verify-copy.mjs` 与 `verify-nav-icons.mjs`（只读
  源码 / `dist/`），**这两个能上 CI**。
- `package.json` 只有 `dev` / `build` / `build:fast` / `og` / `preview` 五个脚本，
  没有 `lint` / `test` / `check` 入口。

> **给下一任接手者**：想按 §47 做，第一步是**先补 L1 的下层**（lint + typecheck + 单测）
> 与**一条 CI**，而不是继续用全量回归兜底。补的顺序建议：
> ① `@astrojs/check` + typescript（typecheck，几乎零改造）；
> ② prettier 或 biome（lint/format）；
> ③ GitHub Actions 跑 `build` + `verify-copy`（这两个在 CI 里能跑），
>    浏览器类脚本先留在本地按 L2 手动跑。
> ⚠️ 以上都属于**构建配置改动**，按 §47.2 第 3 条**要先问站长**。

---

## 48. `/nav/` 卡片图标改为各站真实图标（2026-09-19 站长要求）

**需求**：把网站导航每张卡左侧的「首字圆牌」换成**该网站自己的图标**。

### 48.1 实现方式（自托管，不发外部请求）

沿用 §46 已立的设计约束 —— **不依赖任何第三方 favicon 服务**（避免第三方挂掉 / 被墙 / 泄露访客 IP）：

| 环节 | 做法 |
|---|---|
| 图标存放 | `public/nav/<slug>.png\|svg`（构建时原样拷进 `dist/nav/`，由 Cloudflare Pages 自带 CDN 服务） |
| 数据绑定 | `src/site.ts` 的 `SITE_NAV` 条目加可选字段 `icon: '/nav/xxx.png'`；页面**零硬编码** |
| 渲染 | `nav/index.astro` 用 `<span class="nvc-ico" style="--ico:url(...)">` 把路径塞进 CSS 变量 |
| 兜底 | 图标走 **CSS `::before` 背景图**（`background-image: var(--ico, none)`），**不是 `<img>`** |

**为什么用背景图而不是 `<img>`**：背景图**加载失败时什么都不画** —— 底下的首字圆牌自然露出，
不会像 `<img>` 那样留一个破图标记，因此**不需要 `onerror` 之类的 JS 兜底**。
尺寸用 `content-box` + `contain`，非正方形的 logo（横排字标）也不会被拉伸。
→ 于是"没填 `icon`"和"填了但文件挂了"收敛成**同一种降级行为**，只有一条代码路径。

### 48.2 抓取结果：19/21 成功，2 个取不到

图标由一次性脚本抓取（`_shots/_fetch-icons*.mjs`，含**手工 DIB→RGBA 解码器**，
因为 `sharp`/libvips **不支持 ICO 与 BMP 输入**，而多数站点只给 `/favicon.ico`）。

**两个失败的站点**（症状与根因如下；**后续已按站长意见改用通用 logo，解决方式见 §48.7**）：

| 站点 | 症状 | 根因 |
|---|---|---|
| `github.akams.cn`（GitHub Proxy） | `CERT_HAS_EXPIRED` | **该站 TLS 证书确已过期** —— Node 与浏览器两侧一致报错，`http` 路径返回 404，备用路径同样证书失败。**取该站自身的图标无解** |
| `www.curseforge.com`（CurseForge） | `HTTP 403` | Cloudflare **机器人防护**：非浏览器请求一律 403；用 CDP 真实浏览器等 12s 仍未过 JS 挑战（页面标题停在"请稍候…"） |

另有 `zh.minecraft.wiki` / `zh-cn.namemc.com` 同样被 Cloudflare 挡（403），
**改走 CDP 真实浏览器在页面上下文里 fetch** 才拿到 → 它们**成功了**。

### 48.3 ★来源核验：发现并修掉一个"取错图"★（重要教训）

图标抓完后做了一次**来源审计**（把每张图与站点自己声明的 `<link rel="icon">` 对比），
结果：

- **4 个 SVG 与站点声明逐字节一致**（`deepseek` / `daziya` / `apinebula` / `godot`）。
- `minecraftshader` / `reactbits` / `fgo` 与声明**同一 logo**（我们的是更高分辨率版本）。
- ⚠️ **`yuushya.png` 是错的** —— 抓到的是一张**黑咖啡杯**，而该站声明的是
  `images/icon.png`（官方吉祥物）。黑杯在深色卡上**几乎不可见**（亮度 L=25.9，区间 15–30）。
  → 已替换为其官方 240×240 资源 `images/yuushya_icon.png`（该站无白色版 logo）。

> **教训**：favicon 抓取**不能只看"抓到了"**，必须回头核对"抓到的是不是这个站的"。
> 本次是靠**亮度量化 + 深浅底对照截图**才暴露的（黑 logo 在深卡上等于没画）。
> 抓取脚本以后要落一条：**对每个站声明的 `<link rel="icon">` 做一次比对**。

### 48.4 验证（严格按 §47 分层，**未跑全量回归**）

本次改动 = **模板 + CSS + 静态资源**，属"子页面/组件"级；**不涉及**路由 / 全局状态 / 鉴权 / 依赖 / 构建配置，
故按 §47 第 1 条只跑该页相关项：

| 检查 | 结果 |
|---|---|
| `astro build` | ✅ 20 页，exit 0（产物自动清理，临时对照页已消失） |
| `smoke.mjs`（本地 4321 + CDP 9222） | ✅ **53/53**，无 JS 异常 |
| `verify-copy.mjs`（只读 `dist/`） | ✅ **31/31** |
| 图标**真实加载**（CDP 逐张 `new Image()`） | ✅ **19/19 载入成功，0 破图**；2 张首字圆牌（预期内） |
| 亮度/对比量化 + 深浅底对照截图 | ✅ 唯一告警 `yuushya` 已修（见 §48.3） |

**未做**：全量回归（§47.2 第 1/3 条）；lint / typecheck / 单测（§47.3 已记：本项目**没有**这三样）。
本轮**未触碰**路由、全局状态、鉴权、依赖、构建配置 → **无 §47.2 第 3 条触发项**。

### 48.5 交付物

- `src/site.ts` — `SITE_NAV` 21 条中 **19 条**加 `icon` 字段；两条失败的**写在注释里说明原因**。
- `src/pages/nav/index.astro` — `.nvc-ico` 改 CSS 变量传图 + `::before` 背景图兜底（替换原 `.nvc-ico img` 规则）。
- `public/nav/` — **19 个**自托管图标（5 SVG + 14 PNG），文件名 = `SITE_NAV` 的 slug，一一对应。

### 48.6 ★修复：真实图标与首字圆牌重叠★（站长 2026-09-19 指出）

**症状**：卡片上"两个图标叠在一起"——真实图标有透明区域时，底下那个首字会透出来。

**根因**：原实现把首字当"背景图加载失败的兜底"，让它**与图标同时渲染**。
但 **CSS 无法感知 `background-image` 是否真的加载成功** —— 兜底永远生效，于是变成叠加。

**修法**：两者改为**互斥**，纯静态判断，不需要任何 JS：

```astro
<span class="nvc-ico" style={it.icon ? `--ico:url("${it.icon}")` : undefined}>
  {!it.icon && mono(it.name)}   {/* ← 原为 {mono(it.name)}：无条件渲染 */}
</span>
```

**代价与新失效面**：填了 `icon` 但**路径写错 / 文件没提交** → 图标区会**空着**
（以前会露出首字兜底）。为把这件事挡在上线前，新增了
**`scripts/verify-nav-icons.mjs`**（纯 Node、只读源码 + 文件系统 + `dist/`，**能上 CI**，与 `verify-copy.mjs` 同类），
断言四件事：

| 组 | 断言 |
|---|---|
| A | `SITE_NAV` 里每个 `icon` 路径在 `public/` 下**真实存在**，且形如 `/nav/<slug>.png\|svg` |
| B | `public/nav/` **没有孤儿文件**（防早期按完整 host 命名的旧副本残留） |
| C | 已构建时：每个 icon 都被拷进 `dist/nav/`；`/nav/` 页引用的集合与声明**完全一致** |
| D | 已构建时：带 `--ico` 的图标位**内无任何文本**（即首字确实没再渲染 → 不会重叠）；未带 icon 的条目仍保留首字 |

**验证**：`verify-nav-icons` ✅ **8/8**；`smoke` ✅ **53/53**；`verify-copy` ✅ **31/31**；
CDP 逐张 `new Image()` ✅ 19/19 载入、0 破图；末组放大截图确认**无首字透出**。
仍**未跑全量回归**（§47）。

> **环境提示（供接手者）**：本机 9222 上的无头 Edge 会**僵死**——CID 端口仍在听，
> 但页面导航一律落到 `chrome-error://chromewebdata/`（连外网也是 `about:blank`）。
> 判据：先看 `/json/version` 是否回**真实 Browser 版本**，再随便开一页看是否 `chrome-error`。
> 处理：`taskkill /PID <9222 的 LISTENING pid> /T /F` 后按 `smoke.mjs` 头部注释重启；
> ⚠️ **必须用会话后台任务方式启动**（普通 `subprocess.Popen` 启的子进程会随父进程被回收）。
> 重启前先用 `Get-CimInstance Win32_Process` 看一眼命令行，确认是
> `--headless=new --user-data-dir=…\Temp\cwcdp*`（**别误杀用户自己的 Edge**）。

### 48.7 ★补完：两个取不到图标的站改用「通用 logo」★（2026-09-19 站长裁决）

§48.2 的两个失败站点（**取的是"该站自己的图标"，确实取不到**）不再退回**首字圆牌**，
按站长意见改用**通用 logo**，使 21 张卡视觉统一：

| 站点 | 采用 | 说明 |
|---|---|---|
| GitHub Proxy | **GitHub 官方 mark**（`/nav/github.svg`，白 `#ffffff`） | 该站本身是 GitHub 加速镜像，用 GitHub 标记语义正确。simple-icons（CC0）矢量；**默认色 `#181717` 近黑，在暗色卡上等于没画 → 必须取白色版** |
| CurseForge | **CurseForge 官方 mark**（`/nav/curseforge.svg`，品牌橙 `#F16436`） | simple-icons（CC0）矢量，保留品牌色 |

结果：**21/21 带 `icon`，0 个首字圆牌**（`verify-nav-icons` 报"首字圆牌 0 个"）。
`src/site.ts` 里原先"取不到 → 不填 icon"的注释已改写为"取不到 → 改用通用 logo"并注明来源与配色理由。

**新增断言 [E]：SVG 图标的暗底可读性下限**（这是 §48.3 那个近黑咖啡杯教训的自动化）

`verify-nav-icons.mjs` 新增 [E] 组：SVG 里**所有硬编码 `fill` 中最亮的那个**，
相对亮度必须 **≥ 0.12**。理由 —— 图标位底色是深色，"近黑 fill"等于没画。

| 图标 | 最亮 fill 亮度 | 结论 |
|---|---|---|
| `curseforge.svg` | 0.2808 | ✅ |
| `github.svg`（白） | 1.0 | ✅ |
| `apinebula` / `deepseek` / `daziya` / `godot`（既有） | 1.0 / 0.1925 / 0.7202 / 1.0 | ✅ 均在阈值之上 |
| 反例：`github.svg` 若用 simple-icons **默认近黑** `#181717` | **0.0087** | ❌ 会红 |

> ★**按 §7.6 第 3 条验证过"缺陷态会红"**★：临时把 `github.svg` 的 `#ffffff` 改成 `#181717` →
> `verify-nav-icons` 退出码 1、[E] 报 `❌ …（最亮 0.0087）`；还原后回到 0。判据不是恒真。
> ⚠️ **已知盲区**：[E] 只查 `.svg`。PNG 需要解码像素才能算亮度（§48 抓取脚本里那个**一次性 DIB 解码器**
> 没搬进来），故 PNG 的暗底可读性仍依赖换图时的**深浅底对照截图**。

**验证**：`verify-nav-icons` **9/9**；CDP 逐张 `new Image()` ✅ **21/21 载入、0 破图**；
放大截图确认两张新卡（GitHub 白标 / CurseForge 橙标）在暗色卡上清晰、与其余 19 张风格一致。

---

## 49. 全站交互策略：禁拖选 / 点击不出轮廓 / 键盘轮廓保留（2026-09-19 站长要求）

**需求（站长原话 + 追问澄清）**：
> 「网页的文字不可通过鼠标拖选；点击按钮时避免鼠标点击后出现蓝色轮廓；同时保留键盘可访问性。」

追问时站长明确**不限定某个具体元素**（"圆形按钮"只是举例）→ 按**全站通用策略**实现，不做逐元素特判。

### 49.1 三条要求 → 三层实现（互不冲突）

| # | 要求 | 实现 | 文件 |
|---|---|---|---|
| A | 文字不可鼠标拖选 | `body { user-select: none }`（含 `-webkit-` 前缀）；**表单/可编辑区显式放行** `user-select: text` | `src/styles/global.css` |
| B | 点击不出轮廓 | `:focus:not(:focus-visible) { outline: none }` + **JS 兜底** `[data-pointer-focus]:focus { outline: none !important }` | `global.css` + `src/scripts/ui.js` |
| C | 键盘可访问性不丢 | 全站原有 `:focus-visible { outline: 2px solid var(--accent) }` **原样保留**，不做任何削弱 | `global.css`（未改） |

配套细节：
- `img { -webkit-user-drag: none }` —— 图片默认是 HTML5 可拖拽的，按住一拖会浮出半透明"幽灵图"并**连带把邻近文字选中**，等于绕过 A。
- `-webkit-tap-highlight-color: transparent` —— 去掉触摸端点按的默认高亮块（Chrome Android 淡蓝 / iOS 灰块）。

### 49.2 ★为什么光靠 CSS 不够：必须加 JS 兜底★

站长说的"蓝色轮廓"实测就是本站 `:focus-visible` 的强调色（`#9fd3e8`，实测 `outline: solid 2px rgb(159,211,232)`）。

规范上 `:focus-visible` **只在键盘操作时命中**，Chromium 桌面实测确实如此
（点击 → `focusVisible=false`；Tab → `focusVisible=true`）。
**但 Safari 与 Android Chrome 会把「点击 / 触摸」也判成 `:focus-visible`** —— 纯 CSS 兜不住。

故在 `ui.js` 加 `focusModality()`，按"**最后一次输入方式**"给焦点元素打标：

| 事件 | 动作 |
|---|---|
| `pointerdown` / `touchstart` | `fromKeyboard = false` |
| `keydown` | `fromKeyboard = true` |
| `focusin` | `fromKeyboard \|\| needsSteadyRing(el)` → **撤**标；否则 **打** `data-pointer-focus` |
| `focusout` | 清标（软导航会换 DOM，别让复用节点带着上次的来源） |

> ⚠️ **`needsSteadyRing()` 是 a11y 底线**：`input[text]` / `textarea` / `select` / `contenteditable`
> **永远不打标** —— 光标的落点必须看得见，否则"在哪儿打字"就没法判断。
> 少了这条，"去掉轮廓"就会顺手把可用性一起削掉（这正是最容易被"看起来改了"糊弄过去的地方）。

### 49.3 ★代价与例外：文章正文仍可复制（站长已裁决）★

`user-select: none` 是**整站**生效的，一刀切的后果是：

- **文章正文、代码块无法用鼠标选中复制**；
- 且 `user-select: none` 下 **`Ctrl/Cmd+A` 也选不中**该区域 → **键盘复制路径同样失效**（不只是鼠标）。

> **站长裁决（2026-09-19 追问后）：放行正文与代码块。** 判断依据 ——
> 本站是**博客**，正文与代码可复制属核心用途；而"防拖选"真正要挡的是
> **误选 UI 文字**（导航 / 卡片 / 按钮标签），两者不该混为一谈。
> UI 文字仍然不可拖选，只有正文容器例外。

实现（`global.css`，紧跟表单放行规则之后）：

```css
.pp-md, .pp-md pre, .pp-md code { -webkit-user-select: text; user-select: text; }
```

`.pp-md` = 文章详情页的 Markdown 渲染容器（见 `pages/posts/[slug].astro`）。
子元素一并列出：`user-select` 本会被继承，显式声明是为了将来某层覆盖后不至于失效。

**这条例外有断言保护**：`verify-interaction.mjs` 的 **[F] 组** ——
在真实文章页上拖过 `.pp-md p`，**必须选中**（实测 15 字）。谁把 `.pp-md` 那条规则删了，F 就红。

### 49.4 验证（按 §47 分层，**未跑全量回归**）

本次改动 = **全局 CSS + 全局脚本**。虽不涉及路由 / 鉴权 / 依赖 / 构建配置，
但 `user-select` 与 `:focus-visible` 属**全站视觉与交互基线**，可能影响每一页的可操作性，
故**单独新增了一个断言脚本**（`scripts/verify-interaction.mjs`）。

> ★**本轮跑了全量**★ —— 与 §48 不同。依据 §47.2：**"发布前"是跑全量的触发条件之一**，
> 而本次改动**随即推送 `main` → 触发 Cloudflare 自动构建上线**（即等同于发布）。
> 故按 §47 第 3 条跑了 `run-regress.mjs` 全量，并**顺带把新增的两个脚本接进批跑队列**
> （`verify-nav-icons` + `verify-interaction` → 脚本数 **16 → 18**）。

| 检查 | 结果 |
|---|---|
| `astro build` + `pagefind` | ✅ 20 页，索引 1355 词 |
| **`verify-interaction.mjs`（新增）** | ✅ **11/11** |
| `smoke.mjs` | ✅ **53/53**，无 JS 异常 |
| `verify-copy.mjs` | ✅ **31/31** |
| `verify-nav-icons.mjs`（§48 产物，顺带回归） | ✅ **8/8** |
| `verify-search.mjs` | ✅ **17/17** |
| **`run-regress.mjs` 全量（18 个脚本串行，7m53s）** | ✅ **18/18 通过** |

**§49.3 的例外与 §48.7 的通用 logo 落地后，又跑了一次全量**（同样因为要推送 = 发布）：
`verify-interaction` **12/12**（新增 F）、`verify-nav-icons` **9/9**（新增 E）、
`smoke` **53/53**、`verify-copy` **31/31**、`verify-nav` **14/14**、
**`run-regress.mjs` 全量（18 个脚本串行，8m04s）→ ✅ 18/18 通过**。

**推送后线上确认（按 §7.5 / §43.2：不能用 chunk 哈希，必须用内容特征穿透边缘缓存）**：

```bash
node scripts/poll-deploy.mjs --have 'data-pointer-focus' \
     --have 'tap-highlight-color' --have 'user-select:none' --timeout 600
# ✅ 线上已是本次构建（前两轮 1s / 17s 仍报"未通过 3 项" —— 判据在旧构建下会红，
#    34s 那轮翻绿，即真实的构建切换，不是恒真断言）
node scripts/verify-interaction.mjs https://cloudwing.pages.dev
# ✅ 11/11 —— 线上端到端复现同一组结论（不是只看 CSS 字符串在不在）
```

> 两轮 poll 的"未通过 → 通过"过渡，本身就是 §7.6 第 3 条要的**对照组**：
> 若判据恒真，第一轮就该绿。

**§48.7 / §49.3 落地后再次上线确认**（同样用内容特征，`--page /nav/`）：

```bash
node scripts/poll-deploy.mjs --page /nav/ --have 'curseforge.svg' --have 'github.svg' --timeout 600
# ✅ 线上已是本次构建（前 4 轮 2s/18s/34s/51s 均报"未通过 2 项"，68s 翻绿 —— 又是真实的构建切换）
node scripts/verify-interaction.mjs https://cloudwing.pages.dev
# ✅ 12/12 —— 含 [F] 文章正文例外；线上端到端复现同一组结论
```

**`verify-interaction.mjs` 的六组断言（关键：带对照组）**：

| 组 | 断言 | 实测 |
|---|---|---|
| A | 鼠标拖过正文**选不中** | 选中 **0** 字 |
| A′ | **对照组**：临时注入 `*{user-select:text}` 后同样拖拽**必须能选中** | 选中 **13** 字 ✅ |
| B | 点击 `.pf-avatar` / `a.nvc` / `.nvc-ico` 后**无轮廓** | `outline=none` |
| C | Tab 聚焦 4 个元素**必须有可见轮廓**，且**不带** `data-pointer-focus` | 4 个 `a.nvc:2px`，标记 0 个 |
| D | 指针点击**文本输入框**后**仍有**轮廓 | `outline=solid 2px` |
| E | `body` = `none` / `input` = `text` | 一致 |
| **F** | 在**真实文章页**拖过 `.pp-md p` **必须选中**（§49.3 刻意保留的例外） | 选中 **15** 字 |

> ★**为什么要 A′ 对照组**★：只测"没选中文字"是**假绿风险最高**的一类断言 ——
> 拖拽本身没生效（坐标错、元素被遮、事件没派发）时，"没选中"同样成立。
> 对照组把"拖拽有效"这件事独立证出来，A 才有意义。
> （同理，A 组刻意选了**不在 `<a>` 里**的段落：Chrome 在链接上拖拽会走**原生链接拖放**
> 而不是选文字，两种情况下都选不中，会掩盖真实结论。）

**未做**：lint / typecheck / 单测（§47.3：本项目**没有**这三样，故 §47.2 第 1 条的下层仍缺）。

> ⚠️ **构建口径坑（本轮又踩了一次）**：`npm run build` = **`astro build && pagefind --site dist`**。
> 只跑 `astro build`（= `build:fast`）**不会生成 pagefind 索引**，`verify-search` 会**全红**
> （本轮首轮验证就发生在"缺索引的 dist"上，虽侥幸只有 search 相关项未覆盖，但属**假绿风险**）。
> 本机 bash 跑不了 `npm`（§7.1），补跑索引直接用：
> `node node_modules/pagefind/lib/runner/bin.cjs --site dist`。

### 49.5 交付物

- `src/styles/global.css` — 新增交互策略块（A/B 两条 + 拖图 + tap-highlight），并写明**代价与放行写法**。
- `src/scripts/ui.js` — 新增 `focusModality()`（输入方式追踪 + `needsSteadyRing` 白名单），注册进 `boot()`。
- `scripts/verify-interaction.mjs` — **新增**，纯 CDP 断言（A/A′/B/C/D/E 五组），已纳入 L1。
- `scripts/run-regress.mjs` — 批跑队列加入 `verify-nav-icons` 与 `verify-interaction`（**16 → 18**）；
  队列注释写明"纯 Node 的两个排最前"的理由。


---

## §50 「日志」子页面 `/log/`（2026-09-19 晚）

> 站长一句话需求：**「增加网站日志子页面」**。
> 定位：`/blog/` 的归档时间线是**压缩版**（一天一行）；`/log/` 是**完整展开版**——
> 每一天的每一条更新（类型徽标 + 标题 + note 全文）逐条平铺，标题写明"要压缩成一行的时间线，去「归档」"。

### 50.1 数据源与实现

- **数据源就是 changelog 集合**（`src/content/changelog/*.md`，一天一文件，`content.config.ts` glob loader），
  `/log/` **零硬编码**——新加 changelog 文件页面自动长出，无需改页面。
- 页面 `src/pages/log/index.astro`，壳层 `SidebarLayout.astro`（三栏与全站一致）：
  - 数据流：`getCollection('changelog')` → 按 `date` 聚合成天 → 按年分组（新 → 旧）→ 逐条平铺；
  - 结构：`.lg-yy`（年份）→ `.lg-day`（玻璃日期卡）→ `.lg-items` → `.lg-item`（`.lg-kind` 徽标 + `.lg-title` + `.lg-note`）；
  - **「当天日志 →」链接**：当天有 `posts` 文章时给出跳转（优先主题文章、其次日志帖，口径与归档页一致）；
  - 材质：`.lg-day` 用 `var(--glass)` + `--glass-blur` + `--shadow-sm`，与全站卡片同一套玻璃令牌。
- **导航两处注册**：`site.ts` 的 `NAV`（顶栏，`no: '03'`，后续编号顺延 03 → 07）与
  `SidebarNav.astro` 的 `SITES`（左栏，`/blog/` 之后）。顶栏 + 左栏 + 当前页高亮三处都验（见 50.3 C 组）。
- 6 个既有脚本的页面清单同步加入 `/log/`：`smoke` / `diag-errors` / `contrast-audit` /
  `mobile-shots` / `verify-home` / `verify-videobg-global`。

### 50.2 本轮抓到并修掉的两个真缺陷

1. **`postByDay` 建了但没挂上**：`d.post` 从未赋值，「当天日志 →」链接永远不会渲染
   （数据核实：12 个 changelog 日期**全部**有对应文章，即 12 个链接全丢）。
   修法：聚合循环里 `?? { ..., post: postByDay.get(it.date) }`。修复后 `postLinks=12` ✅
   —— 这正是 verify-log B6 断言抓出来的：**断言先行真的能抓真 bug**。
2. **changelog 历史文案踩禁用词**：`/log/` 把 2026-09-15 的 note **全文**展开后，
   「主题开关 / 关灯 / 亮色主题 / 主题切换 / 浅色主题」全部暴露（`verify-copy` 从 31/31 掉到 28/31）。
   这些词在 `/blog/` 压缩时间线上不显示（只显 title？不——连 title 都有，但当时条目少未触发全量命中）。
   **修法（不动史实含义，只改措辞）**：9-15 文件里 5 处改写
   （亮色主题整体压暗 → 页面底色整体压暗；开关灯 → 切换明暗；主题开关 → 切换按钮；
   移除亮色主题 → 移除浅色界面；拉绳开关灯 → 拉绳切换明暗）。
   ⚠️ **教训：给 changelog 写 items 时，BANNED 词表（verify-copy.mjs 的 A 组）全文适用**——
   `/log/` 上线后 note 是页面可见文案，不再有"正文豁免"。

### 50.3 验收口径（`scripts/verify-log.mjs`，新第 19 号脚本）

- **A 壳层**：落在 `/log/`、加载 complete、标题「日志」。
- **B 数据结构**（刻意用**相对计数**，不写死天数/条数——加 changelog 不会误报）：
  年分组 ≥1 且新→旧、每日期卡非空、条目数 ≥ 天数、每条目有徽标+标题、
  note 与「当天日志 →」在、无「暂无日志」空态。
- **C 导航**：顶栏入口、左栏入口、当前页高亮标记。
- **D 材质布局**：`.lg-day` backdrop-filter 在、无横向溢出。
- **E 运行时**：0 JS 异常。附视口截图 `_shots/log-page.png`。

### 50.4 本轮验证结果

- `verify-log` **15/15**；`smoke` **53 → 58**、`verify-home` 25 → **26**、
  `verify-videobg-global` 33 → **37**（均为 `/log/` 加入后断言自然增多）、`verify-copy` **31/31**（改词后恢复）、
  `verify-search` 17/17、`contrast-audit` 0 处不达标、`mobile-shots` 21 → **24/24 无溢出**。
- 批跑队列加入 `verify-log`（**18 → 19**）。
- **发布前全量（19 脚本）**：首跑 18/19，唯一失败 `verify-nav-shrink` 的
  「抽屉含 7 个一级导航链接」——NAV 7 → 8 后**脚本里的硬编码没跟上**（页面行为正确，是断言过期）；
  修正为 8 并写明注释后 **40/40** → **全量口径 19/19 全绿**。
  ⚠️ 教训：**每次往 `NAV` 加项，`verify-nav-shrink` 的抽屉计数断言要同步 +1**。


---

## §52 壳层统一：页头格式 + 顶对齐（2026-09-20 凌晨）

> 站长四条要求：**「子页面标题格式统一；标题上方的小字格式统一；不要在标题下方描述简介；
> 中心内容部分（侧栏除外）顶部与侧栏顶部对齐，各子页面一致」**。

### 52.1 改了什么

- **kicker 统一为「`<b>英文</b> / 中文`」**（去掉五花八门的「· 后缀」）：
  归档 `ARCHIVE / 归档`、日志 `LOG / 日志`、画廊 `GALLERY / 画廊`（原 `02 / GALLERY 画廊`）、
  网站导航 `SITES / 网站导航`、关于 `PROFILE / 关于`；文章/互动/文章详情本来就是该格式，未动。
- **删两处标题下描述**：`/log/` 的「这个站每天做了什么…」（连带清掉未用的 firstDate/totalDays/totalItems），
  `/nav/` 的「按用途分组的常用站点…」（`.navm-stat` 统计行保留——它是数据不是简介）。
- **顶对齐**：改前实测三种偏差并存——`/posts /blog /log` 差 **38px**（各自 root 包装 `padding-top: 2.4rem`）、
  `/account` 差 **8px**（`.room-stage` 0.5rem）、其余 0。修法（shell.css 1200 断点一处管全部）：
  `.shell .page-head / .work-head / .posts-root / .archive-root / .log-root / .room-stage { padding-top: 0 }`
  （对齐由壳层统一负责，页面自身留白只服务非壳层场景）。改后 **7 页偏差全部 = 0**。

### 52.2 踩到的两个坑（都有探针实证）

1. **kicker 的 UA 默认 margin-top 塌陷**：`p` 在本项目没有 reset，`.kicker`（p 元素）带着
   UA 的 `margin-top: 1em`（≈12.5px）。壳层把 page-head 的 `padding-top` 收掉后，这个 margin
   **塌陷出标题块**把整个 `.wrap` 推下 12px —— 7 页偏差从三种值变成"统一的 12px"，反而更迷惑。
   修法：`.kicker` 显式 `margin: 0 0 1.6rem`（`.work-head .no-big` 同理补 `margin: 0`）。
   ⚠️ 教训：**给壳层做「padding-top: 0」这类收紧时，必须同时排查首子元素的 margin 塌陷**。
2. **verify-interaction 连锁失败 ×2**：
   - A 组对照文本用的就是 nav 页标题描述（`.page-head .txt`）——描述删了选择器落空。
     改用**右栏引文** `.sw-quote blockquote`（纯文本、够长、不在链接里；`.navm-stat` 太短选不出 range，弃）。
   - B 组「点导航卡片」稳定拿不到焦点：**`boxOf` 里 `scrollIntoView({block:'center'})` 撞上全局
     smooth 滚动**——删描述后卡片位置变化恰好触发滚动量，rect 在滚动进行中取值 → clickAt 打在
     漂移后的视口位置落空。修法：`scrollIntoView({ block:'center', behavior:'instant' })`。
     ⚠️ 教训：**几何断言脚本里凡 scrollIntoView 后取 rect，必须 `behavior:'instant'`**（§7.6 同族教训）。

### 52.3 验收与上线

- 新第 20 号脚本 `scripts/verify-shell.mjs`（**43/43**）：7 页 × （顶对齐≤1px / kicker 格式 /
  `<b>` 包英文 / 无描述 / h1 非空 / 无溢出）+ 全程无异常，纳入 `run-regress`（**19 → 20**）。
- 受影响回归：verify-interaction 12/12（两次复跑稳定）、smoke 58/58、copy 31/31、log 15/15、
  nav 21/21、nav-shrink 40/40。
- **发布前全量 20 脚本：20/20 全绿**（§47.2 发布前触发）。
- 对齐实况截图：`_shots/shell-aligned.png`（/blog/ 三栏，kicker 与左栏个人信息卡顶边同线）。


---

## §53 「记录」三页 + 档案页与其余子页面壳层统一（2026-09-20 凌晨第二轮）

> 站长需求：**「把记录页面下的三个子页面（文章/归档/日志）和档案页面（目前这四个页面不一样）
> 与其他子页面的壳层统一」**。

### 53.1 改前实测的差异（探针逐页量）

| 页 | 标题→内容间距 | 与众不同处 |
|---|---|---|
| /posts /blog /log | **32px**（页面内 `.page-head { margin-bottom: 2rem }`） | 各自的 root 包装层 |
| /about | **16.8px** + **h1 是作者名 CloudWing_X**（ProximityText） | 页头不是页面名 |
| /gallery /nav | 25.6 / 27.2px（section 自带 padding-top） | ——（当作基准） |
| /account | 19.2px（玻璃卡） | —— |

### 53.2 统一动作

- **标题→内容间距全站统一 1.6rem（25.6px）**：posts/blog/log 页内 `margin-bottom 2rem → 1.6rem`；
  nav `section padding-top 1.7rem → 1.6rem`；about/account 在 shell.css 补齐
  （`.shell .who { padding-top: 0.55rem }`、`.shell .room-card { margin-top: 0.4rem }`）。
- **档案页页头改「档案」**：kicker `PROFILE / 档案`、h1 = `ProximityText label="档案"`
  （**邻近特效保留**，只把作用的文字从作者名换成页面名）、浏览器标签 title 改「档案」。
  此前 h1 是 `SITE.author`——全站唯一一个"标题不是页面名"的子页面。
- 顶对齐（§52）不受影响，7 页偏差仍全 0。

### 53.3 期间又踩/又堵的坑

- **margin 塌陷二番战**：about 的间距 16.8px 真凶是 `.who` 首段 `p.txt` 的 **UA margin-top（1em=16.8px）
  塌出 section**。第一版用 `margin-top: 0.55rem` 补偿——**与塌陷值取 max 而完全无效**（断言抓出仍 16.8）；
  改成 `padding-top` **阻断塌陷**后 8.8+16.8=25.6 ✓。
  ⚠️ 规律（§52.2 坑① 的推广）：**UA 默认 margin（p/h 系）+ 无 padding/border 的父级 = 塌陷三连，
  补偿要用 padding 或显式 margin:0，不能对着塌陷值加 margin**。
- **verify-videobg 全量首跑 21/22**（hero 副标题可读性）：本轮没动首页，复跑两次 **22/22** ——
  视频帧内容随机的**时序假失败**，与 §46.5 同判据。全量有效口径 **20/20**。

### 53.4 验收与上线

- `verify-shell` 扩到 **50/50**（新增 7 页「标题→内容间距」断言；卡片/区块边界型量**盒间距**、
  about 平文型量**首文本顶**，分页口径表写在脚本里并注明原因）。
- **发布前全量 20 脚本：20/20**（videobg 假失败复跑口径，见 §53.3）。
- 档案页实况截图：`_shots/about-unified.png`。
- 调试环境注：本轮 CDP 无头浏览器（`cwcdp3` profile）出现"本地页面在 ~2500 字符处
  readyState 停滞"的实例级损坏  （外部站点正常）——**换回健康的 `cwcdp2` profile +
  `--disable-background-networking` 重启即恢复**。排查时先杀旧实例再换 profile，别急着改页面代码。


---

## §51 顶栏「记录」悬停下拉（2026-09-19 深夜）

> 站长一句话需求：**「把文章、归档、日志三个子页面归于导航栏"记录"按钮的二级菜单下，
> 当鼠标移动到记录按钮时，会浮现出二级菜单」**。
> 背景：§50 刚加了 `/log/`，顶栏一级项一度到 8 个；本轮把其中三个内容入口收拢成一个「记录 ▾」。

### 51.1 数据与结构

- **数据源仍是 `site.ts` 的 `NAV`（唯一）**：`NavItem` 类型新增可选 `children`；
  「记录」（href 仍指 `/posts/`，父项可点）带 3 个 child：文章 `/posts/`、归档 `/blog/`、日志 `/log/`。
  顶栏一级项 8 → 6（首页 / 记录 / 画廊 / 导航 / 关于 / 互动），`no` 顺延 00–05。
- **父项高亮口径**：路由落在自己**或任一 child**（`isActiveGroup`）——访问 /blog/ 或 /log/ 时亮的是「记录」。
- **桌面端（Header.astro）**：`li.has-sub > a`（带 ▾ caret，悬停旋转 180°）+ `ul.nav-sub[data-nav-sub]`；
  打开方式 `li:hover` **与** `li:focus-within`（键盘 Tab 进得去、Esc 外都能用，纯 CSS 零 JS）。
  材质与抽屉同源：`rgba(10,10,15,.92)` + `blur(20px) saturate(180%)` + 14px 圆角 + 描边投影。
- **hover 桥**：链接与面板之间留了 12px 视觉缝隙，`.nav-sub::before` 一块透明垫片
  （left/right 各超出 14px）防止鼠标穿过缝隙时菜单闪烁收回——悬停下拉最容易翻车的就是这里。
- **当前页样式分工**：一级链接的雾蓝下划线 `::after` 收窄到 `.nav-links > li > a`（下不得进下拉）；
  下拉里的当前页用**强调色文字**（不加横线）。
- **移动端抽屉**：「记录」渲染为分组——`.mm-group`（12px 字距组标题）+ 三个缩进链接 `.mm-sub`；
  一级链接 5 个 + 组内 3 个，`<a>` 总数仍是 8。
- **left 栏导航树（SidebarNav.astro）不动**：三页在左栏仍是平级独立入口（分栏入口与顶栏入口解耦）。

### 51.2 断言反转（verify-nav / verify-nav-shrink）

- `verify-nav.mjs` 旧断言「导航栏已无二级菜单（照参考）」**反转**为
  「恰好 1 个 `data-nav-sub`」，并**新增 7 条行为断言**：
  顶栏有「记录」、落 /blog/ 时父项 `aria-current`、**悬停浮出（CDP `Input.dispatchMouseEvent`）**、
  浮层在视口内顶栏下方、三项文字与 href 一一对应（`/posts/` `/blog/` `/log/`）、**移开收回**。
  旧断言「已无遗留的二级菜单开关（`[data-nav-caret]`）」保留——本轮没用这个属性，防止旧实现回流。
- `verify-nav.mjs`「导航项仍可点击」的选择器从 `/blog/`（已进下拉，隐藏态不可命中）改为一级的 `/gallery/`。
- `verify-nav-shrink.mjs` 抽屉断言改为「一级 5 + 组内 3 = 共 8 个 `<a>`」+「记录分组恰 1 组且无 ?tag=/?game= 链接」。
- 基线：`verify-nav` **14 → 21**、`verify-nav-shrink` 40（断言语义更新）。

### 51.3 验证与上线

- 单跑：`verify-nav` **21/21**、`verify-nav-shrink` **40/40**、smoke 58/58、copy 31/31、log 15/15、home 26/26。
- **发布前全量 19 脚本：19/19 全绿**（§47.2 发布前触发）。
- 悬停实况截图：`_shots/records-dropdown.png`（记录 ▾ + 玻璃下拉三项）。
- ⚠️ 教训（沿用 §50.4）：**改 NAV 结构（加项/收组）必须同步两处断言**——
  `verify-nav-shrink` 的抽屉计数与 `verify-nav` 的一级入口选择器，这轮是提前改好才没红。

## §54 顶栏「记录」点击不跳转，只开合二级菜单（2026-09-20 凌晨第三轮）

**站长要求**：点击「记录」按钮时，不要跳转任何页面，仅展开二级菜单。

- 实现（`src/scripts/nav-mobile.js` 新增 `initSubmenuToggle()`）：
  - 父项 `a`（`/posts/`）的 click 被拦截：`preventDefault` + `stopPropagation`，改为给 `li.has-sub` 加/去 `.open`；再点一次收起；点外部 / Esc 收起；`aria-expanded` 同步。
  - ⚠️ **关键坑：必须捕获阶段（`{capture:true}`）+ `stopPropagation`**——Astro ClientRouter 也在 document 上监听 click 接管同源链接，bubble 阶段先 `preventDefault` 拦不住它的 `pushState` 导航（探针实测 URL 照样变成 /posts/）。
  - 触屏没有 hover，这条拦截也是触屏端唯一可靠的展开途径。
- CSS（`Header.astro` scoped style）：`.has-sub.open` 与 hover 同款展开态（菜单浮出 + caret 旋转），二者叠加互不干扰；父项 `a` 标记补 `aria-expanded="false"` 初始值。
- 语义口径：父项 a 是**分组入口**而非页面链接，`/posts/` 只能经下拉里的「文章」到达。
- 验证：CDP 探针四步全过（点父项 URL 不变 + 菜单展开 + aria-expanded=true → 再点收起 → 点子项「归档」正常软导航到 /blog/）；
  `verify-nav-shrink` 40/40、`verify-interaction` 12/12、`verify-shell` 全过；**发布前全量 20/20**（§47.2）。
- 环境坑（复用记忆）：遗留 astro preview 占 4321 端口时 `--force` 不生效（报错文案误导），需先杀旧 node 进程；preview 必须用后台任务起，前台 `&` 会随命令结束被杀。

## §55 归档页「更新热力图」（2026-09-20 上午）

**站长要求**：给归档页内容上方、标题下方增加热力图，参考 `blog.tsh520.cn/archive/`（该站热力图是 JS 渲染，抓不到静态结构，按 GitHub contributions 惯例实现）。

- 位置与口径：`/blog/` 的 `.page-head` 之后、年份时间轴之前；强度 = **当日 changelog 条目数**（与时间轴同口径），0/1/2–3/4–7/8+ 五档，站点雾蓝 accent 色阶。
- 实现（`src/pages/blog/index.astro`，零客户端 JS）：
  - 构建期算好 43 周（首条更新所在周的周日 → 构建日），列 = 周（周日始）× 7 行；最后一周补 `null` 占位；
  - 月份标签 = 本周首日的月份与上周不同则标；tooltip 用原生 `title`（`YYYY-MM-DD：N 条更新`）；
  - 统计行「`YYYY.MM – YYYY.MM` 共 N 条更新 · 活跃 D 天」+ 右侧「少 □□□□□ 多」图例；
  - 容器 `.hm` 不设 margin-top（保住 verify-shell 对 `/blog/` 的 1.6rem 间距口径，实测 25.6px ✓），移动端 `.hm-scroll` 横向滚动。
- ⚠️ **连带修复：`--accent-rgb` 只在 `index.astro`（首页，hero-theme.js 补间用）定义过，
  其余页面 `rgba(var(--accent-rgb), a)` 全部静默失效变透明**——热力图首版整片网格不可见即此因
  （时间轴 `.tl-dot` 的光晕其实也一直没生效）。已在 `global.css :root` 补默认值 `159, 211, 232`
  （与 `--accent: #9fd3e8` 同源）；首页运行时仍由 hero-theme.js 写在 `documentElement` 内联样式上，优先级更高，互不影响。
- 视觉：空格底 `rgba(accent, 0.13)` + 1px 内描边（深底上可见），hover 放大 1.35；l4 满色带 4px 光晕。
- 验证：CDP 探针（43 列 / 306 格 / 295 格带 title / 月份标签 11 个 / 间距 26≈25.6 / 无溢出）；
  `verify-shell` 全过；发布前全量见下。
- 截图：`_shots/blog-heatmap.png`。
- 同日午间追加（站长要求「宽一点大一点」）：格子不再写死 10px——`.hm-week`/`.hm-month` 改
  `flex: 1 1 0` 均分内容列宽，格子 `aspect-ratio: 1/1` 等比拉伸（实测约 13px，整体宽约 590px）；
  图例小色块单独定回 10px 固定尺寸。verify-shell 复跑 2× 全过（/account/ 首跑 1.3px 为字体时序假失败）。

## §56 右栏「GitHub 热榜」卡（2026-09-20 下午）

**站长要求**：右侧栏站点统计卡片上方做 GitHub 热榜，每日/每周/每月/每年四个子选项（默认每日），每日榜每天 24 点自动刷新、周榜每周最后一天 24 点、月/年同理，点击跳转对应仓库。

- 位置与结构：`SidebarWidgets.astro` 的 `.shell-right` 首位（STATS 卡之前）；标题 GITHUB / 热榜 + 四 tab（每日/每周/每月/每年，`role=tablist/tab` + `aria-selected`）+ 条目列表（排名 / 全名 / ★star / 语言圆点 / 一行描述）+ 底注。交互在 `ui.js` 的 `githubTrending()`（照 weatherWidget 模式）。
- 数据源：**GitHub Search API**（`/search/repositories?q=created:>=桶起点 stars:>10&sort=stars`，官方接口、无需鉴权、CORS 可用）——「期间内新建仓库按 star 排序」，一个代码路径覆盖全部四个周期（GitHub 无官方 trending API，第三方源不稳定故不用）。
- **刷新语义的实现 = 时间桶缓存**（localStorage `__cwGhHot_v1`，按周期分键）：桶 ID = 日桶当天 / 周桶本周周一 / 月桶 `YYYY-MM` / 年桶 `YYYY`；桶滚动即旧缓存失效自动重拉——严格等价于「每日 24 点 / 周、月、年最后一天 24 点换新」。页面驻留时每分钟比对当前周期桶 ID，跨桶即时重拉（不用等切页）。
- 细节：语言色点映射 GitHub Linguist 色（24 种，未知灰点）；star ≥1000 显示 `1.2k`；加载骨架 shimmer 占位高 520px ≈ 8 条实高（防渲染后右栏整体下跳的 CLS）；限流/断网进 error 态带「重试」按钮。
- **新第 21 号脚本 `verify-ghhot.mjs`**（纳入 run-regress，20→21）：① 卡片位于 STATS 卡正上方；② 四 tab + 默认每日；③ 每日榜真实渲染 ≥5 条；④ 链接指向 github.com 仓库；⑤ 条目带 star；⑥ 切每周正常渲染；⑦ 日/周缓存桶 = 当天 / 本周一（自动换新的实现依据）。⚠️ 真实调用 api.github.com（搜索接口无鉴权限流 10 次/分），脚本只实拉日/周两周期，别在循环里跑。
- ⚠️ **连带修 verify-interaction A 组拖选对照组（§49）**：热榜卡把右栏引文卡推低后，/nav/ 这类短页上引文只在**滚到页底**时才进视口（scrollIntoView 在溢出裁剪祖先上会提前停），且热榜异步渲染期量坐标会拿到骨架期的滚动上限——对照组改为「等热榜 ready → scrollTo 页底（必须 `behavior:'instant'`，全局 smooth 滚动的坑再 +1）→ 量矩形（底部越界即报不可达）」。
- 验证：CDP 探针全过（位置 / 默认每日 / 8 条真实数据 / github.com 链接 / 切 tab / 缓存桶 / 切回秒出走缓存）；verify-ghhot 9/9；verify-interaction 复跑 2× 12/12；**发布前全量 21/21**（§47.2）。
- 截图：`_shots/ghhot.png`。

## §57 章节地图与交接导航（2026-09-20 傍晚，交接完善轮）

> **为什么编号是乱的**：本文件是"活文档"——§0–§14 是交接骨架（保持编号稳定，方便旧引用不失效），
> §15 起是**按时间追加的变更史**；中途几轮大修（§37–§41、§42–§49）是"插叙"，所以会出现
> §37 排在 §6 与 §7 之间、§52 排在 §51 之前这类顺序。**编号本身是稳定引用，别重排**；
> 要按时间看变更，从文件末尾往前读（§56 → §50 → §49 …）。

### 57.1 新接手者的推荐阅读路径（半天可完成）

| 顺序 | 读什么 | 目的 |
|---|---|---|
| 1 | §0 一句话现状 + §0.1–§0.4 轮次摘要 | 站点是什么、现在什么状态 |
| 2 | §1 五分钟上手 → 照做一遍 build + smoke（期望 **73/73**） | 把本地环境跑起来 |
| 3 | §2 环境硬约束 + §3 目录结构 | 本机的坑、每个目录谁负责 |
| 4 | §5 三条铁律 + §6 踩坑手册（先通读标题） | **不做错事**；细节等踩到再查 |
| 5 | §7 验证与调试（§7.1 调试环境三步、§7.2 脚本清单表、§7.6 断言三铁律） | 学会怎么验证自己的改动 |
| 6 | §8–§9 三栏壳层 / 主题令牌 + §47 测试分层 | 改 UI 与跑测试的规矩 |
| 7 | §10 遗留问题 + §13 下一步 + §14 交接自检清单（照抄跑一遍） | 接住没做完的事 |

### 57.2 主题 → 章节索引（按"你要改什么"查）

| 你要动的东西 | 先读 |
|---|---|
| 导航栏（形态 / 抽屉 / 记录下拉） | §33、§31、§51、§54；改 NAV 结构必同步 §51.3 两处断言 |
| 首页 Hero / 代码卡片 / 容器宽度 | §34、§36、§36.1、§36.2 |
| 子页面壳层（页头 / kicker / 间距 / 顶对齐） | §52、§53；新子页面必读 §44.4 三件事 |
| 新增子页面 | §44（骨架）+ §44.4（断言同步）+ §52/§53（壳层口径） |
| 内容（文章 / changelog / 画廊 / 导航站点） | §4 内容怎么加；§46（站点条目） |
| 强调色 / 主题令牌 | §9、§34（色卡预设）、§55（`--accent-rgb` 全局定义） |
| 交互策略（拖选 / 轮廓） | §49（+ §49.3 正文放行例外） |
| 右栏挂件（热榜 / 日历 / 天气 / 音乐） | §56、§8；`ui.js` 的 `githubTrending()` / `weatherWidget()` / `calPanel()` |
| 验证脚本（新写 / 排查假失败） | §7.2 清单表、§7.6 三铁律、§46.5（时序假失败判据）、§43.2（缓存判据） |
| 构建与部署 | §44.5（pagefind 索引坑）、§43.2（边缘缓存坑）、§7.5（poll-deploy） |
| 历史"为什么删了它" | §40（作品库下线）、§27（亮色主题删除）、§41（极简化）、§43（CODEX.md） |

### 57.3 交接完善轮（本节）做了什么

- **基线数字全量刷新**：头部 / §0 / §7.2 / §14 的脚本数（16→…→**21**）、全量基线（**21/21**）、
  smoke 基线（**58/58**，2026-09-20 实测）与 #424 已修复的口径统一。
- **§7.2 脚本表**补 `verify-ghhot.mjs` 行；**§10** 补两条新遗留（热榜数据口径 / 短页右栏可达性）；
  **§13** 划掉已完成项、补 2026-09-20 新候选（热榜数据源升级 / **验证套件上 CI——当前最大工程缺口**）。
- **补录 `src/content/changelog/2026-09-20.md`**（4 条：壳层统一 / 记录展开式入口 / 归档热力图 / GitHub 热榜）
  ——归档与日志页的数据源就是 changelog，当天改动必须当天补，漏了时间线就断档。
- 章节顺序**刻意不动**（编号是稳定引用）；以本节地图代替重排。

## §58 ★修复两处「软导航后交互失效」：热榜切 tab / 画廊大图（2026-09-20 深夜）★

**站长报的两个 bug**：① 切换子页面后，侧栏 GitHub 热榜的 tab 点了没反应；
② 切到别的子页面再切回画廊，点画廊卡片没有任何反应。
**同一类根因**：监听器/闭包抓死了**首次渲染时的 DOM 节点**，软导航把侧栏/正文整块换新后，
事件还在写已脱离文档的旧节点 —— 正是 §5 铁律一与 §6.20（SearchModal）的又一对实例。

### 58.1 复现（§7.6 规矩：先证明断言在缺陷态会红）

新写探针 `_shots/probe-softnav.mjs`（软导航 `/` → /posts/ → /blog/ → /account/ 后切 tab；
再 /gallery/ → /posts/ → /gallery/ 后点卡片）：**缺陷构建上 2/6** ——
- 热榜：点「每周」后 `dataset.ghhotPeriod` 仍是 `daily`、`aria-selected` 不动（写进了旧卡片）；
- 画廊：点卡片抛 **`InvalidStateError: showModal on HTMLDialogElement: not in a Document`**（§6.20 同款）。
⚠️ 探针踩坑两个：① 点「第一个匹配链接」会命中**悬停下拉里 0×0 的隐藏链接**，点了不导航 ——
必须按 `getBoundingClientRect().width > 0` 过滤；② bash 内联 node 的**替换串里写 `$1` 又被 bash 吞掉**
（§41 同款，第三次了）—— 长文本一律用 Edit 工具，不走 shell。

### 58.2 修法

| 缺陷 | 根因 | 修法 |
|---|---|---|
| 热榜 tab 失效 | `githubTrending()` 的 tab 委托监听由 `window.__cwGhHotWired` 保证只注册一次，但它闭包引用**当次调用**的 `card`/`load` —— 每页 `boot()` 重跑拿到的是新卡片，监听器还抓着首次的 | 把「当前这一次」的 `{ card, load }` 挂 **`window.__cwGhHotApi`**（每次进页刷新），监听器与驻留刷新定时器只做转发；`bucketOf`/`readStore` 是纯函数，留在首次闭包无害 |
| 画廊大图点不开 | `gallery/index.astro` 页面脚本在模块首次执行时缓存了 `dlg`/`gdImg` 等节点引用；软导航换新 dialog 后对死节点 `showModal()` 抛错 | 改成 §6.20 模式：点击监听一次性挂 **document 委托**（含 `[data-gal-close]`），**每次触发重新查当前节点**；dialog 自身事件（背板点击 / `close`）用 dataset 防重 + `astro:page-load` 重绑到当前 dialog |

### 58.3 回归断言（两处都进了批跑队列，防止再犯）

- `smoke.mjs` [3] 末尾新增画廊段（58 → **61**）：软导航一圈后进画廊 → 点卡片大图必须打开 → 关闭必须生效；
- `verify-ghhot.mjs` 新增 ⑤ 组（9 → **11**）：软导航换页后热榜卡片仍在当前文档、切回「每日」仍生效
  （选中态 + `period` + 列表 ≥5 条三重判定）。
- **探针判据已按 §7.6 验证**：同一探针缺陷构建 2/6 → 修复后 **6/6**。

### 58.4 验证与上线（2026-09-20 深夜已完成）

- 发布前全量 **21/21**（新基线：smoke 61/61、ghhot 11/11）；推送 `a367f46..1007ed2`
  （git 代理 33210 未运行，**绕过代理直连一次成功**：`git -c http.proxy= -c https.proxy= push`）。
- **线上确认（三层特征）**：① `poll-deploy --page /log/ --have '<changelog 新条目>'` ×2，
  54 秒「未通过 2 项 → 0 项」真实翻转；② **JS chunk**（poll-deploy 不查 JS）：
  首页 `Base…js` 含 `__cwGhHotApi` ✓、`/gallery/` HTML 内联脚本含 `__cwGalViewerWired` ✓；
  ③ 线上端到端：`verify-ghhot` **11/11**、`probe-softnav` **6/6**、
  硬加载 /gallery/ 点卡片开图 ✓、放慢节奏的完整软导航序列全绿 ✓。
- ⚠️ **`smoke.mjs` 打线上会间歇 3 处红（已取证，非回归）**：`/about/ 两栏等高 763/1006` +
  [3] 画廊段 2 条。复现实验：同一序列固定 3.5s sleep 线上稳定失败、**8s 全绿、本地全绿**——
  根因是 smoke 的**固定 sleep 节奏**撞上 /about/ 的重资源岛（吊牌 GLB ~2.4MB + three.js）
  在线上的加载时长：上一页还没装载完就点下一个链接 → 该次导航静默丢失（§7.1 第 1 条
  "轮询等待、不要固定 sleep" 正是这类问题；[1] 的等高断言同理，右栏 ghhot 卡异步渲染
  在线上要几秒，`sideSticky()` 未跑完就量了）。**待办**：把 smoke [3] 的固定 sleep 换成
  「等 pathname 变化 + 等页面装载完成」的轮询，[1] 的等高断言等 boot 完成再量
  ——属测试基建改动，动手前过一下 §7.6 并知会站长。复现/判别脚本：`_shots/_smoke-gal-debug.mjs`（3.5s 版）与 `_shots/_smoke-gal-slow.mjs`（8s 版）。

## 59. 画廊「文件夹视图」为默认（2026-09-20 傍晚）★

**站长需求**：画廊里的图按分类收归到文件夹，文件夹拟物风、贴合全站暗色玻璃风，
悬停有「文件夹张开」动效，点击文件夹进入对应图集。已确认口径：**按 `game` 字段分类 + 文件夹视图为默认**。
数据现状：40 张截图全是 `Minecraft` → 今天只有 1 个文件夹；未来新增其它游戏的截图，
frontmatter 按 `game` 分组的逻辑会**自动长出新文件夹，零页面改动**。

### 59.1 实现（`src/pages/gallery/index.astro` 单文件闭环）

- **数据**：frontmatter 新增 `folders` = 按 `game` 分组（按张数降序），每夹带
  `count` / `latest` / `thumbs`（最新 3 张缩略图，当文件夹口探出的「纸张」）。
- **视图互斥**：`#gal-folders-sec`（文件夹墙，默认）/ `#gal-album-sec`（原玻璃卡片网格 + 大图 dialog）。
  浏览器端按 `?game=` 有无切换 —— 复用既有 `applyGameFilter`（`astro:page-load` 重放），
  **零新增节点缓存**（§5 铁律无新风险面）；文件夹本体是 `<a href="/gallery/?game=X">`，
  软导航拦截、前进后退、「返回文件夹」全部天然可用。图集视图里仍按 `game` 过滤卡片。
- **拟物 CSS**：`folder-back`（玻璃底板）→ `folder-papers`（3 张缩略图错位叠放，`nth-child` 各自
  rotate/translate）→ `folder-front`（带舌片 `::before` 的盖，`transform-origin: bottom`，
  悬停 `rotateX(46deg)` 向后翻开 + accent 辉光，纸张上浮错位）→ `folder-info`（标签固定最上层，
  不随盖翻动，保证可读）。颜色全走 `--glass` / `--accent` / `--line-2` 令牌，
  `prefers-reduced-motion` 全量降级（悬停不翻开）。手机端两列、高度收紧。

### 59.2 顺手修的一个老 bug

`.gal-filter { display:inline-flex }` 一直压过 `[hidden]` 的 UA 样式 —— 分类筛选条
**在文件夹视图下其实从未隐藏过**（旧版首屏也能看到「分类 — 40 张」）。补
`.gal-filter[hidden]{display:none!important}`；截图对比见 `_shots/folder-idle.png`（修后无筛选条）。

### 59.3 回归断言与验证（§7.6）

- `smoke.mjs` [3] 画廊段 61 → **64**，新增三条：① 默认见文件夹墙、图集隐藏；
  ② 点文件夹 → URL 带 `?game=`、文件夹墙隐藏、图集显示且**有可见宽度 > 0 的卡片**；
  ③ 「返回文件夹」→ `/gallery/` 无查询串、回到文件夹墙。判据在缺陷态（无 §59 结构）必然红
  （`gal-folders-sec` 不存在），已满足"先证红再接受"。
- 本地全量 **64/64**；软导航一圈后仍无 JS 异常。视觉：`_shots/folder-idle.png`（静态）+
  `folder-hover.png`（悬停翻盖态，CDP `Input.dispatchMouseEvent` 移入后截图）。
- 交互零新增 JS 监听（翻盖是纯 CSS hover，进图集走 `<a>` 软导航），§58 类
  「闭包抓死旧节点」风险面不新增。

### 59.4 上线记录与 verify-ghhot「凌晨空窗」取证（2026-09-21 清晨）

- **发布前全量 20/21**：唯一 FAIL 是 `verify-ghhot`（4/11），**已取证为环境性伪失败、非回归**
  （§59 未触碰热榜代码）。根因：热榜查询是 `created:>=当天0点 stars:>10` —— 清晨跑批时
  「每日」桶还是**空集**（实测 `created:>=2026-09-21 stars:>10` → `total_count: 0`），
  卡片抛 `empty` 进错误态，7 条依赖数据的断言全红（`state=error, n=0`）。
  已排除限流（重置后复跑仍 4/11）与代理（api.github.com 直连 200；死代理 33210 只影响 git）。
  昨晚深夜 11/11 是因为桶里已攒了一整天数据。**判别脚本**：`_shots/check-ghapi.mjs`。
  ⚠️ **待办（需站长拍板）**：给每日桶加兜底（如空集时回退展示昨日/本周数据，或降低 stars 阈值），
  否则每天 0 点后到首仓破 10 星前热榜卡都是错误态。动手前过 §7.6。
- **推送**：`d217f2e..d552d18`（github.com:443 间歇不可达复发：首轮 5 连败且第 2 次误报
  「Everything up-to-date」，ls-remote 证伪后重试首轮即成功——**推送后必须以 ls-remote/
  内容特征确认，不能信 push 的模糊输出**）。
- **线上确认**：poll-deploy 49 秒翻转（/gallery/ HTML 含 `gal-folders-sec`、`folder-front`、
  「返回文件夹」三特征）；线上端到端 `probe-softnav` **6/6**、线上截图
  `_shots/folder-idle.png` / `folder-hover.png`（文件夹墙 + 悬停翻盖态）。

## 60. 构建指纹自愈：存量标签页跨部署自动刷新（2026-09-21 清晨）★

**站长报障**：「点击文件夹后没有进入图集」。排查结论：**新鲜会话下功能完全正常**——
桌面真实鼠标点击（`_shots/probe-folder-click.mjs`，CDP `Input.dispatchMouseEvent`）三条路径
（首点 / 返回后再点 / 软导航往返后点）、移动端触屏仿真（`probe-folder-click-mobile.mjs`）、
线上截图（`shot-album.mjs`：点后图集卡片 `opacity:1` 全部可见）全绿；
smoke §59 三断言也一直绿。**根因是 §5 铁律的跨部署变体**：部署前就开着的标签页，
ClientRouter 软导航换进来的是新 DOM（所以文件夹墙看得见），内存里的 JS 却还是旧构建的
——旧 `applyGameFilter` 没有视图切换逻辑 → URL 变成 `?game=...` 但界面不切。
所有跨部署的存量访客都会中招，此前只能靠用户手动刷新。

### 60.1 修法（`src/layouts/Base.astro`）

- 每次构建生成唯一 `BUILD_ID`（`Date.now().toString(36)`，模块级求值 → 一次构建全站一致；
  dev 恒为 `'dev'`），写进 `<meta name="cw-build">`。
- 头部 `is:inline` 脚本记下本标签页 JS 首次加载时的戳；每个 `astro:page-load` 比对
  「当前 DOM 的戳 vs 内存里的戳」，不一致 = 跨部署存量标签页 → `location.reload()` 自愈。
- **防循环刷新**：sessionStorage 记「已为哪个构建刷过」，同一构建只自动刷一次
  （防 CDN 供旧页时无限刷新）；try/catch 兜底禁用 storage 的环境。
- **边界**：这只保护「装了新代码之后」的部署（旧内存脚本里没有这段检查，救不了本次
  已中招的标签页 —— 那些刷新一次即愈）。无 JS / 无 ClientRouter 时不派发 astro:page-load，不动作。

### 60.2 回归（§7.6）

- 新常驻脚本 `scripts/verify-buildstamp.mjs`（4 条，已入 run-regress 队列）：
  ① 戳一致时手动派发 astro:page-load **不**刷新（防误伤）；
  ② 伪造旧戳（= 跨部署存量标签页）**必须**触发整页刷新；
  ③ 刷新后戳一致；④ 防环：防护表已记该构建时**必须**放弃刷新。
  判据缺陷态（无 §60 脚本 / 无防环）分别会红。
- 本地全量 22 脚本批跑见 §59.4 同款口径（ghhot 仍受凌晨空窗影响，见 §59.4 取证）。

## 61. 「切回画廊闪白屏」：深色画布兜底 + 文件夹纸即时加载（2026-09-21 早）★

**站长报障**：点别的页面再切回画廊，闪白屏。**排查**（连帧取证，§7.6）：
CDP `Page.startScreencast` 对软导航（本地 + 线上 `/posts/ → /gallery/`）逐帧采样并自解码
PNG 算亮度（`_shots/probe-whiteflash.mjs` + `measure-flash.mjs`）：**无任何亮帧**
（mean 全程 24–35，切换瞬间反而变暗）——软导航渲染路径本身不产生白。
真正的暴露面是「CSS 未就绪就首绘」的路径：全站深色全靠 body 的 CSS 渐变，
`<html>` 无背景色、head 无 color-scheme 元信息 → 弱网硬加载 / ClientRouter 拉取失败
回退硬导航 / 手机浏览器首绘 / overscroll 回弹，都会露出浏览器默认白底。
本地无法复现该路径的首绘白（无头合成器起始即黑 + CSS 有磁盘缓存），按机制补三层兜底。

### 61.1 修法

| 层 | 改动 | 作用 |
|---|---|---|
| `<html>` 行内样式 | `style="background:#03060a"`（Base.astro） | CSS/JS 之前的第一个绘制就是深色；ClientRouter 同步新文档 html 属性，软导航后不丢 |
| head 元信息 | `<meta name="color-scheme" content="dark">` | 浏览器解析 CSS 前按暗色起步（首绘画布/表单控件/overscroll） |
| 画廊文件夹纸 | `loading="lazy"` → `loading="eager" decoding="async"` | 纸张是首屏内容（每夹仅 3 张），懒加载放大「切回画廊」swap 后 0.7s 淡入期的空屏感 |

（CSS 里的 `:root { color-scheme: dark }` 此前已有，但生效要等样式表；meta 是它的 pre-CSS 前置。）

### 61.2 回归

- smoke **64/64**、verify-copy **31/31**、verify-shell **50/50**；连帧复测软导航
  152 帧无亮帧（max mean 23.8，文件夹纸改即时加载后淡入期即有实际内容）。
- ⚠️ 若站长侧仍见白闪：需要录屏或说明白的是**整屏还是局部**、哪条操作路径 ——
  Chromium 侧软导航已证无白帧，剩余候选只有用户环境的硬导航/GPU 合成路径。

### 61.3 §61 第一版引入回归又回退（2026-09-21 早，站长发现：背景没了）

- **回归**：第一版给 `<html>` 加了行内 `style="background:#03060a"`，上线后站长发现
  **背景视频整个没了**。根因：背景视频层是 `position:fixed; z-index:-4`（VideoBackground），
  它的可见性依赖「**html 无背景 → body 的深色渐变传播到画布**（由视口画在最底层）→
  负 z-index 层画在画布之上」。html 一旦有不透明背景，body 渐变不再传播、留在 body 上，
  绘制顺序就盖住一切负 z-index 层 → 视频 + grid-bg 全部隐身
  （取证：`_shots/bg-home-now.png`（坏，mean 17.4，纯平渐变）vs
  `bg-home-fixed.png`（好，mean 32.0，视频纹理回来））。
- **回退**：撤掉 html 行内背景；白屏闪防护只保留 `meta color-scheme` + `theme-color`
  （现代浏览器 pre-CSS 画布即暗，够用）。**铁律升级：绝不能给 `<html>` 设不透明背景**，
  已写进 Base.astro 的 html 标签上方注释。
- ⚠️ **同类坑记一辈子**：这个站点「画布由 body 传播、装饰层负 z-index」的分层设计，
  意味着任何「给根元素加底色」的想法都会隐藏所有装饰层 —— 改动前先想绘制顺序
  （CSS 2.1 Appendix E：根元素背景 → 负 z-index → 块级背景 → …）。
- 修后 smoke **64/64**；推送后线上以 `poll-deploy --not 'style="background'` +
  首页截图（视频纹理）双确认。

### 61.4 站长反馈白闪仍在 → pre-CSS body 深色兜底（2026-09-21 早）

- 站长复测仍见白闪，且明确要求**不动网页背景**。软导航路径已连帧证净（61 帧级取证），
  剩余暴露面是「pre-CSS 首绘画布」：**meta color-scheme 救不了所有浏览器的画布**
  （Safari/部分 Windows 内核 pre-CSS 画布就是白）。
- 修法（不碰 html，不碰背景视频）：head 授权顺序最前放 `<style is:inline>` ——
  `html{color-scheme:dark}` + `body{background:#070b0f}`。两条保障：
  ① html 保持无背景，body 背景照旧传播到画布（视频层无恙，实测 mean 32.0 不变）；
  ② 内联块在构建产物里位于 `/_astro/*.css` 之前（dist 实测 pos 2166 < 4288），
  全局样式表载入后按文档序覆盖它 —— 它只兜「CSS 未就绪」的窗口。
- 验证：构建产物顺序断言 ✓、smoke **64/64** ✓、视频层截图亮度 32.0 不变 ✓。
- 若站长环境**仍**白闪：那就只剩「软导航回退硬导航」或录屏级信息才可定位 ——
  需要站长提供浏览器/设备/整屏还是局部。（→ 站长复测仍白，见 §62。）

## 62. 白屏闪根治：画布分层重排（html 深色 + 渐变迁至 body::after）（2026-09-21 早）★★

**站长反馈**：§61.4 后白闪仍在，且升级为「**所有页面加载都会闪白屏**」，要求全面排查修复。
**根因链完整版**：空白导航期（硬加载/刷新/回退到未缓存页/ClientRouter 回退）浏览器要画
一个「空画布」，其颜色取自**根元素的背景**——html 无背景时画 UA 默认白。
`meta color-scheme` 只对 Chromium 系画布生效（且各版本行为不一），**救不了全部浏览器**。
唯一可靠手段是给 `<html>` 一个不透明深色背景。但 §61.3 证明：html 一旦有背景，
body 背景不再传播到画布、留在 body 上，绘制顺序（CSS 2.1 Appendix E：根背景 →
负 z-index → 块级背景）就会让 body 的不透明渐变**盖住 z:-4 的视频层**。
→ 结论：**必须把底色渐变从 body 迁到独立的负 z-index 伪元素**，两个目标才能同时成立。

### 62.1 新分层（自下而上，与旧视觉逐层等价）

| 层 | 旧 | 新 |
|---|---|---|
| 画布最底 | body 渐变**传播到画布**（依赖 html 无背景） | `html { background: var(--bg-deep) }` + html 行内 `style="background:#03060a"`（pre-CSS） |
| 底色渐变 | （就是画布本身） | **`body::after`**：`position:fixed; inset:0; z-index:-5`，载原暗色渐变（radial #0d151c + linear #070b0f→#03060a） |
| 背景视频 | `.video-bg` z:-4 | 不变（-5 < -4，视频仍在渐变之上） |
| 光斑层 | `body::before` z:-3 | 不变 |
| 网格 | `.grid-bg` z:-2 | 不变 |

配套改动：`global.css` body 规则去掉 background（`background:none`）；`motion.css`
V16 的 body 浅色渐变（旧「页面底色真实取值」）与 V17 的 `html[data-theme='dark'] body`
暗色渐变**一并改为 `background:none`**（否则任何一条都会盖回视频层——这两条就是
§61.3 回归的埋点）。`bg-flow` 位移动画随之失效移除（has-video-bg 下本来就停）。

### 62.2 验证

- 构建产物断言：html 行内背景 ✓、`body{background:none}` ✓、`body:after{...z-index:-5...
  position:fixed;inset:0}` ✓（Lightning CSS 会把 `::after` 压成 `:after`、`background:none`
  压成 `background-color:#0000`，断言脚本别按源码字面找）。
- 视觉：首页/画廊截图亮度均值 **32.0 / 36.0**（视频纹理在，与重排前一致）；
  软导航连帧 90 帧 0 亮帧；硬加载（禁缓存+50Kbps 弱网）连帧 197 帧 0 亮帧。
- smoke **64/64**；全量 22 脚本 **21/22**（唯一 FAIL 仍是 ghhot 凌晨空窗伪失败，§59.4）。
  `verify-videobg` 断言随架构迁移更新：底色降级断言改查 body::after + 新增 html 画布断言
  （22 → **23**，23/23 全绿）。
- **新铁律（取代 §61.3 的旧表述）**：`html` 必须持有不透明深色背景（防白），
  `body` 必须无背景（防盖视频）；底色渐变住在 `body::after`（z:-5）。三者绑定，动一改三。

## 63. §60 构建指纹逐页漂移 → 跨页误刷根治（2026-09-21 午）★★★

**站长反馈**：仍白闪，且**「一个页面会连续快速加载两次」**——这句话直接定位了真凶。
**根因**：§60 的 `BUILD_ID = Date.now().toString(36)` 写在 Base.astro **frontmatter** 里，
而 Astro 组件 frontmatter 是**逐页渲染执行**的 —— 一次构建 21 页要跑十几秒，
每页拿到**不同的指纹**（dist 实测：7 页 7 值，`muaiyya2` / `muaiywl0` / `muaiyy46`…）。
于是**每一次跨页软导航**：内存戳（A 页）vs 新 DOM 戳（B 页）必不相等 → §60 自愈机制
误判为「跨部署存量标签页」→ 立即 `location.reload()` → 页面**连续加载两次**，
刷新瞬间的空窗就是用户看到的白闪。§60 上线起每次换页都在发生，smoke/探针全绿
是因为它们的断言从不检测「计划外 reload」——判据盲区，非站点渲染问题。

### 63.1 修法（Base.astro frontmatter）

- BUILD_ID 改取**部署提交 SHA**：`CF_PAGES_COMMIT_SHA`（CF Pages CI 注入）→
  `COMMIT_REF` → 本地 `git rev-parse HEAD` → 兜底常量 `'static-build'`。
  同一次构建内**所有页面恒定**（同一提交）；不同部署 = 不同提交 = 指纹不同，
  §60 自愈语义完整保留。`globalThis.__cwBuildId` 记忆化，避免逐页 spawn git。
- 教训（入 §6 手册口径）：**想要「整次构建只算一次」的值，绝不能放在组件
  frontmatter 里用时间类源**——frontmatter 是逐页执行的；要么用内容恒定源
  （git SHA / env），要么 `globalThis` 记忆化。

### 63.2 回归（§7.6 红→绿）

- 新常驻守卫 `scripts/verify-noreload.mjs`（3 条，入 run-regress 队列 22 → **23**）：
  硬加载 A 页打内存标记 → 软导航到 B/C 页 → **标记必须仍在**（= 无计划外 reload）+
  指纹 DOM=内存一致。缺陷态（指纹漂移）实测 1/3 → 修复后 **3/3**。
- 构建产物断言：全站页面指纹种类数 = **1**（修复前 7 页 7 值）。
- smoke **64/64**、verify-buildstamp 4/4（自愈语义保留：伪造旧戳仍会刷新一次）、
  verify-videobg **23/23**。全量 23 脚本批跑见同轮记录（ghhot 凌晨空窗口径不变）。

## 64. ★新增「日历」子页面 `/calendar/`（2026-09-20 晚）★

**站长需求**：「记录」二级菜单加日历，参考 fqzlr.com/calendar，要有相关节假日；
随后追加要求「稍微改造一下以符合本站风格」——即不照搬参考站，按深色玻璃视觉重做。

### 64.1 实现要点

- 导航：`site.ts` 的「记录」children 追加 `{ href:'/calendar/', label:'日历' }`，
  Header 桌面下拉 / 移动抽屉自动长出（NAV 是唯一数据源，零 Header 改动）。
- 页面：`src/pages/calendar/index.astro`（SidebarLayout 壳）。深色玻璃月历主卡 +
  右侧「近期节点」倒计时卡与「图例」卡；格子 = 日期数字 + 农历/节日/节气副标签 +
  「休/班」角标 + 站点更新圆点；今天描边、周末降调。
- 农历/节气/传统节日：新依赖 `js-calendar-converter`（MIT，jjonline/calendar.js），
  **构建期**在 frontmatter 逐日换算 2025-01-01 ~ 2027-12-31，压成 labels 数组 +
  kinds 数字串内联进页面（约 6KB），访客端零外部请求、零运行时计算。
  ⚠️ 两个实测坑：① `solar2lunar` 内部用 `this` 查年表，**不能解构调用**（TypeError: lYearDays）；
  ② 客户端 innerHTML 动态节点**没有 Astro scoped 属性标记**，样式必须放
  `<style is:global>`（类名 cal- 前缀防泄漏）——scoped 下静态区正常、动态区整块
  回退 UA 默认，极易误判为「样式没写」。
- 法定节假日：国务院办公厅官方通知手工录入（2025：国办 2024-11-12 发布；
  2026：国办 2025-11-04 发布，gov.cn 原文口径），休=红「休」、调休上班=灰「班」，
  tooltip 给出区间名（如「春节 · 放假」）。
- 站点更新叠加：changelog 按日计数（与 /log/ 热力同口径），格子底部强调色圆点。
- 月历由客户端脚本在 `astro:page-load` 按访客本地「今天」渲染（构建时间与访问时间
  解耦）；翻月/回今天纯客户端，不触发软导航。

### 64.2 回归与运维

- smoke 扩容：SHELL_PAGES 加 /calendar/（5 条壳层检查）+ 4 条功能断言
  （当月渲染 / 「休班角标数=内联数据当月条数」逐月比对 / 倒计时非空 / 可翻月），
  **64 → 73**；CDP 截图桌面 + 移动双端核验（`_shots/shot-calendar.mjs`）。
- **数据有效期**：农历与节假日数据覆盖 2025–2027；2027 年官方放假安排公布后，
  改页面顶部 OFF_RANGES / WORK_DAYS / END_Y 三个常量并顺延即可。

## 65. ★新增「Peak」图集（2026-09-22 凌晨）★

**站长需求**：把 Steam PEAK 截图传上网页画廊。站长给的路径是 `screenshots/thumbnails`
（18 张缩略图，每张仅约 15KB/约 400px 宽），经确认改用 `screenshots` 根目录**同名的
全尺寸原图**（18 张，1920×1080，共约 3.6MB）—— 缩略图点开大图会糊；另有 4 张未生成
缩略图的原图不收录（站长选了「全尺寸原图」方案）。

### 65.1 做法

- 图片：`public/shots/peak/peak-001..018.jpg`（按文件名时间戳升序编号，JPEG 原样拷贝，
  不转 webp——项目无 sharp 之类转换链，总增量 3.6MB 可接受；现有 MC 图集为 webp 平均 80KB）。
- 条目：`src/content/shots/peak-001..018-shot.md`，frontmatter `game: Peak`、
  `date` 取自文件名时间戳（6 张 2026-09-21、12 张 2026-09-22）、`aspect: 16:9`。
  零页面代码改动——gallery 按 game 分组，文件夹墙自动长出第二个文件夹
  （Minecraft 40 张 + Peak 18 张），侧栏统计 40 → 58 同步。
- JPEG 尺寸用 20 行 SOF 段解析器读取（无外部依赖），确认全部 1920×1080。

### 65.2 验证与坑

- CDP 视觉探针（`_shots/shot-peak.mjs`）：文件夹墙出现 Peak（18 张 · 最近 2026-09-22）、
  点进 `?game=Peak` 图集 18 张可见、首图 1920×1080 原图加载成功。
- smoke **73/73**（画廊段回归全过：默认文件夹墙 / 点夹进图集 / 返回 / 大图开闭）。
- 坑：Astro 7 preview 默认绑 localhost（IPv6 ::1），smoke 探 127.0.0.1 直接连不上——
  重启加 `--host 127.0.0.1 --port 4321`。
- **运维**：后续加图集 = 图片拷入 `public/shots/<游戏>/` + 每张一个 .md 条目（game 字段
  即文件夹名），不需要动任何页面代码；图片建议全尺寸直出（JPEG 可），缩略图仅作参考。

### 66. 全站统一 1300 网格 —— 「导航栏 vs 内容」逐像素对齐（2026-09-22 凌晨）

### 66.1 背景与排查（四轮 CDP 探针，`_shots/probe-nav-align*.mjs`）

- 站长报告「画廊和首页的导航栏相比之下有位置偏移」。四轮探针的结论链：
  1. **导航栏自身零偏移**：5 页（首页/画廊/文章/日志/日历）× 3 视口（1280/1536/1920）
     硬加载，header 容器 / logo / 导航链接坐标逐像素全等；软导航、`data-scrolled`
     残留、DPR 1.25、滚动条闪烁逐项排除。
  2. **真正的成因 = header 容器（固定 1300 + `--nav-pad-x` 32）与各页内容容器宽度
     不一致**：首页 hero 1300 与 header 同位（所以首页"看起来正常"）；子页面
     `.shell` 是 100rem(1600)——@1920 两侧各比 header 宽 150px、@1536 全宽比 header
     每侧多 113px，切到子页面导航就"飘"在内容内侧，视觉上像导航栏偏了。
  3. 另有恒定 19px 的文字级错位：导航内边距 32 vs 内容 `--gutter` 52。
- 站长拍板「全站统一 1300 网格」，并明确约束：**不动导航栏动效**
  （Header.astro 一行未改——1300→1140 收缩、32→24 内边距过渡全部原样）。

### 66.2 改动（3 个文件，全部内容侧）

- `src/styles/shell.css`：`.shell` 的 `--shell-max: 100rem` → `var(--w-max)`（=1300，
  与 header/首页同源；shell.css 是全局文件，var() 不会被 Astro 作用域编译改写）；
  水平内边距 `var(--gutter)` → `var(--pad-align)`。
- `src/styles/global.css`：新增令牌 `--pad-align: 32px` + 两档断点（≤1100 → 24px、
  ≤768 → 20px，**逐档跟随 Header.astro 的 `--nav-pad-x` 断点值**，那边是动效契约
  只做跟随）；`.wrap` 水平内边距 `var(--gutter)` → `var(--pad-align)`。
- `src/pages/index.astro`：hero 的 `padding: 96px var(--gutter) 48px` → `var(--pad-align)`
  （hero 自身 max-width 本来就指向 --w-max；≤1024/≤768 断点里写死的 24/20 恰与
  header 断点一致，未动）。代价（站长已知）：子页面中列在宽屏收窄约 300px。
- 19px 错位消除后残差 1px（logo 的 1px 透明边框），不可见。

### 66.3 验证与断言维护

- 探针复测（`_shots/probe-nav-align4.mjs`，改后日志 `probe4-after.log`）：
  三视口 × 5 页 `.shell` / 首页 `.wrap` 与 `.header-container` **坐标逐像素全等**
  （如 @1920 三者都是 l=305/r=1605/w=1300）；首页 h1 与 logo 差 19px → **1px**。
  截图 `_shots/align-home-1920.png` / `align-gallery-1920.png`：导航 logo 与左栏
  卡片左缘、GitHub 按钮与右栏右缘严丝合缝。
- 回归：`verify-nav-shrink` **40/40**、`verify-shell` / `verify-hero` / `verify-home` /
  `verify-redesign` 全 PASS、smoke **73/73**。
- 断言过期修正（非放宽）：`verify-nav-shrink` 抽屉断言「共 8 个链接」→ **9 个** ——
  §64 日历上线时「记录」组从 3 个子链接变 4 个，断言没跟上（与本次改动无关的遗留）。
- ⚠️ 后续约定：`--pad-align` 的三个值（32/24/20）必须与 Header.astro
  `--nav-pad-x` 的三个断点值保持同步；Header 是动效契约不许动，改对齐只动这边。

### 66.4 推送上线与线上确认（2026-09-22 凌晨，commit bc3d3ae）

- L3 全量：`run-regress.mjs` 21 脚本串行（10m34s）全绿 —— 途中抓到 verify-nav
  19/21（「记录」下拉断言仍是旧口径 3 项），按 §64 事实修正为 4 项（含 /calendar/）
  后 21/21。**日历上线共留下两处过期断言**（verify-nav-shrink 抽屉 + verify-nav 下拉），
  都属"断言没跟上功能事实"，非站点缺陷。
- 部署特征：have `--pad-align:32px` / `--shell-max:var(--w-max)` / changelog
  「全站统一 1300 网格」、not `100rem`。
- ⚠️ 新坑：**Bash 工具会把单引号里的 `\s` 吃成 `/s`**（poll66.log 回显可证）——
  poll-deploy 的正则特征经命令行传递时不要用反斜杠类（`\s`/`\(` 等），
  改用零反斜杠写法（`--pad-align:32px`、`--shell-max:var.--w-max.`）。
  另一个坑：**poll-deploy 只抓目标页 HTML 引用的 CSS chunk**——首页不引用
  Base chunk（--pad-align 住在里面），首页取样测 CSS token 会恒红；
  换 /gallery/ 取样或用 `_shots/fetch-live-css.mjs` 直取证据。
- 线上确认：65s 构建切换（changelog 条目出现、100rem 消失）；线上
  `Base.BH7S552V.css` 与本地同名同哈希、含 pad-align/shell-max；
  生产探针 `_shots/probe-nav-align4-live.mjs`（3 视口 × 5 页）与本地结果
  **逐值一致**（@1920 五页 hc=305–1605、logoL=338；Δ h1=1.0、Δ shell=33.0）。

### 67. 音乐功能全链路 —— 四首曲目 + 侧栏歌词面板 + /music/ 独立子页（2026-09-22）

### 67.1 音源盘点、转码与封面（public/music/）
- 源：D:\Download\music 四首 FLAC 24bit/192kHz（共约 713MB），超 CF Pages 单文件 25MB 硬限 →
  static-ffmpeg 转 320kbps MP3（venv python 在
  `...\.workbuddy\binaries\python\envs\default\Scripts\python.exe`，是 Scripts\python.exe 不是根目录）：
  evolution-era（V.K克 Deemo·纯音乐）292.11s/11.15MB、into-the-sky（SawanoHiroyuki[nZk]）229.84s/8.77MB、
  wings-of-piano（V.K克·纯音乐）340.31s/12.98MB、starry-night（supercell·魔法使いの夜）230.52s/8.80MB。
  报告 `_shots/transcode-report.json`。
- **MP3 实测时长 ≠ FLAC 标签**（292.11 vs 280.9、340.31 vs 331.5）：site.ts 静态 duration 一律以
  MP3 实测为准（浏览器元数据口径），verify 断言区间按此校准（如 4:52 段 → 285–300）。
- 源 FLAC **无内嵌封面**（ffprobe 仅单音频流、-map 0:v:0 无匹配，取证 `_shots/cover-debug.log`）→
  ImageGen 生成 4×1024×1024 深色系封面（约 20–40 credits）→ PNG 转 JPG（ffmpeg -q:v 4）→
  底部「AI生成 WORKBUD>」水印 crop=1024:954:0:0 裁掉。封面可整图替换 `public/music/covers/<id>.jpg`。

### 67.2 数据模型与「零配置歌词」约定
- site.ts 新增 MusicTrack { id,title,artist?,album?,src,cover?,instrumental?,duration?,sizeMB?,bitrate?,origin? }；
  NAV 增「音乐」no:03（画廊之后），导航/关于/互动顺延 04/05/06。
- 歌词零配置：`public/music/lyrics/<id>.lrc` 存在即自动启用同步高亮，无需 site.ts 字段；
  404 缓存进 lrcCache Map；instrumental:true 显「♪ 纯音乐，请欣赏」，无人声无 LRC 显「暂无歌词」；
  解析器支持一行多个 [mm:ss.xx]。约定文档：public/music/lyrics/README.md、public/music/README.md（全 schema）。
- 侧栏 MusicPlayer.astro：mu-ctrl 内 mu-no 前插「词」按钮（data-mu-lyrics + aria-expanded），
  后插 .mu-lyrics 面板（hidden > .mu-lyrics-inner）；shell.css 追加样式——.mu-lyrics-inner
  max-height:132px + mask 渐变 + **position:relative**（offsetTop 推 scrollTop 依赖它）。

### 67.3 /music/ 独立子页（src/pages/music/index.astro，~500 行）
- 全宽页（bodyClass=page-music，与首页同列 smoke WIDE_PAGES）；section[data-music-page] 挂全套
  data-mp-*（ids/srcs/titles/artists/albums/covers/inst/durs/sizes/origins），实例 window.__cwMusicPage。
- 中心大唱片：沟槽 repeating-radial-gradient + label（内联 backgroundImage=封面）+ 中孔 + 高光
  （跟随 --shx/--shy）；@keyframes mp-spin 24s linear，.is-playing 时 animation-play-state:running。
  **视差**：rAF lerp 指针倾斜 perspective(900px) rotateX(-cy*10) rotateY(cx*12)（data-mp-discwrap），
  settle 即停 rAF，prefers-reduced-motion 下禁用。
- 信息铺满：参数 dl 10 项（播放状态/曲目序号/格式/时长/大小/音源/文件名/循环/音量/歌词）+
  进度条时间 + 控制区（循环 chip、音量 range+百分比）+ 歌词区 168px + 曲目列表（data-mp-item + .mp-eq 播放条）。
- ui.js 新增 musicPage()（~380 行）：单例 Audio；ended 按循环模式（one→重播/shuffle→随机换曲/list→下一曲）；
  音量持久化 cw-mp-vol、循环持久化 cw-mp-loop；键盘 ←→ ±5s；进度条点击 seek。
- **双播放器互斥**：各自 play 监听里 pause 对方（__cwMusic.audio.pause() / __cwMusicPage.audio.pause()），
  verify-music 经软导航往返双向验证。

### 67.4 mpRoot 软导航过期闭包修复（真 bug）
- 症状：软导航去别页再回 /music/ 后点曲目，src 切了但可见曲名不同步——once 接线的委托闭包捕获
  boot 时 root，往返后旧 root 已 detach：音频操作正常（单例存活）但 DOM 写入不可见。
- 修法：**模块级 let mpRoot = null，每次 boot 重新赋值；musicPage 全部 DOM 读写（qs/list/paint/
  resume/shine-vars 共 8 处）经由 mpRoot**。侧栏播放器靠「每次 boot 重同步」幸存，/music/ 页同思路根治；
  grep 复核无游离引用。

### 67.5 Number(null)===0 音量坑（真 bug，截图揪出）
- Number(localStorage.getItem('cw-mp-vol')) 键缺失时得 0，能通过 !isNaN(v)&&v>=0&&v<=1 守卫 →
  新访客静默 0% 音量。修法：显式 `rawVol == null ? NaN : Number(rawVol)`，null 走默认 1；
  修后状态转储确认音量 100%。教训：localStorage 读取转数字必须先判 null。

### 67.6 断言同步与环境坑
- smoke.mjs：WIDE_PAGES = ['/', '/music/']（全宽页无侧栏断言扩展到音乐页）。
- verify-music.mjs 整体重写为真实曲目断言：时长区间、seek 75%（219.14s）、歌词面板开合与文案、
  软导航连续性、唱片旋转（is-playing + animationPlayState running）、视差 transform、双向互斥、
  曲目点击同步曲名、无 JS 错误 —— **45/45**。
- **9222 双监听坑**：netstat -ano -p tcp 发现 IPv4 127.0.0.1:9222 与 [::1]:9222 各有监听者——
  残留上轮无头 Edge（无 autoplay 豁免）占 IPv4，新实例只绑上 IPv6 → CDP 脚本打到旧浏览器，
  合成 .click() 的 play() 被拒、卡片卡 'loading'。taskkill /F /PID <pid> /T（38 子进程）后
  单实例重启恢复。**本项目无头跑测必须带 --autoplay-policy=no-user-gesture-required**。
- 顺带加固产品：侧栏 toggle 的 play() catch 补 card.dataset.state='paused'（原为空，play 被拒时 UI 卡 loading）；
  musicPage toggle catch 补 paint()。
- pagefind 入口：node ./node_modules/pagefind/lib/runner/bin.cjs --site dist（lib/index.js 静默 no-op，
  以 package.json bin 字段为准）。
- astro preview PID 锁：已有实例时新起报 "Another astro preview server is already running"；
  旧实例从磁盘即时读 dist，新构建不用重启即可见。
- ⚠️ 再次踩中**同消息双 Edit 同文件互相覆盖**（site.ts wings 340.31 丢失、verify-music 时长断言丢失）
  —— 同一文件必须串行改 + grep 复核落盘。

### 67.7 回归与状态
- 最终全绿：verify-music **45/45**、smoke **76/76**（含 /music/ 溢出/JS/无侧栏）、verify-nav **21/21**、
  verify-nav-shrink **40/40**、verify-copy **31/31**。日志：_shots/verify-music.log、smoke-music.log 等。
- 截图 QA（CDP，_shots/shot-musicpage.mjs）：musicpage-top-1920 / musicpage-playing-1920（数值转储
  1.1s↔0.33% 填充一致、音量 100%、唱片倾斜生效）/ musicpage-params-1920 / musicpage-mobile-390。
- changelog src/content/changelog/2026-09-22.md 顶部新条目 上线「新增「音乐」子页面并导入四首曲目」。
- **状态：§67 全部改动在工作区未 commit**（等站长「推送上线」指令）；b90e306（§66.4 留痕）仍因
  github.com:443 不可达滞留本地。

### 67.8 推送上线与「线上 seek 不稳定」根治（2026-09-22，commit 9752720 + 07069df）

- 推送：push-retry 第 1 轮即成（网络已恢复，6–19s）；ls-remote 证伪远端 main=9752720；
  CF 轮询 `_shots/poll-music-deploy.mjs` 第 3 轮 DEPLOY_VERIFIED（/music/ 404→200 带
  data-music-page 特征 + 首页导航反查 href="/music/"）。
- 线上首跑 verify-music（argv 传 BASE 即可打线上）**44/45**：仅「跳转 75%」失败——
  读数 1.16s/292.11s，处理函数执行了却没 seek。补「元数据就绪」前置断言后仍复现
  （45/46），排除断言时序单因。
- 根因（`_shots/probe-seek-live{,2}.mjs` + `probe-range-rate.mjs` 三层探针）：
  **CF Pages 静态资产不支持 Range 请求**——`Range: bytes=0-0` 一律 200 整体
  （页面内 fetch 12/12 一致，连小 JPG 都没有 accept-ranges；本地 astro preview 正常 206
  → 本地全绿、线上翻车的完整解释）。Chromium 对不可 Range 的媒体资源把 seek 钳到
  seekable 上界：实测同 URL 一次 seekable=[0,0]（点进度条≈重头播放）、另一次 [0,dur]，
  行为随边缘状态漂移，不可信。
- 修复（站长三选一拍板 **Service Worker 补丁**，放弃 _worker.js 全站接管与 R2 迁移）：
  `public/sw.js`（VER cw-audio-v1，Base.astro head 最早注册）只拦截同源 GET
  `/music/*.mp3` 且带 Range 头的请求——① 缓存命中直接切 206（seek 秒响应）；
  ② 首播 bytes=0- 流式 206 + 后台 cache.put（不阻塞起播）；③ 中段 seek 未缓存时
  全量拉取后切片（一次性成本）。其余流量零参与，任何错误回落默认 fetch；
  **换曲目不用动 SW**（正则按 `<id>.mp3` 匹配），改 SW 本体须递增 VER 清旧缓存。
- 验证（`_shots/probe-sw-local.mjs` 本地/线上双跑同结果）：SW 接管 activated、206 带
  SW 指纹头（cache-control `public, max-age=14400`，native 服务器非此值 → 可证伪误判）、
  后缀分片 bytes=-200 数学正确、播放后缓存填充、seek-150 秒响应且继续播放；
  线上 verify-music **46/46**（seek 断言前置「元数据就绪」后 45→46 条）。
- 留痕：本节 + poll-sw-deploy.mjs + 最终线上日志，commit 后随归档提交推送。

### 67.9 侧栏播放器与 /music/ 页状态同步：共享音频单例（2026-09-22）

- 需求：原先侧栏与音乐页是两个独立 window 单例（`__cwMusic` / `__cwMusicPage`），
  各自 `new Audio()`、互斥播放——切页即丢曲目/进度/播放态，只靠 cross-pause 互停。
- 新架构（ui.js）：
  - `getSharedAudio()` 模块级共享 `<audio>` 单例：两视图读写同一元素，
    `window.__cwMusic.audio === window.__cwMusicPage.audio`，状态天然同步，互斥代码删除。
  - `musicCard` 模块级 let（仿 `mpRoot` 模式）：每次 boot 更新为当前文档的侧栏卡；
    音乐页离开时 `mpRoot = null`、壳层页离开时 `musicCard = null`，防写 detached DOM。
  - 两套监听器经 `audio.__sideBound` / `audio.__pageBound` 各绑一次（共享元素只创建一次，
    不能按「st.audio 是否已存在」判断绑定）；UI 刷新一律经 musicCard/mpRoot 间接引用，
    首次绑定的闭包从此永不过期（顺带修复侧栏委托/监听器捕获首次 card 的旧隐患）。
  - 曲终推进所有权 `musicEndedOwner`：musicPlayer boot 置 'side'、musicPage boot 置 'page'
    （后注册覆盖）；两个 ended 监听器都常驻，只有 owner 才 act，防双跳。两视图
    不同时在页面（/music/ 无侧栏卡），按连通性判定即正确。
  - boot 派生（两侧对称）：`audio.src` 按文件名对齐 `st.index`（两侧列表同源、
    decodeURIComponent 保险）；对齐后跳过 sessionStorage 曲目恢复（恢复逻辑收拢进
    `!audio.src` 分支，mpResume/musicResume 也只在该分支设置，防陈旧 dataset 被下次
    loadedmetadata 误消费）。
- 顺手修正三处旧账：① 页面音量恢复只改 `st.vol` 未应用 `audio.volume`（共享后音量是
  全局属性，boot 时真正应用）；② 页面静态参数区（标题/专辑/封面/格式/大小/时长/来源/
  文件名）只在 load() 刷新，抽 `paintStatics()` 并在 boot 尾补刷（派生改变 index 后
  参数区跟着新曲目走）；③ 页面 boot 尾歌词渲染改 `ensureLyrics()`（覆盖派生后 index
  变化，加载完成有 index 守卫）。
- null 安全（共享监听器在另一视图页面也会触发）：srcs/ids/insts/lyPanel/lyInner/
  setToggleLabel/paintProgress/load 全组补 musicCard 空守卫；loadLyrics(!id) 本就返回 null。
- verify-music 断言语义升级（§7.6 rule 3：先改断言、确认新语义在旧架构下必挂）：
  旧「双播放器互斥」3 断言描述的行为在新架构下**按设计不复存在**，改写为状态连续性
  11 断言——共享单例同一性、软导航往返曲目/播放态/序号保持、侧栏点暂停即全局暂停
  （进度保留非重置）、回 /music/ 同步为暂停态且唱片停转。注意：/music/ 页无侧栏卡，
  `__cwMusic` 在该页不存在，「同一元素」断言必须在软导航到壳层页后做。
- 回归：verify-music **53/53**（46→53，全程无 JS 异常）、smoke 76/76、verify-nav 21/21。
  产物特征：`dist/_astro/*.js` 含 `__sideBound`（minifier 会重命名 getSharedAudio，
  断言/轮询别按函数名找）。

## §68 宽屏容器放宽：--w-max 1300 → 1600（2026-09-22 晚）

- 需求：站长「整个网页布局容器总宽改为在宽屏下 1600px」。当天上午刚收的 1300 网格
  （§ 版面统一）当晚放宽 —— 之前 100rem(1600) 的「导航像飘」问题在**全站同步**下
  不复现（当时是壳层 1600 vs 导航 1300 不同步造成的）。
- 令牌与引用：
  - `global.css --w-max: 1300px → 1600px`；视口 <1600 时容器 = 视口满宽
    （与 1300 时代中等屏观感一致），≥1600 才出现上限 → 「宽屏下 1600」天然成立，
    无需新增断点。
  - 引用方全部自动跟随：`.wrap`、`.shell(--shell-max)`、首页 `.hero`、
    account.astro、music/index.astro（都走 var(--w-max)）。
  - ⚠️ Header.astro 的 max-width **必须手工同步**（Astro 作用域编译把 var() 变成
    calc(%) 的历史坑）：`.header-container` 1300→1600；滚动胶囊 1140→1440
    （保持 160 收缩差）。`--nav-w / --nav-w-scrolled` 注释性令牌同步。
- verify 脚本同步（几何断言全部跟着容器走）：
  - verify-nav-shrink：断言 1600/1440/恢复 1600；**视口 1440→1920** —— 1440 视口下
    容器满宽 1430（= 1440 − 滚动条），1600/1440 两条硬等值断言必挂（实测 37/40）。
  - verify-nav：胶囊断言 `min(1440, 视口)`；视口同步 1920 —— 1440 下胶囊与未滚动
    容器都满宽，断言退化成恒真（巧合通过不是语义通过）。
  - verify-hero：max-width '1600px' / hero 同宽 / 1920 档锁 1600（原有 1440+1920
    两档设计正好覆盖）。
  - verify-videobg：`CONTAINER_W = 1600`（bandWidth/offX/右缘/容器匹配四处引用）；
    **主 tab 与对照页 bg tab 视口必须一致**（都 1920）—— 主 tab 1440 + bg tab 1920
    时 hero 文字框坐标 32 vs 187 对不上（实测）；误报修复：`/music/*.mp3` 的
    ERR_ABORTED 过滤 —— §67 起侧栏 audio 请求也记 Media 类型，切页销毁 audio 是
    正常取消（§67 以来潜伏，今天首跑 L2 才暴露，与 1600 无关）。
  - diag-edges：默认 W 1920 + CONTAINER_W=1600。
- changelog：今天上午「全站统一 1300 网格」条目更新为「宽屏版面放宽至 1600」
  （访客视角只留最终态）。
- 产物特征（部署轮询用）：`Base.CPIDXiyJ.css` 含 `--w-max:1600px`、
  `max-width:1600px`（header 未滚动）、`max-width:1440px`（滚动后）。
- 回归：verify-nav-shrink **40/40**、verify-nav **21/21**、verify-hero **88/88**、
  verify-videobg **23/23**、smoke **76/76**。

## §67.9/§68 部署上线（2026-09-22 深夜）

- 提交链：`d0b96bb`（music: 共享音频单例 §67.9）→ `13337fa`（layout: --w-max 1600 §68）
  → `189688b`（docs: 归档 HANDOFF + 回归日志），`push-retry.mjs` 第 1 轮即成功。
- `ls-remote` 反证：origin/main = `189688b`。注意：裸 `ls-remote` 会走失效代理
  127.0.0.1:33210 报 connect refused，须加 `-c http.proxy= -c https.proxy=` 直连。
- 部署轮询 `_shots/poll-679-68.mjs`（HTML→CSS→JS→对照四层特征，禁 chunk 哈希）：
  第 1 轮命中 —— CSS 含 `--w-max:1600px` + `max-width:1600px` + `max-width:1440px`
  且无 `--w-max:1300px` 残留；JS chunk 含 `__sideBound`；对照页 /music/
  `data-music-page` 存在。日志 `_shots/poll-679-68.log`。
- 线上探针（BASE=https://cloudwing.pages.dev）：
  - verify-nav-shrink **40/40**（首跑 34/40：6 失败全在移动端汉堡段，点击时菜单
    未开 —— CDP 移动视口切换后点击过快的偶发时序，重跑全绿，非代码问题）；
  - verify-hero **88/88**；
  - verify-music **53/53**，软导航后「同一元素:true / 卡片状态 playing /
    Evolution Era 01/04」—— 共享音频单例在生产生效。
- 留痕日志：`_shots/live-nav-shrink.log`、`live-nav-shrink-2.log`、`live-hero.log`、
  `live-music.log`、`push-679-68.log`、`poll-679-68.log`。

## §69 热榜数据源改造：直连 GitHub → 同域构建快照（2026-09-22 上午）

- 需求：站长「侧边栏 GitHub 热榜换一个国内容易访问的 api，不要再出现接口限流和网络
  问题」。原实现（§56）前端运行时直连 `api.github.com/search/repositories`：无鉴权
  search 配额 10 次/分极易 403，跨境链路也不稳（访客侧网络问题不受站点控制）。
- 选型：**没有比同域静态文件更「国内易访问」的 API**——访客只请求与博客正文同一条
  CF Pages 链路的 `/api/gh-hot.json`，站点能开热榜就能开；GitHub 请求挪到构建期
  （CF 数据中心 → GitHub 每次部署仅 4 个请求，远低于任何限流阈值）。第三方公共
  trending API（ossinsight 等）语义不符、自有限流，不采用。
- 新脚本 `scripts/fetch-ghhot.mjs`（构建前置，`package.json build` 已挂）：
  - 拉四周期（查询语义与原前端完全一致：`created:>=<start> stars:>10 sort=stars
    per_page=8`），桶起点按北京时间 GMT+8 计算；产物 `public/api/gh-hot.json`
    （generatedAt + periods 四周期，items 字段 name/url/stars/lang/desc 与渲染直连）。
  - **永不失败**：逐周期更新、失败保留旧数据、退出码恒 0，绝不阻塞构建。
  - 坑 ①（假阳性）：fetchPeriod 是 async，调用处漏 await → items 恒为 Promise（truthy）
    → 「ok 4/4」但 JSON.stringify 把 Promise 序列化成 undefined，四周期 items 全丢。
    症状：ok 4/4 与 e.items undefined 并存。已改 `await`。
  - 坑 ②（真实数据稀疏）：daily 查询当天凌晨/上午可能真没有「新建且 star>10」的仓库
    （UTC 才过 2.8h，三轮 empty 不是故障）→ **daily 空榜自动回退昨日**重拉（榜单语义
    = 最近一天新建即爆）；403 限流轮间等待拉长到 25s 等窗口滚动。
  - 本机实测：api.github.com 无鉴权 search 限流很紧（4 周期 × 3 轮的请求量就能把自己
    打进 403），**等 65–70s 窗口重置再跑**即可过 —— 这正是要换掉直连的实证。
- 前端 `ui.js githubTrending()`（§56 逻辑保留）：数据源换成同域 `/api/gh-hot.json`
  （3s 超时），一次快照**全周期写桶缓存**（切 tab 零请求零等待）；时间桶刷新语义不变
  （桶滚动 → 重拉同域文件拿部署新版）；错误文案改「热榜暂时不可用（数据加载失败）」；
  删除死变量 N（条数由快照决定）。SidebarWidgets 头注释同步。
- SW 兼容核查：sw.js 只拦带 Range 的音频请求，`/api/gh-hot.json` 走默认网络行为，
  不会被缓存劫持；`src/pages/api/` 不存在，public/api 无路由冲突。
- verify-ghhot 更新：新增断言「站内快照 /api/gh-hot.json 存在且含四周期」；渲染等待
  9000→4000ms（同域秒级）；头注释移除限流警告（可放心重复跑）。
- 回归：verify-ghhot **12/12**（本地 preview，快照断言+渲染+桶缓存+软导航全过）、
  smoke **76/76**、verify-interaction **12/12**。产物：`dist/api/gh-hot.json` 7392B
  四周期各 8 条。
- 数据新鲜度语义：榜单 = 最近一次部署的快照（博客日更节奏下偏差 ≤1 天）；
  时间桶滚动会重拉快照文件，部署过就有新数据。种子快照（2026-09-22 生成）随 git 入库，
  本地构建拉不动时站点仍有完整数据。
- **§69 部署上线（同日）**：提交 `f67245d`（8 文件 214+/36-）推送成功。部署轮询
  `_shots/poll-69.mjs`（线上快照四周期 / JS chunk 无 api.github.com/search 残留 /
  CSS --w-max:1600px 防回滚）第 1 轮命中 —— **线上快照 generatedAt=02:57:47 是 CF
  构建时新生成**（本地种子 02:51:06），证明 fetch 脚本在 CF 数据中心拉取成功、四周期
  4/4。线上探针 verify-ghhot **12/12**；探针 tab 已按静音约定收尾清理。

## §70 hero 整块水平居中（2026-09-22 上午）

- 需求：站长截图首页 hero（左文案＋右代码卡）「把我所截图的那一整块放在网页的中心，
  而不是像现在一样整体偏左，其他东西不要动」。
- 根因：`.hero` 容器本身 `margin: 0 auto` 一直居中，但内部两栏是
  `justify-content: flex-start`（2026-09-18 三轮为「左栏左缘与下方区块左缘重合」
  刻意贴左）——§68 把 --w-max 放宽到 1600 后容器净宽 > 两栏总宽（左栏 700 + gap 96
  + 卡片 400 = 1196），右侧留白最大到 ~340px，宽屏下「整体偏左」非常显眼。
- 改法（仅一处属性）：`.hero` 的 `justify-content: flex-start → center`。
  当年注释里否掉 center 的理由（「与下方区块左缘不重合」）正是用户现在要的效果；
  下方区块保持主栅格左对齐不动。竖向居中（align-items/align-content）、≤768 列向
  堆叠（其 center 是竖向主轴语义）、1024/768 断点全部不动。
- 断言同步（§7.6）：verify-hero 原「hero 内容左缘与区块内容左缘重合」改为
  「hero 整块水平居中（块外左右留白对称 ≤2px）」——量 .hero-content 左缘与
  .code-card 右缘在 hero 内容盒内的两侧留白。videobg 的 offX/边缘采样对象是
  `.hero` 容器盒（位置未变），不受内部两栏排布影响，无需改。
- 回归：verify-hero **88/88**（1440 实测左右留白 **85.0/85.0**、1920 容器 155/155）、
  verify-videobg **23/23**。
- **§70 部署上线（同日）**：提交 `1ff3318` 推送成功；线上 verify-hero 第 1 轮
  即 **88/88**；探针 tab 已清理。

## §71 代码卡上移与徽标胶囊顶对齐（2026-09-22 上午）

- 需求：站长「把首页代码卡片向上移与『上线·新增音乐子页面并导入四首曲目』这个小标题
  对齐，其他东西都不要动」。
- 机制：卡片顶对齐由 `hero-theme.js alignCard()` 驱动——绝对坐标收敛
  （want = cur + (锚点顶 − 卡片顶)，`--card-shift` + `position:relative; top`，
  禁用 margin-top 防止参与 flex 行盒高度破坏竖向居中，历史教训见注释）。
  原锚点是 `.hero-title` 顶（2026-09-18 三轮）；badge 在标题上方。
- 改法：锚点 `.hero-title` → `.hero-badge`（badge 缺失回退标题顶），其余一行不动。
  推断并实测证实：badge 顶 = 行盒自然顶 = 卡片自然位 → `--card-shift` 归 0，
  等价于把卡片上移一个「badge 高 + 间距」（原 shift ≈ 60px）。
- 断言同步：verify-hero「大标题与卡片顶部齐平」→「徽标胶囊与卡片顶部齐平」
  （badgeTop vs cardTop ≤1px）；竖向居中段历史注释更新（齐平位移现归 0）。
- 回归：verify-hero **88/88**（徽标顶=卡片顶=239，shift=0px；卡片中心差 110→50）、
  verify-videobg **23/23**、smoke **76/76**。
- **§71 部署上线（同日）**：提交 `cf520ee` 推送成功；线上 verify-hero 第 1 轮
  即 **88/88**；探针 tab 已清理。

## §72 Minecraft 图集扩容：35 张新截图（2026-09-22 中午）

- 需求：站长把 `F:\MC\.minecraft\versions\乌托邦探险之旅\screenshots` 的截图加入
  MC 图集。源 = 35 张 PNG（2560×1440 2K，命名 = 拍摄时间戳），接续编号
  `mc-041 ~ mc-075`。
- 管线：Anaconda Python（Pillow 12.3，托管 3.13 无 PIL）转 1920 宽 webp
  quality=80（与既有 mc-001~040 规格/观感一致，均 ~80KB，总量 240MB → ~2.8MB）；
  脚本 `_shots/mc-transcode.py` + 产物映射 `_shots/mc-transcode-map.txt`。
- 条目：`mc-041~075-shot.md`（title/date=拍摄日、game: Minecraft、aspect 16:9）。
  ⚠️ `2026-08-26_1/2/3.png` 三张 mtime 是复制日（09-22），按文件名语义归
  2026-08-26。gallery 页全自动按 game 分组 → 文件夹 meta 自动变「75 张 · 最近
  2026-08-26」，无需改页面代码。
- changelog：+1 条（截图总数 58 → 93）。
- 回归：构建产物校验（dist 75 webp + gallery meta）+ smoke **76/76** +
  verify-nav **21/21**。
- **§72 部署上线（同日）**：提交 `fb53084`（71 文件）推送成功；线上 /gallery/
  「Minecraft 75 张 · 最近 2026-08-26」+ `/shots/mc/mc-075.webp` 200，第 1 轮命中；
  探针 tab 已清理。
- 环境备忘：本次发现旧 preview（残留 PID 32168）已退出，重启 `astro preview` 后
  它绑定在 **localhost(IPv6 ::1)** 而非 127.0.0.1 —— verify 脚本 BASE 传
  `http://localhost:4321` 即可，不必改脚本（127.0.0.1 会 ECONNREFUSED）。

## §73 新增「黑暗之魂2」图集（2026-09-22 中午）

- 需求：站长提供 6 张 Steam 截图（AppID 335300，`D:\steam\userdata\...\335300
  \screenshots`，1920×1080 JPG，文件名 = 拍摄时间戳 2025-06-28/29），新建图集。
- 管线：同 §72 模板（Pillow → webp q80），新目录 `public/shots/ds2/`，编号
  `ds2-001 ~ ds2-006`；条目 `game: 黑暗之魂2`（schema 为自由字符串，文件夹墙
  标签直接显示），date 取文件名时间戳。gallery 全自动分组 → 第三个文件夹
  「黑暗之魂2 6 张 · 最近 2025-06-29」。
- 体积：源 JPG 462–620KB → webp 84–314KB（约省 55%）。
- changelog：+1 条（截图总数 93 → 99）。
- 回归：构建产物校验（folders meta + dist webp）+ smoke **76/76**。
- **§73 部署上线（同日）**：提交 `d68b60e`（13 文件）推送成功；线上 /gallery/
  「黑暗之魂2 6 张 · 最近 2025-06-29」+ `/shots/ds2/ds2-006.webp` 200，第 1 轮
  命中；探针 tab 已清理。
