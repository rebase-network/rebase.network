import { existsSync } from 'node:fs';

import { chromium, type Page } from 'playwright-core';
import { eq } from 'drizzle-orm';

import { articles, events, geekdailyEpisodes } from '@rebase/db';
import type { AdminArticleRecord, AdminEventRecord, AdminGeekDailyRecord } from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { getDb } from './db.js';
import { badRequest, serviceUnavailable } from './errors.js';
import { getEnv } from './env.js';
import { getInfoqCredentials, getPublicSiteConfig } from './site.js';
import { getAdminArticle } from './articles.js';
import { getAdminEvent } from './events.js';
import { getAdminGeekDailyEpisode } from './geekdaily.js';

type InfoqArticleInput = {
  title: string;
  summary: string;
  bodyMarkdown: string;
  tags: string[];
};

type InfoqPublishResult = { uuid: string; url: string };

// ponytail: one process-wide publish queue; use a durable job worker if volume requires parallelism.
let publishQueue = Promise.resolve();

const queuePublish = <T>(task: () => Promise<T>) => {
  const next = publishQueue.then(task);
  publishQueue = next.then(() => undefined, () => undefined);
  return next;
};

const getExecutablePath = () => {
  const configured = getEnv().infoqChromiumExecutablePath.trim();
  if (configured) {
    return configured;
  }

  return ['/usr/bin/chromium', '/usr/bin/chromium-browser'].find((path) => existsSync(path));
};

const firstParagraph = (markdown: string) =>
  markdown
    .split(/\n\s*\n/)
    .map((part) => part.replace(/^#+\s+|[*_`>-]/g, '').trim())
    .find(Boolean) ?? '';

const trimUtf8 = (value: string, maxBytes: number) => {
  let result = '';
  for (const character of value.trim()) {
    if (Buffer.byteLength(result + character, 'utf8') > maxBytes) break;
    result += character;
  }
  return result;
};

const trimTitle = (value: string) => trimUtf8(value, 128);
const trimSummary = (value: string) => trimUtf8(value, 120);

const dismissInfoqTips = async (page: Page) => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const buttons = page.getByText('知道了', { exact: true });
    let dismissed = false;
    for (let index = 0; index < await buttons.count(); index += 1) {
      const button = buttons.nth(index);
      if (await button.isVisible().catch(() => false)) {
        await button.click();
        dismissed = true;
        break;
      }
    }
    if (!dismissed) break;
  }
};

const publicUrl = async (path: string) => {
  const site = await getPublicSiteConfig();
  return new URL(path, `${site.primaryDomain}/`).toString();
};

const login = async (page: Page, username: string, password: string) => {
  await page.goto('https://xie.infoq.cn/', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => undefined);
  if (await page.getByText('登录', { exact: true }).isVisible().catch(() => false)) {
    await page.getByText('登录', { exact: true }).click();
  }

  await page.waitForTimeout(1500);
  if (!page.url().includes('account.geekbang.org/infoq/')) throw serviceUnavailable('InfoQ login page did not open');
  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => undefined);
  if (await page.getByText('账号密码登录', { exact: true }).isVisible().catch(() => false)) {
    await page.getByText('账号密码登录', { exact: true }).click();
  }

  await page.getByRole('textbox', { name: '请输入手机号' }).fill(username);
  await page.getByRole('textbox', { name: '请输入密码' }).fill(password);
  await page.getByRole('checkbox', { name: '我已阅读并同意极客邦 、' }).check();
  await page.getByText('登录', { exact: true }).click();
  await page.waitForTimeout(5000);
  if (page.url() !== 'https://xie.infoq.cn/') throw serviceUnavailable('InfoQ login failed');
}

