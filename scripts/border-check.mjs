// 核对线上实际生效的边框宽度与颜色
const CDP = 'http://127.0.0.1:9222';
const BASE = process.argv[2] || 'https://cloudwing.pages.dev';
const THEME = process.argv[3] || 'light';
const tab = await (await fetch(`${CDP}/json/new?` + encodeURIComponent(BASE + '/works/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: THEME }] });
await send('Page.addScriptToEvaluateOnNewDocument', {
  source: `try{localStorage.setItem('cw-theme-pref','${THEME}');document.cookie='cw-theme-pref=${THEME};path=/';}catch(e){}`,
});
await send('Page.navigate', { url: BASE + '/works/' });
await new Promise((r) => setTimeout(r, 5000));
const r = await send('Runtime.evaluate', {
  expression: `(() => {
    const pick = (sel, label) => {
      const e = document.querySelector(sel);
      if (!e) return label + ': 无元素';
      const cs = getComputedStyle(e);
      return label + ' = ' + cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor;
    };
    return [
      pick('.wk-item .wk-card', '作品卡'),
      pick('.plate', '档案框'),
      pick('.sidecard', '侧栏卡'),
      pick('.pf-links a', '个人信息链接'),
      pick('.chip', '标签'),
      pick('.topbar', '顶栏'),
      pick('.theme-toggle', '主题切换'),
      pick('.art-toc', '正文目录'),
      '主题=' + document.documentElement.dataset.theme,
      '--line-1=' + getComputedStyle(document.documentElement).getPropertyValue('--line-1').trim(),
      '--line-2=' + getComputedStyle(document.documentElement).getPropertyValue('--line-2').trim(),
      '--line-w=' + getComputedStyle(document.documentElement).getPropertyValue('--line-w').trim(),
    ];
  })()`, returnByValue: true,
});
console.log(r.result.result.value.join('\n'));
ws.close();
