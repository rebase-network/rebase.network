import { expect, test } from '@playwright/test';

const feeds = [
  '/rss.xml',
  '/geekdaily/rss.xml',
  '/articles/rss.xml',
  '/events/rss.xml',
  '/who-is-hiring/rss.xml',
] as const;

for (const path of feeds) {
  test(`${path} returns xml`, async ({ request }) => {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    expect(body).toContain('<?xml');
    expect(body).toContain('<rss');
    expect(body).toContain('<item>');
  });
}

test('feed links use the agreed public route conventions', async ({ request }) => {
  const geekdailyFeed = await request.get('/geekdaily/rss.xml');
  const geekdailyBody = await geekdailyFeed.text();
  expect(geekdailyBody).toContain('/geekdaily/episode-1915');

  const jobsFeed = await request.get('/who-is-hiring/rss.xml');
  const jobsBody = await jobsFeed.text();
  expect(jobsBody).toContain('/who-is-hiring/protocol-growth-lead');

  const eventsFeed = await request.get('/events/rss.xml');
  const eventsBody = await eventsFeed.text();
  expect(eventsBody).toContain('/events/2026-04-25-geekdaily-editor-roundtable');
});
