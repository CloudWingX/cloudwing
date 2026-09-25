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
let id = 0; const p = new Map(); const errs = []; const failedReq = []; const reqUrl = new Map();
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push((((m.params.exceptionDetails.exception || {}).description) || '').slice(0, 110));
  if (m.method === 'Network.requestWillBeSent') reqUrl.set(m.params.requestId, m.params.request.url);
  // 带 URL：ERR_ABORTED 若落在页面切换瞬间的 video 请求上，属元素随文档销毁的正常取消，
  // 不是加载失败 —— 没 URL 就分不清这两种情形（2026-09-22 排查记录）。
  if (m.method === 'Network.loadingFailed') failedReq.push(m.params.errorText + ' ' + (m.params.type || '') + ' ' + (reqUrl.get(m.params.requestId) || ''));
  if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
};
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };

await s('Page.enable'); await s('Runtime.enable'); await s('Network.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1920, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: THEME }] });
await s('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('cw-theme-pref','${THEME}');}catch(e){}` });
await s('Page.navigate', { url: BASE + '/blog/' });
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
    bodyAfter背景图值:getComputedStyle(document.body,'::after').backgroundImage||'none',
    html背景色:getComputedStyle(document.documentElement).backgroundColor||'',
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
// §62：底色渐变从 body 迁到 body::after（z:-5，视频之下），html 持有不透明深色底 ——
// "视频加载失败时页面仍有主题本色降级底"的保障点随之迁移（原检查 body 背景图）。
check('页面底色仍是主题本色（未被清空，body::after 承载）', /gradient/.test(v.bodyAfter背景图值 || ''), (v.bodyAfter背景图值 || '').slice(0, 44));
check('html 深色画布兜底（§62）', v.html背景色 === 'rgb(3, 6, 10)', v.html背景色);
// 视频必须真的"看得见"：透明度在 (0, 1) 之间
const op = parseFloat(v.视频透明度);
check('视频半透明且可见（0 < 不透明度 < 1）', op > 0.05 && op < 1, `opacity=${v.视频透明度}`);
check('底色位移动画已停（不与视频争抢）', v.body底色动画 === 'none', String(v.body底色动画));
check('无横向溢出', v.溢出 === 0, String(v.溢出));

// 视频相关请求是否成功
// ⚠️ §67 起侧栏播放器会加载 /music/*.mp3 —— CDP 把 audio 请求也记成 Media 类型，
// 且切页销毁 <audio> 时是正常的 ERR_ABORTED 取消（2026-09-22 实测）。
// 本断言只管视频：排除 /music/*.mp3（播放器加载由 verify-music 覆盖）。
const vidFail = failedReq.filter((f) => /media|mp4|video/i.test(f) && !/\/music\/[a-z0-9-]+\.mp3/i.test(f));
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
/* 开局清掉"强调色预设"的存档：共用调试浏览器时，上一次留下的色卡选择会带来色膜，
   让"文字背后的底色"整体偏色（实测残留时标题区被判成 rgb(159,211,232)）。 */
await ev(`(()=>{try{localStorage.removeItem('cw-accent');}catch(e){} return true;})()`);
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
    const m=cs.color.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?/);
    if(!m) continue;
    // ⚠️ 必须带上 alpha：字幕是 rgba(255,255,255,.92)，字形本身半透明 ——
    // 按不透明白算会把对比度算高（旧版就是这样，等于放松了标准）。
    const a = m[4] === undefined ? 1 : parseFloat(m[4]);
    out.push({sel, rgb:[+m[1],+m[2],+m[3]], alpha:a, size:parseFloat(cs.fontSize), weight:cs.fontWeight,
      x0:Math.round(r.left), x1:Math.round(r.right), y0:Math.round(r.top), y1:Math.round(r.bottom)});
  }
  return out;})()`);

// ⚠️ 这里**不**在当前页隐藏文字（试过四种都失败，见下面的注释）：
// 当前页保持原样，只用来量"文字框在哪、文字是什么颜色"。

/* ★背景图怎么取：另开一个"从头就隐藏文字"的对照页，而不是在当前页上动手脚★
   在当前页上试过四种都失败（都实测过）：
     · visibility:hidden / opacity:0 —— 渐变标题的字形是 background-clip:text 画的，
       color 改了字形层还在，仍采到白字（假 1.00）；
     · color:transparent + background:none —— 去不掉渐变那层；
     · text-indent:-9999px —— 同样不行（背景层按元素自身盒定位）；
     · **remove() 节点** —— 布局回流，徽标/统计往上顶进标题原来的框里，
       采样框里变成它们的白字，还是假 1.00（踩过第二次）。
   所以改成正路：新开一个 tab，在**首次导航之前**就注入"文字不可见"的样式，
   这样页面从一开始就不含字形，布局按正常内容尺寸走，取样干净。
   为了确保"框对得上"，对照页还会量一次同样的选择器做尺寸自检。 */
const HIDE_CSS = '.hero-title,.hero-subtitle{visibility:hidden !important}';
const bgTab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const bgWs = new WebSocket(bgTab.webSocketDebuggerUrl);
await new Promise((res, rej) => { bgWs.onopen = res; bgWs.onerror = rej; });
let bgId = 0; const bgPending = new Map();
const bgSend = (m, p2 = {}) => new Promise((res) => { const i = ++bgId; bgPending.set(i, res); bgWs.send(JSON.stringify({ id: i, method: m, params: p2 })); });
bgWs.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && bgPending.has(m.id)) { bgPending.get(m.id)(m); bgPending.delete(m.id); } };
const bgEv = async (x) => (await bgSend('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
await bgSend('Page.enable'); await bgSend('Runtime.enable');
// ⚠️ 新 tab 不会继承另一个 tab 的 Emulation 覆盖，不显式设置就会按默认（移动端）渲染，
// 量出来的框与真实页对不上（踩过：对照页 left=20 vs 真实页 133）。
// ⚠️ 两个 tab 视口必须一致：容器 1600 后，1440 视口下容器满宽、1920 下才有
// "容器 + 留白带"两种形态 —— 不一致则对照页框坐标必然对不上（2026-09-22 实测）。
await bgSend('Emulation.setDeviceMetricsOverride', { width: 1920, height: 900, deviceScaleFactor: 1, mobile: false });
await bgSend('Page.addScriptToEvaluateOnNewDocument', {
  source: `document.addEventListener('DOMContentLoaded',function(){var s=document.createElement('style');s.textContent=${JSON.stringify(HIDE_CSS)};document.head.appendChild(s);});`,
});
await bgSend('Page.navigate', { url: BASE + '/' });
await sleep(3000);
const bgBoxes = JSON.parse(await bgEv(`(()=>{const o=[];
  for(const sel of ['.hero-title','.hero-subtitle']){const e=document.querySelector(sel);if(!e)continue;
  const r=e.getBoundingClientRect();o.push({sel,x0:Math.round(r.left),x1:Math.round(r.right),y0:Math.round(r.top),y1:Math.round(r.bottom)});}
  return JSON.stringify(o);})()`) || '[]');
check('对照页可用（隐藏文字的同一版式）', bgBoxes.length === boxes.length,
  `${bgBoxes.length} vs ${boxes.length} 个文字框`);
check('对照页版式与真实页一致（框坐标相同，说明没有回流）',
  bgBoxes.every((b, i) => Math.abs(b.x0 - boxes[i].x0) <= 1 && Math.abs(b.y0 - boxes[i].y0) <= 1
    && Math.abs(b.x1 - boxes[i].x1) <= 1 && Math.abs(b.y1 - boxes[i].y1) <= 1),
  JSON.stringify(bgBoxes.map((b) => [b.x0, b.y0])) + ' vs ' + JSON.stringify(boxes.map((b) => [b.x0, b.y0])));
/* ★取 3 帧★ —— 背景几何检查必须做"逐格取三帧最小"，否则视频自身的内容会假失败：
   实测过：把视频停在某一帧时，x=1091,y=152 出现 4.98/255 的竖直边缘，
   用 document.elementsFromPoint 查过，那一点上只有 `.hero` —— 是**视频画面里**的竖直纹理，
   不是任何 CSS 层。CSS 层的边缘在每一帧都在同一格；视频纹理不会三帧都落同一格。
   （三帧取固定时间点、跨度拉大，避免"相邻帧还长得一样"。） */
const FRAME_TIMES = [1.5, 12, 24];
const frames = [];
for (const t of FRAME_TIMES) {
  await bgEv(`(()=>{const v=document.querySelector('.video-bg__el'); if(v){v.pause(); v.currentTime=${t};} return true;})()`);
  await sleep(900);
  const sh = await bgSend('Page.captureScreenshot', { format: 'png' });
  frames.push(decodePNG(Buffer.from(sh.result.data, 'base64')));
}
const bg = frames[0];
// 逐格取最小：静态边缘保留，视频内容被剔除
const minFrame = (fn) => Math.min(...frames.map(fn));

for (const b of boxes || []) {
  const need = (b.size >= 24 || (b.size >= 18.66 && +b.weight >= 700)) ? 3.0 : 4.5;
  let worst = Infinity, wb = null, samples = 0, wxy = null;
  for (let y = b.y0; y <= b.y1; y += 4) {
    for (let x = b.x0 + 4; x <= b.x1 - 4; x += 16) {
      if (x < 1 || y < 1 || x >= bg.width || y >= bg.height) continue;
      const px = bg.at(x, y);
      samples++;
      // 字形是半透明时（alpha<1），先按 alpha 合成到该像素的底色上，再算对比度
      const fg = b.alpha >= 1 ? b.rgb : b.rgb.map((c, i) => c * b.alpha + px[i] * (1 - b.alpha));
      const r = ratio(lum(fg), lum(px));
      if (r < worst) { worst = r; wb = px; wxy = [x, y]; }
    }
  }
  const tag = b.alpha >= 1 ? '' : `（文字 alpha=${b.alpha}，已按合成色计算）`;
  check(`hero ${b.sel} 在视频背景上可读`, worst >= need && samples > 0,
    `对比 ${worst === Infinity ? 'n/a' : worst.toFixed(2)}（需 ${need}，采样 ${samples} 点）最差底色 rgb(${wb}) 于 (${wxy})${tag}`);
}
/* ★"两侧有没有硬边/暗带"这个坑必须自动兜住（2026-09-18 三轮踩过两次）★
   背景：Hero 竖直居中后字幕压到视频亮带，一度靠在首页叠一层"压暗膜"修 ——
   那层在页面上留下了可见痕迹（用户两次指出"标题后方的黑色矩形 / 首页两边有瑕疵"）。
   只量"容器边缘两个像素"是抓不到的（两次都判成合格），必须**扫整条留白带的逐列均值**：
   在**主内容容器之外**的左右留白带里，逐列求纵向均值，再看相邻列的阶跃。
   ⚠️ 要排除最后 12px（滚动条槽）：满屏截图里 x≈1428 是滚动条的亮边，
   它会给出一条 30+ 的假阶跃（踩过）。
   ⚠️ 阈值 3.0 是实测出来的：正常背景（视频 + 光晕 + 粒子）在留白带内最大阶跃 ≤1.0；
   一旦有"只在容器内生效的压暗/加亮层"，容器边缘会出现 20~40 的阶跃。 */

/* ★2026-09-18 四轮修订：上面那两个 check 以前是**空的**（连过两轮都没抓到真瑕疵）★
   两个独立的 bug，都修了：
   1. **单位错**：`lum()` 返回 0..1，阈值却写 3.0 —— 永远成立，等于没测。
      现在统一用 `gray()`（0..255 口径），阈值 3 才有上面注释里说的物理意义。
   2. **扫描范围绕开了分界线**：留白带只扫容器**外面**（0..65），
      而分界线正好落在容器边缘 x=65/1365 上，属于盲区。
   四轮的真凶：`.hero::before` 强调色柔光（浓度仅 6%/4%，肉眼几乎看不见）
   只铺在主容器盒里（宽度跟 --w-max，现为 1600；首次抓到时是 1300），
   被 `.hero` 的 `overflow: hidden` 沿容器左右边缘切断，
   在导航条带（左）和卡片行（右）各留一条竖分界线 —— 正是用户报的位置。 */
const gray = ([r, g, b]) => (r + g + b) / 3; // 0..255 口径
const CONTAINER_W = 1600; // = global.css --w-max（2026-09-22 晚 1300 → 1600）
const bandWidth = Math.round((bg.width - 10 - CONTAINER_W) / 2);
const bandStep = (from, to) => {
  const yTop = Math.round(bg.height * 0.12), yBot = Math.round(bg.height * 0.88);
  const colMean = (f, x) => { let sum = 0, n = 0; for (let y = yTop; y < yBot; y += 3) { sum += gray(f.at(x, y)); n++; } return sum / n; };
  let mx = 0, at = null;
  for (let x = from + 2; x <= to - 2; x++) {
    // ⚠️ 三帧取最小：静态边缘三帧都在，视频自身的竖向纹理不会
    const d = minFrame((f) => Math.abs(colMean(f, x + 2) - colMean(f, x - 2)));
    if (d > mx) { mx = d; at = x; }
  }
  return { mx, at };
};
const leftBand = bandStep(0, bandWidth);
const rightBand = bandStep(bg.width - 12 - bandWidth, bg.width - 12);
check('容器左侧留白带内没有暗带/硬边（逐列阶跃 ≤3/255）', leftBand.mx <= 3,
  `最大阶跃 ${leftBand.mx.toFixed(2)}/255 @x=${leftBand.at}（留白带宽 ${bandWidth}）`);
check('容器右侧留白带内没有暗带/硬边（逐列阶跃 ≤3/255）', rightBand.mx <= 3,
  `最大阶跃 ${rightBand.mx.toFixed(2)}/255 @x=${rightBand.at}（已排除滚动条 12px）`);

/* ── A. 容器边缘偏差：把屏幕纵向切成 72px 段，逐段看"内 4 列 − 外 4 列" ──
   分界线是**整段一致**的偏置；视频自身的横向梯度是**缓慢**的（实测各段 ≤0.29/255）。
   ⚠️ 不能用"整屏平均"代替：柔光的左尾在整屏尺度上会被别的起伏抵消
   （实测整屏只有 +0.31/255，看着合格；而按 72px 分段时导航条带那一段是 +1.87/255）——踩过。 */
const cw = await bgEv(`document.documentElement.clientWidth`);
const offX = Math.round((cw - CONTAINER_W) / 2);
const segs = [];
for (let y0 = 8; y0 + 72 <= bg.height - 14; y0 += 72) segs.push([y0, y0 + 72]);
const segBias = (f, y0, y1) => {
  const colMean = (x) => { let s2 = 0, n = 0; for (let y = y0; y < y1; y += 2) { s2 += gray(f.at(x, y)); n++; } return s2 / n; };
  const inner = (x) => (colMean(x) + colMean(x + 1) + colMean(x + 2) + colMean(x + 3)) / 4;
  const outer = (x) => (colMean(x) + colMean(x - 1) + colMean(x - 2) + colMean(x - 3)) / 4;
  return { left: inner(offX) - outer(offX - 1), right: inner(offX + CONTAINER_W - 1) - outer(offX + CONTAINER_W) };
};
let worstL = { v: 0 }, worstR = { v: 0 };
for (const [y0, y1] of segs) {
  // 三帧取最小：静态分界线的偏差三帧都差不多，视频亮度起伏会被压掉
  const bs = frames.map((f) => segBias(f, y0, y1));
  const left = bs.reduce((a, b) => (Math.abs(b.left) < Math.abs(a) ? b.left : a), bs[0].left);
  const right = bs.reduce((a, b) => (Math.abs(b.right) < Math.abs(a) ? b.right : a), bs[0].right);
  if (Math.abs(left) > Math.abs(worstL.v)) worstL = { v: left, y: y0 };
  if (Math.abs(right) > Math.abs(worstR.v)) worstR = { v: right, y: y0 };
}
// 阈 0.5/255（实测标定）：
//   · 修好之后各段 |偏差| ≤0.29/255（就是视频自身的横向梯度）
//   · 把柔光加回去（EXTRA_CSS 注入，模拟缺陷）时：导航条带左缘 +1.87/255、卡片行右缘 -1.37/255
//   缺陷比本底大 4.7 倍，本底距阈值还有 1.7 倍余量 → 这条断言既不会漏，也不会误报。
check('容器左缘没有分界线（逐 72px 段 |内−外| ≤0.5/255）', Math.abs(worstL.v) <= 0.5,
  `最大偏差 ${worstL.v.toFixed(2)}/255 @y=${worstL.y}`);
check('容器右缘没有分界线（逐 72px 段 |内−外| ≤0.5/255）', Math.abs(worstR.v) <= 0.5,
  `最大偏差 ${worstR.v.toFixed(2)}/255 @y=${worstR.y}`);

/* ── B. 结构性规则：容器的"绝对定位伪元素 + 渐变"会被容器边缘切断 ──
   为什么不用像素扫描做这件事（试过，**不可靠**）：
   一开始写的是"在纯背景列上扫 1px 灰度差"，结果视频画面自身的竖直纹理会被判成分界线 ——
   实测 x=1091,y=152 报 4.98/255、x=871,y=152 报 1.70/255，
   用 document.elementsFromPoint 查过，这两点上只有 `.hero`（没有任何元素在画），
   说明是**视频内容**；而真凶柔光的实测幅度只有 1.37/255，
   **视频纹理比瑕疵还大**，任何阈值都分不开 → 这条像素断言在设计上就不成立，删掉。
   （留三帧取最小能压掉 4.98 那一档，但压不掉 1.70 那一档。）

   改成结构判定：遍历所有"宽度等于主容器宽"的元素，看它有没有画着渐变的
   `::before / ::after` 且 `position: absolute` —— 这种伪元素的盒子就是容器盒，
   必然在容器左右边缘留下分界线。两次瑕疵（`.hero::after` 压暗膜、`.hero::before` 柔光）
   都是这一个模式；而 `body::before` 那种 `position: fixed; inset: 0` 的全屏层是安全的。
   ⚠️ 已实测：把柔光加回去（EXTRA_CSS 注入）时这条规则会指向
   `section#top.hero::before pos=absolute inset=0px`；删掉后为空。 */
