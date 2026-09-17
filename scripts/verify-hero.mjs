// Hero 验收（2026-09-18 改版：照用户的 reference 文件做像素级版式复刻）
// 断言的是"版式 / 尺寸 / 间距 / 断点"，期望值全部取自参考文件在无头浏览器里的**实测值**。
// 颜色不在此断言：强调色按用户要求保留站点雾蓝，见 index.astro 的注释。
// 用法：node scripts/verify-hero.mjs [baseUrl]
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const OUT = 'D:\\deep seek workplace\\_shots';

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

/* 一次量齐：结构 + 关键盒子的几何与排版 */
const snap = () => ev(`(()=>{
  const q=(s)=>document.querySelector(s);
  const box=(s)=>{const e=q(s); if(!e) return null; const r=e.getBoundingClientRect(); const c=getComputedStyle(e);
    return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
      fs:c.fontSize,fw:c.fontWeight,lh:c.lineHeight,ls:c.letterSpacing,
      radius:c.borderTopLeftRadius,padT:c.paddingTop,padL:c.paddingLeft,
      gap:c.gap,color:c.color,bg:c.backgroundColor,display:c.display};};
  const hero=q('.hero'); const hc=getComputedStyle(hero);
  return {
    hero:{w:Math.round(hero.getBoundingClientRect().width),h:Math.round(hero.getBoundingClientRect().height),
      padL:hc.paddingLeft, padR:hc.paddingRight, padT:hc.paddingTop, gap:hc.gap, display:hc.display,
      dir:hc.flexDirection, minH:hc.minHeight, maxW:hc.maxWidth},
    content:box('.hero-content'), badge:box('.hero-badge'), dot:box('.badge-dot'),
    title:box('.hero-title'), gradient:box('.title-gradient'),
    subtitle:box('.hero-subtitle'), features:box('.hero-features'),
    number:box('.feature-number'), label:box('.feature-label'), divider:box('.feature-divider'),
    tags:box('.component-tags'), tag:box('.component-tags .tag'),
    card:box('.code-card'), cardHead:box('.code-header'), cardBody:box('.code-body'),
    titleText: q('.hero-title').textContent.replace(/\\s+/g,' ').trim(),
    subtitleText: q('.hero-subtitle').textContent.replace(/\\s+/g,' ').trim(),
    tagCount: document.querySelectorAll('.component-tags .tag').length,
    legacy: {eyebrow:!!q('.hero-eyebrow'), inner:!!q('.hero-inner'), cta:!!q('.hero-cta'),
      htline:!!q('.ht-line'), accent:!!q('.ht-accent'), stroke:!!q('.stroke-text__svg'),
      typed:!!q('.typed-hero')},
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  };})()`);

