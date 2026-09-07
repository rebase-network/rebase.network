import { expect, test, type Page } from '@playwright/test';

const getPublishedHref = async (page: Page, listPath: string, slug: string) => {
  await page.goto(listPath);
  const href = await page.locator(`a[href*="${slug}"]`).first().getAttribute('href');
  expect(href, `${slug} should be linked from ${listPath}`).toBeTruthy();
  expect(href).toMatch(new RegExp(`^${listPath}/\\d+-${slug}$`));
  return href as string;
};

const primaryRoutes = [
  { path: '/', heading: /Rebase Community 是由中国开发者们在业余时间用热爱建立的开发者社区/ },
  { path: '/about', heading: /Rebase Community 是由中国开发者们在业余时间用热爱建立的开发者社区/ },
  { path: '/who-is-hiring', heading: /开放岗位/ },
  { path: '/geekdaily', heading: /Rebase 极客日报/ },
  { path: '/articles', heading: /社区文章/ },
  { path: '/events', heading: /社区活动/ },
  { path: '/contributors', heading: /贡献者/ },
] as const;

for (const route of primaryRoutes) {
  test(`${route.path} renders core layout`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
  });
}

test('detail pages render expected content blocks', async ({ page }) => {
  await page.goto('/geekdaily/geekdaily-1915');
  await expect(page.getByRole('heading', { level: 1, name: '极客日报#1915' })).toBeVisible();
  await expect(page.getByText('推荐人：Cedric', { exact: true })).toBeVisible();

  const articleHref = await getPublishedHref(page, '/articles', 'building-rebase-in-public');
  await page.goto(articleHref);
  await expect(page.getByRole('heading', { level: 1, name: '把 Rebase 做成一个持续更新的社区媒体站点' })).toBeVisible();
  await expect(page.getByText('重新定义社区站点')).toBeVisible();

  const eventHref = await getPublishedHref(page, '/events', 'rebase-shanghai-builder-night');
  await page.goto(eventHref);
  await expect(page.getByRole('heading', { level: 1, name: 'Rebase Shanghai Builder Night' })).toBeVisible();
  await expect(page.getByText('查看历史活动链接')).toBeVisible();
  await expect(page.getByText('立即报名')).toHaveCount(0);

  const jobHref = await getPublishedHref(page, '/who-is-hiring', 'protocol-growth-lead');
  await page.goto(jobHref);
  await expect(page.getByRole('heading', { level: 1, name: 'protocol growth lead' })).toBeVisible();
  await expect(page.getByText('外部投递链接')).toBeVisible();
});

test('pages expose canonical and social metadata', async ({ page }) => {
  const articleHref = await getPublishedHref(page, '/articles', 'building-rebase-in-public');
  await page.goto(articleHref);

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `https://rebase.network${articleHref}`,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-card\.svg|https?:\/\//);
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', /可阅读、可订阅/);
});

test('social QR code buttons open scan dialogs', async ({ page }) => {
  await page.goto('/');

  for (const item of [
    { button: '微信公众号', dialog: '关注 Rebase 微信公众号', image: '/qrcodes/wechat-official.jpg' },
    { button: 'QQ 群', dialog: '加入 Rebase QQ 群', image: '/qrcodes/qq-group.jpg' },
  ]) {
    await page.getByRole('button', { name: item.button }).click();
    const dialog = page.getByRole('dialog', { name: item.dialog });
    const image = dialog.getByRole('img');
    await expect(dialog).toBeVisible();
    await expect(image).toHaveAttribute('src', item.image);
    await expect(image).toBeInViewport({ ratio: 1 });
    await dialog.getByRole('button', { name: '关闭二维码弹窗' }).click();
    await expect(dialog).toBeHidden();
  }
});

test('redesigned community UX avoids misleading public actions', async ({ page }) => {
  await page.goto('/events');
  await expect(page.locator('#event-archive')).not.toContainText('立即报名');

  await page.goto('/who-is-hiring');
  await expect(page.locator('.company-name', { hasText: /^\/$/ })).toHaveCount(0);

  await page.goto('/geekdaily');
  await expect(page.getByRole('link', { name: '下一页' })).toHaveAttribute('href', /page=2/);
  await expect(page.getByText('推荐内容 ↗')).toHaveCount(0);
});