const containerLayers = await bgEv(`(()=>{const out=[];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (Math.abs(r.width - CONTAINER_W) > 2) continue;
    for (const w of ['::before', '::after']) {
      const c = getComputedStyle(el, w);
      if (!c.content || c.content === 'none') continue;
      if (c.backgroundImage === 'none') continue;
      if (c.position !== 'absolute') continue;
      const d = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
        + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).join('.') : '');
      out.push(d + w + ' pos=' + c.position + ' inset=' + c.inset);
    }
  }
  return JSON.stringify(out);})()`);
const containerLayerList = JSON.parse(containerLayers || '[]');
check('主容器上没有"会被容器边缘切断"的装饰伪元素', containerLayerList.length === 0,
  containerLayerList.length ? containerLayerList.join(' , ') : '已扫描全部元素（含 ::before/::after）');

try { await fetch(`${CDP}/json/close/${bgTab.id}`); } catch { /* 忽略 */ }
try { bgWs.close(); } catch { /* 忽略 */ }

check('无 JS 异常', errs.length === 0, errs[0] || '');

// ── §83.4 手机端不加载背景视频（2026-09-25）──
// 真机「刷新特别慢 + JS 功能失效」主因：6MB 视频自动播放与 JS 包抢带宽。
// 手机端（≤768）视频不赋 src（不下载），poster 静帧兜底；桌面端行为不变（src 由脚本赋值）。
await s('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await s('Page.navigate', { url: BASE + '/' });
await sleep(4000);
const mobV = await ev(`(() => { const v = document.querySelector('.video-bg__el'); const w = document.querySelector('.video-bg');
  return { src: v ? v.getAttribute('src') : 'NO-EL', ds: v ? (v.getAttribute('data-src') || '').split('/').pop() : '',
    bg: w ? getComputedStyle(w).backgroundImage : '', disp: v ? getComputedStyle(v).display : '' }; })()`);
check('手机端背景视频不加载（无 src，§83.4）', mobV.src === null || mobV.src === '', `src=${mobV.src} display=${mobV.disp}`);
check('手机端 poster 静帧兜底', /bg-poster/.test(mobV.bg), mobV.bg.slice(0, 80));
check('手机端 data-src 保留（桌面脚本可赋值）', mobV.ds === 'bg-loop.mp4', mobV.ds);
// 恢复桌面视口（后续截图用）
await s('Emulation.setDeviceMetricsOverride', { width: 1920, height: 900, deviceScaleFactor: 2, mobile: false });

// 截图取首页（hero + 背景视频一起入镜，最能反映观感）
const shot = await s('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) { writeFileSync(`${OUT}\\videobg-hero-${THEME}.png`, Buffer.from(shot.result.data, 'base64')); console.log(`\n  ✓ videobg-hero-${THEME}.png`); }

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
