// 播放器功能验证：播放/暂停、进度、下一首/上一首、切页不中断、进度条跳转。
// 用法：node scripts/verify-music.mjs [baseUrl]
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/blog/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map(); const errs = [];
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
// 允许无声自动播放，避免被策略拦掉影响断言
await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__cwTestAllowAudio=true;` });

const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value;
const state = async () => ev(`(()=>{const a=window.__cwMusic&&window.__cwMusic.audio; const c=document.querySelector('[data-music]');
  return { 有音频: !!a, src: a?a.src.split('/').pop():null, 暂停: a?a.paused:null, 当前时间: a?+(a.currentTime||0).toFixed(2):null,
    时长: a&&isFinite(a.duration)?+a.duration.toFixed(2):null, 卡片状态: c?c.dataset.state:null,
    曲名: c?c.querySelector('[data-mu-title]')?.textContent:null, 序号: c?c.querySelector('[data-mu-no]')?.textContent:null,
    进度宽: c?c.querySelector('[data-mu-fill]')?.style.width:null, 时间显示: c?c.querySelector('[data-mu-cur]')?.textContent:null,
    总时长显示: c?c.querySelector('[data-mu-dur]')?.textContent:null };})()`);

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`  ${ok ? '✅' : '❌'} ${name}${detail ? '  —— ' + detail : ''}`); };

console.log('=== 初始状态 ===');
await send('Page.navigate', { url: BASE + '/blog/' });
await sleep(4000);
const s0 = await state();
console.log('  ' + JSON.stringify(s0));
check('音频单例已创建', s0.有音频 === true);
check('默认加载第一首', s0.src === '__test__.wav', String(s0.src));
check('初始为暂停', s0.暂停 === true);
check('时长已知（元数据已加载）', s0.时长 > 5 && s0.时长 < 7, String(s0.时长));

console.log('\n=== 播放 ===');
await ev(`document.querySelectorAll('[data-mu-toggle]')[0].click()`);
await sleep(1500);
const s1 = await state();
check('点击播放后不再暂停', s1.暂停 === false);
check('卡片状态为 playing', s1.卡片状态 === 'playing', String(s1.卡片状态));
check('时间在推进', s1.当前时间 > 0.5, `${s1.当前时间}s`);
check('进度条宽度非 0', parseFloat(s1.进度宽) > 0, String(s1.进度宽));
check('当前时间文本已更新', s1.时间显示 !== '0:00', String(s1.时间显示));

console.log('\n=== 暂停 ===');
await ev(`document.querySelectorAll('[data-mu-toggle]')[0].click()`);
await sleep(600);
const s2 = await state();
check('再次点击暂停', s2.暂停 === true);
const frozen = s2.当前时间;
await sleep(900);
const s2b = await state();
check('暂停后时间不再推进', Math.abs(s2b.当前时间 - frozen) < 0.15, `${frozen} -> ${s2b.当前时间}`);

console.log('\n=== 下一首 ===');
await ev(`document.querySelectorAll('[data-mu-next]')[0].click()`);
await sleep(1800);
const s3 = await state();
check('切到第二首', s3.src === '__test2__.wav', String(s3.src));
check('曲名已更新', String(s3.曲名).includes('二号'), String(s3.曲名));
check('序号显示 02 / 02', String(s3.序号).trim() === '02 / 02', String(s3.序号));
check('第二首自动播放', s3.暂停 === false);

console.log('\n=== 上一首 ===');
await ev(`document.querySelectorAll('[data-mu-prev]')[0].click()`);
await sleep(1800);
const s4 = await state();
check('回到第一首', s4.src === '__test__.wav', String(s4.src));
check('序号显示 01 / 02', String(s4.序号).trim() === '01 / 02', String(s4.序号));

console.log('\n=== 进度条点击跳转（点 75% 处）===');
await ev(`(()=>{const b=document.querySelector('[data-mu-bar]'); const r=b.getBoundingClientRect();
  b.dispatchEvent(new MouseEvent('click',{clientX:r.left+r.width*0.75,clientY:r.top+r.height/2,bubbles:true}));})()`);
await sleep(500);
const s5 = await state();
check('跳转到约 75%（5s 的 3.75s）', s5.当前时间 > 3.2 && s5.当前时间 < 5.5, `${s5.当前时间}s / ${s5.时长}s`);

console.log('\n=== 软导航切页后是否继续播放 ===');
await ev(`[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')==='/gallery/')?.click()`);
await sleep(4000);
const s6 = await state();
check('切页后音频仍在', s6.有音频 === true);
check('切页后仍在播放（未被打断）', s6.暂停 === false, `paused=${s6.暂停}`);
check('切页后曲名仍正确', String(s6.曲名).includes('一号'), String(s6.曲名));
check('切页后进度条仍在推进', parseFloat(s6.进度宽) > 0, String(s6.进度宽));

console.log('\n=== 控制按钮在切页后仍可用（委托是否失效）===');
await ev(`document.querySelectorAll('[data-mu-toggle]')[0].click()`);
await sleep(600);
const s7 = await state();
check('切页后点暂停有效', s7.暂停 === true);

check('全程无 JS 异常', errs.length === 0, errs[0] || '');

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
if (failed.length) failed.forEach((f) => console.log('  ❌ ' + f.name));
ws.close();
process.exit(failed.length ? 1 : 0);
