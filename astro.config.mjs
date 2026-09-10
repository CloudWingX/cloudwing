// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import cjsInlineShim from './plugins/vite-cjs-inline-shim.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://cloudwing.pages.dev', // 线上地址（Cloudflare Pages）
  output: 'static',
  integrations: [
    react(),
    // 生成 sitemap-index.xml / sitemap-0.xml（搜索页不参与收录）
    sitemap({
      filter: (page) => !page.includes('/search/'),
    }),
  ],
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
