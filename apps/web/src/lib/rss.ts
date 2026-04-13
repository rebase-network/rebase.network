export interface WebRssItem {
  title: string;
  link: string;
  description: string;
  pubDate?: string | Date | null;
  guid?: string;
}

interface WebRssFeedOptions {
  title: string;
  link: string;
  description: string;
  language?: string;
  items: WebRssItem[];
}

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const wrapCdata = (value: string) => `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;

const createWeakEtag = (value: string) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `W/"${value.length.toString(16)}-${(hash >>> 0).toString(16)}"`;
};

const getLastModified = (items: WebRssItem[]) => {
  const timestamps = items
    .map((item) => (item.pubDate ? Date.parse(String(item.pubDate)) : Number.NaN))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.floor(Math.max(...timestamps) / 1000) * 1000);
};

const matchesIfNoneMatch = (request: Request | undefined, etag: string) => {
  const ifNoneMatch = request?.headers.get('if-none-match');

  if (!ifNoneMatch) {
    return false;
  }

  return ifNoneMatch
    .split(',')
    .map((value) => value.trim())
    .some((value) => value === '*' || value === etag);
};

const matchesIfModifiedSince = (request: Request | undefined, lastModified: Date | null) => {
  if (!lastModified) {
    return false;
  }

  const ifModifiedSince = request?.headers.get('if-modified-since');

  if (!ifModifiedSince) {
    return false;
  }

  const timestamp = Date.parse(ifModifiedSince);
  return Number.isFinite(timestamp) && timestamp >= lastModified.getTime();
};

export const withBaseUrl = (baseUrl: string, pathname: string) => new URL(pathname, baseUrl).toString();

export const buildRssXml = (options: WebRssFeedOptions) => {
  const language = options.language ?? 'zh-cn';
  const itemsXml = options.items
    .map((item) => {
      const pubDate = item.pubDate ? new Date(item.pubDate).toUTCString() : null;

      return [
        '<item>',
        `<title>${escapeXml(item.title)}</title>`,
        `<link>${escapeXml(item.link)}</link>`,
        `<guid isPermaLink="true">${escapeXml(item.guid ?? item.link)}</guid>`,
        `<description>${wrapCdata(item.description)}</description>`,
        pubDate ? `<pubDate>${escapeXml(pubDate)}</pubDate>` : '',
        '</item>',
      ]
        .filter(Boolean)
        .join('');
    })
    .join('');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '<channel>',
    `<title>${escapeXml(options.title)}</title>`,
    `<link>${escapeXml(options.link)}</link>`,
    `<description>${escapeXml(options.description)}</description>`,
    `<language>${escapeXml(language)}</language>`,
    itemsXml,
    '</channel>',
    '</rss>',
  ].join('');
};

export const rssResponse = (options: WebRssFeedOptions, request?: Request) => {
  const body = buildRssXml(options);
  const etag = createWeakEtag(body);
  const lastModified = getLastModified(options.items);
  const headers = new Headers({
    'content-type': 'application/rss+xml; charset=utf-8',
    'cache-control': 'public, max-age=300, stale-while-revalidate=3600',
    etag,
  });

  if (lastModified) {
    headers.set('last-modified', lastModified.toUTCString());
  }

  if (matchesIfNoneMatch(request, etag)) {
    return new Response(null, {
      status: 304,
      headers,
    });
  }

  if (!request?.headers.get('if-none-match') && matchesIfModifiedSince(request, lastModified)) {
    return new Response(null, {
      status: 304,
      headers,
    });
  }

  return new Response(body, {
    headers,
  });
};
