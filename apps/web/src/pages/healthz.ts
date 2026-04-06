import { fetchApiReady } from '@/lib/api';
import { getSiteSettings } from '@/lib/content';

export async function GET() {
  try {
    const [ready, site] = await Promise.all([fetchApiReady(), getSiteSettings()]);

    return Response.json(
      {
        status: 'ok',
        checkedAt: new Date().toISOString(),
        checks: {
          api: ready.status,
          database: ready.checks.database,
          auth: ready.checks.auth,
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
