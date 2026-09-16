// 验证首页 01 板块的堆叠卡片（CardSwap）几何是否正常。
// 覆盖历史 bug：卡片被容器/板块裁切、跑出内容列、顶到导航栏、压到下一板块、横向溢出。
// 用法：node scripts/verify-deck.mjs [baseUrl] [light|dark]
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const THEME = process.argv[3] === 'light' ? 'light' : 'dark';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const WIDTHS = [1440, 1280, 1100, 390];

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const p = new Map(); const errs = [];
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push((((m.params.exceptionDetails.exception || {}).description) || '').slice(0, 100));
  if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
};
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: THEME }] });
await s('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('cw-theme-pref','${THEME}');}catch(e){}` });

for (const w of WIDTHS) {
  await s('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 700 });
  await s('Page.navigate', { url: BASE + '/' });
  const waitFor = async (x, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(400); } return false; };
  await waitFor(`!!document.querySelector('.works-deck-inner')`);
  // 滚到"板块正好完整可见"
  await ev(`(()=>{const b=document.querySelector('.works-block'); scrollTo(0, b.getBoundingClientRect().top+scrollY-140);})()`);
  await sleep(2200);

  const d = await ev(`(()=>{
    const cards=[...document.querySelectorAll('.works-block .card')];
    const rects=cards.map(c=>{const b=c.getBoundingClientRect(); return {top:b.top,bottom:b.bottom,left:b.left,right:b.right};});
    const deck=document.querySelector('.works-deck-inner').getBoundingClientRect();
    const deckC=document.querySelector('.card-swap-container').getBoundingClientRect();
    const wrap=document.querySelector('.works-block .wrap').getBoundingClientRect();
    const block=document.querySelector('.works-block').getBoundingClientRect();
    const nav=document.querySelector('.site-header').getBoundingClientRect();
    const next=document.querySelector('.gallery-block')?.getBoundingClientRect();
    return {w:innerWidth, 卡片数:cards.length,
      最高卡片top:Math.min(...rects.map(r=>r.top)), 最低卡片bottom:Math.max(...rects.map(r=>r.bottom)),
      最左:Math.min(...rects.map(r=>r.left)), 最右:Math.max(...rects.map(r=>r.right)),
      容器:{left:deckC.left,right:deckC.right,top:deckC.top,bottom:deckC.bottom},
      牌堆:{left:deck.left,right:deck.right,top:deck.top,bottom:deck.bottom},
      文本列:{left:wrap.left,right:wrap.right}, 板块:{top:block.top,bottom:block.bottom,left:block.left,right:block.right},
      导航bottom:nav.bottom, 下一板块top:next?next.top:null,
      卡面:getComputedStyle(cards[0]).backgroundImage,
      溢出:document.documentElement.scrollWidth-document.documentElement.clientWidth,};})()`);

  console.log(`\n=== 视口 ${d.w}px（主题 ${THEME}）===`);
  console.log(`  卡片数=${d.卡片数} 最右=${Math.round(d.最右)} 内容列右=${Math.round(d.文本列.right)} 容器=[${Math.round(d.容器.left)},${Math.round(d.容器.right)}]`);
  check(`${d.w}px：三张卡片都在`, d.卡片数 === 3, String(d.卡片数));
  // 卡片必须完整落在**板块**内：CardSwap 容器是 overflow:visible，
  // 真正会裁切的是板块的 overflow:clip，所以判据看 .works-block 的边界（含 padding）。
  check(`${d.w}px：卡片完整落在板块内（不被 overflow:clip 裁切）`,
    d.最右 <= d.板块.right + 1 && d.最左 >= d.板块.left - 1 &&
    d.最高卡片top >= d.板块.top - 1 && d.最低卡片bottom <= d.板块.bottom + 1,
    `卡顶=${Math.round(d.最高卡片top)} 板块顶=${Math.round(d.板块.top)}；卡右=${Math.round(d.最右)} 板块右=${Math.round(d.板块.right)}`);
  // 与页面栅格对齐：不跑出内容列
  check(`${d.w}px：卡片不超出内容列（与页面栅格对齐）`,
    d.最右 <= d.文本列.right + 1 && d.最左 >= d.文本列.left - 1,
    `卡右=${Math.round(d.最右)} 列右=${Math.round(d.文本列.right)}`);
  // 不压到导航栏（导航可见时）
  check(`${d.w}px：卡片不被导航栏压住`, d.导航bottom <= 0 || d.最高卡片top >= d.导航bottom,
    `卡顶=${Math.round(d.最高卡片top)} 导航底=${Math.round(d.导航bottom)}`);
  // 不压到下一板块
  check(`${d.w}px：卡片不压到下一板块`, d.下一板块top === null || d.最低卡片bottom <= d.下一板块top,
    `卡底=${Math.round(d.最低卡片bottom)} 下一板块顶=${d.下一板块top === null ? '-' : Math.round(d.下一板块top)}`);
  check(`${d.w}px：无横向溢出`, d.溢出 === 0, `overflowX=${d.溢出}`);
  // 卡面必须不透明：半透明会让后排文字透出来（历史上看起来像两行字叠在一起）
  check(`${d.w}px：卡面不透明（后排文字不会透出）`, !/rgba\([^)]*,\s*0\.\d+\)/.test(d.卡面) || d.卡面.includes('linear-gradient'), d.卡面.slice(0, 46));
}

check('全程无 JS 异常', errs.length === 0, errs[0] || '');
const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
