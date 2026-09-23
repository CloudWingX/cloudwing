# 音乐目录

左侧栏底部音乐播放器（`components/MusicPlayer.astro`）与音乐子页面（`pages/music/index.astro`）
的音频都放这里；曲目数据统一在 `src/site.ts` 的 `MUSIC` 数组里维护：

    {
      id: 'evolution-era',                 // slug：封面/歌词文件名都跟它走
      title: 'Evolution Era',
      artist: 'V.K克',
      album: '『Deemo』Song Collection',
      src: '/music/evolution-era.mp3',
      cover: '/music/covers/evolution-era.jpg',
      instrumental: true,                  // 纯音乐（歌词面板显示「纯音乐」）
      duration: 292.11,                    // 秒（静态展示；以 MP3 实测为准，≠ FLAC 标签）
      sizeMB: 11.15,
      bitrate: 320,
      origin: 'FLAC 24bit/192kHz → MP3 320kbps',
    }

当前四首（§67，2026-09-22 导入）：由 `D:\Download\music` 的无损 FLAC 转码为 320kbps MP3
（CF Pages 单文件 25MB 上限，原 FLAC 147–211MB 无法直接部署）。

约定：
- 文件名用**英文/数字**（`<id>.mp3`），避免中文与空格的 URL 编码问题；
- 封面放 `covers/<id>.jpg`（§79，2026-09-23 已换成官方专辑封面：Deemo 合辑封面
  取自 QQ 音乐『Deemo』Song Collection、Into the Sky <MODv> 取自 Apple Music
  「Avid / Hands Up to the Sky - EP」、魔法使いの夜 OST 取自 Apple Music 同名专辑）；
- 歌词放 `lyrics/<id>.lrc` 即自动启用同步高亮（零配置，见 `lyrics/README.md`；
  §79：into-the-sky / starry-night 为 LRCLIB 社区同步歌词，后者为 Game Ver. 版本，
  与站点音源时长一致）。
- 音乐涉及版权，请只放自己有权使用的内容。

## Range 补丁（§67.8，public/sw.js）

CF Pages 静态资产不支持 Range 请求（`Range:` 一律回 200 整体），浏览器媒体栈对不可
Range 的资源会把 seek 钳到 0（点进度条≈重头播放），且行为随边缘状态漂移。
`public/sw.js`（Service Worker，Base.astro head 注册）只拦截同源 `/music/*.mp3` 的
Range 请求：首播流式回 206 并后台缓存整曲，之后任意分片从缓存秒切 206——seek 恢复
正常且确定。**换新曲目无需动 SW**（路径正则按 `<id>.mp3` 匹配）；若改 SW 本体记得
递增文件内 `VER` 以清旧缓存。
