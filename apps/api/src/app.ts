import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { AppVariables } from './middleware/auth.js';
import { getAuth } from './lib/auth.js';
import { getEnv } from './lib/env.js';
import { handleApiError, jsonError } from './lib/http.js';
import { requestContextMiddleware } from './middleware/auth.js';
import { adminRoutes } from './routes/admin.js';
import { publicRoutes } from './routes/public.js';
import { rootRoutes } from './routes/root.js';

export const app = new Hono<{ Variables: AppVariables }>();

const env = getEnv();

app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      if (!origin) {
        return env.corsAllowedOrigins[0] ?? '*';
      }

      return env.corsAllowedOrigins.includes(origin) ? origin : env.corsAllowedOrigins[0] ?? origin;
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    credentials: true,
    maxAge: 600,
  }),
);

app.use('*', requestContextMiddleware);

app.on(['GET', 'POST'], '/api/auth/*', (c) => {
  const auth = getAuth();

  if (!auth) {
    return jsonError(c, 503, 'AUTH_NOT_CONFIGURED', 'authentication is not configured');
  }

  return auth.handler(c.req.raw);
});

app.route('/', rootRoutes);
app.route('/api/public/v1', publicRoutes);
app.route('/api/admin/v1', adminRoutes);

app.notFound((c) => jsonError(c, 404, 'NOT_FOUND', 'route not found'));
app.onError((error, c) => handleApiError(c, error));
