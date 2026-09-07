// ============================================================================
// vite-cjs-inline-shim.mjs
// ----------------------------------------------------------------------------
// 背景：Astro 7.3 的 content sync（glob 内容加载器）在其 module-runner 里把
// node_modules 依赖当 ESM「内联执行」。纯 CJS 依赖没有 require 上下文，会直接抛
// "require is not defined"（本站实际命中的是 tinyglobby -> picomatch 链）。
//
// 本插件在 Vite 转换管线最前端，对目标包内的 .js 文件套一层 CommonJS 兼容壳：
//   - 用 node:module 的 createRequire(import.meta.url) 提供真正可用的 require；
//   - 注入 module / exports / __filename / __dirname；
//   - 末尾 export default module.exports，转为 ESM 默认导出。
// 这样 CJS 源码原样在 ESM 执行器里也能跑，不需要修改 node_modules 里的任何文件。
//
// 如需扩展，把包名加进 SHIM_PACKAGES 即可（只匹配 node_modules/<pkg>/ 下的 .js）。
// ============================================================================
import { dirname, normalize, sep } from 'node:path';

const SHIM_PACKAGES = ['picomatch'];

function isTarget(id) {
  if (!id || typeof id !== 'string' || !id.endsWith('.js')) return false;
  const norm = normalize(id).split(sep).join('/');
  const marker = '/node_modules/';
  const idx = norm.lastIndexOf(marker);
  if (idx === -1) return false;
  const seg = norm.slice(idx + marker.length).split('/');
  return seg.length >= 2 && SHIM_PACKAGES.includes(seg[0]);
}

export default function cjsInlineShim() {
  return {
    name: 'cjs-inline-shim',
    enforce: 'pre',
    transform(code, id) {
      if (!isTarget(id)) return null;
      const file = normalize(id);
      return {
        code: [
          "import { createRequire } from 'node:module';",
          `const __filename = ${JSON.stringify(file)};`,
          `const __dirname = ${JSON.stringify(dirname(file))};`,
          'const module = { exports: {} };',
          'const exports = module.exports;',
          'const require = createRequire(import.meta.url);',
          code,
          'export default module.exports;',
        ].join('\n'),
        map: null,
      };
    },
  };
}
