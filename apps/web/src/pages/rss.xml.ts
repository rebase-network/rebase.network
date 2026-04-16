import {
  getEvents,
  getLatestArticles,
  getLatestGeekDaily,
  getLatestJobs,
  getSiteSettings,
} from '@/lib/content';
import { getArticlePath, getEventPath, getGeekDailyPath, getJobPath } from '@/lib/paths';
import { rssResponse, withBaseUrl } from '@/lib/rss';

export async function GET({ request }: { request: Request }) {
  const [site, episodes, articles, events, jobs] = await Promise.all([
    getSiteSettings(),
    getLatestGeekDaily(3),
    getLatestArticles(3),
    getEvents(),
    getLatestJobs(3),
  ]);

  const items = [
    ...episodes.map((episode) => ({
      title: episode.title,
      description: episode.body,
      pubDate: new Date(episode.publishedAt),
      link: withBaseUrl(site.primaryDomain, getGeekDailyPath(episode.episodeNumber)),
    })),
    ...articles.map((article) => ({
      title: article.title,
      description: `<p>${article.summary}</p>`,
      pubDate: new Date(article.publishedAt),
      link: withBaseUrl(site.primaryDomain, getArticlePath(article.id, article.slug)),
    })),
    ...events.map((event) => ({
      title: event.title,
      description: `<p>${event.summary}</p>`,
      pubDate: new Date(event.startAt),
      link: withBaseUrl(site.primaryDomain, getEventPath(event.id, event.slug)),
    })),
    ...jobs.map((job) => ({
      title: `${job.roleTitle} · ${job.companyName}`,
      description: `<p>${job.summary}</p>`,
      pubDate: new Date(job.publishedAt),
      link: withBaseUrl(site.primaryDomain, getJobPath(job.id, job.slug)),
    })),
  ]
    .sort((a, b) => +b.pubDate - +a.pubDate)
    .slice(0, 3);

  return rssResponse(
    {
      title: 'Rebase feed',
      link: withBaseUrl(site.primaryDomain, '/rss.xml'),
      description: 'The latest community signals from Rebase.',
      items,
    },
    request,
  );
}
