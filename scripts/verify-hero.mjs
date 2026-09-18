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
// 开局先清掉"强调色预设"的存档：共用调试浏览器时，上一次跑脚本留下的记录会让
// "默认态是零改动"这类断言整片误判（实测：profile 里残留 violet，默认态断言就挂了）。
await s('Page.navigate', { url: BASE + '/' });
await sleep(1200);
await ev(`(()=>{try{localStorage.removeItem('cw-accent');}catch(e){} return true;})()`);

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

/* 容器与下方区块对齐（2026-09-18 全局容器加宽后）：
   两者同宽（--w-max 1428）同内边距（--gutter），所以"内容左缘"必须重合。
   之前 hero 是写死 32px、max-width 1280，比区块窄 80px。 */
const edgeState = JSON.parse(await ev(`(function(){
  var w=document.querySelector('.sec .wrap'), h=document.querySelector('.hero');
  var cw=w?getComputedStyle(w):null, ch=h?getComputedStyle(h):null;
  var heroL=document.querySelector('.hero-content').getBoundingClientRect();
  var contentLeft = w ? Math.round(w.getBoundingClientRect().left + parseFloat(cw.paddingLeft)) : null;
  return JSON.stringify({
    heroPadL: ch?ch.paddingLeft:null, wrapPadL: cw?cw.paddingLeft:null,
    heroMaxW: ch?ch.maxWidth:null, wrapMaxW: cw?cw.maxWidth:null,
    heroContentLeft: Math.round(heroL.left), sectionContentLeft: contentLeft });})()`));
check('hero 与区块容器同宽（都用 --w-max）', edgeState.heroMaxW === edgeState.wrapMaxW,
  `${edgeState.heroMaxW} vs ${edgeState.wrapMaxW}`);
check('hero 与区块容器同内边距（都用 --gutter）', edgeState.heroPadL === edgeState.wrapPadL,
  `${edgeState.heroPadL} vs ${edgeState.wrapPadL}`);
check('hero 内容左缘与区块内容左缘重合（对齐主栅格）',
  Math.abs(edgeState.heroContentLeft - edgeState.sectionContentLeft) <= 1,
  `hero=${edgeState.heroContentLeft} 区块=${edgeState.sectionContentLeft}`);

/* ── 一、容器宽度与居中不变量（2026-09-18 二轮：--w-max 1428 → 1300）──
   用户要求：主内容容器 ≈1300、水平居中、左右留白对称；
   header / main / footer 三者同容器宽；导航栏本身仍 width:100%。
   这里在**同一个视口**下同时量四个容器：主内容区块 .wrap、hero、
   导航 .header-container、页脚 .site-footer .wrap，
   断言"同宽 + 同左缘 + 各自居中"。1440 与 1920 两档都会各跑一次
   （下面 goto(1440) / goto(1920) 两段）。 */
const widthInv = JSON.parse(await ev(`(function(){
  var q=function(s){return document.querySelector(s);};
  var vw=document.documentElement.clientWidth;
  var wrap=q('.sec .wrap'), hero=q('.hero'), head=q('.header-container'), foot=q('.site-footer .wrap');
  var g=function(e){ return e? e.getBoundingClientRect() : null; };
  var padL=function(e){ return e? parseFloat(getComputedStyle(e).paddingLeft) : null; };
  var wb=g(wrap), hb=g(head), fb=g(foot), hrb=g(hero);
  return JSON.stringify({
    vw: vw,
    wrapBoxW: wb?Math.round(wb.width*10)/10:null, wrapMaxW: wrap?getComputedStyle(wrap).maxWidth:null,
    wrapOffL: wb?Math.round(wb.left*10)/10:null, wrapOffR: wb?Math.round((vw-wb.right)*10)/10:null,
    wrapContentL: wb?Math.round((wb.left+padL(wrap))*10)/10:null,
    wrapContentR: wb?Math.round((wb.right-padL(wrap))*10)/10:null,
    heroBoxW: hrb?Math.round(hrb.width*10)/10:null,
    headW: hb?Math.round(hb.width*10)/10:null, headOffL: hb?Math.round(hb.left*10)/10:null,
    headOffR: hb?Math.round((vw-hb.right)*10)/10:null,
    footW: fb?Math.round(fb.width*10)/10:null, footOffL: fb?Math.round(fb.left*10)/10:null,
    footOffR: fb?Math.round((vw-fb.right)*10)/10:null,
    footContentL: fb?Math.round((fb.left+padL(foot))*10)/10:null
  });})()`));
