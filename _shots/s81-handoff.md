
## 81. 交接快照（2026-09-23 晚，给下一个接手者）

> 本章是「当前状态的横切面」：读完 §0–§5、§7、§14 的常驻手册后，从这里接上即可。
> 之后有新交付，照例往编号日志追加，并同步刷新本章。

**最近两天的四块主要交付**
- **§79 音乐页官方封面 + 同步歌词**：图源优先级 iTunes Search API > QQ 音乐 >
  MusicBrainz CAA > VGMdb（按本机可达性）；歌词用 LRCLIB（免费带时间轴），
  **务必按音源时长核对版本变体**（Game Ver. / MODv，230s vs 269s 的坑）。
- **§80 移动端导航 StaggeredMenu 抽屉**（四轮迭代：初版 → 收窄 76vw →
  减半宽 38vw + 零右留白 + 低可见度磨砂 → 盖住导航栏 +「记录」二级收进下拉）。
  **架构决策：vanilla gsap 移植而非 React island** —— 保住 §5 铁律（document 委托 +
  window 单例）与 ClientRouter 软导航安全；`data-mnav-toggle / hidden / is-open /
  mnav-open` 契约原样保留。
- **§78 部署回归修复**：唱片外阴影随方形容器呈矩形扩散（border-radius 补 50%）。
- 层级模型（§80 终态）：导航条无 z-index → 抽屉 z-67 盖住导航栏 →
  开关 z-68 浮出；菜单打开时（mnav-open）显式摘掉胶囊 backdrop-filter，
  否则层叠上下文会把开关困在抽屉之下。

**当前基线（2026-09-23 晚）**
- smoke **76/76**；verify-nav-shrink **43/43**；verify-music **53/53**。
- 最近一次发布前全量 run-regress 日期见 §7.2 表；**verify-music 尚未入队**（见下）。

**本日新坑速查（细节与证据在 §80）**
1. **gsap × SSR transform 叠加**：元素 CSS 带 `translateX(100%)` 时，gsap 首次接管把
   它解析成独立 `x` 分量，与 `xPercent` 相加（起点 200%、fromTo 终态卡 100%）。
   凡 gsap 接管服务端初始 transform 的元素，一律显式 `x: 0`。
2. **CDP 通道**：Node 全局 WebSocket 对 Edge 153 只 open 不回包 —— 验收/探针一律
   `import WebSocket from 'file:///C:/Users/24645/.workbuddy/binaries/node/workspace/node_modules/ws/index.js'`。
3. **Edge profile 残留**：Page.navigate 不回包（ws open 正常）→ 杀进程换全新
   user-data-dir（现用 `cwcdp-mute2`）+ 启动加 `--no-proxy-server`（无头浏览器会走
   系统代理拿 502 页）。静音铁律不变：`--mute-audio`。
4. **preview 端口**：astro preview 只监听 `[::1]:4321`（IPv6）→ 浏览器里必须用
   `http://localhost:4321`；`127.0.0.1` 直连是 chrome-error 页（会被误判成"页面没元素"）。
5. 本机 shell：Git Bash 缺 coreutils（`sleep`/`dirname` 等）、`rm` 被损坏的钩子接管
   （禁用，见长期记忆）→ 文件操作用 node/PowerShell，延时用 node setTimeout。

**遗留待办**
- [ ] `verify-music` 加入 `run-regress.mjs` 队列（音乐页改动后才不会被全量回归漏掉）。
- [ ] §10（遗留问题）/ §13（下一步参考）中的旧条目仍然有效，按需推进。
- [ ] 9222 无头 Edge 再遇「ws open 但不回包」：按序换 profile → 加 --no-proxy-server →
      核对 preview 端口协议（localhost vs 127.0.0.1）。

**接手路径**：§0–§5（是什么/怎么跑/铁律）→ §7（怎么验）→ §14（自检清单）→
§57（章节地图，按模块挑读）→ §78–§81（最近变更）。
