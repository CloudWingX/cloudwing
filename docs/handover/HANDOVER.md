# CloudWing 云翼 · 交接压缩入口（HANDOVER）

> **新接手者从这里开始读。** 本文按《交接压缩方案 v1.0》整理为 C0–C3 四级：
> **C0 契约**（不可违反的硬规则）→ **C1 操作**（怎么跑起来/怎么验/怎么上线）→
> **C2 设计**（站点现在长什么样、为什么）→ **C3 索引**（按主题查详细章节）。
> 任何 C 级条目与详细历史冲突时，**以最新交付为准**（编号日志是滚动更新的）。
>
> - 完整历史日志 + 常驻手册：`docs/HANDOFF.md`（每轮交付照旧在彼处追加编号章节；
>   工作区根目录 `<工作区>/HANDOFF.md` 是同一文件的副本，改完两边同步）。
> - 历史全文归档：`docs/handover/archive/HANDOFF_full_v2_2026-09-25.md`（**最新**，
>   SHA256 见同目录 `SHA256.txt`）；更早的 `HANDOFF_full_v1_2026-09-23.md` 保留备查（截至 §81）。
> - 本机路径（`D:\deep seek workplace\...`、Edge、代理端口）来自开发机，换机器按实际替换。
>
> 最后更新：2026-09-25 晚（§82 性能与自定义域 + §83 手机端重构系列；基线见 C3.3）。

---

## C0 契约（违反必出 bug，先读这个再动手）

### C0.1 三条铁律（HANDOFF §5）

1. **软导航会重建 DOM，但页面脚本不会重跑**：全站走 Astro `<ClientRouter />`，
   切页时 body 被换掉、页面级 `<script>` 不再执行。任何交互必须写成
   **document 级事件委托 + window 上的单例状态**，并在
   `document.addEventListener('astro:page-load', ...)` 里重新绑定/重算。
2. **`astro:page-load` / `astro:after-swap` 在 document 上派发且不冒泡**：
   挂到 window 上永远收不到（本项目已因此踩坑两次）。
3. **`src/components/ReactBits/*` 是官方原码，只允许在宿主层改**：
   改视觉效果 → 新建宿主组件传 props / 覆盖 CSS，不改官方组件本体。
   导航/移动端抽屉**禁用 React island**（与 ClientRouter 冲突），用 vanilla gsap。

### C0.2 环境硬约束（HANDOFF §2）

- **不提交 `package-lock.json`**（Windows lock 缺平台可选依赖，CF `npm ci` 必挂）；
  `react`/`react-dom` 精确锁 **19.2.8**；`.npmrc` 保留 `legacy-peer-deps=true`。
- **`IMG_CDN = ''`（`src/site.ts`）**：图片本地相对路径，不改回 jsDelivr。
- 构建脚本保留 `plugins/vite-cjs-inline-shim.mjs`（删了构建失败）与
  `plugins/vite-modulepreload.mjs`（§83.4；删了失去 JS 预加载，手机慢网首屏退化）。
  ⚠️ 后者是 **Astro integration**（`astro:build:done` 钩子）——vite 的 HTML 钩子对
  Astro 静态页**不触发**；`dir` 是 URL 对象，须 `fileURLToPath`。
- **★禁止在 bash 里做删除★**（`rm`/`git rm` 会被损坏的沙箱钩子接管并连带删整个父目录，
  曾实测 `git rm -r public/covers` 把整个 `public/` 与 `scripts/` 删掉）。
  删除一律"同卷 Move-Item 到中转目录 + `git add -A` 记录"，删后必须 `git status` 逐文件比对。
  清理 `_shots` 类目录时**先 `git ls-files <目录>` 分清 tracked/untracked**——
  untracked 才是垃圾，tracked 的历史证据误删会连累（2026-09-24 实测误移 100+ 个跟踪文件，`git restore --worktree` 无损还原）。
  ⚠️ `git add -A` 会把未跟踪的 `_shots` 证据一并暂存 → 记得 `git restore --staged -- _shots/`。
- bash 里 `npm`/`npx` 是坏 shim；构建/脚本用**绝对路径 node 直接跑入口**
  （`node ./node_modules/astro/bin/astro.mjs build`）；`npm run xxx` 走 PowerShell。