const goto = async (w, h, mobile) => {
  await s('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: !!mobile });
  await s('Page.navigate', { url: BASE + '/' });
  await waitFor(`!!document.querySelector('.hero-title')`);
  await sleep(1300);
  await ev(`window.scrollTo(0,0)`);
  await sleep(400);
};

console.log('=== 桌面 1440：整版几何（对照参考实测值）===');
await goto(1440, 900, false);
const d = await snap();
console.log('  ' + JSON.stringify({ hero: d.hero, title: d.title, card: d.card }));

check('hero 左右内边距 32px（参考值）', d.hero.padL === '32px' && d.hero.padR === '32px', `${d.hero.padL}/${d.hero.padR}`);
check('hero 两栏 gap 80px（参考值）', d.hero.gap === '80px', d.hero.gap);
// 注意：min-height:100vh 在 getComputedStyle 里会被解析成 px（900px），
// 所以要么按视口高比，要么直接读源码里的声明 —— 这里按"等于视口高"断言。
check('hero min-height = 视口高（100vh）', Math.abs(d.hero.h - 900) <= 1, `${d.hero.h} vs 900`);
check('hero 是左右两栏 flex', d.hero.display === 'flex' && d.hero.dir === 'row', `${d.hero.display}/${d.hero.dir}`);
check('左栏最大宽 560（参考值）', d.content.w <= 560 && d.content.w > 400, String(d.content.w));

check('徽标：圆角 9999px / 内距 6×14（参考值）',
  parseFloat(d.badge.radius) >= 900 && d.badge.padT === '6px' && d.badge.padL === '14px',
  `${d.badge.radius} ${d.badge.padT} ${d.badge.padL}`);
check('徽标圆点 6×6', d.dot.w === 6 && d.dot.h === 6, `${d.dot.w}×${d.dot.h}`);

/* 主标题：2026-09-18 用户改文案为两行
   L1「Code on clouds, life on wings」/ L2「Hello this is CloudWing」。
   L1 有 28 字符，64px 下要 844px 而左栏只有 560px —— 所以字号是**按最长行反解**的
   clamp(27px, 1.9vw, 42px)，并且两行 nowrap 保证 PC 上严格两行。
   这里断言的是"两行 + 放得下 + 颜色分工"，不再锁定 64px。 */
const titleInfo = await ev(`(function(){var q=function(s){return document.querySelector(s);};
  var t=q('.hero-title'), l1=q('.ht-l1'), l2=q('.ht-l2');
  var cw=q('.hero-content').getBoundingClientRect().width;
  var mw=function(e){var d=e.style.display;e.style.display='inline-block';var w=e.getBoundingClientRect().width;e.style.display=d;return w;};
  return JSON.stringify({fs:getComputedStyle(t).fontSize, fw:getComputedStyle(t).fontWeight,
    lh:getComputedStyle(t).lineHeight, ls:getComputedStyle(t).letterSpacing, cw:Math.round(cw),
    l1w:Math.round(mw(l1)), l2w:Math.round(mw(l2)),
    l1:l1.textContent.trim(), l2:l2.textContent.trim(),
    l1color:getComputedStyle(l1).color, l2clip:getComputedStyle(l2).webkitBackgroundClip||getComputedStyle(l2).backgroundClip,
    l2img:getComputedStyle(l2).backgroundImage.slice(0,24),
    l1rects:l1.getClientRects().length, l2rects:l2.getClientRects().length});})()`);
const ti = JSON.parse(titleInfo);
check('标题第一行文案正确', ti.l1 === 'Code on clouds, life on wings', ti.l1);
check('标题第二行文案正确', ti.l2 === 'Hello this is CloudWing', ti.l2);
check('PC 上严格两行（两行都不折行）', ti.l1rects === 1 && ti.l2rects === 1, `L1=${ti.l1rects} L2=${ti.l2rects}`);
check('两行都放得进左栏（按最长行反解字号）', ti.l1w <= ti.cw + 1 && ti.l2w <= ti.cw + 1,
  `L1=${ti.l1w} L2=${ti.l2w} 容器=${ti.cw}`);
check('第一行为纯白', /rgb\(255,\s*255,\s*255\)/.test(ti.l1color), ti.l1color);
check('第二行走渐变强调色（background-clip:text + 渐变）',
  /text/.test(ti.l2clip) && /gradient/.test(ti.l2img), `${ti.l2clip} | ${ti.l2img}`);
check('主标题字重 700', ti.fw === '700', ti.fw);
check('主标题行高 1.05', Math.abs(parseFloat(ti.lh) - parseFloat(ti.fs) * 1.05) < 2, `${ti.lh} @ ${ti.fs}`);
check('主标题字距 -0.03em', Math.abs(parseFloat(ti.ls) + parseFloat(ti.fs) * 0.03) < 0.8, ti.ls);

check('副标题文案正确', d.subtitleText === '记录我的学习，折腾和胡思乱想', d.subtitleText);
check('副标题字号 18px', d.subtitle.fs === '18px', d.subtitle.fs);
check('副标题颜色 rgba(255,255,255,0.7)', /rgba\(255,\s*255,\s*255,\s*0?\.7\)/.test(d.subtitle.color), d.subtitle.color);
check('副标题行高 1.6', Math.abs(parseFloat(d.subtitle.lh) - 18 * 1.6) < 1.5, d.subtitle.lh);

check('统计组 gap 32px', d.features.gap === '32px', d.features.gap);
check('统计数字 28px / 600', d.number.fs === '28px' && d.number.fw === '600', `${d.number.fs}/${d.number.fw}`);
check('统计说明 14px', d.label.fs === '14px', d.label.fs);
check('分隔线 1×40', d.divider.w === 1 && d.divider.h === 40, `${d.divider.w}×${d.divider.h}`);

check('标签圆角 9999px / 内距 6×14', parseFloat(d.tag.radius) >= 900 && d.tag.padT === '6px' && d.tag.padL === '14px',
  `${d.tag.radius} ${d.tag.padT} ${d.tag.padL}`);
check('标签组 gap 8px', d.tags.gap === '8px', d.tags.gap);
check('标签数量 ≥ 4（来自作品 tools）', d.tagCount >= 4, String(d.tagCount));

check('卡片最大宽 520（参考值）', d.card.w <= 520 && d.card.w >= 380, String(d.card.w));
check('卡片圆角 12px', d.card.radius === '12px', d.card.radius);
check('卡片头有文件名', (await ev(`!!document.querySelector('.code-filename')`)) === true);
check('卡片三色圆点', (await ev(`document.querySelectorAll('.code-dot').length`)) === 3);

check('旧 Hero 结构已清干净（eyebrow/inner/cta/ht-*/stroke/typed）',
  !d.legacy.eyebrow && !d.legacy.inner && !d.legacy.cta && !d.legacy.htline && !d.legacy.accent && !d.legacy.stroke && !d.legacy.typed,
  JSON.stringify(d.legacy));
check('内容来自站点真实数据（标题/副标题非空）',
  d.titleText.length > 4 && d.subtitleText.length > 8, `"${d.titleText}" / "${d.subtitleText.slice(0, 24)}…"`);
check('桌面无横向溢出', d.overflow === 0, String(d.overflow));

console.log('\n=== 1024：gap 40 / pad 24 / 标题 48px / 卡片 440（参考值）===');
await goto(1024, 900, false);
const t = await snap();
check('gap 收到 40px', t.hero.gap === '40px', t.hero.gap);
check('左右内边距 24px', t.hero.padL === '24px' && t.hero.padR === '24px', `${t.hero.padL}/${t.hero.padR}`);
check('标题字号 ≤ PC 上限（按最长行反解，不再写死 48px）', parseFloat(t.title.fs) <= 42, t.title.fs);
check('卡片最大宽收到 440', t.card.w <= 440, String(t.card.w));
check('无横向溢出', t.overflow === 0, String(t.overflow));

console.log('\n=== 768：堆叠（参考手机端行为）===');
await goto(768, 900, true);
const m = await snap();
check('改为列向堆叠', m.hero.dir === 'column', m.hero.dir);
// 2026-09-18 手机端优化：照参考站的手机端实测值 —— 左对齐 / gap 32 / 上内边距 96
check('gap 32px（参考手机端值）', m.hero.gap === '32px', m.hero.gap);
check('上内边距 96px（参考手机端值）', m.hero.padT === '96px', m.hero.padT);
check('标题 36px（手机端比 PC 大：第一行允许折行，不必为一行牺牲字号）', m.title.fs === '36px', m.title.fs);
check('内容**左对齐**（参考手机端不居中）', (await ev(`getComputedStyle(document.querySelector('.hero-content')).textAlign`)) === 'left');
check('统计组左对齐', (await ev(`getComputedStyle(document.querySelector('.hero-features')).justifyContent`)) === 'flex-start');
check('标签组左对齐', (await ev(`getComputedStyle(document.querySelector('.component-tags')).justifyContent`)) === 'flex-start');
check('卡片占满内容宽', m.card.w > 600, String(m.card.w));
check('代码卡片不横向滚动（字号已按最长行反解）',
  (await ev(`(()=>{const b=document.querySelector('.code-body'); return b.scrollWidth-b.clientWidth;})()`)) === 0);
check('无横向溢出', m.overflow === 0, String(m.overflow));

console.log('\n=== 减少动态：不应有残留动画导致的空白 ──');
await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await goto(1440, 900, false);
const r = await snap();
check('减少动态下标题仍可见（透明/不可见类没有被沿用）',
  r.title.w > 100 && parseFloat(await ev(`getComputedStyle(document.querySelector('.hero-title')).opacity`)) > 0.9,
  `${r.title.w}px / opacity=${await ev(`getComputedStyle(document.querySelector('.hero-title')).opacity`)}`);

check('全程无 JS 异常', errs.length === 0, errs[0] || '');

await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await s('Page.navigate', { url: BASE + '/' });
await sleep(2500);
const shot = await s('Page.captureScreenshot', { format: 'png' });
if (shot.result?.data) { writeFileSync(`${OUT}\\hero-final.png`, Buffer.from(shot.result.data, 'base64')); console.log('\n  ✓ hero-final.png'); }

const failed = results.filter((x) => !x.ok);
console.log(`\n=== 结果：${results.length - failed.length}/${results.length} 通过 ===`);
failed.forEach((f) => console.log('  ❌ ' + f.n));
ws.close();
process.exit(failed.length ? 1 : 0);
