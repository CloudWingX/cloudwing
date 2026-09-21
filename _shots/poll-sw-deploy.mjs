// poll-sw-deploy.mjs — 轮询 CF Pages 直至 §67.8（sw.js 音频 Range 补丁）上线
// 特征从产物生成：/sw.js 含 VER 标记 + 页面 head 含 SW 注册脚本；/music/ 特征做对照组。
const BASE = 'https://cloudwing.pages.dev';
const ts = Date.now();
const get = async (p) => {
  const res = await fetch(BASE + p + (p.includes('?') ? '&' : '?') + 'cb=' + ts, { redirect: 'follow' });
  return { status: res.status, text: await res.text() };
};

for (let round = 1; round <= 15; round++) {
  try {
    const [sw, blog, music] = await Promise.all([get('/sw.js'), get('/blog/'), get('/music/')]);
    const swOK = sw.status === 200 && sw.text.includes('cw-audio-v1');
    const regOK = blog.status === 200 && blog.text.includes('serviceWorker');
    const ctrlOK = music.status === 200 && music.text.includes('data-music-page'); // 对照：上一版特征仍在
    console.log(
      'round ' + round +
      ' sw=' + sw.status + '/' + swOK +
      ' reg=' + regOK +
      ' ctrl=' + ctrlOK
    );
    if (swOK && regOK && ctrlOK) {
      console.log('DEPLOY_VERIFIED round=' + round);
      process.exit(0);
    }
  } catch (e) {
    console.log('round ' + round + ' fetch error: ' + String(e.message || e).slice(0, 120));
  }
  await new Promise(r => setTimeout(r, 20000));
}
console.log('DEPLOY_TIMEOUT');
process.exit(1);
