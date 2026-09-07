import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 作品档案数据源：src/content/works/*.md
const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().default(''),
    date: z.coerce.date(), // YAML 日期会被解析成 Date，这里统一收编
    order: z.number(),
    tags: z.array(z.string()).default([]),
    tools: z.array(z.string()).default([]),
    state: z.string().default('已公开'),
    cover: z.string().default('/covers/blank.svg'),
    link: z.string().optional(), // 外部链接（如 GitHub 仓库）
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

export const collections = { works, shots };
