// 播放器功能验证（§67 起对真实曲目断言）：
//   播放/暂停、进度、下一首/上一首、切页不中断、进度条跳转、
//   歌词面板（词按钮弹出/纯音乐占位）、/music/ 页（唱片旋转+视差+曲目表+参数）、
//   侧栏播放器与音乐页共享同一音频（§67.9 状态同步：单例同一性/软导航往返
//   曲目与播放态保持/任一视图控制同一音频）。
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

const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.result?.value;
const state = async () => ev(`(()=>{const a=window.__cwMusic&&window.__cwMusic.audio; const c=document.querySelector('[data-music]');
  return { 有音频: !!a, src: a?a.src.split('/').pop():null, 暂停: a?a.paused:null, 当前时间: a?+(a.currentTime||0).toFixed(2):null,
    时长: a&&isFinite(a.duration)?+a.duration.toFixed(2):null, 卡片状态: c?c.dataset.state:null,
    曲名: c?c.querySelector('[data-mu-title]')?.textContent:null, 序号: c?c.querySelector('[data-mu-no]')?.textContent:null,
    进度宽: c?c.querySelector('[data-mu-fill]')?.style.width:null, 时间显示: c?c.querySelector('[data-mu-cur]')?.textContent:null,
    总时长显示: c?c.querySelector('[data-mu-dur]')?.textContent:null };})()`);
const mpState = async () => ev(`(()=>{const st=window.__cwMusicPage; const a=st&&st.audio; const r=document.querySelector('[data-music-page]');
  const disc=r?r.querySelector('[data-mp-disc]'):null;
  return { 有音频: !!a, src: a?a.src.split('/').pop():null, 暂停: a?a.paused:null,
    页状态: r?r.dataset.state:null, 盘旋转类: disc?disc.classList.contains('is-playing'):null,
    盘动画: disc?getComputedStyle(disc).animationPlayState:null,
    曲名: r?r.querySelector('[data-mp-title]')?.textContent:null,
    曲目数: r?r.querySelectorAll('[data-mp-item]').length:0,
    参数项: r?r.querySelectorAll('.mp-params dd').length:0,
    歌词: r?(r.querySelector('[data-mp-lyrics-inner]')?.textContent||'').trim().slice(0,20):null,
    tilt: r?r.querySelector('[data-mp-discwrap]')?.style.transform:null };})()`);

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok }); console.log(`  ${ok ? '✅' : '❌'} ${name}${detail ? '  —— ' + detail : ''}`); };

console.log('=== 初始状态（侧栏播放器）===');
await send('Page.navigate', { url: BASE + '/blog/' });
await sleep(4500);
const s0 = await state();
console.log('  ' + JSON.stringify(s0));
check('音频单例已创建', s0.有音频 === true);
check('默认加载第一首（evolution-era.mp3）', s0.src === 'evolution-era.mp3', String(s0.src));
check('初始为暂停', s0.暂停 === true);
check('时长已知（≈4:52，元数据已加载）', s0.时长 > 285 && s0.时长 < 300, String(s0.时长));

console.log('\n=== 播放 ===');
await ev(`document.querySelectorAll('[data-mu-toggle]')[0].click()`);
await sleep(1800);
const s1 = await state();
check('点击播放后不再暂停', s1.暂停 === false);
check('卡片状态为 playing', s1.卡片状态 === 'playing', String(s1.卡片状态));
check('时间在推进', s1.当前时间 > 0.5, `${s1.当前时间}s`);
check('进度条宽度非 0', parseFloat(s1.进度宽) > 0, String(s1.进度宽));
check('当前时间文本已更新', s1.时间显示 !== '0:00', String(s1.时间显示));

console.log('\n=== 歌词面板（词按钮弹出）===');
await ev(`document.querySelector('[data-mu-lyrics]').click()`);
await sleep(900);
const s1l = await ev(`(()=>{const c=document.querySelector('[data-music]');
  const p=c.querySelector('[data-mu-lyrics-panel]');
  return { 打开: p&&!p.hidden, 文案: (p?.textContent||'').trim().slice(0,14), 展开: c.querySelector('[data-mu-lyrics]').getAttribute('aria-expanded') };})()`);
check('点「词」后面板展开', s1l.打开 === true);
check('展开态 aria-expanded=true', s1l.展开 === 'true', String(s1l.展开));
check('纯音乐曲目显示「纯音乐」占位', String(s1l.文案).includes('纯音乐'), String(s1l.文案));
await ev(`document.querySelector('[data-mu-lyrics]').click()`);
await sleep(400);
const s1l2 = await ev(`!document.querySelector('[data-mu-lyrics-panel]').hidden`);
check('再点收起面板', s1l2 === false);

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
await sleep(2000);
const s3 = await state();
check('切到第二首（into-the-sky.mp3）', s3.src === 'into-the-sky.mp3', String(s3.src));
check('曲名已更新', String(s3.曲名).includes('Into the Sky'), String(s3.曲名));
check('序号显示 02 / 04', String(s3.序号).trim() === '02 / 04', String(s3.序号));
check('第二首自动播放', s3.暂停 === false);
check('第二首时长 ≈ 3:50', s3.时长 > 224 && s3.时长 < 236, String(s3.时长));

