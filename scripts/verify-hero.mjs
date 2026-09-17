// 首页 Hero 验收：布局/间距/断点/动画四项（ShinyText / BlurText / GradientText / 逐字）。
// 用法：node scripts/verify-hero.mjs [baseUrl]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';

const tab = await (await fetch(`${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const p = new Map(); const errs = [];
const s = (m, pp = {}) => new Promise((r) => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: pp })); });
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.method === 'Runtime.exceptionThrown') errs.push((((m.params.exceptionDetails.exception || {}).description) || '').slice(0, 110));
  if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); }
};
const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true })).result?.result?.value;
const results = [];
const check = (n, ok, d = '') => { results.push({ n, ok }); console.log(`  ${ok ? '✅' : '❌'} ${n}${d ? '  —— ' + d : ''}`); };
const waitFor = async (x, ms = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await ev(x)) return true; await sleep(400); } return false; };

await s('Page.enable'); await s('Runtime.enable');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await s('Page.navigate', { url: BASE + '/' });
await waitFor(`!!document.querySelector('.hero-eyebrow')`);
await sleep(3200);

console.log('=== 结构 ===');
const dom = await ev(`(()=>({
  顺序: [...document.querySelector('.hero-inner').children].map(e=>e.className.split(' ')[0]),
  eyebrow: document.querySelector('.hero-eyebrow .he-text')?.textContent.trim(),
  行: [...document.querySelectorAll('.ht-line')].map(e=>e.textContent.trim()),
  副标题: document.querySelector('.hero-sub')?.textContent.trim(),
  按钮: [...document.querySelectorAll('.hero-cta .cta')].map(e=>e.textContent.trim()+'→'+e.getAttribute('href')),
}))()`);
console.log('  ' + JSON.stringify(dom));
check('Eyebrow 文案正确', dom.eyebrow === 'CLOUDWING · PERSONAL BLOG', String(dom.eyebrow));
check('层级顺序：eyebrow → 标题 → 副标题 → CTA',
  JSON.stringify(dom.顺序) === JSON.stringify(['hero-eyebrow', 'hero-title', 'hero-sub', 'hero-cta']), JSON.stringify(dom.顺序));
// 切词会给词间插入 NBSP 占位，比较前把空白统一成普通空格
const norm = (s) => String(s).replace(/[\s\u00A0]+/g, ' ').trim();
check('主标题两行文案正确', norm(dom.行[0]) === 'code on clouds,' && norm(dom.行[1]) === 'life on wings.', dom.行.map(norm).join(' / '));
check('副标题文案正确', dom.副标题 === '云上写代码，翼下记生活。记录前端、设计与日常思考。', String(dom.副标题));
check('两个 CTA 指向正确', dom.按钮[0].endsWith('/works/') && dom.按钮[1].endsWith('/about/'), dom.按钮.join(' '));

console.log('\n=== 布局与间距（规格逐条）===');
const css = await ev(`(()=>{
  const hero=document.querySelector('.hero'); const inner=document.querySelector('.hero-inner');
  const eb=document.querySelector('.hero-eyebrow'); const ti=document.querySelector('.hero-title');
  const sub=document.querySelector('.hero-sub'); const cta=document.querySelector('.cta');
  const g=(e,k)=>getComputedStyle(e)[k];
  return {
    hero最小高:g(hero,'minHeight'), hero对齐:g(hero,'alignItems'), hero内边距:g(hero,'paddingTop')+' '+g(hero,'paddingLeft'),
    inner最大宽:g(inner,'maxWidth'), inner方向:g(inner,'flexDirection'), inner对齐:g(inner,'alignItems'), inner文本对齐:g(inner,'textAlign'),
    eyebrow字号:g(eb,'fontSize'), eyebrow字重:g(eb,'fontWeight'), eyebrow行高:g(eb,'lineHeight'), eyebrow字距:g(eb,'letterSpacing'),
    eyebrow大写:g(eb,'textTransform'), eyebrowpadding:g(eb,'paddingTop')+' '+g(eb,'paddingLeft'), eyebrow圆角:g(eb,'borderRadius'),
    eyebrow模糊:g(eb,'backdropFilter')||g(eb,'webkitBackdropFilter'), eyebrow下距:g(eb,'marginBottom'),
    标题字号:g(ti,'fontSize'), 标题字重:g(ti,'fontWeight'), 标题行高:g(ti,'lineHeight'), 标题字距:g(ti,'letterSpacing'), 标题下距:g(ti,'marginBottom'),
    行display:g(document.querySelector('.ht-line'),'display'), 行nowrap:g(document.querySelector('.ht-line'),'whiteSpace'),
    强调字重:g(document.querySelector('.ht-accent'),'fontWeight'),
    强调渐变:g(document.querySelector('.ht-accent'),'backgroundImage').slice(0,60),
    强调尺寸:g(document.querySelector('.ht-accent'),'backgroundSize'),
    on字重:g(document.querySelector('.ht-dim'),'fontWeight'),
    副标题字号:g(sub,'fontSize'), 副标题行高:g(sub,'lineHeight'), 副标题最大宽:g(sub,'maxWidth'), 副标题下距:g(sub,'marginBottom'),
    cta高:g(cta,'minHeight'), cta内边距:g(cta,'paddingLeft'), cta圆角:g(cta,'borderRadius'), cta字号:g(cta,'fontSize'), cta字重:g(cta,'fontWeight'),
    cta模糊:g(cta,'backdropFilter')||g(cta,'webkitBackdropFilter'), cta阴影:g(cta,'boxShadow').slice(0,40),
    cta组gap:g(document.querySelector('.hero-cta'),'gap'),
    字体:g(hero,'fontFamily').slice(0,60),
  };})()`);
console.log('  ' + JSON.stringify(css, null, 1).replace(/\n/g, '\n  '));
check('Hero min-height 100vh', css.hero最小高 === '900px' || /vh/.test(css.hero最小高), css.hero最小高);
check('Hero 垂直居中（flex align center）', css.hero对齐 === 'center');
check('Container max-width 1200px', css.inner最大宽 === '1200px', css.inner最大宽);
check('Container flex column + 左对齐', css.inner方向 === 'column' && css.inner对齐 === 'flex-start' && css.inner文本对齐 === 'left');
check('Eyebrow 13px/500/1.2/0.16em/大写', css.eyebrow字号 === '13px' && css.eyebrow字重 === '500' && Math.abs(parseFloat(css.eyebrow行高) - 13 * 1.2) < 0.6 && Math.abs(parseFloat(css.eyebrow字距) - 13 * 0.16) < 0.2 && css.eyebrow大写 === 'uppercase', `${css.eyebrow字号}/${css.eyebrow字重}/行高${css.eyebrow行高}/字距${css.eyebrow字距}`);
check('Eyebrow 玻璃胶囊 padding 8px 14px + 999px', css.eyebrowpadding === '8px 14px' && css.eyebrow圆角 === '999px', `${css.eyebrowpadding} / ${css.eyebrow圆角}`);
check('Eyebrow blur(16px)', /blur\(16px\)/.test(String(css.eyebrow模糊)), String(css.eyebrow模糊));
check('Eyebrow margin-bottom 24px', css.eyebrow下距 === '24px', css.eyebrow下距);
check('主标题字体 clamp(52px,9.5vw,148px) @1440', parseFloat(css.标题字号) >= 52 && parseFloat(css.标题字号) <= 148, css.标题字号);
// 计算样式里 em 已换算成 px：行高 = 字号*1.02、字距 = 字号*(-0.055)
const fs0 = parseFloat(css.标题字号);
check('主标题 500 / 1.02 / -0.055em', css.标题字重 === '500' && Math.abs(parseFloat(css.标题行高) - fs0 * 1.02) < 1.2 && Math.abs(parseFloat(css.标题字距) - fs0 * -0.055) < 0.6, `${css.标题字重}/行高${css.标题行高}/字距${css.标题字距}`);
check('主标题 margin-bottom 28px', css.标题下距 === '28px', css.标题下距);
check('每行 display:block + nowrap（桌面）', css.行display === 'block' && css.行nowrap === 'nowrap', `${css.行display}/${css.行nowrap}`);
check('clouds/wings 字重 600', css.强调字重 === '600', css.强调字重);
check('clouds/wings 有渐变（GradientText）', /linear-gradient/.test(String(css.强调渐变)) && css.强调尺寸 === '200% 100%', `${css.强调尺寸}`);
check('"on" 字重 300', css.on字重 === '300', css.on字重);
check('副标题字号 clamp(16,1.8vw,20) / 行高 1.7 / 42ch / 下距 40px',
  parseFloat(css.副标题字号) >= 16 && parseFloat(css.副标题字号) <= 20 && Math.abs(parseFloat(css.副标题行高) - parseFloat(css.副标题字号) * 1.7) < 1 && parseFloat(css.副标题最大宽) >= 400 && parseFloat(css.副标题最大宽) <= 700 && css.副标题下距 === '40px',
  `${css.副标题字号}/${css.副标题行高}/${css.副标题最大宽}/${css.副标题下距}`);
check('CTA min-height 48px / padding 0 24px / 999px / 15px / 500',
  css.cta高 === '48px' && css.cta内边距 === '24px' && css.cta圆角 === '999px' && css.cta字号 === '15px' && css.cta字重 === '500',
  `${css.cta高}/${css.cta内边距}/${css.cta圆角}/${css.cta字号}/${css.cta字重}`);
check('CTA blur(18px) + 阴影 + gap 12px', /blur\(18px\)/.test(String(css.cta模糊)) && /0px 4px 16px/.test(css.cta阴影) && css.cta组gap === '12px', `${css.cta模糊} | ${css.cta阴影} | gap${css.cta组gap}`);
check('字体族为 Inter + 系统中文回退', /Inter/.test(css.字体) && /PingFang SC/.test(css.字体), css.字体);

console.log('\n=== 动画（用 GSAP 状态 + 计算样式验证）===');
const anim = await ev(`(()=>{
  const ti=document.querySelector('.hero-title');
  const acc=document.querySelector('.ht-accent');
  const sheen=document.querySelector('[data-shiny-sheen]');
  const chars=document.querySelectorAll('.hero-char');
  const words=document.querySelectorAll('.hero-word');
  const sub=document.querySelector('.hero-sub');
  const g=(e,k)=>getComputedStyle(e)[k];
  return {
    词数:words.length, 字容器数:chars.length,
    词终态:[...words].slice(0,3).map(e=>({o:g(e,'opacity'), t:g(e,'transform'), f:g(e,'filter')})),
    字终态:[...chars].slice(0,3).map(e=>({o:g(e,'opacity'), t:g(e,'transform')})),
    副标题容器:g(sub,'opacity'),
    渐变动画:g(acc,'animationName'), 渐变时长:g(acc,'animationDuration'),
    微光存在:!!sheen,
    分行单词: [...document.querySelectorAll('.ht-line')].map(l=>[...l.querySelectorAll('.hero-word')].map(w=>w.textContent)),
    行完整文本: [...document.querySelectorAll('.ht-line')].map(l=>l.textContent),
  };})()`);
console.log('  ' + JSON.stringify(anim));
check('主标题已按词切分（BlurText）', anim.词数 >= 7, `${anim.词数} 个词`);
check('单词终态：opacity 1 / 无位移 / blur 0', anim.词终态.every((w) => w.o === '1' && (w.t === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(w.t)) && (w.f === 'none' || /blur\(0px\)/.test(w.f))), JSON.stringify(anim.词终态[0]));
// 注：词与词之间的空格在 DOM 里是**独立文本节点**（词 span 之间），
// 所以要把整行的 textContent 读出来比较，不能只看各 span 的文字再拼。
check('切词后文案不丢（两行仍完整）',
  norm(anim.行完整文本?.[0]) === 'code on clouds,' && norm(anim.行完整文本?.[1]) === 'life on wings.',
  JSON.stringify(anim.行完整文本));
check('副标题已按字切分（SplitText）', anim.字容器数 >= 20, `${anim.字容器数} 个字`);
check('逐字终态：opacity 1 / 无位移', anim.字终态.every((c) => c.o === '1' && (c.t === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(c.t))), JSON.stringify(anim.字终态[0]));
check('clouds/wings 渐变在循环动画', anim.渐变动画 === 'hero-grad' && parseFloat(anim.渐变时长) === 4, `${anim.渐变动画} ${anim.渐变时长}`);
check('ShinyText 微光元素存在', anim.微光存在 === true);

console.log('\n=== 逐帧验证入场动画的 stagger ===');
await s('Page.navigate', { url: BASE + '/' });
await waitFor(`!!document.querySelector('.hero-word')`);
await ev(`(()=>{ window.__hf=[];
  const t0=performance.now();
  const tick=()=>{ const ws=[...document.querySelectorAll('.hero-word')];
    window.__hf.push({t:Math.round(performance.now()-t0), o:ws.map(e=>+(+getComputedStyle(e).opacity).toFixed(2))});
    if(performance.now()-t0<2600) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); })()`);
await sleep(3000);
const hf = await ev(`window.__hf`);
const firstIdx = hf[0].o.map((_, i) => { const f = hf.find((x) => x.o[i] >= 0.99); return f ? f.t : -1; });
console.log(`  各词就位时间: ${JSON.stringify(firstIdx)}`);
const inc = firstIdx.every((t, i) => i === 0 || (t >= 0 && firstIdx[i - 1] >= 0 && t >= firstIdx[i - 1]));
check('逐词依次入场（80ms stagger 递增）', inc && firstIdx.filter((t) => t > 0).length >= 5, JSON.stringify(firstIdx));

console.log('\n=== 断点 ===');
for (const [w, min, max, padL] of [[1440, 52, 148, '64px'], [1000, 44, 96, '40px'], [700, 36, 64, '24px'], [420, 30, 44, '20px']]) {
  await s('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 700 });
  await s('Page.navigate', { url: BASE + '/' });
  await waitFor(`!!document.querySelector('.hero-title')`);
  await sleep(1200);
  const m = await ev(`(()=>{const t=document.querySelector('.hero-title'); const h=document.querySelector('.hero');
    const s=document.querySelector('.hero-sub'); const c=document.querySelector('.cta');
    return {字号:parseFloat(getComputedStyle(t).fontSize), 行高:getComputedStyle(t).lineHeight,
      字距:getComputedStyle(t).letterSpacing, 左内边距:getComputedStyle(h).paddingLeft,
      副宽:getComputedStyle(s).maxWidth, 按钮宽:Math.round(c.getBoundingClientRect().width),
      溢出:document.documentElement.scrollWidth-document.documentElement.clientWidth};})()`);
  console.log(`  ${w}px: ` + JSON.stringify(m));
  const okSize = m.字号 >= min - 1 && m.字号 <= max + 1;
  const okPad = m.左内边距 === padL;
  check(`${w}px 主标题 ${min}–${max}px`, okSize, `${m.字号}px`);
  check(`${w}px 左右 padding ${padL}`, okPad, m.左内边距);
  check(`${w}px 无横向溢出`, m.溢出 === 0, String(m.溢出));
  if (w === 420) check('<480 副标题 max-width 30ch', parseFloat(m.副宽) <= 320, m.副宽);
  if (w < 480) check('<480 按钮占满一行', m.按钮宽 > 300, `${m.按钮宽}px`);
}

console.log('\n=== prefers-reduced-motion ===');
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await s('Page.navigate', { url: BASE + '/' });
await waitFor(`!!document.querySelector('.hero-word')`);
await sleep(1200); // 不播动画也应立刻可见
const rm = await ev(`(()=>{const ws=[...document.querySelectorAll('.hero-word')];
  const cs=[...document.querySelectorAll('.hero-char')];
  return {词:ws.slice(0,4).map(e=>getComputedStyle(e).opacity), 字:cs.slice(0,4).map(e=>getComputedStyle(e).opacity),
    渐变动画:getComputedStyle(document.querySelector('.ht-accent')).animationName};})()`);
console.log('  ' + JSON.stringify(rm));
check('减少动态：文字直接可见（无动画）', rm.词.every((o) => o === '1') && rm.字.every((o) => o === '1'), JSON.stringify(rm));
check('减少动态：关闭渐变流动', rm.渐变动画 === 'none', rm.渐变动画);

check('全程无 JS 异常', errs.length === 0, errs[0] || '');

await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await s('Page.navigate', { url: BASE + '/' });
await sleep(3500);
const shot = await s('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) { writeFileSync('D:\\deep seek workplace\\_shots\\hero-final.png', Buffer.from(shot.result.data, 'base64')); console.log('\n  ✓ hero-final.png'); }

const failed = results.filter((r) => !r.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
