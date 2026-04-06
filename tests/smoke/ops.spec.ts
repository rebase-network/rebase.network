import { expect, test } from '@playwright/test';

test('/robots.txt returns the sitemap hint', async ({ request }) => {
  const response = await request.get('/robots.txt');
  expect(response.ok()).toBeTruthy();
  const body = await response.text();
  expect(body).toContain('User-agent: *');
  expect(body).toContain('Sitemap: https://rebase.network/sitemap.xml');
});

test('/sitemap.xml returns key public URLs', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.ok()).toBeTruthy();
  const body = await response.text();
  expect(body).toContain('<urlset');
  expect(body).toContain('https://rebase.network/geekdaily/geekdaily-1915');
  expect(body).toContain('https://rebase.network/articles/building-rebase-in-public');
});

test('/healthz returns runtime health data', async ({ request }) => {
  const response = await request.get('/healthz');
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.status).toBe('ok');
  expect(payload.checks.api).toBe('ok');
  expect(payload.checks.database).toBe('ok');
  expect(payload.checks.auth).toBe('ok');
  expect(payload.checks.publicContent).toBe('ok');
});
