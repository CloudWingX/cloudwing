---
title: Cloudflare Pages 自动构建的三个坑
summary: 无 lock 构建、平台可选依赖、以及"推送成功但线上没变"的排查顺序。
date: 2026-06-14
tags: [部署, Cloudflare, DevOps]
---

把静态站接到 Cloudflare Pages 之后，构建基本零维护。但头三次部署各踩了一个坑，记录下来：

1. **不要提交 `package-lock.json`**。Windows 生成的 lock 缺平台相关可选依赖，云端 Linux `npm ci` 直接报 `Missing @emnapi/*`。解法是 lock 进 `.gitignore`，让云端走 `npm install`。
2. **依赖版本要精确锁**。`react` 用浮动版本会解析到 19.3，和某些库的 peer `>=19 <19.3` 冲突，构建期 ERESOLVE。
3. **"推送成功但线上没变"先查部署日志**。构建只要 30–90 秒；超过五分钟没动静，先确认推送真的到了远端，再去看 Build log。

另一个经验：判断"新代码是否已上线"不要比对 chunk 哈希（本地与云端依赖解析差异会让哈希不同），要把这次改动的**内容特征**拿到线上 HTML/CSS 里搜，搜到了才算上线。
