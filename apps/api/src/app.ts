import { Hono } from 'hono';

import { adminModules, ok, publicSiteConfigPlaceholder } from '@rebase/shared';

export const app = new Hono();

app.get('/', (c) => c.json(ok({ message: 'rebase api foundation' })));
app.get('/health', (c) => c.json(ok({ status: 'ok' })));
app.get('/ready', (c) =>
  c.json(
    ok({
      status: 'ok',
      checks: {
        app: 'ok',
        database: 'planned',
        auth: 'planned',
      },
    }),
  ),
);
app.get('/version', (c) =>
  c.json(
    ok({
      name: 'rebase-api',
      version: process.env.APP_VERSION ?? '0.1.0-foundation',
    }),
  ),
);

app.get('/api/public/v1/site-config', (c) => c.json(ok(publicSiteConfigPlaceholder)));
app.get('/api/admin/v1/modules', (c) =>
  c.json(
    ok({
      modules: adminModules,
      stage: 'foundation',
      message: 'Custom admin and API scaffolding is now in place for the Rebase transition.',
    }),
  ),
);