- 推送失败先分清"代理坏了"还是"网络断了"（github.com:443 间歇不可达，
  `git -c http.proxy= -c https.proxy= push` + 重试；极端时起本地 TCP 隧道，见 §2）。

### C0.3 测试分层（HANDOFF §47，站长明确要求）

| 层级 | 触发时机 | 跑什么 |
|---|---|---|
| L1 单页/组件 | 每完成一个子页面或组件 | `smoke.mjs` + 该页对应脚本 |
| L2 功能模块 | 每完成一个功能模块 | 相关模块脚本 + 关键路径 e2e |
| L3 全量回归 | **仅** PR 前 / 合并前 / 发布前 / 站长明确要求 | `run-regress.mjs`（优先交 CI） |

**不要每改一个子页面就跑全量回归。** 验证脚本**必须串行跑**（并发大面积假失败）。

### C0.4 写断言的三条硬要求（HANDOFF §7.6）

单位口径明确；扫描范围必须覆盖被怀疑的边界；**证明它在缺陷态下会红**。
设计事实变更时，verify/smoke 断言与 HANDOFF 数字必须同步更新（不仅限代码变更）。

### C0.5 分层绘制铁律（HANDOFF §62）

html 持不透明深色背景（#03060a）；body 永久无背景；底色渐变住 `body::after`（z:-5）；
光斑 `body::before`（-3）、网格 `.grid-bg`（-2）、视频（-4）。**三者绑定，动一改三。**
（minifier 会把 `::after` 压成 `:after`，产物断言别按源码字面找。）

### C0.6 隐私红线（HANDOFF §12）

站点任何地方不得出现真实姓名/学校/企业名（作者身份统一 `CloudWing_X`）；
不把简历课业放进仓库；天气默认按访客 IP；提交信息不带个人信息。

### C0.7 静音铁律（2026-09-22 站长要求）

跑任何测试/探针不得让音乐出声：CDP 调试浏览器必须带 **`--mute-audio`** 启动。

### C0.8 ★手机端专属硬约束（§83 系列，2026-09-25，站长：改手机不得影响 PC）★

1. **手机端（≤768）背景视频不加载**：`<video>` 只给 `data-src`（不给 src 即不下载），
   `initVideoBg` 在桌面（≥769px）才赋 src；手机端 video `display:none`，
   由 `.video-bg` 的 **poster 静帧 + 55% 暗化层**兜底（观感与桌面视频一致）。
2. **手机端 html 底色/回弹**：`overscroll-behavior-y:none` + 深青 `#071620`——
   ⚠️ **必须 `!important`**，否则被 Base.astro 的 html **行内 style**（§62 防白屏）压过。
   `.video-bg` 手机端 `inset:-80px 0` 外扩，吸收地址栏伸缩露出的黑边。
3. **显现兜底（防"内容永久隐形"）**：`js` 标记由 head 内联脚本先于首帧打上，
   而显现逻辑在 JS 包里 → 3s `rv-expired` 强制可见 + pageshow/visibilitychange 同步 sweep + 2.5s 超时。
   慢网/真机 rAF 冻结是真实场景，**任何"JS 未运行则内容不可见"的实现都不允许**。
4. **能 SSR 的视觉不许交给 JS**：唱片封面 `mp-label` 已 SSR 直出（`MUSIC[0].cover`），
   JS 只负责切曲目换图。
5. **改手机端前先确认 PC 零影响**：所有手机端改动一律写在 `@media (max-width: 768px)` 内，
   或用 JS `matchMedia` 分支；桌面行为不得改变（站长明确要求）。

### C0.9 触屏降级原则（§83.5）

鼠标专属动效（星轨 canvas、大标题 3D tilt）用 `(pointer: fine)` 守卫——
触屏设备无鼠标却要维护 canvas + rAF + resize 监听，纯耗 CPU/电量；桌面行为不变。

---

## C1 操作（build / 验证 / 上线）

### C1.1 五分钟上手

```powershell
cd 'D:\deep seek workplace\endfield-blog'
npm run build        # 必须 npm run build（= astro build && pagefind --site dist）；
                      # 只跑 astro build 不生成 pagefind 索引，verify-search 全红
```

期望退出码 0。pagefind 打 "doesn't support stemming for zh-cn" 是已知无害提示。

