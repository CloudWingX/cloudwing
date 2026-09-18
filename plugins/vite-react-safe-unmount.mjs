// ============================================================================
// vite-react-safe-unmount.mjs
// ----------------------------------------------------------------------------
// 修「React error #424：This root received an early update, before anything was
// able to hydrate. Switched the entire root to client rendering.」
//
// 根因（2026-09-18 定位，实测证据见 docs/HANDOFF.md §37）：
//   1. Astro 的 astro-island 元素在被移出 DOM 时（**每次软导航都会发生**）派发
//      `astro:unmount`；
//   2. @astrojs/react 的渲染器在 hydrateRoot 后立刻注册
//      `element.addEventListener("astro:unmount", () => r.unmount())`；
//   3. 若此刻这个根**还没水合完**（`client:idle` 的岛、CPU/网络慢、或连续快速换页），
//      React 的 `updateHostRoot` 会把 unmount 当成 root.render(null) 的"早期更新"：
//      nextChildren(null) !== prevChildren(element) 且 root 仍 isDehydrated
//      → 抛 #424 并降级为整根客户端渲染。
//      实测栈：root.unmount → performWork → updateHostRoot → Error(424)。
//
// 修法（不改动 node_modules）：在构建期把上面那句 unmount 换成"先等水合、再卸载"。
//   判断依据：FiberRoot 的 `memoizedState.isDehydrated`（水合完成后 React 自己置 false）。
//   - 已水合 → 立刻 unmount（原行为，零成本）；
//   - 仍在脱水 → 每 30ms 轮询，水合完就 unmount；
//   - 1.5s 仍未水合（后台标签页等极端情况）→ 放弃卸载：未水合的根没跑过 useEffect，
//     不会留下监听器，放弃也不会泄漏交互。
//
// ⚠️ 本插件靠**精确字符串**改上游文件，升级 @astrojs/react 后如果匹配不上会大声告警
//    （不静默跳过）—— 那时请重新核对 dist/client.js 的这段源码。
// ============================================================================
import { normalize, sep } from 'node:path';

const NEEDLE = 'element.addEventListener("astro:unmount", () => r.unmount(), { once: true });';

const HELPER = `
// ↓↓↓ 由 plugins/vite-react-safe-unmount.mjs 注入（修 React #424）↓↓↓
function __cwSafeUnmount(root) {
  var fr = root && root._internalRoot;
  var readState = function () { return (fr && fr.current && fr.current.memoizedState) || null; };
  var st = readState();
  // 已水合（或拿不到内部状态，保守按原行为处理）→ 直接卸载
  if (!st || !st.isDehydrated) { root.unmount(); return; }
  var t0 = Date.now();
  var tick = function () {
    var s = readState();
    // 超时仍未水合：放弃卸载（未水合 = 没跑过 useEffect，不会留下监听器）
    if (s && s.isDehydrated && Date.now() - t0 > 1500) return;
    if (s && s.isDehydrated) { setTimeout(tick, 30); return; }
    try { root.unmount(); } catch (e) { /* 忽略：卸载失败不影响页面 */ }
  };
  setTimeout(tick, 30);
}
// ↑↑↑ 注入结束 ↑↑↑
`;

function isTarget(id) {
  if (!id || typeof id !== 'string') return false;
  const norm = normalize(id).split(sep).join('/');
  return norm.includes('@astrojs/react/dist/client.js');
}

export default function reactSafeUnmount() {
  let warned = false;
  // CW_DISABLE_SAFE_UNMOUNT=1：关掉本补丁，用来做 A/B（证明 #424 真是由它消除的）。
  const disabled = process.env.CW_DISABLE_SAFE_UNMOUNT === '1';
  return {
    name: 'cw-react-safe-unmount',
    enforce: 'pre',
    transform(code, id) {
      if (disabled || !isTarget(id)) return null;
      const hits = code.split(NEEDLE).length - 1;
      if (hits !== 2 && !warned) {
        warned = true;
        console.warn(
          `\n[cw-react-safe-unmount] ⚠️ 未能在 @astrojs/react/dist/client.js 里匹配到 2 处 ` +
            `astro:unmount 注册（实际 ${hits} 处）。#424 修复未生效 —— 请核对上游文件后更新本插件。\n`
        );
        return null;
      }
      const patched = code.replaceAll(NEEDLE, 'element.addEventListener("astro:unmount", () => __cwSafeUnmount(r), { once: true });') + HELPER;
      return { code: patched, map: null };
    },
  };
}
