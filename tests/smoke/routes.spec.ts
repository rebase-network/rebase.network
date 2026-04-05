import { expect, test } from '@playwright/test';

const primaryRoutes = [
  { path: '/', heading: /把社区的日常内容，组织成一个值得反复访问的公共入口/ },
  { path: '/about', heading: /Rebase 是一个围绕 builder、community operator 和研究者展开的社区媒体网络/ },
  { path: '/who-is-hiring', heading: /让招聘信息不仅被发出来，还能被读懂、被订阅、被稳定地回看/ },
  { path: '/geekdaily', heading: /GeekDaily 是 Rebase 的持续现场，它应该被阅读、搜索和订阅/ },
  { path: '/articles', heading: /把社区里的想法、复盘和方法写成可以沉淀下来的文章/ },
  { path: '/events', heading: /活动页先做好表达与归档，再慢慢加深运营能力/ },
  { path: '/contributors', heading: /社区不是抽象概念，它总是由具体的人把内容、活动和协作推着往前走/ },
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
  await page.goto('/geekdaily/episode-1915');
  await expect(page.getByRole('heading', { level: 1, name: '极客日报#1915' })).toBeVisible();
  await expect(page.getByText('推荐人：Cedric', { exact: true })).toBeVisible();

  await page.goto('/articles/building-rebase-in-public');
  await expect(page.getByRole('heading', { level: 1, name: '把 Rebase 做成一个持续更新的社区媒体站点' })).toBeVisible();
  await expect(page.getByText('重新定义社区站点')).toBeVisible();

  await page.goto('/events/2026-04-18-rebase-shanghai-builder-night');
  await expect(page.getByRole('heading', { level: 1, name: 'Rebase Shanghai Builder Night' })).toBeVisible();
  await expect(page.getByText('外部报名链接')).toBeVisible();

  await page.goto('/who-is-hiring/protocol-growth-lead');
  await expect(page.getByRole('heading', { level: 1, name: 'protocol growth lead' })).toBeVisible();
  await expect(page.getByText('外部投递链接')).toBeVisible();
});
