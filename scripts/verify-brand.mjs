// 品牌标志验收：导航栏与页脚是否用上品牌稿的标志、颜色是否正确、尺寸是否合理。
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const TAG = process.argv[3] || 'brand';

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const p = new Map(); const errs = [];
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push((((m.params.exceptionDetails.exception || {}).description) || '').slice(0, 90));
  if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
};
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };
const waitFor = async (x, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(400); } return false; };

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Page.navigate', { url: BASE + '/blog/' });
await waitFor(`!!document.querySelector('.logo')`);
await sleep(2500);

console.log('=== 导航栏品牌标志 ===');
const brand = await ev(`(()=>{
  const b=document.querySelector('.logo');
  const svg=b.querySelector('svg.brandmark');
  if(!svg) return {有标志:false};
  const r=svg.getBoundingClientRect();
  const cs=getComputedStyle(svg);
  const cloud=svg.querySelector('g[fill] rect, rect');
  const wing=svg.querySelector('g[stroke]');
  return {
    有标志:true,
    宽高:Math.round(r.width)+'×'+Math.round(r.height),
    viewBox:svg.getAttribute('viewBox'),
    云体色:cloud?getComputedStyle(cloud).fill:null,
    羽翼色:wing?getComputedStyle(wing.querySelector('path')).stroke:null,
    中文站名:!!b.querySelector('.bname'),
    旧六边形:document.querySelectorAll('.logo .hex').length,
  };})()`);
console.log('  ' + JSON.stringify(brand));
check('导航栏使用品牌标志', brand.有标志 === true);
check('用的是横版字标（viewBox 355.06×58）', String(brand.viewBox).startsWith('0 0 355.06 58'), String(brand.viewBox));
check('云体为品牌稿纸白 #F4F7FA', /244,\s*247,\s*250/.test(String(brand.云体色)), String(brand.云体色));
check('羽翼为品牌稿雾蓝 #9FD3E8', /159,\s*211,\s*232/.test(String(brand.羽翼色)), String(brand.羽翼色));
check('旧六边形标志已移除', brand.旧六边形 === 0, String(brand.旧六边形));
check('标志高度合理（20px，照参考的字标高度）', (() => { const h = parseInt(brand.宽高.split('×')[1]); return h === 20; })(), brand.宽高);

console.log('\n=== 页脚品牌 ===');
// 2026-09-19 需求：移除各页面页脚 —— 改为校验页脚确实不存在。
const footGone = await ev(`!document.querySelector('.site-footer')`);
check('页脚已按 2026-09-19 需求移除', footGone === true, String(footGone));

console.log('\n=== 不遮挡 / 不溢出 ===');
check('无横向溢出', (await ev(`document.documentElement.scrollWidth-document.documentElement.clientWidth`)) === 0);
check('标志未超出导航胶囊', await ev(`(()=>{const s=document.querySelector('.logo svg').getBoundingClientRect();
  const hd=document.querySelector('.header-container').getBoundingClientRect();
  return s.top>=hd.top-1 && s.bottom<=hd.bottom+1 && s.left>=hd.left-1 && s.right<=hd.right+1;})()`) === true);
check('无 JS 异常', errs.length === 0, errs[0] || '');

const shot = await s('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) { writeFileSync(`D:\\deep seek workplace\\_shots\\${TAG}.png`, Buffer.from(shot.result.data, 'base64')); console.log(`\n  ✓ ${TAG}.png`); }

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
