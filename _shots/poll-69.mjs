// §69 部署轮询：热榜数据源改造（禁 chunk 哈希判断 —— poll-deploy 规则 #1）
// 特征：① 线上 /api/gh-hot.json 存在且四周期 items>0（CF 构建时 fetch-ghhot 重新生成）
//      ② 首页 JS chunk 不再含 api.github.com/search（旧直连已移除）
//      ③ 防回滚：CSS 仍含 --w-max:1600px（§68 特征健在）
import fs from 'node:fs';

const BASE = 'https://cloudwing.pages.dev';
const MAX_ROUNDS = 30;
const INTERVAL_MS = 20000;
const lines = [];
const say = (m) => { lines.push(`[${new Date().toISOString()}] ${m}`); };
const bust = () => `?poll=${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function get(url) {
  const r = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

let ok = false;
for (let round = 1; round <= MAX_ROUNDS && !ok; round++) {
  try {
    const raw = await get(`${BASE}/api/gh-hot.json${bust()}`);
    const snap = JSON.parse(raw);
    const ps = snap.periods || {};
    const four = ['daily', 'weekly', 'monthly', 'yearly']
      .filter((k) => Array.isArray(ps[k]?.items) && ps[k].items.length > 0).length;
    say(`r${round} snapshot ok=${four}/4 generatedAt=${snap.generatedAt}`);
    if (four !== 4) continue;

    const html = await get(`${BASE}/${bust()}`);
    const jss = [...html.matchAll(/<script[^>]+src="(\/_astro\/[^"]+\.js[^"]*)"/g)].map((x) => x[1]);
    let legacy = false;
    for (const j of jss) {
      const t = await get(j.startsWith('http') ? j : `${BASE}${j}${bust()}`);
      if (/api\.github\.com\/search/.test(t)) { legacy = true; break; }
    }
    say(`r${round} jsChunks=${jss.length} legacyDirectGithub=${legacy}`);
    if (legacy) continue;

    const cssLinks = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css[^"]*)"/g)].map((x) => x[1]);
    let css = '';
    for (const c of cssLinks) css += await get(c.startsWith('http') ? c : `${BASE}${c}${bust()}`);
    const w1600 = /--w-max:\s*1600px/.test(css);
    say(`r${round} css --w-max:1600px=${w1600}`);
    if (!w1600) continue;

    ok = true;
    say(`DEPLOYED ✔ round=${round}`);
  } catch (e) {
    say(`r${round} ERR ${e.message}`);
  }
  if (!ok && round < MAX_ROUNDS) await new Promise((r) => setTimeout(r, INTERVAL_MS));
}
if (!ok) say('TIMEOUT ✘ 特征未上线');
fs.writeFileSync(new URL('./poll-69.log', import.meta.url), lines.join('\n') + '\n', 'utf-8');
console.log(lines.join('\n'));
process.exit(ok ? 0 : 1);
