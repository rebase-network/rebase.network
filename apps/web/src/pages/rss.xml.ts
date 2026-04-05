import rss from '@astrojs/rss';
import { getArticles, getEvents, getGeekDailyEpisodes, getJobs, getSiteSettings } from '@/lib/content';
import { getArticlePath, getEventPath, getGeekDailyPath, getJobPath } from '@/lib/paths';

export async function GET() {
  const site = getSiteSettings();
  const items = [
    ...getGeekDailyEpisodes().map((episode) => ({
      title: episode.title,
      description: episode.body,
      pubDate: new Date(episode.publishedAt),
      link: getGeekDailyPath(episode.episodeNumber),
    })),
    ...getArticles().map((article) => ({
      title: article.title,
      description: article.summary,
      pubDate: new Date(article.publishedAt),
      link: getArticlePath(article.slug),
    })),
    ...getEvents().map((event) => ({
      title: event.title,
      description: event.summary,
      pubDate: new Date(event.startAt),
      link: getEventPath(event.startAt, event.slug),
    })),
    ...getJobs().map((job) => ({
      title: `${job.roleTitle} · ${job.companyName}`,
      description: job.summary,
      pubDate: new Date(job.publishedAt),
      link: getJobPath(job.slug),
    })),
  ]
    .sort((a, b) => +b.pubDate - +a.pubDate)
    .slice(0, 3);

  return rss({
    title: 'Rebase feed',
    description: 'The latest community signals from Rebase.',
    site: site.primaryDomain,
    items,
    customData: '<language>zh-cn</language>',
  });
}
