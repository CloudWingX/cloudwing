import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 博客文章数据源：src/content/posts/*.md
// 归档页 /blog/ 按年份分组展示；link 可选（填了就跳外链，不填则展开正文）。
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().default(''),
    date: z.coerce.date(), // YAML 日期会被解析成 Date，这里统一收编
    tags: z.array(z.string()).default([]),
    link: z.string().optional(), // 外部链接（如博客原文 / 掘金 / 知乎专栏）
  }),
});

// 影集（游戏截图/照片墙）数据源：src/content/shots/*.md
const shots = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/shots' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    game: z.string().default('未分类'), // 用作筛选的“游戏/场景”标签
    image: z.string(),
    note: z.string().default(''),
    aspect: z.enum(['16:9', '4:3', '3:2', '1:1']).default('16:9'),
  }),
});

// 站点更新记录：src/content/changelog/*.md —— 一天一个文件，items 里写当天做了什么。
// 侧栏「活跃热力图」会把这些和博客/截图一起按日期聚合。
const changelog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/changelog' }),
  schema: z.object({
    date: z.coerce.date(),
    items: z
      .array(
        z.object({
          kind: z.string().default('更新'), // 上线 / 优化 / 修复 / 内容 …
          title: z.string(),
          note: z.string().default(''),
        }),
      )
      .default([]),
  }),
});

export const collections = { posts, shots, changelog };
