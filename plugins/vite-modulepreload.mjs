// §83.4（2026-09-25）：为页面引用的全部 module 脚本注入 modulepreload——
// 手机慢网络上让交互 JS（Base 43KB/ui.js 等）在 head 解析时即以高优先级起拉。
// 无 hash 依赖：构建完成后从落盘 HTML 现场提取。
// 注意：Astro 静态页的 HTML 不经 vite 的 transformIndexHtml/generateBundle（实测都不触发），
// 必须用 Astro integration 的 astro:build:done 钩子直接改写磁盘上的 HTML 文件。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export default function modulePreload() {
  return {
    name: 'cw-modulepreload',
    hooks: {
      'astro:build:done': async ({ dir, pages, logger }) => {
        const outDir = fileURLToPath(dir); // dir 是 URL 对象，pathname 含 %20 编码，必须转路径
        let n = 0;
        for (const page of pages) {
          const file = path.join(outDir, page.pathname.replace(/\/?$/, '/'), 'index.html');
          if (!fs.existsSync(file)) continue;
          let html = fs.readFileSync(file, 'utf8');
          if (html.includes('modulepreload')) continue; // 幂等
          const srcs = [...html.matchAll(/<script type="module" src="([^"]+)"/g)].map((m) => m[1]);
          if (!srcs.length) continue;
          const links = [...new Set(srcs)].map((u) => `<link rel="modulepreload" href="${u}">`).join('');
          html = html.replace(/<head([^>]*)>/, `<head$1>${links}`);
          fs.writeFileSync(file, html);
          n++;
        }
        logger.info(`modulepreload 注入 ${n} 页`);
      },
    },
  };
}
