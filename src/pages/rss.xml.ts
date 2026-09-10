// RSS 2.0 订阅：/rss.xml
// 内容 = 作品库全部档案（按归档日期倒序），供阅读器订阅"作品更新"。
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../site';

export async function GET(context: APIContext) {
  const works = (await getCollection('works')).sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );

  const site = context.site ?? 'https://cloudwing.pages.dev';
  const feedUrl = new URL('rss.xml', site).href;

  return rss({
    title: `${SITE.title}（${SITE.latin}）· 作品档案`,
    description: SITE.notice,
    site,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>zh-CN</language><atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
    items: works.map((w) => ({
      title: `W-${String(w.data.order ?? 0).padStart(3, '0')} · ${w.data.title}`,
      description: w.data.summary || '',
      pubDate: new Date(w.data.date),
      link: `/works/${w.id}/`,
      categories: w.data.tags ?? [],
    })),
  });
}
