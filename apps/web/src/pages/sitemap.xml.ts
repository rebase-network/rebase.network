import {
  getArticles,
  getEvents,
  getGeekDailyEpisodes,
  getJobs,
  getSiteSettings,
} from '@/lib/content';
import { getArticlePath, getEventPath, getGeekDailyPath, getJobPath } from '@/lib/paths';

type SitemapEntry = {
  path: string;
  lastmod?: string;
};

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function renderUrl(baseUrl: string, entry: SitemapEntry) {
  const loc = escapeXml(new URL(entry.path, baseUrl).toString());
  const lastmod = entry.lastmod ? `<lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>` : '';

  return `<url><loc>${loc}</loc>${lastmod}</url>`;
}

export async function GET() {
  const [site, articles, events, jobs, episodes] = await Promise.all([
    getSiteSettings(),
    getArticles(),
    getEvents(),
    getJobs(),
    getGeekDailyEpisodes(),
  ]);

  const staticEntries: SitemapEntry[] = [
    { path: '/' },
    { path: '/about' },
    { path: '/who-is-hiring' },
    { path: '/geekdaily' },
    { path: '/articles' },
    { path: '/events' },
    { path: '/contributors' },
  ];

  const contentEntries: SitemapEntry[] = [
    ...articles.map((article) => ({
      path: getArticlePath(article.slug),
      lastmod: article.publishedAt,
    })),
    ...jobs.map((job) => ({
      path: getJobPath(job.slug),
      lastmod: job.publishedAt,
    })),
    ...events.map((event) => ({
      path: getEventPath(event.startAt, event.slug),
      lastmod: event.startAt,
    })),
    ...episodes.map((episode) => ({
      path: getGeekDailyPath(episode.episodeNumber),
      lastmod: episode.publishedAt,
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    [...staticEntries, ...contentEntries].map((entry) => renderUrl(site.primaryDomain, entry)).join('') +
    `</urlset>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
