import { spawnSync } from 'node:child_process';

const NODE = 'C:/Users/24645/.workbuddy/binaries/node/versions/22.22.2-3/node.exe';
const scripts = [
  'smoke', 'verify-hero', 'verify-home', 'verify-nav-shrink', 'verify-nav',
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
