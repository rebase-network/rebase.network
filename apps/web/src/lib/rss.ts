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

export const rssResponse = (options: WebRssFeedOptions) =>
  new Response(buildRssXml(options), {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  });