console.log('\n=== 有词曲目缺 LRC 时显示「暂无歌词」===');
await ev(`document.querySelector('[data-mu-lyrics]').click()`);
await sleep(900);
const s3l = await ev(`(()=>{const p=document.querySelector('[data-mu-lyrics-panel]');
  return (p?.textContent||'').trim().slice(0,10);})()`);
check('歌词面板显示「暂无歌词」', String(s3l).includes('暂无歌词'), String(s3l));
await ev(`document.querySelector('[data-mu-lyrics]').click()`);
await sleep(300);

console.log('\n=== 上一首 ===');
await ev(`document.querySelectorAll('[data-mu-prev]')[0].click()`);
await sleep(2000);
const s4 = await state();
check('回到第一首', s4.src === 'evolution-era.mp3', String(s4.src));
check('序号显示 01 / 04', String(s4.序号).trim() === '01 / 04', String(s4.序号));

console.log('\n=== 等待元数据就绪（线上首访 duration 要等网络加载）===');
let durReady = false;
for (let i = 0; i < 40; i++) {
  const d = await ev(`window.__cwMusic?.audio?.duration ?? NaN`);
  if (Number.isFinite(d) && d > 0) { durReady = true; break; }
  await sleep(300);
}
check('音频元数据就绪（duration 为有限值）', durReady, 'isFinite(duration)');

console.log('\n=== 进度条点击跳转（点 75% 处）===');
await ev(`(()=>{const b=document.querySelector('[data-mu-bar]'); const r=b.getBoundingClientRect();
  b.dispatchEvent(new MouseEvent('click',{clientX:r.left+r.width*0.75,clientY:r.top+r.height/2,bubbles:true}));})()`);
await sleep(1200);
const s5 = await state();
check('跳转到约 75%（292.1s 的 ≈219s）', s5.当前时间 > 150 && s5.当前时间 < 260, `${s5.当前时间}s / ${s5.时长}s`);

console.log('\n=== 软导航切页后是否继续播放 ===');
await ev(`[...document.querySelectorAll('a')].find(a=>a.getAttribute('href')==='/gallery/')?.click()`);
await sleep(4000);
const s6 = await state();
check('切页后音频仍在', s6.有音频 === true);
check('切页后仍在播放（未被打断）', s6.暂停 === false, `paused=${s6.暂停}`);
check('切页后曲名仍正确', String(s6.曲名).includes('Evolution'), String(s6.曲名));
check('切页后进度条仍在推进', parseFloat(s6.进度宽) > 0, String(s6.进度宽));

console.log('\n=== 控制按钮在切页后仍可用（委托是否失效）===');
await ev(`document.querySelectorAll('[data-mu-toggle]')[0].click()`);
await sleep(600);
const s7 = await state();
check('切页后点暂停有效', s7.暂停 === true);

console.log('\n=== /music/ 音乐页 ===');
await send('Page.navigate', { url: BASE + '/music/' });
await sleep(4500);
const m0 = await mpState();
console.log('  ' + JSON.stringify(m0));
check('页面容器存在（data-music-page）', m0.页状态 !== null);
check('页面音频单例已创建并加载第一首', m0.src === 'evolution-era.mp3', String(m0.src));
check('曲目表 4 项', m0.曲目数 === 4, String(m0.曲目数));
check('参数网格 10 项', m0.参数项 === 10, String(m0.参数项));
check('初始暂停 → 唱片无旋转类', m0.盘旋转类 === false && m0.盘动画 === 'paused', `${m0.盘旋转类}/${m0.盘动画}`);
check('歌词区显示纯音乐占位', String(m0.歌词).includes('纯音乐'), String(m0.歌词));

console.log('\n=== 音乐页播放：唱片旋转 ===');
await ev(`document.querySelector('[data-mp-toggle]').click()`);
await sleep(1800);
const m1 = await mpState();
check('音乐页播放中', m1.暂停 === false);
check('唱片加 is-playing 类', m1.盘旋转类 === true);
check('动画 play-state = running', m1.盘动画 === 'running', String(m1.盘动画));

console.log('\n=== 悬停视差 ===');
const m2 = await ev(`(()=>{const w=document.querySelector('[data-mp-discwrap]'); const r=w.getBoundingClientRect();
  w.dispatchEvent(new PointerEvent('pointermove',{clientX:r.left+r.width*0.8,clientY:r.top+r.height*0.3,bubbles:true}));
  return true;})()`);
