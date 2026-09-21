// push-retry.mjs — git push 带真实间隔重试（bash 无 sleep；直连 443 间歇不可达）
import { execFileSync } from 'node:child_process';

const REPO = 'D:/deep seek workplace/endfield-blog'; // 本机 bash 缺 cd，用 git -C 免依赖 cwd
const ok = () => {
  try {
    execFileSync('git', ['-C', REPO, '-c', 'http.proxy=', '-c', 'https.proxy=', 'push', 'origin', 'main'],
      { stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 });
    return true;
  } catch (e) {
    const tail = String(e.stderr || e.message || '').trim().split('\n').slice(-2).join(' | ');
    if (tail) console.log('  err: ' + tail.slice(0, 200));
    return false;
  }
};
for (let i = 1; i <= 12; i++) {
  if (ok()) { console.log('PUSH_OK round ' + i); process.exit(0); }
  console.log('round ' + i + ' failed at ' + new Date().toISOString());
  await new Promise(r => setTimeout(r, 30000));
}
console.log('ALL_ROUNDS_FAILED');
process.exit(1);