check('主容器 max-width 1300（用户要求 ≈1300）', widthInv.wrapMaxW === '1300px', String(widthInv.wrapMaxW));
check('主容器居中：左右偏移差 ≤1px（留白对称）', Math.abs(widthInv.wrapOffL - widthInv.wrapOffR) <= 1,
  `左=${widthInv.wrapOffL} 右=${widthInv.wrapOffR}`);
check('hero 与主内容区块容器同宽（都是 1300 盒宽）', widthInv.heroBoxW === widthInv.wrapBoxW,
  `${widthInv.heroBoxW} vs ${widthInv.wrapBoxW}`);
check('header 容器与主内容容器同宽', widthInv.headW === widthInv.wrapBoxW, `${widthInv.headW} vs ${widthInv.wrapBoxW}`);
check('header 容器居中：左右偏移差 ≤1px', Math.abs(widthInv.headOffL - widthInv.headOffR) <= 1,
  `左=${widthInv.headOffL} 右=${widthInv.headOffR}`);
/* ⚠️ 首页的 <footer class="site-footer"> 被页面样式 `display:none` 掉了
   （index.astro 的 `body.home-route .site-footer { display: none }`），
   所以首页量不到页脚容器 —— 页脚与主容器同宽这条改由 verify-nav-shrink.mjs
   在 /works/ 上断言。这里只做"页脚若存在就必须对齐"的条件断言。 */
if (widthInv.footW !== null && widthInv.footW > 0) {
  check('footer 容器与主内容容器同宽且居中', widthInv.footW === widthInv.wrapBoxW,
    `${widthInv.footW} vs ${widthInv.wrapBoxW}`);
  check('footer 内容左缘与主内容区块内容左缘重合',
    Math.abs(widthInv.footContentL - widthInv.wrapContentL) <= 1,
    `footer=${widthInv.footContentL} 区块=${widthInv.wrapContentL}`);
}
check('header / 主内容容器左缘重合（同一栅格）',
  Math.abs(widthInv.headOffL - widthInv.wrapOffL) <= 1,
  `header=${widthInv.headOffL} main=${widthInv.wrapOffL}` +
  (widthInv.footW ? ` footer=${widthInv.footOffL}` : '（首页无页脚容器）'));

/* 2026-09-18 三轮：PC 端把整块（大标题＋代码卡片）竖向居中，并加大标题字号。
   布局三件套（互相咬合，改一个要同时改另两个）：
     左栏 700 + 两栏间隔 96 + 卡片 400 = 1196 = 容器净宽
   字号上限 48 → 52（第一行 28 字符在 52px 下实宽 686px，700 的栏放得下）。 */
check('hero 两栏 gap 96px（加大后的实测值）', d.hero.gap === '96px', d.hero.gap);
// 注意：min-height:100vh 在 getComputedStyle 里会被解析成 px（900px），
// 所以要么按视口高比，要么直接读源码里的声明 —— 这里按"等于视口高"断言。
check('hero min-height = 视口高（100vh）', Math.abs(d.hero.h - 900) <= 1, `${d.hero.h} vs 900`);
check('hero 是左右两栏 flex', d.hero.display === 'flex' && d.hero.dir === 'row', `${d.hero.display}/${d.hero.dir}`);
check('左栏 ≈ 700px（放大标题后的取值）', d.content.w >= 660 && d.content.w <= 710, String(d.content.w));

/* ── 竖向居中（2026-09-18 三轮：用户要求"整块挪到屏幕正中心"）──
   口径（实测 1440×900）：主内容块 [239,610] 中心 424 ≈ 视口中心 450；
   卡片因"与标题顶齐平"被下移 60px（标题顶 299 / 卡片 [299,769]），
   顶部留白 299 = 卡片底留白 131 + 60×2 + (610−239−470)…… 所以只断言：
   ① 主内容块居中；② 卡片相对主内容块居中（允许那 60px 的齐平位移）；
   ③ 标题顶与卡片底都在视口内、且标题顶不再是"贴顶的 96px"。 */
