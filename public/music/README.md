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
      duration: 280.9,                     // 秒（静态展示；实际以音频元数据为准）
      sizeMB: 11.15,
      bitrate: 320,
      origin: 'FLAC 24bit/192kHz → MP3 320kbps',
    }

当前四首（§67，2026-09-22 导入）：由 `D:\Download\music` 的无损 FLAC 转码为 320kbps MP3
（CF Pages 单文件 25MB 上限，原 FLAC 147–211MB 无法直接部署）。

约定：
- 文件名用**英文/数字**（`<id>.mp3`），避免中文与空格的 URL 编码问题；
- 封面放 `covers/<id>.jpg`（当前为自制生成图，源 FLAC 无内嵌封面；换真实封面直接覆盖同名文件）；
- 歌词放 `lyrics/<id>.lrc` 即自动启用同步高亮（零配置，见 `lyrics/README.md`）；
- 音乐涉及版权，请只放自己有权使用的内容。
