# CloudWing / 云翼

个人学习与作品档案站 —— Astro 静态站，磨砂玻璃扁平化 UI（浅色通透、黑白灰强调）。
记录代码、图集与学习轨迹，按编号留存、过程可追溯。

- 技术栈：Astro 7.3（静态输出）、React 岛、gsap、React Bits 组件原码（`src/components/ReactBits/`）
- 页面：首页（hero + 三板块交错）、作品库（卡 → 详情）、画廊（玻璃网格 + 大图）、关于（履历 + MagicBento + Lanyard）、互动（giscus 留言板）
- 背景：全站 Particles（`/account/` 用 GridScan）

## 本地运行

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # 输出 dist/
npm run preview    # 本地预览产物
```

> 注意：本机 Node 24 + Astro 7.3 下 build 依赖项目内插件
> `plugins/vite-cjs-inline-shim.mjs`（解决 picomatch 的 `require is not defined`），
> **不要**改动 node_modules。npm 可用自定义缓存：`$env:npm_config_cache='<cache>'`。

## 目录速览

```text
src/
  site.ts                  ← 站点信息 / NAV / IMG_CDN 图床开关 / GISCUS 配置
  content.config.ts        ← works（作品）/ shots（影集）集合 schema
  content/works/*.md       ← 每件作品一个 Markdown → 自动生成卡片与详情页
  content/shots/*.md       ← 影集条目（title/date/game/image/aspect）
  pages/                   ← index / works / gallery / about / account / 404
  components/ReactBits/    ← React Bits 官方原码 + 宿主组件（HomeWorksCardSwap 等）
  layouts/Base.astro       ← 全局壳：主题引导、Header/Footer、Particles、font
  styles/global.css        ← token + 玻璃基础；styles/motion.css ← 动效/深色 token
public/
  shots/mc/*.webp          ← 影集 40 张（已转 webp，共 ~3MB）
  covers/                  ← 作品封面
  favicon.svg / favicon-dark.svg
```

## 图片 / 图床

- 影集原图已从 PNG（共 180MB）压缩为 **webp**（1600w q78，共 ~3MB），存于 `public/shots/mc/`；
  原 PNG 备份在工作区外 `mc-originals-backup/`，不进仓库。
- 页面图片统一经 `src/site.ts` 的 `imgUrl()` 输出：
  - `IMG_CDN = ''`（默认）：走本地相对路径（Cloudflare Pages 自带 CDN，直接可用）；
  - `IMG_CDN = 'https://cdn.jsdelivr.net/gh/<user>/<repo>@main/public'`：切到 GitHub + jsDelivr 图床。
- 只影响 `/shots/…` 等静态图；ReactBits 组件原码不动，仅宿主/页面拼前缀。

## 内容怎么加

- **作品**：复制 `src/content/works/w001-lib.md` → 改 frontmatter（title/summary/date/order/tags/tools/state/cover）与正文；封面放 `public/covers/`。
- **影集**：webp 放 `public/shots/mc/`，在 `src/content/shots/` 加一条 md（image 指向 `/shots/mc/mc-xxx.webp`）。
- **留言板**：`site.ts` 的 `GISCUS` 填 repo/repoId/categoryId 后重建。

## 发布到 GitHub + Cloudflare Pages

1. 在 GitHub 新建公开仓库（如 `CloudWingX/cloudwing`），本地推上去：
   ```bash
   git init && git add -A && git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```
2. Cloudflare Pages → Create → Connect to Git → 选该仓库；
   Framework preset 选 **Astro**（build `npm run build`，输出 `dist`），保存即自动部署；
   也可用 Upload assets 手动传 `dist/`。
3. 若要让图片走 jsDelivr 图床，把 `site.ts` 的 `IMG_CDN` 填上 jsDelivr 地址后再 build。
   （注意：jsDelivr 只在仓库 push 后可用；国内部分地区访问 jsDelivr 不稳定，可保持 `''` 用 Pages 自带 CDN。）

## 上线前清单

- [ ] `src/site.ts`：邮箱 / GitHub / Bilibili 换成真实信息（当前为占位）
- [ ] `astro.config.mjs`：`site` 填正式域名
- [ ] 隐私确认：About 页与 README 不出现真实姓名 / 学校 / 企业（当前已规避）