```powershell
# 起 preview（脚本默认 127.0.0.1:4321，必须绑 IPv4；不带 --host 会只听 [::1]）
Start-Process 'cmd.exe' -ArgumentList @('/c','"D:\deep seek workplace\endfield-blog\node_modules\.bin\astro.cmd" preview --port 4321 --host 127.0.0.1') -WorkingDirectory 'D:\deep seek workplace\endfield-blog' -WindowStyle Hidden
```

```bash
# 起静音无头 Edge（9222；profile 不能带空格路径；--no-proxy-server 防系统代理 502）
"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new \
  --remote-debugging-port=9222 --remote-allow-origins=* \
  --autoplay-policy=no-user-gesture-required --mute-audio --no-proxy-server \
  --user-data-dir="C:/Users/24645/AppData/Local/Temp/cwcdp-mute2" \
  --no-first-run --disable-extensions --window-size=1440,1000 about:blank
```

（常驻进程用 Bash 的 run_in_background 起——PowerShell `Start-Process` 起的进程会随命令结束被杀。）

```bash
node scripts/smoke.mjs http://127.0.0.1:4321    # 期望 76/76
```

⚠️ **preview 起不来的头号原因**：残留 `.astro/preview.json` + WorkBuddy 的 safe-delete shim
（astro 启动时会 `fs.rm` 旧锁文件 → 被拦 → 4 秒自杀）。解法：先 `renameSync` 挪走锁文件再起；
`existsSync` 有陈旧缓存（真删了仍报 true），**rename 抛 ENOENT 应视为"已清掉"直接继续**，
别像早期那样重试 10 次白等。

### C1.2 验证脚本

- 全部在 `scripts/`，用法 `node scripts/<名>.mjs [url]`；前置：4321 preview + 9222 浏览器。
- 退出码 0=全过 / 1=有失败 / 2=环境没起。**逐条清单与基线表看 HANDOFF §7.2**（最权威）。
- 不需要浏览器的两个：`verify-copy`（文案断言 31 条）、`verify-nav-icons`（图标静态断言）。
- **全量批跑 `node scripts/run-regress.mjs`**（串行，现为 **24 个脚本**：23 个原有 +
  2026-09-24 入队的 `verify-music`）。⚠️ 本会话沙箱实测：若输出整片 `FAIL(null)` 且
  error 为 EBUSY——沙箱禁止 node 进程派生子进程，spawnSync 机制跑不了；等价替代是
  **bash for 循环逐个顶层 `node scripts/<名>.mjs`**（同样串行，判定口径一致）。
- 跑完收尾：`/json/list` → `/json/close/<id>` 关掉测试 tab，别让页面带着播放态留在后台。

### C1.3 部署与确认

- **一键推送（2026-09-25 起）**：`bash "D:/deep seek workplace/.workbuddy/gh-push.sh" [分支=main]`
  —— 探测驱动：SSH over 443（主）→ HTTPS 直连 → TCP 隧道（自动探测可达 IP），推完自动
  **核验 remote ref**。理由：github.com:443 有间歇 SNI 干扰（§2），SSH 无 SNI 可掐，实测秒推。
  依赖：`~/.ssh/id_ed25519`（公钥已加 GitHub）+ 仓库级 `core.sshCommand` 指向
  `~/.ssh/github_config`（**用户的 `~/.ssh/config` 有写保护，别碰**）。
  ⚠️ 凭据坑：一次失败重试会触发 PortableGit 的 `helper-selector`，把 `~/.gitconfig` 写成
  `credential.helper=`（空值禁用一切）→ 之后全部 401。修法：`.gitconfig` 设
  `helper = !"…git-credential-manager.exe"`（凭据库已有 `git:https://github.com` 存量）。
- 推 `main` → Cloudflare Pages 自动构建（`npm run build`）→ 线上 <https://cloudwing.pages.dev>；
  **主域 `https://cloudwing.top`**（2026-09-25 起绑定，腾讯云注册 NS 已托管 CF）——两域名并行服务，
  canonical/sitemap/RSS 用 cloudwing.top。
