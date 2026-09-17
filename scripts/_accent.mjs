// 验证色卡：点击后是否补间（经过中间色）、代码 token 是否跟着变色、有无溢出
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';
const CDP = 'http://127.0.0.1:9222';
const BASE = process.argv[2] || 'http://127.0.0.1:4321';

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const p = new Map();
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); } };
const ev = async (x) => { const r = await s('Runtime.evaluate', { expression: x, returnByValue: true }); if (r.result && r.result.exceptionDetails) return 'ERR ' + ((r.result.exceptionDetails.exception || {}).description || '').split('\n')[0]; return r.result && r.result.result ? r.result.result.value : undefined; };
await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await s('Page.navigate', { url: BASE + '/' });
for (let i = 0; i < 90; i++) { await sleep(300); if (await ev(`!!document.querySelector('.code-preset')`)) break; }
await sleep(2200);

const PROBE = [
 "(function(){var rs=getComputedStyle(document.documentElement);var q=function(s){return document.querySelector(s);};",
 "var tok=q('.code-keyword'), str=q('.code-string'), num=q('.code-number');",
 "return JSON.stringify({",
 "  accent: rs.getPropertyValue('--accent').trim(),",
 "  tintC: rs.getPropertyValue('--tint-c').trim(),",
 "  tintA: rs.getPropertyValue('--tint-a').trim(),",
 "  codeKey: rs.getPropertyValue('--code-key').trim(),",
 "  tokKeywordColor: tok?getComputedStyle(tok).color:null,",
 "  tokStringColor: str?getComputedStyle(str).color:null,",
 "  tokNumberColor: num?getComputedStyle(num).color:null,",
 "  pressed: [].slice.call(document.querySelectorAll('.code-preset[aria-pressed=\"true\"]')).map(function(b){return b.textContent.trim();}),",
 "  presets: document.querySelectorAll('.code-preset').length,",
 "  footerH: Math.round((q('.code-footer')||{getBoundingClientRect:function(){return{height:0}}}).getBoundingClientRect().height),",
 "  cardH: Math.round(q('.code-card').getBoundingClientRect().height),",
 "  overflow: document.documentElement.scrollWidth-document.documentElement.clientWidth",
 "});})()"
].join('');

console.log('初始:', await ev(PROBE));

// 点「余烬」（第 4 个），高频采样看是否经过中间色
const started = await ev(`(function(){var b=document.querySelector('[data-accent-preset="ember"]'); if(!b) return 'no btn'; b.click(); return 'clicked';})()`);
console.log('点击余烬:', started);
const samples = [];
for (let i = 0; i < 14; i++) {
  await sleep(80);
  samples.push(await ev(`(function(){var rs=getComputedStyle(document.documentElement);
    return rs.getPropertyValue('--accent').trim()+' | tint '+rs.getPropertyValue('--tint-a').trim()+' | key '+rs.getPropertyValue('--code-key').trim();})()`));
}
console.log('过渡采样（每 80ms）:');
samples.forEach((x, i) => console.log(`  ${String(i * 80).padStart(4)}ms  ${x}`));
await sleep(1200);
console.log('\n终态:', await ev(PROBE));
const sh = await s('Page.captureScreenshot', { format: 'png' });
if (sh.result && sh.result.data) writeFileSync('D:\\deep seek workplace\\_shots\\cw-preset-ember.png', Buffer.from(sh.result.data, 'base64'));

// 换个预设 + 刷新看是否记住
await ev(`document.querySelector('[data-accent-preset="aurora"]').click()`);
await sleep(1400);
await s('Page.navigate', { url: BASE + '/' });
for (let i = 0; i < 90; i++) { await sleep(300); if (await ev(`!!document.querySelector('.code-preset')`)) break; }
await sleep(1800);
console.log('\n刷新后（应记住极光）:', await ev(PROBE));
const sh2 = await s('Page.captureScreenshot', { format: 'png' });
if (sh2.result && sh2.result.data) writeFileSync('D:\\deep seek workplace\\_shots\\cw-preset-aurora.png', Buffer.from(sh2.result.data, 'base64'));
ws.close();
