import { Hono } from 'hono';

import { ok } from '../lib/http.js';
import { getPublicArticleByPublicNumber, listPublicArticles } from '../lib/articles.js';
import { listPublicContributorGroups, listRandomPublicContributors } from '../lib/contributors.js';
import { getPublicEventByPublicNumber, listPublicEvents } from '../lib/events.js';
import {
  getGeekDailySearchDocuments,
  getPublicGeekDailyEpisodeBySlug,
  getPublicGeekDailyOverview,
  listPublicGeekDailyArchivePage,
  listPublicGeekDailyEpisodePreviews,
  listPublicGeekDailyEpisodes,
} from '../lib/geekdaily.js';
import { getPublicJobByPublicNumber, listPublicJobs } from '../lib/jobs.js';
import { getPublicAboutPage, getPublicSiteConfig } from '../lib/site.js';

export const publicRoutes = new Hono();
const publicCacheControl = 'public, max-age=300, stale-while-revalidate=3600';

const getPositiveLimit = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const sortByPublishedAtDesc = <T extends { publishedAt?: string | null }>(items: T[]) =>
  [...items].sort((left, right) => {
    const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : 0;
    const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : 0;
    return rightTime - leftTime;
  });

const buildContentHref = (basePath: string, publicNumber: number, slug: string) =>
  `/${basePath}/${slug ? `${publicNumber}-${slug}` : publicNumber}`;

publicRoutes.get('/site-config', async (c) => c.json(ok(await getPublicSiteConfig())));
publicRoutes.get('/about', async (c) => c.json(ok(await getPublicAboutPage())));

publicRoutes.get('/home', async (c) => {
  const [site, about, articles, jobs, events, geekdaily, featuredContributors] = await Promise.all([
    getPublicSiteConfig(),
    getPublicAboutPage(),
    listPublicArticles(),
    listPublicJobs(),
    listPublicEvents(),
    listPublicGeekDailyEpisodes(3),
    listRandomPublicContributors(10),
  ]);

  const recentArticles = sortByPublishedAtDesc(articles).slice(0, 3);
  const recentJobs = sortByPublishedAtDesc(jobs).slice(0, 3);
  const upcomingEvents = [...events]
    .filter((event) => event.status === 'upcoming')
    .sort((left, right) => Date.parse(left.startAt ?? '') - Date.parse(right.startAt ?? ''))
    .slice(0, 3);

  const dynamicFeed = sortByPublishedAtDesc([
    ...recentArticles.map((item) => ({
      type: 'article',
      title: item.title,
      summary: item.summary,
      href: buildContentHref('articles', item.publicNumber, item.slug),
      publishedAt: item.publishedAt,
    })),
    ...recentJobs.map((item) => ({
      type: 'job',
      title: `${item.companyName} - ${item.roleTitle}`,
      summary: item.summary,
      href: buildContentHref('who-is-hiring', item.publicNumber, item.slug),
      publishedAt: item.publishedAt,
    })),
    ...upcomingEvents.map((item) => ({
      type: 'event',
      title: item.title,
      summary: item.summary,
      href: buildContentHref('events', item.publicNumber, item.slug),
      publishedAt: item.startAt,
    })),
    ...geekdaily.map((item) => ({
      type: 'geekdaily',
      title: item.title,
      summary: item.summary,
      href: `/geekdaily/${item.slug}`,
      publishedAt: item.publishedAt,
    })),
  ]).slice(0, 8);

  return c.json(
    ok({
      site,
      about,
      latestGeekDaily: geekdaily[0] ?? null,
      recentArticles,
      recentJobs,
      upcomingEvents,
      recentGeekDaily: geekdaily,
      featuredContributors,
      dynamicFeed,
    }),
  );
});

publicRoutes.get('/articles', async (c) => {
  const limit = getPositiveLimit(c.req.query('limit'), 0);
  const rows = await listPublicArticles();
  return c.json(ok(limit > 0 ? rows.slice(0, limit) : rows));
});

publicRoutes.get('/articles/:publicNumber', async (c) => {
  const record = await getPublicArticleByPublicNumber(c.req.param('publicNumber'));
  if (!record) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'article not found' } }, 404);
  }
  return c.json(ok(record));
});

publicRoutes.get('/jobs', async (c) => {
  const limit = getPositiveLimit(c.req.query('limit'), 0);
  const rows = await listPublicJobs();
  return c.json(ok(limit > 0 ? rows.slice(0, limit) : rows));
});

publicRoutes.get('/jobs/:publicNumber', async (c) => {
  const record = await getPublicJobByPublicNumber(c.req.param('publicNumber'));
  if (!record) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'job not found' } }, 404);
  }
  return c.json(ok(record));
});

publicRoutes.get('/events', async (c) => {
  const rows = await listPublicEvents();
  const status = c.req.query('status');
  const filtered = status ? rows.filter((row) => row.status === status) : rows;
  return c.json(ok(filtered));
});

publicRoutes.get('/events/:publicNumber', async (c) => {
  const record = await getPublicEventByPublicNumber(c.req.param('publicNumber'));
  if (!record) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'event not found' } }, 404);
  }
  return c.json(ok(record));
});

publicRoutes.get('/contributors', async (c) => c.json(ok(await listPublicContributorGroups())));

publicRoutes.get('/geekdaily', async (c) => {
  const limit = getPositiveLimit(c.req.query('limit'), 0);
  c.header('Cache-Control', publicCacheControl);
  return c.json(ok(await listPublicGeekDailyEpisodePreviews(limit)));
});

publicRoutes.get('/geekdaily/overview', async (c) => {
  c.header('Cache-Control', publicCacheControl);
  return c.json(ok(await getPublicGeekDailyOverview()));
});

publicRoutes.get('/geekdaily/archive', async (c) => {
  const rawYear = c.req.query('year');
  const year = rawYear && /^\d{4}$/.test(rawYear) ? Number.parseInt(rawYear, 10) : undefined;
  const tag = c.req.query('tag')?.trim() ?? '';
  const page = getPositiveLimit(c.req.query('page'), 1);
  const pageSize = getPositiveLimit(c.req.query('pageSize'), 10);
  const result = await listPublicGeekDailyArchivePage({
    page,
    pageSize,
    year,
    tag,
  });

  c.header('Cache-Control', publicCacheControl);
  return c.json(ok(result.items, result.meta));
});

publicRoutes.get('/geekdaily/search', async (c) => {
  c.header('Cache-Control', publicCacheControl);
  return c.json(ok(await getGeekDailySearchDocuments()));
});

publicRoutes.get('/geekdaily/:slug', async (c) => {
  const record = await getPublicGeekDailyEpisodeBySlug(c.req.param('slug'));
  if (!record) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'geekdaily episode not found' } }, 404);
  }
  c.header('Cache-Control', publicCacheControl);
  return c.json(ok(record));
});
