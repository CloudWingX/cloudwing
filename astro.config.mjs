// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cjsInlineShim from './plugins/vite-cjs-inline-shim.mjs';
import reactSafeUnmount from './plugins/vite-react-safe-unmount.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://cloudwing.top', // 主域（腾讯云注册，Cloudflare 全托管；pages.dev 仍并行服务）
  output: 'static',
  integrations: [
    react(),
    // 生成 sitemap-index.xml / sitemap-0.xml（全站页面）
    sitemap(),
  ],
  build: {
    // Cloudflare Pages 直接上传 dist/ 即可
    format: 'directory',
  },
  vite: {
    plugins: [
      // 修复 Astro 7.3 content sync 内联执行 CJS 依赖报 "require is not defined"
      cjsInlineShim(),
      // 修复软导航时卸载"尚未水合"的 React 岛抛 React error #424（见插件内注释）
      reactSafeUnmount(),
    ],
  },
});