const vc = JSON.parse(await ev(`(function(){
  var q=function(s){return document.querySelector(s);};
  var vh=document.documentElement.clientHeight;
  var c=q('.hero-content').getBoundingClientRect();
  var card=q('.code-card').getBoundingClientRect();
  var t=q('.hero-title').getBoundingClientRect();
  return JSON.stringify({vh:vh,
    topGap:Math.round(t.top), bottomGap:Math.round(vh-card.bottom),
    contentTop:Math.round(c.top), contentBottom:Math.round(c.bottom),
    cardTop:Math.round(card.top), cardBottom:Math.round(card.bottom),
    contentMid:Math.round((c.top+c.bottom)/2), cardMid:Math.round((card.top+card.bottom)/2)});})()`));
check('整块竖向居中：主内容块中心 ≈ 视口中心（±40px）',
  Math.abs(vc.contentMid - vc.vh / 2) <= 40, `内容中心=${vc.contentMid} 视口中心=${vc.vh / 2}`);
check('卡片与主内容块同级居中（卡片中心 − 内容中心 ≤ 120px，含齐平位移）',
  Math.abs(vc.cardMid - vc.contentMid) <= 120,
  `卡片中心=${vc.cardMid} 内容中心=${vc.contentMid} 差=${vc.cardMid - vc.contentMid}`);
check('不再顶到顶部：标题顶留白 ≥ 120px（改前是 96px）', vc.topGap >= 120, String(vc.topGap));
check('标题顶与卡片底都在视口内（居中后不会被切）',
  vc.topGap > 0 && vc.cardBottom <= vc.vh && vc.bottomGap > 0,
  `标题顶=${vc.topGap} 卡片底=${vc.cardBottom} 视口高=${vc.vh}`);

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
/* 比例照参考站：左栏 / 卡片 / gap 的相对关系（现在是 700 : 400 : 96）。
   参考 h1 是 66px@645 栏；我们文案更长（第一行 28 字符），
   所以断言"比例"而不是"绝对值 66"。 */
check('左栏 ≈ 700px（放大标题后的取值）', ti.cw >= 660 && ti.cw <= 710, String(ti.cw));
check('标题字号落在新区间（45–53px，上限已从 48 提到 52）', parseFloat(ti.fs) >= 45 && parseFloat(ti.fs) <= 53, ti.fs);
check('两行都放得进左栏（按最长行反解字号）', ti.l1w <= ti.cw + 20 && ti.l2w <= ti.cw + 1,
  `L1=${ti.l1w} L2=${ti.l2w} 容器=${ti.cw}`);
check('第一行为纯白', /rgb\(255,\s*255,\s*255\)/.test(ti.l1color), ti.l1color);
check('第二行走渐变强调色（background-clip:text + 渐变）',
  /text/.test(ti.l2clip) && /gradient/.test(ti.l2img), `${ti.l2clip} | ${ti.l2img}`);
check('主标题字重 700', ti.fw === '700', ti.fw);
check('主标题行高 1.05', Math.abs(parseFloat(ti.lh) - parseFloat(ti.fs) * 1.05) < 2, `${ti.lh} @ ${ti.fs}`);
check('主标题字距 -0.03em', Math.abs(parseFloat(ti.ls) + parseFloat(ti.fs) * 0.03) < 0.8, ti.ls);

check('副标题文案正确', d.subtitleText === '记录我的学习，折腾和胡思乱想', d.subtitleText);
check('副标题字号 18px', d.subtitle.fs === '18px', d.subtitle.fs);
/* 2026-09-18 三轮：Hero 竖直居中后副标题正压着背景视频亮带，
   .7 白在亮帧上对比只有 3.66（18px 需 4.5）→ 提到 .92（配套 scrimTop/Mid 提到 .45/.75）。 */
