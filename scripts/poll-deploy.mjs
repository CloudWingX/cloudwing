// 推送后轮询线上，直到"本次改动的内容特征"在线上都成立为止。
//
// 用法（特征由你自己给，脚本里**不存任何默认特征** —— 那种默认值一定会过期）：
//   node scripts/poll-deploy.mjs --have '--w-max:\s*1300px' --not 'hero::before'
//   node scripts/poll-deploy.mjs --url https://cloudwing.pages.dev --timeout 480 \
//        --have 'brightness\(var\(--vid-dim' --not '--scrim-top' --not '60% 50% at 30% ?-10%'
//
// 为什么必须这么确认（两条踩过的坑，见 CODEX「构建 / 部署坑」第 6 条 / HANDOFF §7.5）：
//   1. **不要用 chunk 哈希判断部署** —— 本地与线上哈希可能不同（npm install 解析差异）。
//   2. **检查范围必须含"首页自己引用的 CSS"** —— 首页样式和 /works/ 不在同一个 chunk，
//      只看 /works/ 会得出"没上线"的假结论。
//   3. **删除类的改动只有反向特征**（"线上找不到某字符串"），正向特征一个都没有 ——
//      用 --not 表达。四轮删掉 .hero::before 那次就是这样确认的。
//
// 退出码：0 = 全部成立；1 = 超时（会打印最后一次的逐项结果）。
import { setTimeout as sleep } from 'node:timers/promises';

const argv = process.argv.slice(2);
const opt = { url: 'https://cloudwing.pages.dev', page: '/', timeout: 480, interval: 15, have: [], not: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--have') opt.have.push(argv[++i]);
  else if (a === '--not') opt.not.push(argv[++i]);
  else if (a === '--url') opt.url = argv[++i];
  else if (a === '--page') opt.page = argv[++i];
  else if (a === '--timeout') opt.timeout = +argv[++i];
  else if (a === '--interval') opt.interval = +argv[++i];
  else { console.error('未知参数: ' + a); process.exit(2); }
}
if (!opt.have.length && !opt.not.length) {
  console.error('至少给一个 --have 或 --not 特征（脚本故意不提供默认特征，避免过期）。');
  process.exit(2);
}
const base = opt.url.replace(/\/$/, '');

async function probe() {
  const html = await (await fetch(base + opt.page, { cache: 'no-store' })).text();
  const links = [...new Set([...html.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)].map((m) => m[1]))];
  const parts = [];
  for (const l of links) parts.push(await (await fetch(base + l, { cache: 'no-store' })).text());
  const css = parts.join('\n');
  const checks = [
    ...opt.have.map((re) => [`have ${re}`, new RegExp(re).test(html + '\n' + css)]),
    ...opt.not.map((re) => [`not  ${re}`, !new RegExp(re).test(html + '\n' + css)]),
  ];
  return { checks, cssLen: css.length, chunks: links.length };
}

const t0 = Date.now();
let last = null;
while (Date.now() - t0 < opt.timeout * 1000) {
  try {
    last = await probe();
    const bad = last.checks.filter(([, ok]) => !ok);
    const secs = Math.round((Date.now() - t0) / 1000);
    console.log(`[${secs}s] HTML+CSS 共 ${last.cssLen} 字节 / ${last.chunks} 个 chunk；未通过 ${bad.length} 项` +
      (bad.length ? ' → ' + bad.map(([n]) => n).join(' , ') : ''));
    if (!bad.length) {
      console.log('\n✅ 线上已是本次构建：');
      last.checks.forEach(([n, ok]) => console.log(`   ${ok ? '✅' : '❌'} ${n}`));
      process.exit(0);
    }
  } catch (e) {
    console.log('  请求失败（继续重试）：' + e.message);
  }
  await sleep(opt.interval * 1000);
}
console.log(`\n⏱ ${opt.timeout}s 内没等到全部特征。最后一次：`);
last?.checks.forEach(([n, ok]) => console.log(`   ${ok ? '✅' : '❌'} ${n}`));
console.log('（CF 构建通常 30~90 秒；先确认推送真的成功：git ls-remote origin main）');
process.exit(1);
