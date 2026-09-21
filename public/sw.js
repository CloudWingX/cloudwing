/* §67.8 CloudWing 音频 Range 补丁（Service Worker）—— 2026-09-22
 *
 * 背景：CF Pages 静态资产不支持 Range 请求（Range: bytes=x-y 一律回 200 整体，
 * 连小 JPG 也如此；fetch 直测 12/12 一致）。Chromium 对不可 Range 的媒体资源会把
 * seek 钳到 seekable 上界——实测一次 seekable=[0,0]（点进度条≈重头播放）、另一次
 * [0,dur]，行为随边缘状态漂移。astro preview（Node）正常 206，所以本地回归全绿、
 * 线上 seek 时灵时不灵。
 *
 * 方案：SW 只拦截「同源 GET /music/<file>.mp3 且带 Range 头」的媒体请求：
 *   ① 缓存命中 → 直接切 206 分片（seek 秒响应）；
 *   ② 首播 bytes=0- 且未缓存 → 向源站要全量（剥掉 Range 头），流式回 206 给媒体栈
 *     （不阻塞起播），同时后台写入 Cache API；
 *   ③ 中段 seek 且未缓存 → 全量拉取后切片（一次性成本，其后走 ①）。
 * 严格边界：非 mp3 / 非 GET / 非同源 / 无 Range 头一律不 respondWith（默认网络行为）；
 * 内部任何错误回落默认 fetch——站点其它流量完全不经过这里。
 * 版本：改本文件或曲目文件时递增 VER，activate 时清掉旧缓存。
 */
const VER = 'cw-audio-v1';
const AUDIO_RE = /^\/music\/[a-z0-9][a-z0-9-]*\.mp3$/i;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VER).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// 在途全量请求去重（多标签页/连续分片共享一次下载）
const inflight = new Map();

function slice206(buf, m) {
  const total = buf.byteLength;
  let start, end;
  if (m[1] === '' && m[2] !== '') {
    // bytes=-N 后缀语义
    const n = Math.min(+m[2], total);
    start = total - n;
    end = total - 1;
  } else {
    start = m[1] === '' ? 0 : +m[1];
    end = m[2] === '' ? total - 1 : Math.min(+m[2], total - 1);
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= total) {
    return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + total } });
  }
  const slice = buf.slice(start, end + 1);
  return new Response(slice, {
    status: 206,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(slice.byteLength),
      'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=14400',
    },
  });
}

async function fullBuffered(url) {
  const cache = await caches.open(VER);
  const hit = await cache.match(url.href);
  if (hit) return hit.arrayBuffer();
  let job = inflight.get(url.href);
  if (!job) {
    job = (async () => {
      const up = await fetch(url.href, { redirect: 'follow' }); // 不带 Range → 源站 200 全量
      if (!up || !up.ok || !up.body) throw new Error('upstream ' + (up ? up.status : 'null'));
      const res = new Response(up.body, { status: up.status, statusText: up.statusText, headers: up.headers });
      await cache.put(url.href, res.clone());
      return res;
    })().finally(() => inflight.delete(url.href));
    inflight.set(url.href, job);
  }
  const res = await job;
  return res.arrayBuffer();
}

async function audioResponse(req, url) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((req.headers.get('range') || '').trim());
  if (!m) return fetch(req); // 解析不了 → 默认行为

  const cache = await caches.open(VER);
  const cached = await cache.match(url.href);
  if (cached) return slice206(await cached.arrayBuffer(), m); // ①

  const start0 = m[1] === '' || m[1] === '0';

  // ② 首播：流式 206 + 后台写缓存
  if (start0 && m[2] === '') {
    let job = inflight.get(url.href);
    if (job) return slice206(await (await job).arrayBuffer(), m);
    job = (async () => {
      const up = await fetch(url.href, { redirect: 'follow' });
      if (!up || !up.ok || !up.body) throw new Error('upstream ' + (up ? up.status : 'null'));
      const total = Number(up.headers.get('content-length')) || 0;
      const res = new Response(up.body, { status: up.status, statusText: up.statusText, headers: up.headers });
      if (total > 0) cache.put(url.href, res.clone()).catch(() => {});
      return { res, total };
    })().finally(() => inflight.delete(url.href));
    inflight.set(url.href, job);
    const { res, total } = await job;
    if (total > 0) {
      return new Response(res.body, {
        status: 206,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': String(total),
          'Content-Range': 'bytes 0-' + (total - 1) + '/' + total,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=14400',
        },
      });
    }
    return slice206(await res.arrayBuffer(), m); // content-length 缺失时退化为全量切片
  }

  // ③ 中段 seek 且未缓存：全量拉取后切片
  return slice206(await fullBuffered(url), m);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  if (!AUDIO_RE.test(url.pathname)) return;
  if (!req.headers.has('range')) return;
  event.respondWith(audioResponse(req, url).catch(() => fetch(req)));
});
