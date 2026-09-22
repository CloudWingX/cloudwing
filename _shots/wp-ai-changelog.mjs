// 一次性：changelog 追加「壁纸/AI生成」条目
import fs from 'node:fs';
const p = 'D:/deep seek workplace/endfield-blog/src/content/changelog/2026-09-22.md';
let t = fs.readFileSync(p, 'utf-8');
const eol = t.includes('\r\n') ? '\r\n' : '\n';
const q = (s) => "'" + s + "'";
const item = [
  '  - kind: ' + q('上线'),
  '    title: ' + q('新增「壁纸」「AI生成」图集'),
  '    note: ' + q('微信收藏壁纸 14 张（竖版为主）与 AI 生成贴纸 9 张入库，画廊文件夹墙长到 5 个文件夹；截图总数 99 → 122'),
].join(eol);
t = t.replace(/(\r?\n)---\s*$/, eol + item + eol + '---' + eol);
fs.writeFileSync(p, t, 'utf-8');
console.log('CHANGELOG_OK');
