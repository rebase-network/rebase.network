import rss from '@astrojs/rss';
import { getArticles, getSiteSettings } from '@/lib/content';
import { getArticlePath } from '@/lib/paths';

export async function GET() {
  const site = getSiteSettings();
  const items = getArticles()
    .slice(0, 3)
    .map((article) => ({
      title: article.title,
      description: article.summary,
      pubDate: new Date(article.publishedAt),
      link: getArticlePath(article.slug),
    }));

  return rss({
    title: 'Rebase articles',
    description: 'Latest published articles from Rebase.',
    site: site.primaryDomain,
    items,
    customData: '<language>zh-cn</language>',
  });
}
