// 诊断 v2：直接把"主容器边缘"附近的逐列均值打印出来（不做排行榜，避免小阶跃被内容边缘挤掉），
// 另外统计"竖直线"特征：某一条 x 上出现阶跃的**行数**——真正的分界线会横跨几百行。
// 用法：node scripts/diag-edges.mjs [baseUrl] [page]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';
import zlib from 'node:zlib';

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
const PAGES = process.argv.slice(3).length ? process.argv.slice(3) : ['/', '/blog/'];
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const OUT = 'D:\\deep seek workplace\\_shots';
const W = +(process.env.W || 1440), H = +(process.env.H || 900);

const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const p = new Map();
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); } };
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await s('Page.addScriptToEvaluateOnNewDocument', { source: `try{localStorage.setItem('cw-theme-pref','dark');localStorage.removeItem('cw-accent');}catch(e){}` });

const freeze = (css) => ev(`(()=>{const st=document.createElement('style');st.id='frz';st.textContent=${JSON.stringify(css)};document.head.appendChild(st);return true;})()`);

async function grab(page, extraCss = '') {
  await s('Page.navigate', { url: BASE + page });
  const waitFor = async (x, ms = 40000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(400); } return false; };
  await waitFor(`(()=>{const v=document.querySelector('.video-bg__el');return v&&v.readyState>=2;})()`, 60000);
  await sleep(2200);
  await ev(`(()=>{const o=document.getElementById('frz');if(o)o.remove();const st=document.createElement('style');st.id='frz';
    st.textContent='*,*::before,*::after{animation:none !important;transition:none !important}'+${JSON.stringify(extraCss)};
    document.head.appendChild(st);return true;})()`);
  await ev(`document.querySelector('.video-bg__el')?.pause()`);
  await sleep(800);
  { const extra = process.env.EXTRA_CSS; if (extra) await ev(`(()=>{const st=document.createElement('style');st.textContent=${JSON.stringify(extra)};document.head.appendChild(st);return true;})()`); await sleep(300); }
  const shot = await s('Page.captureScreenshot', { format: 'png' });
  const png = decodePNG(Buffer.from(shot.result.data, 'base64'));
  const geo = await ev(`(()=>{const g=(sel)=>{const e=document.querySelector(sel);if(!e)return null;const r=e.getBoundingClientRect();return [Math.round(r.left),Math.round(r.right),Math.round(r.top),Math.round(r.bottom)];};
    return JSON.stringify({wrap:g('.wrap'),navBox:g('.header-container'),hero:g('.hero'),card:g('.code-card'),main:g('main'),cw:document.documentElement.clientWidth});})()`);
  return { png, geo: JSON.parse(geo) };
}

// 竖直线检测：对每个 x，统计全高范围内"单像素横向跳变"的行数
function verticalEdges(png) {
  const rows = [];
  for (let y = 4; y < H - 14; y++) rows.push(y);
  const stats = new Map();
  for (const y of rows) {
    for (let x = 2; x <= W - 14; x++) {
      const a = lum(png.at(x - 1, y)), b = lum(png.at(x + 1, y));
      const d = Math.abs(b - a);
      if (d > 0.0012) {
        const cur = stats.get(x) || { n: 0, sum: 0, max: 0 };
        cur.n++; cur.sum += d; if (d > cur.max) cur.max = d;
        stats.set(x, cur);
      }
    }
  }
  return [...stats.entries()].map(([x, v]) => ({ x, ...v })).sort((a, b) => b.n - a.n);
}

function profile(png, y0, y1, ranges) {
  const colMean = (x) => { let sum = 0, n = 0; for (let y = y0; y < y1; y += 2) { sum += lum(png.at(x, y)); n++; } return sum / n; };
  return ranges.map(([a, b]) => `x${a}-${b}: ` + Array.from({ length: b - a + 1 }, (_, i) => (a + i) + '=' + colMean(a + i).toFixed(4)).join(' ')).join('\n        ');
}

