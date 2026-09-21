// poll-music-deploy.mjs — 轮询 CF Pages 直至 §67 音乐功能上线
// 判据从产物生成（§64 经验）：/music/ HTML 特征 + 首页导航反查；cache-buster 强制回源绕边缘缓存。
const BASE = 'https://cloudwing.pages.dev';
const ts = Date.now();
const get = async (p) => {
  const res = await fetch(BASE + p + (p.includes('?') ? '&' : '?') + 'cb=' + ts, { redirect: 'follow' });
  return { status: res.status, text: await res.text() };
};

for (let round = 1; round <= 15; round++) {
  try {
    const [music, home] = await Promise.all([get('/music/'), get('/')]);
    const musicOK =
      music.status === 200 &&
      music.text.includes('data-music-page') &&
      music.text.includes('data-mp-ids');
    const navOK = home.status === 200 && home.text.includes('href="/music/"');
    console.log(
      'round ' + round +
      ' music=' + music.status + ' feature=' + musicOK +
      ' navFeature=' + navOK
    );
    if (musicOK && navOK) {
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
