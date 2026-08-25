import { defineMiddleware } from 'astro:middleware';

const documentCacheControl = 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600';
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

type CloudflareCacheStorage = CacheStorage & { default?: Cache };

const isPublicDocumentRequest = (request: Request) => {
  if (request.method !== 'GET' || !request.headers.get('accept')?.includes('text/html')) {
    return false;
  }

  const { pathname } = new URL(request.url);
  return !pathname.startsWith('/admin') && !pathname.startsWith('/api') && !pathname.startsWith('/cdn-cgi/');
};

const withResponseHeaders = (response: Response, cacheStatus: 'HIT' | 'MISS' | 'BYPASS') => {
  const headers = new Headers(response.headers);
  Object.entries(securityHeaders).forEach(([name, value]) => headers.set(name, value));
  headers.set('X-Rebase-Build', __REBASE_BUILD_SHA__);

  if (cacheStatus !== 'BYPASS') {
    headers.set('Cache-Control', documentCacheControl);
  }

  headers.set('X-Rebase-Cache', cacheStatus);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const onRequest = defineMiddleware(async (context, next) => {
  const cacheable = isPublicDocumentRequest(context.request) && !context.request.headers.has('Authorization');
  const cache = cacheable && typeof caches !== 'undefined' ? (caches as CloudflareCacheStorage).default : undefined;

  if (cache) {
    const cached = await cache.match(context.request);
    if (cached) {
      return withResponseHeaders(cached, 'HIT');
    }
  }

  const response = withResponseHeaders(await next(), cacheable ? 'MISS' : 'BYPASS');

  if (cache && response.status === 200 && !response.headers.has('Set-Cookie')) {
    context.locals.cfContext.waitUntil(cache.put(context.request, response.clone()));
  }

  return response;
});
