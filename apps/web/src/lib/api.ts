interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

interface ApiSuccess<T> {
  data: T;
}

const nodeEnv =
  typeof globalThis === 'object'
    ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
    : {};

const API_BASE_URL = (import.meta.env.API_BASE_URL ?? nodeEnv.API_BASE_URL ?? 'http://127.0.0.1:8788').replace(/\/$/, '');

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getPublicApiUrl(pathname: string) {
  return new URL(pathname, `${API_BASE_URL}/`);
}

export async function fetchPublicApi<T>(pathname: string): Promise<T> {
  const url = getPublicApiUrl(pathname);
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiSuccess<T> | ApiErrorShape) : null;

  if (!response.ok || (payload && 'error' in payload)) {
    const message = payload && 'error' in payload ? payload.error.message : `request failed with status ${response.status}`;
    throw new Error(`public api request failed for ${url.toString()}: ${message}`);
  }

  if (!payload || !('data' in payload)) {
    throw new Error(`public api request failed for ${url.toString()}: missing data field`);
  }

  return payload.data;
}

export async function proxyPublicApi(pathname: string) {
  const response = await fetch(getPublicApiUrl(pathname), {
    headers: {
      Accept: 'application/json',
    },
  });

  const headers = new Headers();
  headers.set('content-type', response.headers.get('content-type') ?? 'application/json; charset=utf-8');
  headers.set('cache-control', response.headers.get('cache-control') ?? 'public, max-age=300, stale-while-revalidate=3600');

  return new Response(response.body, {
    status: response.status,
    headers,
  });
}

export async function fetchApiReady() {
  return fetchPublicApi<{ status: string; checks: { database: string; auth: string } }>('/ready');
}
