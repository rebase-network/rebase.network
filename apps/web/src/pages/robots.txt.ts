const primaryDomain = 'https://rebase.network';

export function GET() {
  const body = [
    'User-agent: *',
    'Allow: /',
    `Sitemap: ${primaryDomain}/sitemap.xml`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
}
