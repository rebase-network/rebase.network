import rss from '@astrojs/rss';
import { getLatestJobs, getSiteSettings } from '@/lib/content';
import { getJobPath } from '@/lib/paths';

export async function GET() {
  const [site, jobs] = await Promise.all([getSiteSettings(), getLatestJobs(3)]);
  const items = jobs.map((job) => ({
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
