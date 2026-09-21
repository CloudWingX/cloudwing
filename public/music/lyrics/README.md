# 歌词目录（零配置约定）

把歌词文件命名为 `<曲目 id>.lrc` 放进本目录即可自动启用同步歌词，**不需要改任何代码**：

    evolution-era.lrc
    into-the-sky.lrc
    wings-of-piano.lrc
    starry-night.lrc

- 标准 LRC 格式：`[分:秒.厘秒]歌词文本`（一行可带多个时间戳）；
- 侧栏播放器点「词」、音乐页歌词区都会自动加载并逐行高亮；
- 文件不存在时：纯音乐曲目显示「纯音乐」，其余显示「暂无歌词」。

曲目 id 见 `src/site.ts` 的 `MUSIC` 数组（与 `public/music/covers/<id>.jpg` 同名约定）。