check('副标题颜色 rgba(255,255,255,0.92)', /rgba\(255,\s*255,\s*255,\s*0?\.92\)/.test(d.subtitle.color), d.subtitle.color);
check('副标题行高 1.6', Math.abs(parseFloat(d.subtitle.lh) - 18 * 1.6) < 1.5, d.subtitle.lh);

check('统计组 gap 32px', d.features.gap === '32px', d.features.gap);
check('统计数字 ≈ 标题 ×0.54（参考比例：66px 标题配 26px 数字）',
  Math.abs(parseFloat(d.number.fs) / parseFloat(ti.fs) - 0.54) < 0.08,
  `${d.number.fs} / 标题 ${ti.fs} = ${(parseFloat(d.number.fs) / parseFloat(ti.fs)).toFixed(2)}`);
check('统计说明 ≈ 标题 ×0.28（参考比例：66px 标题配 13px）',
  Math.abs(parseFloat(d.label.fs) / parseFloat(ti.fs) - 0.28) < 0.06,
  `${d.label.fs} / 标题 ${ti.fs} = ${(parseFloat(d.label.fs) / parseFloat(ti.fs)).toFixed(2)}`);
check('分隔线 1×40', d.divider.w === 1 && d.divider.h === 40, `${d.divider.w}×${d.divider.h}`);

check('标签圆角 9999px / 内距 6×14', parseFloat(d.tag.radius) >= 900 && d.tag.padT === '6px' && d.tag.padL === '14px',
  `${d.tag.radius} ${d.tag.padT} ${d.tag.padL}`);
check('标签组 gap 8px', d.tags.gap === '8px', d.tags.gap);
check('标签数量 ≥ 4（来自作品 tools）', d.tagCount >= 4, String(d.tagCount));

check('卡片已收窄（≤410，左栏让出 40px 给大标题）', d.card.w <= 410 && d.card.w >= 360, String(d.card.w));
/* 用户要求"大标题与卡片顶部齐平"（左栏第一块是徽标胶囊，标题在其下方，
   所以卡片要下移一个 badge 高度 + 其下边距）。 */
const alignState = JSON.parse(await ev(`(function(){
  var q=function(s){return document.querySelector(s);};
  return JSON.stringify({titleTop:Math.round(q('.hero-title').getBoundingClientRect().top),
    cardTop:Math.round(q('.code-card').getBoundingClientRect().top),
    cardAlign:getComputedStyle(document.documentElement).getPropertyValue('--card-shift').trim()});})()`));
check('大标题与卡片顶部齐平', Math.abs(alignState.titleTop - alignState.cardTop) <= 1,
  `标题顶=${alignState.titleTop} 卡片顶=${alignState.cardTop}（--card-shift=${alignState.cardAlign}）`);check('卡片圆角 12px', d.card.radius === '12px', d.card.radius);
check('卡片头有文件名', (await ev(`!!document.querySelector('.code-filename')`)) === true);
check('卡片三色圆点', (await ev(`document.querySelectorAll('.code-dot').length`)) === 3);
/* ★代码卡片 = 磨砂玻璃★（2026-09-18 材质升级）：
   ① 背后要真的被**揉开**（blur ≥ 16px）且提了饱和（saturate > 1）—— 否则就是一层灰膜；
   ② 底色是**多层**（渐变高光 + 半透明底），不是单色；
   ③ 有内侧顶部高光（玻璃厚度的关键，box-shadow 里带 inset）。 */
const glassCard = await ev(`(()=>{
  const c=document.querySelector('.code-card'); if(!c) return null;
  const cs=getComputedStyle(c);
  const bf=String(cs.backdropFilter||cs.webkitBackdropFilter||'');
  const m=bf.match(/blur\\((\\d+(?:\\.\\d+)?)px\\)/);
  const s=bf.match(/saturate\\(([\\d.]+)\\)/);
  return {blur:m?parseFloat(m[1]):null, saturate:s?parseFloat(s[1]):null, bf,
    层:cs.backgroundImage.split('gradient').length-1, 底:cs.backgroundColor,
    inset:/inset/.test(cs.boxShadow)};})()`);