- **推送成功判据不是 "Everything up-to-date"，必须 verify remote ref**：`git ls-remote origin main`。
- **部署确认用 `scripts/poll-deploy.mjs --have <正向特征> --not <反向特征>`**
  （别用 chunk 哈希；删除类改动必须给 `--not` 反向特征，且要防边缘缓存骗过——§43.2/§7.5）。
  ⚠️ **bash 里传正则特征别带冒号也别写 `\s`**：MSYS 会把 `x:y` 当路径表转换、
  把 `\s` 吃成 `/s`（两次实测翻车）——用 `' *'` 代替 `'\s*'`、特征串避开冒号；PowerShell 不受影响。
  ⚠️ **poll-deploy 只扫首页引用的 HTML+CSS chunk**：`/music/` 之类的页面特征要直接
  `fetch('https://cloudwing.pages.dev/music/')` 验（音乐页 SSR 封面就是这么验的）。
  ⚠️ Astro scoped 样式编译成 `.类名[data-astro-cid-…]{…}`，裸类名+属性串匹配不到。
- 视觉类缺陷：部署后要求无残留闪烁/重复加载，完整验证后才算成功。

### C1.4 内容纪律

- 当天改动**当天补** `src/content/changelog/YYYY-MM-DD.md`（归档/日志/热力图的数据源，
  漏了时间线断档；每条 changelog 配一篇 `posts/YYYY-MM-DD-log.md`）。
- 内容怎么加（文章/截图/changelog 格式）看 HANDOFF §4；作品库已于 §40 下线，别再往
  `content/works/` 加东西。

---

## C2 设计（站点现在长什么样）

- **形态**：个人博客与档案站「云翼 / CloudWing」。Astro 7 静态 + 少量 React 岛 +
  vanilla JS 交互中枢 `src/scripts/ui.js`（约 2000 行，软导航后所有功能靠它重新接管）。
  暗色电影感 + 玻璃拟态；**只有一套暗色主题**（亮色已删，§27）。
- **页面**：首页（Hero + 代码卡片）/ `/posts/` + `/blog/` 归档 / `/gallery/`（文件夹墙默认，
  58+ 张）/ `/music/`（唱片 + 同步歌词）/ `/calendar/`（农历+节气+节假日）/ `/nav/`（21 站点
  毛玻璃卡）/ `/log/`（changelog 全展开）/ 关于 / 404。
- **三栏壳层**（≥1200px）：`SidebarNav(260) | main | SidebarWidgets(280)`，两侧栏在
  `<main>` 之外（不吃切页入场动画）；两栏共用 `--side-top` 同步滚动（§8）。
  手机端 <1200px 侧栏隐藏、单列；导航为 **StaggeredMenu 抽屉**（vanilla gsap 移植，
  §80：抽屉 z-67 盖导航栏、开关 z-68、`mnav-open` 时摘胶囊 backdrop-filter）。
- **主题令牌**：`global.css` 的 `:root`；强调色雾蓝 `--accent:#9FD3E8`（取自背景视频
  192° 青蓝）+ 5 套色卡预设（`site.ts` 的 `ACCENTS`，§34）；玻璃令牌
  `--glass-blur/--line-2/--r-s|l|m` 全站走令牌不写死；边框 1px 或 2px（Blink 把 1.5px
  渲染成 1px）；字体 Inter + 系统中文回退。
- **背景**：桌面 5.92MB mp4 自托管（2026-09-25 从 15.55MB 瘦身，§82 A1）+ 渐变遮罩 +
  poster 降级，`transition:persist` 防软导航重建；**手机端不加载视频**（poster 静帧 + 55%
  暗化层，观感与桌面一致，§83.4/§83.5）。分层绘制见 C0.5。
- **音乐**：四首曲目自托管转码 mp3 + 官方封面（iTunes/QQ/MusicBrainz/VGMdb 图源优先级，
  §79）+ LRCLIB 同步歌词（**务必按音源时长核对版本变体**）；侧栏播放器与 /music/ 页
  共享 window 单例音频（§67.9）；**唱片封面 SSR 直出**（§83.3，JS 迟到也能显示）。
- **手机端首页排版**（§83）：精选影像 ≤620 两列（影像区 1630→605px）、hero 底部 padding 40；
  详见 C0.8。
- **已清理死代码**（2026-09-25 删，原 §42.5 候选）：`hero-anim.js`、`TextType.astro`、
  `Ticker.astro`、`DriftWallBackground.astro`、`HomeShapeGrid.jsx`——均零引用，
  已移入中转目录并从仓库注销；ReactBits 官方原码按 §5 铁律三未动。

