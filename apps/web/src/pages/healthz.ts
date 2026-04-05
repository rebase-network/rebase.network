import { getSiteSettings } from '@/lib/content';
import { directusHealthcheck } from '@/lib/directus';

export async function GET() {
  try {
    const [directus, site] = await Promise.all([directusHealthcheck(), getSiteSettings()]);

    return Response.json(
      {
        status: 'ok',
        checkedAt: new Date().toISOString(),
        checks: {
          directus: directus.status,
          publicContent: site.name ? 'ok' : 'missing',
        },
      },
      {
        headers: {
          'cache-control': 'no-store',
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        checkedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'healthcheck failed',
      },
      {
        status: 503,
        headers: {
          'cache-control': 'no-store',
        },
      },
    );
  }
}
