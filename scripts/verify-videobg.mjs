// 验证全站背景视频：是否真的在播、层次是否正确、遮罩是否生效、正文是否还看得清。
// 用法：node scripts/verify-videobg.mjs [baseUrl] [light|dark]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';
import zlib from 'node:zlib';

// 极简 PNG 解码（只处理 8bit RGB/RGBA、非隔行）—— 用于读取"最终合成像素"。
function decodePNG(buffer) {
  let off = 8, width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (off < buffer.length) {
    const len = buffer.readUInt32BE(off);
    const type = buffer.toString('ascii', off + 4, off + 8);
    const data = buffer.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; }
    else if (type === 'IDAT') idat.push(Buffer.from(data));
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const ch = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!ch || bitDepth !== 8) throw new Error('不支持的 PNG 格式');
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * ch;
  const out = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const ft = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = Buffer.alloc(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? cur[x - ch] : 0, bb = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let v = line[x];
      if (ft === 1) v += a; else if (ft === 2) v += bb;
      else if (ft === 3) v += (a + bb) >> 1;
      else if (ft === 4) { const pp = a + bb - c, pa = Math.abs(pp - a), pb = Math.abs(pp - bb), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? bb : c); }
      cur[x] = v & 0xff;
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  return { width, height, ch, data: out, at(x, y) { const i = (y * width + x) * ch; return [out[i], out[i + 1], out[i + 2]]; } };
}

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const THEME = process.argv[3] === 'light' ? 'light' : 'dark';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const OUT = 'D:\\deep seek workplace\\_shots';

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const p = new Map(); const errs = []; const failedReq = [];
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push((((m.params.exceptionDetails.exception || {}).description) || '').slice(0, 110));
  if (m.method === 'Network.loadingFailed') failedReq.push(m.params.errorText + ' ' + (m.params.type || ''));
  if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
};
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };

