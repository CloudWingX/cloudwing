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
await waitFor(`!!document.querySelector('.hero-title')`, 30000);
await waitFor(`(()=>{const v=document.querySelector('.video-bg__el'); return v && v.readyState>=2;})()`, 60000);
/* 注入样式要用 DOM，不能用 Page.addStyleTag：
   本机 Edge（153 / 协议 1.3）**没有** Page.addStyleTag，调用会返回
   `-32601 'Page.addStyleTag' wasn't found` 且被静默忽略 —— 之前"冻结动画"和
   "隐藏文字"两次注入其实都没生效，这也是 hero 对比度连着几轮假失败的根因。 */
const injectStyle = (css) =>
  ev(`(()=>{const st=document.createElement('style'); st.textContent=${JSON.stringify(css)};
    document.head.appendChild(st); return true;})()`);
await injectStyle('*,*::before,*::after{animation:none !important;transition:none !important}');
await ev(`document.querySelector('.video-bg__el')?.pause()`);
await sleep(1200);
const shot2 = await s('Page.captureScreenshot', { format: 'png' });
const png = decodePNG(Buffer.from(shot2.result.data, 'base64'));
const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/* ★取样必须避开自己的字形★
   2026-09-18 改版后踩到的坑（连着几轮假失败 1.00）：
   新版 hero 是多行大字（标题 4 行 / 64px·700），在文字框内按 24px 步长采样会**打到白色笔画上**，
   于是"最差底色"被读成 rgb(255,255,255)。
   （用 sharp 复核确认：文字框外 4/10/16px 的真实底色都在 rgb(2,54,68) 量级，不是白。）
   所以这里改成：先把这几处文字 `visibility:hidden`（只隐藏、不动布局），
   再对**同一批坐标**取像素 —— 拿到的就是纯背景，任何字形都不可能污染。 */
const boxes = await ev(`(()=>{const out=[];
  for (const sel of ['.hero-title', '.hero-subtitle']) {
    const e=document.querySelector(sel); if(!e) continue;
    const r=e.getBoundingClientRect();
    const cs=getComputedStyle(e);
    const fill=(cs.webkitTextFillColor||cs.color||'');
    // 渐变字（background-clip:text）的 color 是 transparent，按它算对比度会得到假 1:1，
    // 这类元素由 contrast-audit.mjs 单独覆盖，这里跳过。
    if(/rgba\\(0,\\s*0,\\s*0,\\s*0\\)/.test(fill)) continue;
    const m=cs.color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/);
    if(!m) continue;
    out.push({sel, rgb:[+m[1],+m[2],+m[3]], size:parseFloat(cs.fontSize), weight:cs.fontWeight,
      x0:Math.round(r.left), x1:Math.round(r.right), y0:Math.round(r.top), y1:Math.round(r.bottom)});
  }
  return out;})()`);

// 隐藏 hero 文字（保留布局与所有背景层），再截一张纯背景图。
// 用 opacity:0 而不是 visibility:hidden —— 渐变标题的字形是**背景**画的
// （background-clip:text），visibility 改了颜色却留下字形层，实测仍会采到白色笔画。
// ★而且要把节点真的从文档里摘掉★：只靠注入 CSS 有被作用域样式/时序翻掉的风险
// （实测 opacity 已经是 0，背景图里却仍有一根 2~3px 宽的字形亮条）。
const savedText = await ev(`(()=>{const out=[];
  for (const sel of ['.hero-title','.hero-subtitle']) {
    const e=document.querySelector(sel); if(!e) continue;
    out.push({parent:e.parentElement, next:e.nextSibling, el:e});
    e.remove();
  }
  // 存到 window 上，取样结束后再放回（见脚本末尾）
  window.__cwSavedHero = out;
  return out.length;})()`);
