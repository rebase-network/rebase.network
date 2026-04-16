import { Hono } from 'hono';

import { renderMarkdownToHtml } from '@rebase/shared';

import { ok } from '../lib/http.js';
import { listPublicArticles } from '../lib/articles.js';
import { pingDatabase } from '../lib/db.js';
import { getEnv, isAuthConfigured, isDatabaseConfigured } from '../lib/env.js';
import { listPublicEvents } from '../lib/events.js';
import { listPublicGeekDailyEpisodes } from '../lib/geekdaily.js';
import { listPublicJobs } from '../lib/jobs.js';
import { rssResponse, type RssItem } from '../lib/rss.js';
import { getPublicSiteConfig } from '../lib/site.js';

export const rootRoutes = new Hono();

const takeLatest = <T extends { publishedAt?: string | null }>(rows: T[], count = 3) =>
  [...rows]
    .sort((left, right) => {
      const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : 0;
      const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : 0;
      return rightTime - leftTime;
    })
    .slice(0, count);

const takeLatestRssItems = (rows: Array<RssItem & { pubDate?: string | null }>, count = 3) =>
  [...rows]
    .sort((left, right) => {
      const leftTime = left.pubDate ? Date.parse(left.pubDate) : 0;
      const rightTime = right.pubDate ? Date.parse(right.pubDate) : 0;
      return rightTime - leftTime;
    })
    .slice(0, count);

const withBaseUrl = (baseUrl: string, pathname: string) => new URL(pathname, baseUrl).toString();

const toSummaryDescription = (summary: string) => `<p>${summary}</p>`;
const buildContentHref = (basePath: string, id: string, slug: string) => `/${basePath}/${slug ? `${id}-${slug}` : id}`;

rootRoutes.get('/', async (c) => {
  const site = await getPublicSiteConfig();
  return c.json(
    ok({
      name: 'rebase-api',
      siteName: site.siteName,
      version: process.env.APP_VERSION ?? '0.1.0',
      docs: {
        publicApi: '/api/public/v1',
        adminApi: '/api/admin/v1',
        auth: '/api/auth',
        rss: '/rss.xml',
      },
    }),
  );
});

rootRoutes.get('/health', (c) =>
  c.json(
    ok({
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
    }),
  ),
);

rootRoutes.get('/ready', async (c) => {
  const databaseConfigured = isDatabaseConfigured();
  const authConfigured = isAuthConfigured();
  let database = databaseConfigured ? 'ok' : 'missing_config';

  if (databaseConfigured) {
    try {
      await pingDatabase();
    } catch {
      database = 'error';
    }
  }

  return c.json(
    ok({
      status: database === 'ok' ? 'ok' : 'degraded',
      checks: {
        database,
        auth: authConfigured ? 'ok' : 'missing_config',
      },
    }),
    database === 'ok' ? 200 : 503,
  );
});

rootRoutes.get('/version', (c) =>
  c.json(
    ok({
      name: 'rebase-api',
      version: process.env.APP_VERSION ?? '0.1.0',
      environment: getEnv().nodeEnv,
    }),
  ),
);

rootRoutes.get('/rss.xml', async (c) => {
  const site = await getPublicSiteConfig();
  const [articles, jobs, events, geekdaily] = await Promise.all([
    listPublicArticles(),
    listPublicJobs(),
    listPublicEvents(),
    listPublicGeekDailyEpisodes(3),
  ]);

  const items = takeLatestRssItems(
    [
      ...articles.map((item) => ({
        title: item.title,
        link: withBaseUrl(site.primaryDomain, buildContentHref('articles', item.id, item.slug)),
        description: toSummaryDescription(item.summary),
        pubDate: item.publishedAt,
      })),
      ...jobs.map((item) => ({
        title: `${item.companyName} - ${item.roleTitle}`,
        link: withBaseUrl(site.primaryDomain, buildContentHref('who-is-hiring', item.id, item.slug)),
        description: toSummaryDescription(item.summary),
        pubDate: item.publishedAt,
      })),
      ...events.map((item) => ({
        title: item.title,
        link: withBaseUrl(site.primaryDomain, buildContentHref('events', item.id, item.slug)),
        description: toSummaryDescription(item.summary),
        pubDate: item.startAt,
      })),
      ...geekdaily.map((item) => ({
        title: item.title,
        link: withBaseUrl(site.primaryDomain, `/geekdaily/${item.slug}`),
        description: renderMarkdownToHtml(item.body),
        pubDate: item.publishedAt,
      })),
    ],
    3,
  );

  return rssResponse(
    {
      title: `${site.siteName} Feed`,
      link: withBaseUrl(site.primaryDomain, '/rss.xml'),
      description: `${site.siteName} latest updates`,
      items,
    },
    c.req.raw.headers,
  );
});

rootRoutes.get('/rss/articles.xml', async (c) => {
  const site = await getPublicSiteConfig();
  const items = takeLatest(await listPublicArticles()).map((item) => ({
    title: item.title,
    link: withBaseUrl(site.primaryDomain, buildContentHref('articles', item.id, item.slug)),
    description: toSummaryDescription(item.summary),
    pubDate: item.publishedAt,
  }));

  return rssResponse(
    {
      title: `${site.siteName} Articles`,
      link: withBaseUrl(site.primaryDomain, '/rss/articles.xml'),
      description: `${site.siteName} article feed`,
      items,
    },
    c.req.raw.headers,
  );
});

rootRoutes.get('/rss/jobs.xml', async (c) => {
  const site = await getPublicSiteConfig();
  const items = takeLatest(await listPublicJobs()).map((item) => ({
    title: `${item.companyName} - ${item.roleTitle}`,
    link: withBaseUrl(site.primaryDomain, buildContentHref('who-is-hiring', item.id, item.slug)),
    description: toSummaryDescription(item.summary),
    pubDate: item.publishedAt,
  }));

  return rssResponse(
    {
      title: `${site.siteName} Who Is Hiring`,
      link: withBaseUrl(site.primaryDomain, '/rss/jobs.xml'),
      description: `${site.siteName} hiring feed`,
      items,
    },
    c.req.raw.headers,
  );
});

rootRoutes.get('/rss/events.xml', async (c) => {
  const site = await getPublicSiteConfig();
  const items = [...await listPublicEvents()]
    .sort((left, right) => Date.parse(right.startAt ?? '') - Date.parse(left.startAt ?? ''))
    .slice(0, 3)
    .map((item) => ({
      title: item.title,
      link: withBaseUrl(site.primaryDomain, buildContentHref('events', item.id, item.slug)),
      description: toSummaryDescription(item.summary),
      pubDate: item.startAt,
    }));

  return rssResponse(
    {
      title: `${site.siteName} Events`,
      link: withBaseUrl(site.primaryDomain, '/rss/events.xml'),
      description: `${site.siteName} events feed`,
      items,
    },
    c.req.raw.headers,
  );
});

rootRoutes.get('/rss/geekdaily.xml', async (c) => {
  const site = await getPublicSiteConfig();
  const items = (await listPublicGeekDailyEpisodes(3)).map((item) => ({
    title: item.title,
    link: withBaseUrl(site.primaryDomain, `/geekdaily/${item.slug}`),
    description: renderMarkdownToHtml(item.body),
    pubDate: item.publishedAt,
  }));

  return rssResponse(
    {
      title: `${site.siteName} GeekDaily`,
      link: withBaseUrl(site.primaryDomain, '/rss/geekdaily.xml'),
      description: `${site.siteName} geekdaily feed`,
      items,
    },
    c.req.raw.headers,
  );
});
