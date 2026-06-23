import { expect, test, type Page } from '@playwright/test';

const adminBaseUrl = process.env.SMOKE_ADMIN_BASE_URL ?? 'http://127.0.0.1:5175';
const adminEmail = process.env.DEV_ADMIN_EMAIL ?? 'admin@rebase.local';
const adminPassword = process.env.DEV_ADMIN_PASSWORD ?? 'RebaseAdmin123456!';

const loginToAdmin = async (page: Page) => {
  await page.goto(`${adminBaseUrl}/login`);
  await page.getByLabel('邮箱').fill(adminEmail);
  await page.getByLabel('密码').fill(adminPassword);
  await page.getByRole('button', { name: '登录后台' }).click();
  await expect(page).toHaveURL(new RegExp('/dashboard$'));
};

const createArchivedArticle = async (page: Page, suffix: string) => {
  const title = `Smoke Delete Article ${suffix}`;
  const slug = `smoke-delete-article-${suffix}`;

  await page.goto(`${adminBaseUrl}/articles/new`);
  await page.locator('input.article-title-input').fill(title);
  await page.locator('textarea[placeholder="用一句话描述这篇文章的意义。"]').fill(`summary ${suffix}`);
  await page.locator('textarea[placeholder="使用 Markdown 编写文章正文。"]').fill(`body ${suffix}`);
  await page.locator('input[placeholder="building-rebase-in-public"]').fill(slug);
  await page.locator('input[placeholder="作者姓名"]').fill('Smoke Bot');
  await page.getByRole('button', { name: '保存草稿' }).click();
  await expect(page.getByText('草稿已保存。')).toBeVisible();

  await page.getByRole('button', { name: '归档' }).click();
  await expect(page.getByText('已归档。')).toBeVisible();

  return { title, slug, editUrl: page.url() };
};

test('archived articles can be deleted from the editor and the article list', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'Admin smoke flow runs on desktop only.');

  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });

  await loginToAdmin(page);

  const editorArticle = await createArchivedArticle(page, `${Date.now()}-editor`);
  await expect(page.getByRole('button', { name: '删除文章' })).toBeVisible();
  await page.getByRole('button', { name: '删除文章' }).click();
  await expect(page).toHaveURL(new RegExp('/articles$'));

  await page.goto(editorArticle.editUrl);
  await expect(page.getByText('未找到文章。')).toBeVisible();

  const listArticle = await createArchivedArticle(page, `${Date.now()}-list`);
  await page.goto(`${adminBaseUrl}/articles`);
  await page.locator('#article-search').fill(listArticle.title);
  const row = page.locator('tr', { hasText: listArticle.title }).first();
  await expect(row).toBeVisible();
  await expect(row.getByRole('button', { name: '删除' })).toBeVisible();

  await row.getByRole('button', { name: '删除' }).click();
  await expect(page.getByText(`已删除文章：${listArticle.title}`)).toBeVisible();
  await expect(page.locator('tr', { hasText: listArticle.title })).toHaveCount(0);
});
