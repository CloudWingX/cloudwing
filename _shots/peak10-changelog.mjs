// §77 changelog 追加：Peak 图集 +10
import { readFileSync, writeFileSync } from 'fs';
const P = 'src/content/changelog/2026-09-22.md';
let t = readFileSync(P, 'utf8');
const entry = `  - kind: '上线'
    title: 'Peak 图集新增 10 张截图'
    note: 'PEAK 拍立得大头贴与游玩瞬间入库（Steam 原图直存），Peak 图集 18 → 28 张，站点截图总数 122 → 132';
`;
const anchor = "  - kind: '上线'\n    title: '新增「壁纸」「AI生成」图集'";
if (!t.includes(anchor)) { console.error('ANCHOR_NOT_FOUND'); process.exit(1); }
// 在 items 列表末尾（frontmatter 的 --- 结束前）追加
const end = t.indexOf('---\n', t.indexOf(anchor));
t = t.slice(0, end) + entry + '\n' + t.slice(end);
writeFileSync(P, t);
console.log('CHANGELOG_OK');
console.log(readFileSync(P, 'utf8').split('\n').slice(-6).join('\n'));
