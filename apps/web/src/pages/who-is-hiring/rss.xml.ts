import { getLatestJobs, getSiteSettings } from '@/lib/content';
import { getJobPath } from '@/lib/paths';
import { rssResponse, withBaseUrl } from '@/lib/rss';

export async function GET({ request }: { request: Request }) {
  const [site, jobs] = await Promise.all([getSiteSettings(), getLatestJobs(3)]);
  const items = jobs.map((job) => ({
    title: `${job.roleTitle} · ${job.companyName}`,
    description: `<p>${job.summary}</p>`,
    pubDate: new Date(job.publishedAt),
    link: withBaseUrl(site.primaryDomain, getJobPath(job.id, job.slug)),
  }));

  return rssResponse(
    {
      title: 'Rebase hiring',
      link: withBaseUrl(site.primaryDomain, '/who-is-hiring/rss.xml'),
      description: 'Latest hiring opportunities shared in the Rebase community.',
      items,
    },
    request,
  );
}
