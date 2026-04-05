import rss from '@astrojs/rss';
import { getLatestGeekDaily, getSiteSettings } from '@/lib/content';
import { getGeekDailyPath } from '@/lib/paths';

export async function GET() {
  const [site, episodes] = await Promise.all([getSiteSettings(), getLatestGeekDaily(3)]);
  const items = episodes.map((episode) => ({
    title: episode.title,
    description: episode.body,
    pubDate: new Date(episode.publishedAt),
    link: getGeekDailyPath(episode.episodeNumber),
  }));

  return rss({
    title: 'GeekDaily feed',
    description: 'Latest GeekDaily episodes from Rebase.',
    site: site.primaryDomain,
    items,
    customData: '<language>zh-cn</language>',
  });
}