await s('Page.enable'); await s('Runtime.enable'); await s('Network.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: THEME }] });
await s('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('cw-theme-pref','${THEME}');}catch(e){}` });
await s('Page.navigate', { url: BASE + '/works/' });
const waitFor = async (x, ms = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(500); } return false; };
await waitFor(`!!document.querySelector('.video-bg__el')`);
// 等视频真的能播（不只是挂上 DOM）
await waitFor(`(()=>{const v=document.querySelector('.video-bg__el'); return v && v.readyState>=2;})()`, 60000);
await sleep(2500);

console.log(`=== 背景视频（主题 ${THEME}）===`);
const v = await ev(`(()=>{const el=document.querySelector('.video-bg__el');
  const wrap=document.querySelector('.video-bg');
  const cs=getComputedStyle(wrap); const vs=getComputedStyle(el);
  const part=document.querySelector('.pparticles-layer');
  const grid=document.querySelector('.grid-bg');
  const bodyCs=getComputedStyle(document.body);
  const r=el.getBoundingClientRect();
  return {
    存在:!!el, readyState:el.readyState, paused:el.paused, muted:el.muted, loop:el.loop,
    时长:Math.round(el.duration*10)/10, 当前时间:Math.round(el.currentTime*100)/100,
    视口覆盖:Math.round(r.width)+'×'+Math.round(r.height), 视口:document.documentElement.clientWidth+'×'+document.documentElement.clientHeight,
    视频层z:cs.zIndex, objectFit:vs.objectFit, 视频透明度:vs.opacity,
    body背景图值:(bodyCs.backgroundImage||'none'),
    body背景色:(bodyCs.backgroundColor||''),
    body底色动画:bodyCs.animationName,
    body类:document.body.className,
    粒子z:part?getComputedStyle(part).zIndex:'无',
    光晕z:grid?getComputedStyle(grid).zIndex:'无',
    溢出:document.documentElement.scrollWidth-document.documentElement.clientWidth,
  };})()`);
console.log('  ' + JSON.stringify(v));
check('背景视频已挂载', v.存在 === true);
check('视频正在播放（非暂停）', v.paused === false, `paused=${v.paused} t=${v.当前时间}s`);
check('视频静音且循环', v.muted === true && v.loop === true);
check('视频铺满视口', Math.abs(parseInt(v.视口覆盖.split('×')[0]) - parseInt(v.视口.split('×')[0])) <= 2, v.视口覆盖 + ' vs ' + v.视口);
check('视频层在粒子/光晕之下', parseInt(v.视频层z) < parseInt(v.粒子z) && parseInt(v.视频层z) < parseInt(v.光晕z), `视频${v.视频层z} 粒子${v.粒子z} 光晕${v.光晕z}`);
check('body 已加 has-video-bg', /has-video-bg/.test(v.body类), v.body类);
// 页面底色保持各主题本来的（不透明渐变）——这是"不改文字颜色也能读清"的前提
check('页面底色仍是主题本色（未被清空）', /gradient/.test(v.body背景图值), v.body背景图值.slice(0, 44));
// 视频必须真的"看得见"：透明度在 (0, 1) 之间
const op = parseFloat(v.视频透明度);
check('视频半透明且可见（0 < 不透明度 < 1）', op > 0.05 && op < 1, `opacity=${v.视频透明度}`);
check('底色位移动画已停（不与视频争抢）', v.body底色动画 === 'none', String(v.body底色动画));
check('无横向溢出', v.溢出 === 0, String(v.溢出));

// 视频相关请求是否成功
const vidFail = failedReq.filter((f) => /media|mp4|video/i.test(f));
check('视频资源加载无失败', vidFail.length === 0, vidFail[0] || '');

// 播放推进检测：等 1.6s 看 currentTime 是否前进
const t1 = await ev(`document.querySelector('.video-bg__el').currentTime`);
await sleep(1600);
const t2 = await ev(`document.querySelector('.video-bg__el').currentTime`);
check('视频时间在推进（确实在播）', t2 > t1, `${t1.toFixed(2)} → ${t2.toFixed(2)}`);

// —— hero 文字压在视频上的可读性（★必须去首页测★：/works/ 没有 hero）——
// ★三个取样陷阱，都踩过★：
//   1) 打字机是逐字推进的：字形在"取坐标"与"截图"之间会横向移动，
//      左右两侧的取样点会偶发落到字形上，算出 1.x / 3.x 的假失败。
//      → 只在文字**上下方**取样，并在测量前冻结动画。
//   2) 入场动画（ent-rise 的 clip-path）没跑完就截图：文字只有一半可见，
//      截出来像"标题几乎看不见"，很容易误判成颜色 bug。
//   3) 大标题的描边动画（GSAP 逐字画线，约 2s）没跑完就冻结：
//      第二行会停在"只有轮廓、还没填色"的状态，看起来像文字没渲染出来。
//      → 先等描边跑完（dashoffset 归零），再冻结动画。
await s('Page.navigate', { url: BASE + '/' });
await waitFor(`!!document.querySelector('.typed-hero')`, 30000);
await waitFor(`(()=>{const v=document.querySelector('.video-bg__el'); return v && v.readyState>=2;})()`, 60000);
await waitFor(`(()=>{
  const ts=[...document.querySelectorAll('.stroke-text__stroke tspan')];
  if(!ts.length) return false;
  return ts.every(t=>{const o=parseFloat(getComputedStyle(t).strokeDashoffset)||0; return Math.abs(o)<1;});
})()`, 15000);
await s('Page.addStyleTag', {
  content: '*,*::before,*::after{animation:none !important;transition:none !important}',
});
await ev(`document.querySelector('.video-bg__el')?.pause()`);
await sleep(1200);
const shot2 = await s('Page.captureScreenshot', { format: 'png' });
const png = decodePNG(Buffer.from(shot2.result.data, 'base64'));
const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const heroText = await ev(`(()=>{
  const out=[];
  for (const sel of ['.display', '.typed-hero']) {
    const e=document.querySelector(sel); if(!e) continue;
    const rng=document.createRange(); rng.selectNodeContents(e);
    const rs=[...rng.getClientRects()].filter(r=>r.width>2&&r.height>2);
    if(!rs.length) continue;
    const cs=getComputedStyle(e); const m=cs.color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
    out.push({sel, rgb:[+m[1],+m[2],+m[3]], size:parseFloat(cs.fontSize), weight:cs.fontWeight,
      x0:Math.min(...rs.map(r=>r.left)), x1:Math.max(...rs.map(r=>r.right)),
      y0:Math.min(...rs.map(r=>r.top)), y1:Math.max(...rs.map(r=>r.bottom))});
  }
  return out;})()`);
check('首页 hero 元素可定位（用于对比度取样）', Array.isArray(heroText) && heroText.length === 2,
  Array.isArray(heroText) ? `${heroText.length} 个` : '取值失败');
for (const b of heroText || []) {
  const tl = lum(b.rgb);
  const need = (b.size >= 24 || (b.size >= 18.66 && +b.weight >= 700)) ? 3.0 : 4.5;
  let worst = Infinity, wb = null;
  // 只在文字**上下方**取样（左右会受打字机横向位移影响）
  for (const dy of [10, 18, 26]) {
    for (let dx = -20; dx <= 20; dx += 10) {
      const x = Math.round((b.x0 + b.x1) / 2 + dx);
      for (const y of [Math.round(b.y0 - dy), Math.round(b.y1 + dy)]) {
        if (x < 1 || y < 1 || x >= png.width || y >= png.height) continue;
        const px = png.at(x, y);
        const r = ratio(tl, lum(px));
        if (r < worst) { worst = r; wb = px; }
      }
    }
  }
  check(`hero ${b.sel} 在视频背景上可读`, worst >= need && worst !== Infinity,
    `对比 ${worst === Infinity ? 'n/a' : worst.toFixed(2)}（需 ${need}）最差底色 rgb(${wb})`);
}

check('无 JS 异常', errs.length === 0, errs[0] || '');

// 截图取首页（hero + 背景视频一起入镜，最能反映观感）
const shot = await s('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) { writeFileSync(`${OUT}\\videobg-hero-${THEME}.png`, Buffer.from(shot.result.data, 'base64')); console.log(`\n  ✓ videobg-hero-${THEME}.png`); }

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
