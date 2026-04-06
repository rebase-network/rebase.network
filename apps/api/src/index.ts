import { serve } from '@hono/node-server';

import { app } from './app.js';

const port = Number.parseInt(process.env.PORT ?? '8788', 10);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`rebase api foundation listening on http://localhost:${info.port}`);
});