const gc = typeof glassCard === 'string' ? JSON.parse(glassCard) : glassCard;
check('代码卡片：磨砂模糊 ≥16px 且提饱和',
  gc && gc.blur >= 16 && gc.saturate > 1, gc ? `blur=${gc.blur}px saturate=${gc.saturate}` : 'null');
check('代码卡片：多层玻璃（渐变高光 + 半透明底 + 内侧高光）',
  gc && gc.层 >= 1 && /rgba\(/.test(String(gc.底)) && gc.inset === true,
  gc ? `渐变层=${gc.层} 底=${gc.底} inset=${gc.inset}` : 'null');
/* 代码段照参考的写法：带一个"会随色卡变色的色值胶囊"（swatch + hex），
   并且代码里有随预设变化的数值。 */
const codeState = JSON.parse(await ev(`(function(){var q=function(s){return document.querySelector(s);};
  var sw=q('.code-body .ln-swatch');
  return JSON.stringify({有色块:!!sw, 色块色:sw?getComputedStyle(sw).backgroundColor:null,
    色值:q('.code-body .ln-var')?q('.code-body .ln-var').textContent.trim():null,
    数值数:document.querySelectorAll('.code-body .ln-num').length,
    词法类:['code-keyword','code-string','code-function','code-attr','code-number','code-punc','code-comment']
      .filter(function(c){return document.querySelector('.code-body .'+c);}).length});})()`));
check('代码里有色值胶囊（swatch + hex，照参考）', codeState.有色块 === true && /^#[0-9A-F]{6}$/i.test(String(codeState.色值)), String(codeState.色值));
check('代码里有随预设变化的数值', codeState.数值数 >= 2, String(codeState.数值数));
check('词法着色覆盖 ≥6 类（keyword/string/function/attr/number/punc/comment）', codeState.词法类 >= 6, String(codeState.词法类));

/* ── 强调色预设（照参考站卡片底部的 Presets，见 index.astro / scripts/hero-theme.js）── */
const accentState = async () => JSON.parse(await ev(`(function(){
  var rs=getComputedStyle(document.documentElement); var v=document.querySelector('.video-bg__el');
  return JSON.stringify({
    presets: document.querySelectorAll('[data-accent-preset]').length,
    激活: (document.querySelector('.code-preset[aria-pressed="true"]')||{}).textContent,
    激活数: document.querySelectorAll('.code-preset[aria-pressed="true"]').length,
    accent: rs.getPropertyValue('--accent').trim(),
    tintA: rs.getPropertyValue('--tint-a').trim(),
    hue: rs.getPropertyValue('--vid-hue').trim(),
    filter: v?getComputedStyle(v).filter:null,
    代码色: getComputedStyle(document.querySelector('.code-keyword')).color,
    溢出: document.documentElement.scrollWidth-document.documentElement.clientWidth
  });})()`));

const a0 = await accentState();
check('卡片底部有色卡（5 个预设）', a0.presets === 5, String(a0.presets));
check('同时只有一个预设处于选中态', a0.激活数 === 1, `${a0.激活数} 个 / 当前「${(a0.激活 || '').trim()}」`);
check('默认态是"零改动"（色膜 0、无滤镜）',
  parseFloat(a0.tintA) === 0 && /hue-rotate\(0deg\)/.test(String(a0.filter)) && /saturate\(1\)/.test(String(a0.filter)),
  `tintA=${a0.tintA} filter=${a0.filter}`);

// 点「余烬」：应看到强调色与代码高亮都变，且**中途经过中间色**（不是直接跳）
await ev(`document.querySelector('[data-accent-preset="ember"]').click()`);
const mid = [];
for (let i = 0; i < 6; i++) {
  await sleep(70);
  mid.push(await ev(`(function(){var rs=getComputedStyle(document.documentElement);
    return rs.getPropertyValue('--accent').trim();})()`));
}
await sleep(1400);
const a1 = await accentState();
const uniq = [...new Set(mid)];
check('切换过程中经过中间色（≥3 个不同取值的过渡帧）', uniq.length >= 3, uniq.join(' → '));
check('切到「余烬」后强调色确实变了', a1.accent !== a0.accent, `${a0.accent} → ${a1.accent}`);
check('代码高亮跟着一起变', a1.代码色 !== a0.代码色, `${a0.代码色} → ${a1.代码色}`);
check('背景视频被旋转色相（换色但不是换背景）', parseFloat(a1.hue) !== 0, `${a0.hue} → ${a1.hue}`);
check('色膜浓度在过渡后落到该预设值', parseFloat(a1.tintA) > 0, a1.tintA);
check('切换后选中态跟随', (a1.激活 || '').trim() === '余烬', (a1.激活 || '').trim());
check('切换后无横向溢出', a1.溢出 === 0, String(a1.溢出));
/* 代码里那个"色值胶囊"也要跟着换（照参考：色块与 #hex 都随预设变） */
const pillAfter = JSON.parse(await ev(`(function(){var q=function(s){return document.querySelector(s);};
  var sw=q('.code-body .ln-swatch');
  return JSON.stringify({色:sw?getComputedStyle(sw).backgroundColor:null,
    值:q('.code-body .ln-var')?q('.code-body .ln-var').textContent.trim():null});})()`));
check('代码里的色块与色值随预设一起变', pillAfter.色 !== codeState.色块色 && pillAfter.值 !== codeState.色值,
  `色块 ${codeState.色块色} → ${pillAfter.色}；值 ${codeState.色值} → ${pillAfter.值}`);

// 复位，避免影响后面的断点断言
await ev(`document.querySelector('[data-accent-preset="mist"]').click()`);
await sleep(1200);

check('旧 Hero 结构已清干净（eyebrow/inner/cta/ht-*/stroke/typed）',
  !d.legacy.eyebrow && !d.legacy.inner && !d.legacy.cta && !d.legacy.htline && !d.legacy.accent && !d.legacy.stroke && !d.legacy.typed,
  JSON.stringify(d.legacy));
check('内容来自站点真实数据（标题/副标题非空）',
  d.titleText.length > 4 && d.subtitleText.length > 8, `"${d.titleText}" / "${d.subtitleText.slice(0, 24)}…"`);
check('桌面无横向溢出', d.overflow === 0, String(d.overflow));

console.log('\n=== 1920：同样要"居中 + 左右留白对称 + 三者同宽"（用户点名的另一档）===');
await goto(1920, 1080, false);
const w1920 = JSON.parse(await ev(`(function(){
  var q=function(s){return document.querySelector(s);};
  var vw=document.documentElement.clientWidth;
  var wrap=q('.sec .wrap'), hero=q('.hero'), head=q('.header-container'), foot=q('.site-footer .wrap');
  var g=function(e){ return e? e.getBoundingClientRect() : null; };
  var padL=function(e){ return e? parseFloat(getComputedStyle(e).paddingLeft) : null; };
  var wb=g(wrap), hb=g(head), fb=g(foot), hrb=g(hero);
  return JSON.stringify({
    vw: vw,
    wrapW: wb?Math.round(wb.width*10)/10:null, wrapMaxW: wrap?getComputedStyle(wrap).maxWidth:null,
    wrapOffL: wb?Math.round(wb.left*10)/10:null, wrapOffR: wb?Math.round((vw-wb.right)*10)/10:null,
    heroW: hrb?Math.round(hrb.width*10)/10:null,
    headW: hb?Math.round(hb.width*10)/10:null, headOffL: hb?Math.round(hb.left*10)/10:null,
    headOffR: hb?Math.round((vw-hb.right)*10)/10:null,
    footW: fb?Math.round(fb.width*10)/10:null,
    overflow: document.documentElement.scrollWidth-document.documentElement.clientWidth
  });})()`));
check('1920：主容器仍是 1300（不再随视口变宽）', w1920.wrapMaxW === '1300px' && w1920.wrapW === 1300,
  `${w1920.wrapMaxW} / 实测 ${w1920.wrapW}`);
check('1920：主容器居中，左右留白相等', Math.abs(w1920.wrapOffL - w1920.wrapOffR) <= 1,
  `左=${w1920.wrapOffL} 右=${w1920.wrapOffR}`);
check('1920：hero / header 与主内容容器同宽',
  w1920.heroW === w1920.wrapW && w1920.headW === w1920.wrapW,
  `hero=${w1920.heroW} header=${w1920.headW} main=${w1920.wrapW}` +
  (w1920.footW ? ` footer=${w1920.footW}` : '（首页无页脚容器）'));
if (w1920.footW !== null && w1920.footW > 0) {
  check('1920：footer 与主内容容器同宽', w1920.footW === w1920.wrapW, `${w1920.footW} vs ${w1920.wrapW}`);
}
check('1920：header 容器同样居中', Math.abs(w1920.headOffL - w1920.headOffR) <= 1,
  `左=${w1920.headOffL} 右=${w1920.headOffR}`);
check('1920 无横向溢出', w1920.overflow === 0, String(w1920.overflow));

console.log('\n=== 1024：gap 72 / pad 24 / 标题随 vw 回落 / 卡片整宽 ===');
await goto(1024, 900, false);
const t = await snap();
check('gap 收到 72px（参考 1024 档）', t.hero.gap === '72px', t.hero.gap);
check('左右内边距 24px', t.hero.padL === '24px' && t.hero.padR === '24px', `${t.hero.padL}/${t.hero.padR}`);
check('标题字号 ≤ PC 上限（按最长行反解，不再写死 48px）', parseFloat(t.title.fs) <= 42, t.title.fs);
check('卡片在 1024 档占满（参考同档也是整宽）', t.card.w >= 400, String(t.card.w));
check('无横向溢出', t.overflow === 0, String(t.overflow));

console.log('\n=== 768：堆叠（参考手机端行为）===');
await goto(768, 900, true);
const m = await snap();
check('改为列向堆叠', m.hero.dir === 'column', m.hero.dir);
// 2026-09-18 手机端优化：照参考站的手机端实测值 —— 左对齐 / gap 32 / 上内边距 96
check('gap 40px（堆叠后略收紧）', m.hero.gap === '40px', m.hero.gap);
check('上内边距 96px（参考手机端值）', m.hero.padT === '96px', m.hero.padT);
check('标题字号 30px（= 手机端下限；此时第一行会自动折行）', m.title.fs === '30px', m.title.fs);
check('内容**左对齐**（参考手机端不居中）', (await ev(`getComputedStyle(document.querySelector('.hero-content')).textAlign`)) === 'left');
check('统计组左对齐', (await ev(`getComputedStyle(document.querySelector('.hero-features')).justifyContent`)) === 'flex-start');
check('标签组左对齐', (await ev(`getComputedStyle(document.querySelector('.component-tags')).justifyContent`)) === 'flex-start');
check('卡片占满内容宽', m.card.w > 600, String(m.card.w));
check('代码卡片不横向滚动（字号已按最长行反解）',
  (await ev(`(()=>{const b=document.querySelector('.code-body'); return b.scrollWidth-b.clientWidth;})()`)) === 0);
check('无横向溢出', m.overflow === 0, String(m.overflow));
// ★手机端代码卡片必须"按内容展开"，不能被压扁后裁掉★（2026-09-18）
// 背景：≤768px 是列向堆叠，`flex: 1 1 0` 会把卡片的**高度**基准变成 0，
// 只能分到剩余空间 → 被压扁 + 卡片 overflow:hidden 切掉代码（实测 390px：卡高 230 / 体高 355）。
// 判据同时看三件事：代码体底边不能超出卡片、卡片自身不能被纵向裁切、卡高 ≥ 体高。
const fit = await ev(`(()=>{const c=document.querySelector('.code-card'), b=document.querySelector('.code-body');
  const rc=c.getBoundingClientRect(), rb=b.getBoundingClientRect();
  return {卡高:Math.round(rc.height), 体高:Math.round(rb.height),
    体底超出:Math.round(rb.bottom-rc.bottom), 卡裁Y:c.scrollHeight-c.clientHeight};})()`);
check('手机端代码卡片按内容展开（未被压扁/裁切）',
  fit.体底超出 <= 0 && fit.卡裁Y === 0 && fit.卡高 >= fit.体高, JSON.stringify(fit));

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