await sleep(500);
const m2b = await mpState();
check('视差 tilt 已生效（transform 非空）', !!m2b.tilt && m2b.tilt !== 'none', String(m2b.tilt || '').slice(0, 60));

console.log('\n=== 状态同步：共享音频单例（§67.9，软导航往返验证）===');
// /music/ 页没有侧栏 → 侧栏只能出现在软导航到壳层页之后。§67.9 起两个视图
// 共用同一个 <audio>（getSharedAudio 单例）：曲目/进度/播放态天然一致，
// 不再有互斥播放。断言改为「状态连续性」语义：
//   单例同一性 / 软导航往返曲目与播放态保持 / 任一视图控制同一音频。
const w1 = await ev(`window.__cwMusicPage && window.__cwMusicPage.audio ? !window.__cwMusicPage.audio.paused : null`);
console.log('  /music/ 页在播（软导航前）: ' + JSON.stringify(w1));
check('软导航前音乐页音频仍在播放', w1 === true, JSON.stringify(w1));

// /music/（播放中）→ 壳层页：侧栏接管显示，实况不丢
await ev(`document.querySelector('.site-header a[href="/gallery/"]')?.click()`);
await sleep(4500);
const w2 = await ev(`(()=>{const c=document.querySelector('[data-music]'); const a=window.__cwMusic&&window.__cwMusic.audio;
  return { 同一元素: !!(window.__cwMusic && window.__cwMusicPage && a && window.__cwMusic.audio === window.__cwMusicPage.audio),
    卡片状态: c?c.dataset.state:null, 曲名: c?c.querySelector('[data-mu-title]')?.textContent:null,
    序号: c?c.querySelector('[data-mu-no]')?.textContent:null,
    在播: a?!a.paused:null, src: a?a.src.split('/').pop():null };})()`);
console.log('  ' + JSON.stringify(w2));
check('侧栏与音乐页指向同一 <audio>（共享单例同一性）', w2.同一元素 === true, JSON.stringify(w2));
check('软导航后音频继续播放且仍是原曲', w2.在播 === true && w2.src === 'evolution-era.mp3', JSON.stringify(w2));
check('侧栏卡片自动同步为播放中', w2.卡片状态 === 'playing', JSON.stringify(w2));
check('侧栏曲名/序号与实况一致', String(w2.曲名).includes('Evolution') && String(w2.序号).trim() === '01 / 04', JSON.stringify(w2));

// 侧栏控制同一音频：点暂停 → 全局暂停（不再是「暂停另一边的独立实例」）
await ev(`document.querySelectorAll('[data-mu-toggle]')[0].click()`);
await sleep(1000);
const w3 = await ev(`(()=>{const a=window.__cwMusic&&window.__cwMusic.audio;
  return { 暂停: a?a.paused:null, 当前时间: a?+(a.currentTime||0).toFixed(1):null };})()`);
console.log('  ' + JSON.stringify(w3));
check('侧栏点暂停即全局暂停（同一元素被控）', w3.暂停 === true, JSON.stringify(w3));
check('暂停时进度已保留（不是重置）', w3.当前时间 > 0, `${w3.当前时间}s`);

// 回 /music/：页面 UI 应同步为已暂停实况（曲目/进度/状态三连对齐）
await ev(`document.querySelector('.site-header a[href="/music/"]')?.click()`);
await sleep(4500);
const w4 = await mpState();
console.log('  ' + JSON.stringify({ 页状态: w4.页状态, 暂停: w4.暂停, src: w4.src, 曲名: w4.曲名 }));
check('回 /music/ 后页面同步为暂停态', w4.暂停 === true && w4.页状态 === 'paused', JSON.stringify({ 页状态: w4.页状态, 暂停: w4.暂停 }));
check('回 /music/ 后曲目仍是暂停时那一首', w4.src === 'evolution-era.mp3', String(w4.src));
check('回 /music/ 后唱片未旋转（暂停态）', w4.盘旋转类 === false && w4.盘动画 === 'paused', `${w4.盘旋转类}/${w4.盘动画}`);

console.log('\n=== 音乐页曲目表点选 ===');
await ev(`document.querySelectorAll('[data-mp-item]')[2].click()`);
await sleep(2000);
const m3 = await mpState();
check('点第 3 首切换到 wings-of-piano', m3.src === 'wings-of-piano.mp3', String(m3.src));
check('曲名同步为 Wings of Piano', String(m3.曲名).includes('Wings'), String(m3.曲名));

check('全程无 JS 异常', errs.length === 0, errs[0] || '');

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
if (failed.length) failed.forEach((f) => console.log('  ❌ ' + f.name));
ws.close();
process.exit(failed.length ? 1 : 0);
