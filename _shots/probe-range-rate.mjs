// probe-range-rate.mjs — 统计 CF 边缘对 MP3 Range 请求的 206/200 命中率（页面内 fetch，awaitPromise 版）
import { setTimeout as sleep } from 'node:timers/promises';
const CDP = process.env.CDP_URL || 'http://127.0.0.1:9222';
const tab = await (await fetch(CDP + '/json/new?' + encodeURIComponent('https://cloudwing.pages.dev/blog/'), { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
await send('Page.enable'); await send('Runtime.enable');
await sleep(3500);
const ev = async e => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;

const rounds = 2; // 两轮，每轮 6 发
for (let round = 1; round <= rounds; round++) {
  const out = await ev(`(async()=>{
    const out=[];
    for(let i=0;i<6;i++){
      try{
        const r=await fetch('/music/evolution-era.mp3',{headers:{Range:'bytes=100-199'},cache:'no-store'});
        out.push(r.status+':'+(r.headers.get('content-range')||'-'));
        try{await r.body.cancel()}catch(e){}
      }catch(e){out.push('ERR:'+e.message)}
      await new Promise(r=>setTimeout(r,250));
    }
    return out;
  })()`);
  console.log('round ' + round + ': ' + JSON.stringify(out));
  await sleep(1500);
}
ws.close(); process.exit(0);
