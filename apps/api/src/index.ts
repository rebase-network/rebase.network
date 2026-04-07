import { serve } from '@hono/node-server';

import { getEnv } from './lib/env.js';
import { app } from './app.js';

const port = getEnv().port;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`rebase api listening on http://localhost:${info.port}`);
});
