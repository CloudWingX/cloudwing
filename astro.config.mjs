// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cjsInlineShim from './plugins/vite-cjs-inline-shim.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://example.com', // TODO: 换成你的正式域名，如 https://yourname.com
  output: 'static',
  integrations: [react()],
  build: {
    // Cloudflare Pages 直接上传 dist/ 即可
    format: 'directory',
  },
  vite: {
    plugins: [
      // 修复 Astro 7.3 content sync 内联执行 CJS 依赖报 "require is not defined"
      cjsInlineShim(),
    ],
  },
});
