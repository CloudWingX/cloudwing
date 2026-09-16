# 背景视频

`bg-loop.mp4` —— 全站背景视频（`components/VideoBackground.astro` 使用，配置在 `src/site.ts` 的 `VIDEO_BG`）。

## 素材来源与授权

- 来源：Pixabay（<https://cdn.pixabay.com/video/2016/09/13/5200-183786525_large.mp4>）
- Pixabay 内容许可：可免费用于商业与非商业用途、可修改，**无需署名**。
  详见 <https://pixabay.com/service/license-summary/>
- 已随站点打包（不走外部 CDN）：第三方直链随时可能失效或被墙，稳定性优先。

## 文件规格

- 容器/编码：MP4（H.264，`ftyp mp42`）
- **无音轨**（这样才允许浏览器的静音自动播放策略；换成带音轨的素材时，页面里已写死 `muted`，
  但请确认素材本身没有需要保留的声音）
- 时长约 29 秒，体积约 15.5 MB

## 换成自己的视频

1. 把新文件放进本目录（建议保持文件名 `bg-loop.mp4`，或改 `src/site.ts` 里的路径）。
2. 没有 `ffmpeg` 也能用，但强烈建议先压一遍，控制体积：
   ```
   ffmpeg -i in.mp4 -an -vf "scale=1920:-2" -c:v libx264 -crf 28 -preset slow -movflags +faststart bg-loop.mp4
   ```
   - `-an` 去掉音轨（背景视频不需要声音，也不会有自动播放限制问题）
   - `movflags +faststart` 把索引放到文件头，边下边播更快出画面
   - 建议控制在 **8 MB 以内**；超过 25 MB 会碰到 Cloudflare Pages 的单文件上限
3. 换素材后**务必重跑对比度自检**（不同素材亮度差别很大，浅色主题尤其敏感）：
   ```
   node scripts/verify-videobg.mjs http://127.0.0.1:4321 light
   node scripts/verify-videobg.mjs http://127.0.0.1:4321 dark
   ```
   如果 hero 文字不达标，调 `src/site.ts` 里 `VIDEO_BG` 的
   `opacityLight/opacityDark`（调小 → 视频更淡）或 `scrimLight/scrimDark`（调大 → 遮罩更浓）。

## 关掉视频背景

把 `src/site.ts` 里的 `VIDEO_BG.src` 置为 `''` 即可：`VideoBackground` 不渲染、
`body` 也不再加 `has-video-bg`，页面回到原来的渐变底。
