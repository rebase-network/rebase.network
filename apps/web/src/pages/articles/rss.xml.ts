import { getLatestArticles, getSiteSettings } from '@/lib/content';
import { getArticlePath } from '@/lib/paths';
import { rssResponse, withBaseUrl } from '@/lib/rss';

export async function GET({ request }: { request: Request }) {
  const [site, articles] = await Promise.all([getSiteSettings(), getLatestArticles(3)]);
  const items = articles.map((article) => ({
    title: article.title,
    description: `<p>${article.summary}</p>`,
    pubDate: new Date(article.publishedAt),
    link: withBaseUrl(site.primaryDomain, getArticlePath(article.id, article.slug)),
  }));

  return rssResponse(
    {
      title: 'Rebase articles',
      link: withBaseUrl(site.primaryDomain, '/articles/rss.xml'),
      description: 'Latest published articles from Rebase.',
      items,
    },
    request,
  );
}
