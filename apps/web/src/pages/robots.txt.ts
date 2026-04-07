import { getSiteSettings } from '@/lib/content';

export async function GET() {
  const site = await getSiteSettings();
  const body = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${site.primaryDomain}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