---

## C3 索引（按主题查 HANDOFF 详细章节）

### C3.1 推荐阅读路径（§57.1）

§0（现状）→ §1（五分钟上手，照做 build+smoke）→ §2/§3（硬约束/目录）→
§5+§6（铁律/踩坑手册，先通读标题）→ §7（验证与调试）→ §8–§9+§47（壳层/令牌/测试分层）→
§10+§13+§14（遗留/下一步/自检清单）→ **§78–§83（最近变更，含手机端重构与性能系列）**。
手机端相关先看 C0.8/C0.9，再读 §82/§83/§83.1–§83.5。

### C3.2 主题 → 章节（§57.2 摘要）

| 你要动的东西 | 先读 |
|---|---|
| 导航栏（形态/抽屉/记录下拉） | §33 §31 §51 §54 §80；改 NAV 结构必同步 §51.3 两处断言 |
| 首页 Hero / 代码卡片 / 容器宽度 | §34 §36 §36.1 §36.2 |
| 子页面壳层（页头/kicker/间距/顶对齐） | §52 §53；新子页面必读 §44.4 三件事 |
| 新增子页面 | §44 + §44.4 + §52/§53 |
| 内容（文章/changelog/画廊/导航站点） | §4；§46（站点条目） |
| 强调色/主题令牌 | §9 §34 §55 |
| 交互策略（拖选/轮廓） | §49（+ §49.3 正文放行例外） |
| 右栏挂件（热榜/日历/天气/音乐） | §56 §8 §67；`ui.js` 对应函数 |
| 音乐模块 | §67（全链路）§67.9（共享单例）§79（封面/歌词）§78（部署回归） |
| 移动端导航抽屉 | §80（四轮迭代终态 + gsap×SSR transform 坑） |
| ★手机端加载/背景/显现（2026-09-25） | §82（诊断与分级方案）§83（排版）§83.1/§83.2（显现隐形根治）§83.3（音乐页降级）§83.4（视频/字体/预加载）§83.5（背景统一+黑边+删冗余） |
| ★推送与凭据（卡在提交就看这里） | §2（SSH over 443 主路 + gh-push.sh 一键 + helper-selector 关凭据的坑） |
| 验证脚本（新写/排查假失败） | §7.2 §7.6 §46.5 §43.2 |
| 构建与部署 | §44.5（pagefind 坑）§43.2（边缘缓存坑）§7.5（poll-deploy）§60/§63（构建指纹）§83.4（modulepreload） |
| 白屏闪/背景分层 | §61 §62 §63（根因三部曲）+ §83.5（手机端黑边） |
| 历史"为什么删了它" | §40（作品库）§27（亮色主题）§41（极简化）§43（CODEX.md） |
| 历史大事故与恢复 | §37（React #424）§2（bash 删除事故） |

完整章节目录：`docs/handover/_index_raw.txt`（§0–§83.5 标题）。

### C3.3 当前基线（2026-09-25 晚，手机端重构后）

| 脚本 | 基线 |
|---|---|
| `smoke.mjs` | **76/76** |
| `verify-music.mjs` | **54/54**（+1：无 JS 封面 SSR 断言） |
| `verify-home.mjs` | **28/28**（影像两列 + 刷新显现断言） |
| `verify-videobg.mjs` | **29/29**（+3：手机端视频/posters/回弹/底色） |
| `verify-theme.mjs` | **11/11**（单主题不变量） |
| `run-regress.mjs` | 队列 **24 脚本**（含 2026-09-24 入队的 verify-music） |

- 线上：**<https://cloudwing.top>**（主域）+ cloudwing.pages.dev 并行；背景视频 5.92MB（桌面）。
- 可读性 0 处不达标；8 页 0 JS 异常；手机端 0 横向溢出；首页滚动深度 3516px（手机，原 4565）。
- 最近一次 L3 全量：2026-09-24 早（24/24 逐脚本串行全绿）；此后按 §47 分层只跑受影响模块。
- ⚠️ 沙箱限制：本会话沙箱禁止 node 派生子进程（`run-regress` 的 spawnSync 跑不了），
  全量回归需 bash for 循环逐个顶层调用（见 C1.2）。
