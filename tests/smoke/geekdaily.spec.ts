import { expect, test } from '@playwright/test';

test('GeekDaily search supports episode lookup and empty state', async ({ page }) => {
  await page.goto('/geekdaily');
  const initialCount = (await page.locator('#results-count').textContent())?.trim();

  const searchInput = page.getByLabel('搜索 GeekDaily');
  await searchInput.fill('1915');

  await expect(page.locator('#results-count')).toContainText('找到 1 期');
  await expect(page.getByRole('link', { name: '极客日报#1915' })).toBeVisible();
  await expect(page.locator('#results-state')).toContainText('搜索“1915”');

  await searchInput.fill('definitely-no-match');
  await expect(page.getByRole('heading', { level: 2, name: '没有找到匹配的 GeekDaily' })).toBeVisible();

  await page.getByRole('button', { name: '清空筛选' }).click();
  await expect(page.locator('#results-count')).toHaveText(initialCount ?? '');
});


test('GeekDaily filters sync query params', async ({ page }) => {
  await page.goto('/geekdaily?year=2026');
  await expect(page.locator('#results-state')).toContainText('年份 2026');
  await expect(page.getByRole('link', { name: '极客日报#1915' })).toBeVisible();

  await page.getByRole('button', { name: '2026' }).click();
  await expect(page).not.toHaveURL(/year=2026/);
});
