import rss from '@astrojs/rss';
import { getEvents, getSiteSettings } from '@/lib/content';
import { getEventPath } from '@/lib/paths';

export async function GET() {
  const site = getSiteSettings();
  const items = getEvents()
    .sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt))
    .slice(0, 3)
    .map((event) => ({
      title: event.title,
      description: event.summary,
      pubDate: new Date(event.startAt),
      link: getEventPath(event.startAt, event.slug),
    }));

  return rss({
    title: 'Rebase events',
    description: 'Latest event updates from Rebase.',
    site: site.primaryDomain,
    items,
    customData: '<language>zh-cn</language>',
  });
}