for (const page of PAGES) {
  const { png, geo } = await grab(page);
  console.log(`\n════════ ${page} ════════`);
  console.log('  几何: ' + JSON.stringify(geo));
  const cw = geo.cw;
  const off = Math.round((cw - 1300) / 2);
  console.log(`  主容器: x=${off} .. ${off + 1300}  （clientWidth ${cw}）`);
  const navCs = await ev(`(()=>{const e=document.querySelector('.header-container');if(!e)return 'none';const c=getComputedStyle(e);
    return c.backgroundColor+' | blur='+c.backdropFilter+' | border='+c.borderTopColor+' | shadow='+c.boxShadow+' | mask='+(c.maskImage||c.webkitMaskImage);})()`);
  console.log('  .header-container 计算样式: ' + navCs);
  const heroCs = await ev(`(()=>{const e=document.querySelector('.hero');if(!e)return 'none';const c=getComputedStyle(e);
    const b=getComputedStyle(e,'::before');
    return 'hero bg='+c.backgroundColor+' mask='+(c.maskImage||c.webkitMaskImage)+' overflow='+c.overflow+' || ::before content='+b.content+' bg='+b.backgroundImage.slice(0,120)+' inset='+b.inset;})()`);
  console.log('  .hero 计算样式: ' + heroCs);

  const edges = verticalEdges(png);
  console.log(`  ── 容器边缘阶跃（lum 与 8bit 灰度两种口径）${process.env.EXTRA_CSS ? '  [EXTRA_CSS 已注入]' : ''}:`);
  {
    const bands = [['nav', 6, 58], ['cardRows', 300, 630], ['lowHero', 640, 860], ['full', 4, H - 14]];
    const gray = ([r, g, b]) => (r + g + b) / 3;
    const cm = (x, y0, y1, f) => { let s2 = 0, n = 0; for (let y = y0; y < y1; y += 2) { s2 += f(png.at(x, y)); n++; } return s2 / n; };
    const mean4 = (x, y0, y1, dir, f) => { let s2 = 0; for (let i = 1; i <= 4; i++) s2 += cm(x + dir * i, y0, y1, f); return s2 / 4; };
    for (const [name, y0, y1] of bands) {
      const out = [];
      for (const [tag, f, k, dg] of [['lum', lum, 1, 5], ['gray', gray, 1, 2]]) {
        const L = { o: mean4(off, y0, y1, -1, f), i: mean4(off, y0, y1, +1, f) };
        const R = { i: mean4(off + 1299, y0, y1, -1, f), o: mean4(off + 1299, y0, y1, +1, f) };
        const dl = (L.i - L.o) * k, dr = (R.o - R.i) * k;
        out.push(`${tag} 左${dl >= 0 ? '+' : ''}${dl.toFixed(dg)} 右${dr >= 0 ? '+' : ''}${dr.toFixed(dg)}`);
      }
      console.log(`     ${name.padEnd(9)} ${out.join('   ｜   ')}`);
    }
  }
  console.log('  ── 竖直线（行数 ≥ 40 的）:');
  console.log('  ── 容器级装饰层（结构性规则：容器的绝对定位伪元素 + 渐变 = 会被容器边缘切断）:');
  console.log('     ' + await ev(`(()=>{const off=${off};const out=[];
    const walk=(el)=>{const r=el.getBoundingClientRect();
      if(Math.abs(r.width-1300)>2) return;
      for(const w of ['::before','::after']){const c=getComputedStyle(el,w);
        if(!c.content||c.content==='none') continue;
        if(c.backgroundImage==='none') continue;
        const d=(el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(typeof el.className==='string'&&el.className?'.'+el.className.trim().split(/\\s+/).join('.'):''));
        out.push(d+w+' pos='+c.position+' inset='+c.inset+' bg='+c.backgroundImage.slice(0,48)+' → '+(c.position==='absolute'?'★会被容器边缘切断':'fixed/全屏，安全'));}
    };
    document.querySelectorAll('body *').forEach(walk);
    return out.length?out.join('\\n     '):'（无）';})()`));
  for (const e of edges.filter((e) => e.n >= 40).slice(0, 14)) {
    console.log(`     x=${String(e.x).padStart(5)}  行数=${String(e.n).padStart(4)}  平均${e.sum / e.n > 0 ? '' : ''}ΔL=${(e.sum / e.n).toFixed(5)}  峰值ΔL=${e.max.toFixed(5)}`);
  }
  const huge = edges.filter((e) => e.n >= 200);
  console.log('  ── 跨 200+ 行的长竖线: ' + (huge.length ? huge.map((e) => `x=${e.x}(${e.n}行,ΔL̄=${(e.sum / e.n).toFixed(5)})`).join(', ') : '无'));

  console.log('  ── 导航条带 (y 6-58) 逐列均值：');
  console.log('        ' + profile(png, 6, 58, [[off - 12, off + 12]]));
  console.log('        ' + profile(png, 6, 58, [[off + 1288, off + 1312]]));
  console.log('  ── hero 中段 (y 260-700) 逐列均值：');
  console.log('        ' + profile(png, 260, 700, [[off - 12, off + 12]]));
  console.log('        ' + profile(png, 260, 700, [[off + 1288, off + 1312]]));
}

try { await fetch(`${CDP}/json/close/${tab.id}`); } catch { /* 忽略 */ }
ws.close();
