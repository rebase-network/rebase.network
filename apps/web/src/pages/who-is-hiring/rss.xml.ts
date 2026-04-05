import rss from '@astrojs/rss';
import { getJobs, getSiteSettings } from '@/lib/content';
import { getJobPath } from '@/lib/paths';

export async function GET() {
  const site = getSiteSettings();
  const items = getJobs()
    .slice(0, 3)
    .map((job) => ({
      title: `${job.roleTitle} · ${job.companyName}`,
      description: job.summary,
      pubDate: new Date(job.publishedAt),
      link: getJobPath(job.slug),
    }));

  return rss({
    title: 'Rebase hiring',
    description: 'Latest hiring opportunities shared in the Rebase community.',
    site: site.primaryDomain,
    items,
    customData: '<language>zh-cn</language>',
  });
}
