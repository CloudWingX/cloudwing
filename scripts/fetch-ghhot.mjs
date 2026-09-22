// 构建前置：GitHub 热榜快照抓取（§69，2026-09-22 站长要求「换掉直连 api.github.com，
// 不要再出现接口限流和网络问题」）。
//
// 方案：访客端不再请求 api.github.com，只请求同域静态 /api/gh-hot.json（本脚本产物）。
//   - CF Pages 构建时在本脚本里拉 GitHub Search API（CF 数据中心 → GitHub，稳、快，
//     每次部署仅 4 个请求，远低于任何限流阈值）；本地构建拉不动时沿用 git 里的上次快照。
//   - 脚本设计为「永不失败」：任一周期成功就更新该周期，失败保留旧数据，退出码恒 0，
//     绝不阻塞构建。
//   - 查询语义与前端渲染完全一致（期间内新建仓库按 star 排序，stars:>10，per_page 8），
//     桶起点按北京时间（GMT+8）计算，与站长/访客的主时区一致。
//
// 产物：public/api/gh-hot.json
//   { generatedAt, periods: { daily|weekly|monthly|yearly: { start, items: [..] } } }
//   items 字段：{ name, url, stars, lang, desc }（前端 render 直接消费）。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'api', 'gh-hot.json');
const N = 8;
const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];

const pad = (n) => String(n).padStart(2, '0');
/* 北京时间（GMT+8）的「今天/本周一/本月1日/今年1月1日」，格式 YYYY-MM-DD */
function bjStart(period) {
  const now = new Date(Date.now() + 8 * 3600 * 1000); // 平移到北京时间的 UTC 分量
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  if (period === 'daily') return `${y}-${pad(m + 1)}-${pad(d)}`;
  if (period === 'weekly') {
    const mon = new Date(Date.UTC(y, m, d - ((now.getUTCDay() + 6) % 7)));
    return `${mon.getUTCFullYear()}-${pad(mon.getUTCMonth() + 1)}-${pad(mon.getUTCDate())}`;
  }
  if (period === 'monthly') return `${y}-${pad(m + 1)}-01`;
  return `${y}-01-01`;
}

const mapItem = (it) => ({
  name: it.full_name,
  url: it.html_url,
  stars: it.stargazers_count || 0,
  lang: it.language || '',
  desc: it.description || '',
});

async function fetchOnce(url, tries = 3) {
  for (let i = 1; i <= tries; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const r = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'cloudwing-build' },
      });
      if (!r.ok) throw new Error(`http ${r.status}`);
      const res = await r.json();
      const items = (res.items || []).map(mapItem);
      if (!items.length) throw new Error('empty');
      return items;
    } catch (e) {
      console.warn(`[ghhot] round ${i} failed: ${e.message}`);
      /* 403 = 无鉴权限流窗口未过：拉长等待等窗口滚动（CF 构建几乎不会走到） */
      if (i < tries) await new Promise((r2) => setTimeout(r2, /403/.test(e.message) ? 25000 : 2000));
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

/* 单周期：daily 在「当天新建且 star>10」为空时回退昨日（凌晨构建时当天尚无爆款是真实
   数据稀疏，不是故障；榜单语义 = 最近一天新建即爆的仓库），其余周期空即空 */
async function fetchPeriod(period, start) {
  const urlFor = (s) =>
    `https://api.github.com/search/repositories?q=${encodeURIComponent(`created:>=${s} stars:>10`)}&sort=stars&order=desc&per_page=${N}`;
  const items = await fetchOnce(urlFor(start));
  if (items || period !== 'daily') return items;
  const yst = new Date(Date.now() + 8 * 3600 * 1000 - 86400000);
  const fallback = `${yst.getUTCFullYear()}-${pad(yst.getUTCMonth() + 1)}-${pad(yst.getUTCDate())}`;
  console.warn(`[ghhot] daily empty on ${start} -> fallback ${fallback}`);
  const items2 = await fetchOnce(urlFor(fallback));
  return items2 ? { __start: fallback, items: items2 } : null;
}

/* 主流程：读旧快照 → 逐周期更新 → 写回（全部失败则不动旧文件） */
async function main() {
  const prev = (() => {
    try { return JSON.parse(fs.readFileSync(OUT, 'utf-8')); } catch { return null; }
  })();
  const periods = (prev && prev.periods) || {};
  let okCount = 0;
  for (const p of PERIODS) {
    const start = bjStart(p);
    const got = await fetchPeriod(p, start); /* 必须等待：否则 Promise 恒真造成假阳性 */
    if (got) {
      /* daily 回退昨日时返回 { __start, items }，普通成功返回数组 */
      const items = Array.isArray(got) ? got : got.items;
      const realStart = Array.isArray(got) ? start : got.__start;
      periods[p] = { start: realStart, items };
      okCount++;
    }
    /* 失败：保留旧 periods[p]（若有） */
  }
  if (okCount === 0 && !prev) {
    console.warn('[ghhot] 全部周期失败且无旧快照 —— 不产出文件，前端将显示重试态；构建继续');
    return;
  }
  if (okCount === 0) {
    console.warn('[ghhot] 全部周期失败 —— 沿用上次快照（git 内），构建继续');
    return;
  }
  const out = { generatedAt: new Date().toISOString(), periods };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out), 'utf-8');
  console.log(`[ghhot] ok ${okCount}/4 periods -> public/api/gh-hot.json (generatedAt=${out.generatedAt})`);
}

main();
