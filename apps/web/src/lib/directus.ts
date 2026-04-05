type DirectusQueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | DirectusQueryValue[]
  | { [key: string]: DirectusQueryValue };

const nodeEnv =
  typeof globalThis === 'object'
    ? (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env ?? {}
    : {};

const DIRECTUS_URL = (import.meta.env.DIRECTUS_URL ?? nodeEnv.DIRECTUS_URL ?? 'http://127.0.0.1:8055').replace(/\/$/, '');
const DIRECTUS_WEBSITE_TOKEN = import.meta.env.DIRECTUS_WEBSITE_TOKEN ?? nodeEnv.DIRECTUS_WEBSITE_TOKEN ?? 'rebase-local-website-token';

function appendQueryValue(params: URLSearchParams, key: string, value: DirectusQueryValue) {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    params.set(key, value.join(','));
    return;
  }

  if (typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value)) {
      appendQueryValue(params, `${key}[${childKey}]`, childValue);
    }
    return;
  }

  params.set(key, String(value));
}

function buildUrl(path: string, query: Record<string, DirectusQueryValue> = {}) {
  const url = new URL(path, `${DIRECTUS_URL}/`);
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    appendQueryValue(params, key, value);
  }

  url.search = params.toString();
  return url;
}

export async function directusRequest(path: string, query: Record<string, DirectusQueryValue> = {}) {
  const url = buildUrl(path, query);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${DIRECTUS_WEBSITE_TOKEN}`,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Directus request failed (${response.status}) for ${url}: ${body}`);
  }

  return response.json();
}

export async function directusHealthcheck(): Promise<{ status: string }> {
  const url = buildUrl('/server/health');
  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Directus healthcheck failed (${response.status}) for ${url}: ${body}`);
  }

  const payload = (await response.json()) as { status?: string };
  return {
    status: typeof payload.status === 'string' ? payload.status : 'unknown',
  };
}

export async function readSingleton(collection: string, id = 1, fields: string[] = ['*']): Promise<Record<string, unknown>> {
  const payload = await directusRequest(`/items/${collection}/${id}`, {
    fields,
  });
  return payload.data;
}

export async function readItems(
  collection: string,
  query: Record<string, DirectusQueryValue> = {},
): Promise<Record<string, unknown>[]> {
  const payload = await directusRequest(`/items/${collection}`, query);
  return payload.data ?? [];
}