await waitFor(`!document.querySelector('.hero-title') && !document.querySelector('.hero-subtitle')`, 5000);
await sleep(900);
const bgShot = await s('Page.captureScreenshot', { format: 'png' });
const bg = decodePNG(Buffer.from(bgShot.result.data, 'base64'));
// ★解码器交叉核对★：同一张 PNG 分别用自写解码器与项目依赖 sharp 解，取样必须一致。
// （自写解码器一旦解错，会把"文字自己的白字"当成底色，得出 1.00 这类假失败。）
{
  const sharpMod = await import('sharp');
  const { data: rawData, info: rawInfo } = await sharpMod.default(Buffer.from(bgShot.result.data, 'base64')).raw().toBuffer({ resolveWithObject: true });
  const sAt = (x, y) => { const o = (y * rawInfo.width + x) * rawInfo.channels; return [rawData[o], rawData[o + 1], rawData[o + 2]]; };
  const mism = [];
  for (const [x, y] of [[207, 238], [255, 368], [140, 300], [600, 480], [300, 560]]) {
    const a = bg.at(x, y), b = sAt(x, y);
    if (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]) mism.push(`(${x},${y}) mine=${a} sharp=${b}`);
  }
  check('背景图解码器自检（自写解码 vs sharp）', mism.length === 0, mism.slice(0, 3).join(' | ') || '一致');
}

check('首页 hero 元素可定位（用于对比度取样）', Array.isArray(boxes) && boxes.length >= 1,
  Array.isArray(boxes) ? `${boxes.length} 个` : '取值失败');
// 自检：确认"隐藏文字"确实生效（否则会采到自己的字形，得到假失败）
console.log('  [自检] 隐藏后 .hero-title opacity =', await ev(`getComputedStyle(document.querySelector('.hero-title')).opacity`),
  '| bg图 (207,238)=rgb(' + bg.at(207, 238) + ')');

for (const b of boxes || []) {
  const tl = lum(b.rgb);
  const need = (b.size >= 24 || (b.size >= 18.66 && +b.weight >= 700)) ? 3.0 : 4.5;
  let worst = Infinity, wb = null, samples = 0, wxy = null;
  // 在文字框内按网格取样 —— 此刻字形已隐藏，取到的必然是背景
  for (let y = b.y0; y <= b.y1; y += 4) {
    for (let x = b.x0 + 4; x <= b.x1 - 4; x += 16) {
      if (x < 1 || y < 1 || x >= bg.width || y >= bg.height) continue;
      const px = bg.at(x, y);
      samples++;
      const r = ratio(tl, lum(px));
      if (r < worst) { worst = r; wb = px; wxy = [x, y]; }
    }
  }
  check(`hero ${b.sel} 在视频背景上可读`, worst >= need && samples > 0,
    `对比 ${worst === Infinity ? 'n/a' : worst.toFixed(2)}（需 ${need}，采样 ${samples} 点）最差底色 rgb(${wb}) 于 (${wxy})`);
  if (worst < need && wxy) {
    const [wx, wy] = wxy;
    let map = '';
    for (let dy = -6; dy <= 6; dy += 3) {
      let row = '';
      for (let dx = -6; dx <= 6; dx += 3) {
        const px = bg.at(wx + dx, wy + dy);
        const l = Math.round((px[0] + px[1] + px[2]) / 3);
        row += (l > 200 ? '#' : l > 120 ? '+' : l > 60 ? '.' : ' ') + ' ';
      }
      map += '\n        ' + row;
    }
    console.log(`  [诊断] 最差点邻域（#=亮 +/./空=暗）:${map}`);
  }
}

check('无 JS 异常', errs.length === 0, errs[0] || '');

// 把取样时摘掉的 hero 文字放回去，保证截图是完整页面（不是缺了标题的版本）
await ev(`(()=>{const saved=window.__cwSavedHero; if(!saved) return false;
  for (const it of saved) { it.parent.insertBefore(it.el, it.next); }
  window.__cwSavedHero=null; return true;})()`);
await sleep(800);

// 截图取首页（hero + 背景视频一起入镜，最能反映观感）
const shot = await s('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) { writeFileSync(`${OUT}\\videobg-hero-${THEME}.png`, Buffer.from(shot.result.data, 'base64')); console.log(`\n  ✓ videobg-hero-${THEME}.png`); }

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
