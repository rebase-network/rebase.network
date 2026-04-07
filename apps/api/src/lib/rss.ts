export interface RssItem {
  title: string;
  link: string;
  description: string;
  guid?: string;
  pubDate?: string | null;
}

export interface RssFeedOptions {
  title: string;
  link: string;
  description: string;
  language?: string;
  items: RssItem[];
}

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const wrapCdata = (value: string) => `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;

export const buildRssFeed = (options: RssFeedOptions) => {
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
