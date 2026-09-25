// RSS 2.0 订阅：/rss.xml
// 内容 = 博客全部文章（按发布日期倒序），供阅读器订阅"博客更新"。
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../site';

export async function GET(context: APIContext) {
  const posts = (await getCollection('posts')).sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );

  const site = context.site ?? 'https://cloudwing.top';
  const feedUrl = new URL('rss.xml', site).href;

  return rss({
    title: `${SITE.title}（${SITE.latin}）· 博客`,
    description: SITE.notice,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>zh-CN</language><atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.summary || '',
      pubDate: new Date(p.data.date),
      link: `/posts/${p.id}/`,
      categories: p.data.tags ?? [],
    })),
  });
}
