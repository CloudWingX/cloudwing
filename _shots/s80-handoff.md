
## §80 移动端导航改形 StaggeredMenu 抽屉（2026-09-23 晚）

- 需求：站长给 React Bits 的 StaggeredMenu 组件源码，「把手机端导航栏做成该效果，不要影响电脑端」。
- 形态：右侧全高滑入玻璃抽屉 + 2 层强调色前导层错峰跟进 + 条目 yPercent/rotate 错峰入场 +
  counter 编号（01–07）淡入 + 加号图标旋转 225° + 「菜单/关闭」文字竖向滚动；点外部/Esc/换页收起。
- **实现路线：vanilla 移植而非 React island** —— 项目导航是 document 委托 + window 单例
  （§5 铁律），island 会在 ClientRouter 软导航下重建丢状态；gsap 已是依赖，直接在
  nav-mobile.js 的 initMobileNav 里重写动画，契约（data-mnav-toggle / hidden / is-open / mnav-open）不变。
- 桌面端零影响：全部新样式锁 ≤768px，另加 ≥769px display:none 双保险；旧汉堡/下拉样式删除。
- 内容变化：「记录」父项在抽屉里也渲染为可点一级链接（桌面下拉同口径）→
  一级 7 + 组内 4 = 11 个 a（旧口径 6+4=10，verify 断言随功能事实同步）。
- **踩坑 1（gsap × CSS transform 叠加）**：面板 CSS 有 translateX(100%)，gsap 首次接管把它
  解析成独立 x 分量，与 xPercent:100 **相加**（起点 200%，fromTo 只覆盖 xPercent，终态卡在
  100% —— 「看起来动了却没到位」）。修复：applyClosed/close 显式写 x: 0。
- **踩坑 2（本机 CDP 环境三连）**：
  1) Node 全局 WebSocket 对 Edge 153 只 open 不回包 → 一律用 ws 包（managed workspace 路径
     import，同 music-e2e-s79.mjs）；
  2) 旧 profile 残留状态：Page.navigate 不回包 → 换全新 profile cwcdp-mute2；
  3) astro preview 只监听 [::1]:4321（IPv6），127.0.0.1 直连=chrome-error，且无头 Edge 会走
     系统代理拿 502 页 → 启动加 --no-proxy-server + 用 http://localhost:4321。
  （9222 启动命令不变：--headless=new --mute-audio，测试静音铁律仍守。）
- 回归：verify-nav-shrink **38/38**（移动端断言整体改写为新几何：贴边/全高/宽度 clamp/
  前导层 2 层就位/编号 opacity/滚动后 fixed 稳定）+ smoke **76/76**；截图目检通过。
- 归档：_shots/sm-drawer-open-s80.png（打开态截图）、_shots/diag2/3/4-sm80.mjs
  （定位探针）、verify/smoke/build 日志。
