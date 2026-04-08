import { getLatestGeekDaily, getSiteSettings } from '@/lib/content';
import { getGeekDailyPath } from '@/lib/paths';
import { rssResponse, withBaseUrl } from '@/lib/rss';

export async function GET() {
  const [site, episodes] = await Promise.all([getSiteSettings(), getLatestGeekDaily(3)]);
  const items = episodes.map((episode) => ({
    title: episode.title,
    description: episode.body,
    pubDate: new Date(episode.publishedAt),
    link: withBaseUrl(site.primaryDomain, getGeekDailyPath(episode.episodeNumber)),
  }));

  return rssResponse({
    title: 'GeekDaily feed',
    link: withBaseUrl(site.primaryDomain, '/geekdaily/rss.xml'),
    description: 'Latest GeekDaily episodes from Rebase.',
    items,
  });
}
