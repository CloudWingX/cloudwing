import { spawnSync } from 'node:child_process';

const NODE = 'C:/Users/24645/.workbuddy/binaries/node/versions/22.22.2-3/node.exe';
// 最前面两个是**纯 Node**（只读源码 + 已构建的 dist，不需要无头浏览器），最便宜，
// 也最该先跑 —— 文案漂移是唯一"几何全绿却带着错东西上线"的缺陷类（HANDOFF §32），
// 图标"声明了但文件不在"是同类的静态缺口（HANDOFF §48.6）。
const scripts = [
  'verify-copy',
  'verify-nav-icons',
  'smoke',
  // 交互基线（禁拖选 / 点击不出轮廓 / 键盘轮廓保留，HANDOFF §49）——放在 smoke 之后：
  // smoke 先证明"页面本身是好的"，再验"操作姿势"这一层。
  'verify-interaction',
  'verify-log',
  'verify-hero', 'verify-home', 'verify-nav-shrink', 'verify-nav',
  'verify-brand', 'verify-theme', 'verify-redesign', 'verify-search',
  'verify-videobg', 'verify-videobg-global', 'contrast-audit',
  'mobile-shots', 'diag-errors', 'diag-424',
];

let fails = 0;
for (const s of scripts) {
  const r = spawnSync(NODE, [`scripts/${s}.mjs`], { encoding: 'utf8', timeout: 300000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const lines = out.split(/\r?\n/).filter(l => l.trim()).slice(-3).join('\n');
  const ok = r.status === 0;
  if (!ok) fails++;
  console.log(`===== ${s} ===== ${ok ? 'PASS' : 'FAIL(' + r.status + ')'}`);
  console.log(lines);
  console.log('');
}
console.log(`\n总结: ${scripts.length - fails}/${scripts.length} 通过`);
