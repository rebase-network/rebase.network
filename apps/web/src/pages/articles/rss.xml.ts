import rss from '@astrojs/rss';
import { getLatestArticles, getSiteSettings } from '@/lib/content';
import { getArticlePath } from '@/lib/paths';

export async function GET() {
  const [site, articles] = await Promise.all([getSiteSettings(), getLatestArticles(3)]);
  const items = articles.map((article) => ({
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
