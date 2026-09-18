import { setTimeout as sleep } from 'node:timers/promises';
const CDP='http://127.0.0.1:9222';
const tab=await (await fetch(`${CDP}/json/new?about:blank`,{method:'PUT'})).json();
const ws=new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
let id=0;const p=new Map();
const s=(m,pp={})=>new Promise(r=>{const i=++id;p.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:pp}));});
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&p.has(m.id)){p.get(m.id)(m);p.delete(m.id);}};
const ev=async x=>{const r=await s('Runtime.evaluate',{expression:x,returnByValue:true});
  if(r.result&&r.result.exceptionDetails) return 'ERR '+(r.result.exceptionDetails.exception||{}).description;
  return r.result&&r.result.result?r.result.result.value:undefined;};
const waitFor=async(x,ms=40000)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await ev(x))return true;await sleep(400);}return false;};
await s('Page.enable');await s('Runtime.enable');
for(const [w,h] of [[1440,900],[1920,1080]]){
  await s('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:false});
  await s('Page.navigate',{url:'https://reactbits.dev/'});
  await waitFor("!!document.querySelector('.ln-hero-code-window')",60000);
  await sleep(2500);
  console.log('=== 参考站 '+w+' ===');
  console.log(await ev(`(function(){var W=Math.round(document.documentElement.clientWidth);
    // 找出页面上所有"居中的定宽容器"：宽度<视口且左右边距相近
    var seen=[],out=[];
    document.querySelectorAll('div,section,header,footer,main').forEach(function(e){
      var r=e.getBoundingClientRect(); if(r.width<50||r.height<20) return;
      var cs=getComputedStyle(e);
      var ml=parseFloat(cs.marginLeft)||0, mr=parseFloat(cs.marginRight)||0;
      var centered = Math.abs((W-r.width)/2 - r.left) <= 2;
      if(centered && r.width < W-8){
        var mw=cs.maxWidth;
        var key=Math.round(r.width)+'|'+mw;
        if(seen.indexOf(key)<0){seen.push(key);
          out.push({cls:String(e.className).slice(0,34), w:Math.round(r.width), maxW:mw, padL:cs.paddingLeft});}
      }
    });
    return JSON.stringify({viewport:W, centeredContainers:out.slice(0,10)},null,1);})()`));
}
ws.close();
