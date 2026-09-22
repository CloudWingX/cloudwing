// §67.9 + §68 部署轮询：特征判断（禁止 chunk 哈希判断 —— poll-deploy 规则 #1）
// 层1: 首页 HTML → CSS 链接; 层2: CSS 含 --w-max:1600px / max-width:1600px / max-width:1440px, 反向不含 --w-max:1300px
// 层3: 首页 JS chunk 含 __sideBound(§67.9 共享音频); 对照: /music/ 含 data-music-page
import fs from 'node:fs';

const BASE = 'https://cloudwing.pages.dev';
const MAX_ROUNDS = 30;
const INTERVAL_MS = 20000;
const LOG = new URL('./poll-679-68.log', import.meta.url);

const lines = [];
const say = (m) => { lines.push(`[${new Date().toISOString()}] ${m}`); };

const bust = () => `?poll=${Date.now()}-${Math.random().toString(36).slice(2)}`;

async function get(url) {
  const r = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

function cssLink(html) {
  const m = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+\.css[^"]*)"/g)]
    .map((x) => x[1]);
  return m.length ? m : null;
}

function jsLinks(html) {
  const m = [...html.matchAll(/<script[^>]+src="(\/_astro\/[^"]+\.js[^"]*)"/g)].map((x) => x[1]);
  return m;
}

let ok = false;
for (let round = 1; round <= MAX_ROUNDS && !ok; round++) {
  try {
    const html = await get(`${BASE}/${bust()}`);
    const css = cssLink(html);
    say(`r${round} cssLinks=${JSON.stringify(css)}`);
    if (!css) { say(`r${round} no css link`); continue; }

    let cssText = '';
    for (const c of css) cssText += await get(c.startsWith('http') ? c : `${BASE}${c}${bust()}`);

    const has1600 = /--w-max:\s*1600px/.test(cssText);
    const no1300 = !/--w-max:\s*1300px/.test(cssText);
    const wrap1600 = /max-width:\s*1600px/.test(cssText);
    const hdr1440 = /max-width:\s*1440px/.test(cssText);
    say(`r${round} css: w1600=${has1600} no1300=${no1300} wrap1600=${wrap1600} hdr1440=${hdr1440}`);
    if (!(has1600 && no1300 && wrap1600 && hdr1440)) continue;

    // JS chunk: __sideBound（§67.9 共享音频单例）
    const jss = jsLinks(html);
    say(`r${round} jsChunks=${jss.length}`);
    let sideBound = false;
    for (const j of jss) {
      const t = await get(j.startsWith('http') ? j : `${BASE}${j}${bust()}`);
      if (t.includes('__sideBound')) { sideBound = true; break; }
    }
    say(`r${round} js: __sideBound=${sideBound}`);
    if (!sideBound) continue;

    // 对照页: /music/ data-music-page
    const music = await get(`${BASE}/music/${bust()}`);
    const ctl = music.includes('data-music-page');
    say(`r${round} control /music/: data-music-page=${ctl} len=${music.length}`);
    if (!ctl) continue;

    ok = true;
    say(`DEPLOYED ✔ round=${round}`);
  } catch (e) {
    say(`r${round} ERR ${e.message}`);
  }
  if (!ok && round < MAX_ROUNDS) await new Promise((r) => setTimeout(r, INTERVAL_MS));
}
if (!ok) say('TIMEOUT ✘ 特征未上线');
fs.writeFileSync(LOG, lines.join('\n') + '\n', 'utf-8');
console.log(lines.join('\n'));
process.exit(ok ? 0 : 1);