const publishWithBrowser = async (input: InfoqArticleInput): Promise<InfoqPublishResult> => {
  if (input.bodyMarkdown.trim().length < 50) {
    throw badRequest('InfoQ article body must contain at least 50 characters');
  }

  const credentials = await getInfoqCredentials();
  const executablePath = getExecutablePath();
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    await login(page, credentials.username, credentials.password);

    await page.getByText('立即创作', { exact: true }).first().click();
    await page.waitForTimeout(1500);
    if (!/^\/draft\/\d+$/.test(new URL(page.url()).pathname)) throw serviceUnavailable('InfoQ draft editor did not open');
    await page.locator('input[type=file][accept=".md"]').setInputFiles({
      name: 'rebase-article.md',
      mimeType: 'text/markdown',
      buffer: Buffer.from(input.bodyMarkdown, 'utf8'),
    });
    await page.waitForFunction(() => Boolean(document.querySelector('.ProseMirror')?.textContent?.trim()));
    await page.getByRole('textbox', { name: '请输入标题' }).fill(trimTitle(input.title));
    await page.waitForTimeout(500);
    await dismissInfoqTips(page);
    await page.getByText('发布', { exact: true }).click();

    const summary = trimSummary(input.summary || firstParagraph(input.bodyMarkdown));
    await page.getByRole('textbox', { name: '默认选取正文第一段，最多120字' }).fill(summary);
    const tagInput = page.getByRole('textbox', { name: '输入标签，回车创建' });
    for (const tag of input.tags.slice(0, 5).map((value) => trimUtf8(value, 12)).filter(Boolean)) {
      await tagInput.fill(tag);
      await tagInput.press('Enter');
    }
    await page.getByText('确定', { exact: true }).last().click();
    await page.waitForTimeout(5000);
    if (!/^\/article\/[a-z0-9]+$/.test(new URL(page.url()).pathname)) throw serviceUnavailable('InfoQ publish returned no article page');
    const url = page.url();
    const uuid = url.split('/').pop()?.split('?')[0] ?? '';
    if (!uuid) {
      throw serviceUnavailable('InfoQ publish returned no article id');
    }
    return { uuid, url };
  } finally {
    await browser.close();
  }
};

const publish = (input: InfoqArticleInput) => queuePublish(() => publishWithBrowser(input));

const appendSource = (body: string, url: string) => `${body.trim()}\n\n---\n\n原文链接：${url}`;

export const publishAdminArticleToInfoq = async (id: string, actor: AuditActor): Promise<AdminArticleRecord> => {
  const record = await getAdminArticle(id);
  if (!record) throw badRequest('article not found');
  if (record.status !== 'published') throw badRequest('publish the Rebase article before sending it to InfoQ');
  if (record.infoqArticleUuid) return record;
  const result = await publish({
    title: record.title,
    summary: record.summary,
    bodyMarkdown: appendSource(record.bodyMarkdown, await publicUrl(`/articles/${record.publicNumber}-${record.slug}`)),
    tags: record.tags,
  });
  await getDb().update(articles).set({ infoqArticleUuid: result.uuid, updatedAt: new Date() }).where(eq(articles.id, id));
  await createAuditEntry({ ...actor, action: 'article.infoq_publish', targetType: 'article', targetId: id, summary: `Published article ${record.title} to InfoQ` });
  return (await getAdminArticle(id)) as AdminArticleRecord;
};

export const publishAdminEventToInfoq = async (id: string, actor: AuditActor): Promise<AdminEventRecord> => {
  const record = await getAdminEvent(id);
  if (!record) throw badRequest('event not found');
  if (record.status !== 'published') throw badRequest('publish the Rebase event before sending it to InfoQ');
  if (record.infoqArticleUuid) return record;
  const source = await publicUrl(`/events/${record.publicNumber}-${record.slug}`);
  const details = [`活动时间：${record.startAt ?? ''} 至 ${record.endAt ?? ''}`, `活动地点：${record.city} ${record.location} ${record.venue}`];
  if (record.registrationUrl) details.push(`报名链接：${record.registrationUrl}`);
  const result = await publish({ title: `活动｜${record.title}`, summary: record.summary, bodyMarkdown: appendSource(`${details.join('\n')}\n\n${record.bodyMarkdown}`, source), tags: record.tags });
  await getDb().update(events).set({ infoqArticleUuid: result.uuid, updatedAt: new Date() }).where(eq(events.id, id));
  await createAuditEntry({ ...actor, action: 'event.infoq_publish', targetType: 'event', targetId: id, summary: `Published event ${record.title} to InfoQ` });
  return (await getAdminEvent(id)) as AdminEventRecord;
};

export const publishAdminGeekDailyToInfoq = async (id: string, actor: AuditActor): Promise<AdminGeekDailyRecord> => {
  const record = await getAdminGeekDailyEpisode(id);
  if (!record) throw badRequest('GeekDaily episode not found');
  if (record.status !== 'published') throw badRequest('publish the Rebase GeekDaily episode before sending it to InfoQ');
  if (record.infoqArticleUuid) return record;
  const result = await publish({ title: `极客日报｜${record.title}`, summary: record.summary, bodyMarkdown: appendSource(record.bodyMarkdown, await publicUrl(`/geekdaily/${record.slug}`)), tags: record.tags });
  await getDb().update(geekdailyEpisodes).set({ infoqArticleUuid: result.uuid, updatedAt: new Date() }).where(eq(geekdailyEpisodes.id, id));
  await createAuditEntry({ ...actor, action: 'geekdaily.infoq_publish', targetType: 'geekdaily_episode', targetId: id, summary: `Published GeekDaily ${record.episodeNumber} to InfoQ` });
  return (await getAdminGeekDailyEpisode(id)) as AdminGeekDailyRecord;
};
