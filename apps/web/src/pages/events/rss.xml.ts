import { getEvents, getSiteSettings } from '@/lib/content';
import { getEventPath } from '@/lib/paths';
import { rssResponse, withBaseUrl } from '@/lib/rss';

export async function GET({ request }: { request: Request }) {
  const [site, events] = await Promise.all([getSiteSettings(), getEvents()]);
  const items = events
    .sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt))
    .slice(0, 3)
    .map((event) => ({
      title: event.title,
      description: `<p>${event.summary}</p>`,
      pubDate: new Date(event.startAt),
      link: withBaseUrl(site.primaryDomain, getEventPath(event.publicNumber, event.slug)),
    }));

  return rssResponse(
    {
      title: 'Rebase events',
      link: withBaseUrl(site.primaryDomain, '/events/rss.xml'),
      description: 'Latest event updates from Rebase.',
      items,
    },
    request,
  );
}
