// §76 探针：/about/ 三项删除后的存在性断言
// ① 无黑色信息组件（magic-bento 卡片）② 无吊牌（lanyard）③ 无文字悬浮动效（proximity）
import WebSocket from 'file:///C:/Users/24645/.workbuddy/binaries/node/workspace/node_modules/ws/index.js';
const CDP = 'http://127.0.0.1:9222';
const BASE = process.argv[2] || 'http://localhost:4321';
const list = await (await fetch(CDP + '/json/new?url=' + encodeURIComponent(BASE + '/about/'), { method: 'PUT' })).json();
const ws = new WebSocket(list.webSocketDebuggerUrl, { perMessageDeflate: false });
let id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
ws.on('message', (m) => { const d = JSON.parse(m); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } });
await new Promise(r => ws.on('open', r));
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: BASE + '/about/' });
await new Promise(r => setTimeout(r, 5000));
const data = await send('Runtime.evaluate', { expression: `(() => {
  const q = (s) => document.querySelector(s);
  const st = {
    bento卡片: !!q('.magic-bento-card, .card-grid'),
    吊牌容器: !!q('[data-lanyard], .ly-floater, .lanyard-wrapper'),
    标题邻近特效: !!q('.variable-proximity, .px-host'),
    拉丁词span: document.querySelectorAll('.cw-pxw, .cw-pxc').length,
    h1文本: q('.page-head h1')?.textContent.trim(),
    时间线行: document.querySelectorAll('.tl-row').length,
    技能组: document.querySelectorAll('.skill-groups li').length,
    note存在: !!q('.note'),
    note文本: q('.note')?.textContent.trim().slice(0, 30),
  };
  return JSON.stringify(st);
})()`, returnByValue: true });
const st = JSON.parse(data.result.value);
console.log(JSON.stringify(st));
let allOk = true;
const fail = (msg) => { console.log('FAIL ' + msg); allOk = false; };
if (st.bento卡片) fail('bento 卡片仍存在');
if (st.吊牌容器) fail('吊牌仍存在');
if (st.标题邻近特效) fail('标题邻近特效仍存在');
if (st.拉丁词span !== 0) fail('拉丁词 span 仍存在: ' + st.拉丁词span);
if (st.h1文本 !== '档案') fail('h1 文本异常: ' + st.h1文本);
if (st.时间线行 !== 3) fail('时间线行数异常: ' + st.时间线行);
if (st.技能组 !== 4) fail('技能组行数异常: ' + st.技能组);
if (!st.note存在) fail('.note 页脚缺失（verify-copy 依赖）');
console.log('ABOUT_CHECK=' + (allOk ? 'PASS' : 'FAIL'));
const shot = await send('Page.captureScreenshot', { format: 'png' });
const fs = await import('fs');
fs.writeFileSync('_shots/about-s76' + (BASE.includes('localhost') ? '-local' : '') + '.png', Buffer.from(shot.data, 'base64'));
await fetch(CDP + '/json/close/' + list.id);
process.exit(allOk ? 0 : 1);
