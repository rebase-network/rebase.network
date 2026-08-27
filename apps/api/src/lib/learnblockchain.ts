import { eq } from 'drizzle-orm';

import { articles, events, geekdailyEpisodes } from '@rebase/db';
import type { AdminArticleRecord, AdminEventRecord, AdminGeekDailyRecord } from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { getDb } from './db.js';
import { badRequest, serviceUnavailable } from './errors.js';
import { getEnv } from './env.js';
import { getAdminArticle } from './articles.js';
import { getAdminEvent } from './events.js';
import { getAdminGeekDailyEpisode } from './geekdaily.js';
import { getPublicSiteConfig } from './site.js';

export type LearnBlockchainArticleInput = {
  title: string;
  bodyMarkdown: string;
  categoryId?: number;
};

type LearnBlockchainResponse = {
  code?: number;
  message?: string;
  article_id?: number | string;
};

export const isLearnBlockchainConfigured = () => Boolean(getEnv().learnBlockchainApiKey.trim());

export const shouldAutoPublishToLearnBlockchain = (record: {
  status: string;
  learnBlockchainArticleId?: string | null;
}) => record.status === 'published' && !record.learnBlockchainArticleId;

export const buildLearnBlockchainArticle = (input: LearnBlockchainArticleInput) => ({
  title: input.title.trim(),
  content: input.bodyMarkdown.trim(),
  type: '1',
  is_public: '1',
  category_id: String(input.categoryId ?? 8),
});

const appendSource = (body: string, url: string) => `${body.trim()}\n\n---\n\n原文链接：${url}`;

const getSourceUrl = async (path: string) => new URL(path, `${(await getPublicSiteConfig()).primaryDomain}/`).toString();

const publishArticle = async (input: LearnBlockchainArticleInput) => {
  const env = getEnv();
  const apiKey = env.learnBlockchainApiKey.trim();
  const endpoint = env.learnBlockchainUrlPosts.trim();

  if (!apiKey || !endpoint) {
    throw serviceUnavailable('LearnBlockchain publishing is not configured');
  }
  if (!input.title.trim() || !input.bodyMarkdown.trim()) {
    throw badRequest('LearnBlockchain article title and content are required');
  }

  const form = new URLSearchParams(buildLearnBlockchainArticle(input));
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-API-Key': apiKey,
    },
    body: form,
  });
  const payload = (await response.json().catch(() => null)) as LearnBlockchainResponse | null;
  if (!response.ok || !payload || payload.code !== 0 || payload.article_id === undefined || payload.article_id === null) {
    throw serviceUnavailable('LearnBlockchain article publish failed', {
      status: response.status,
      code: payload?.code,
      message: payload?.message,
    });
  }

  return { articleId: String(payload.article_id) };
};

// ponytail: one process-wide publish queue; use a durable job worker if volume requires parallelism.
let publishQueue = Promise.resolve();
const queuePublish = <T>(task: () => Promise<T>) => {
  const next = publishQueue.then(task);
  publishQueue = next.then(() => undefined, () => undefined);
  return next;
};

export const publishAdminArticleToLearnBlockchain = async (id: string, actor: AuditActor): Promise<AdminArticleRecord> => {
  const record = await getAdminArticle(id);
  if (!record) throw badRequest('article not found');
  if (record.status !== 'published') throw badRequest('publish the Rebase article before sending it to LearnBlockchain');
  if (record.learnBlockchainArticleId) return record;
  const source = await getSourceUrl(`/articles/${record.publicNumber}-${record.slug}`);
  const result = await queuePublish(() => publishArticle({ title: record.title, bodyMarkdown: appendSource(record.bodyMarkdown, source) }));
  await getDb().update(articles).set({ learnBlockchainArticleId: result.articleId, updatedAt: new Date() }).where(eq(articles.id, id));
  await createAuditEntry({ ...actor, action: 'article.learnblockchain_publish', targetType: 'article', targetId: id, summary: `Published article ${record.title} to LearnBlockchain` });
  return (await getAdminArticle(id)) as AdminArticleRecord;
};

export const publishAdminEventToLearnBlockchain = async (id: string, actor: AuditActor): Promise<AdminEventRecord> => {
  const record = await getAdminEvent(id);
  if (!record) throw badRequest('event not found');
  if (record.status !== 'published') throw badRequest('publish the Rebase event before sending it to LearnBlockchain');
  if (record.learnBlockchainArticleId) return record;
  const source = await getSourceUrl(`/events/${record.publicNumber}-${record.slug}`);
  const details = [`活动时间：${record.startAt ?? ''} 至 ${record.endAt ?? ''}`, `活动地点：${record.city} ${record.location} ${record.venue}`];
  if (record.registrationUrl) details.push(`报名链接：${record.registrationUrl}`);
  const result = await queuePublish(() => publishArticle({ title: `活动｜${record.title}`, bodyMarkdown: appendSource(`${details.join('\n')}\n\n${record.bodyMarkdown}`, source) }));
  await getDb().update(events).set({ learnBlockchainArticleId: result.articleId, updatedAt: new Date() }).where(eq(events.id, id));
  await createAuditEntry({ ...actor, action: 'event.learnblockchain_publish', targetType: 'event', targetId: id, summary: `Published event ${record.title} to LearnBlockchain` });
  return (await getAdminEvent(id)) as AdminEventRecord;
};

export const publishAdminGeekDailyToLearnBlockchain = async (id: string, actor: AuditActor): Promise<AdminGeekDailyRecord> => {
  const record = await getAdminGeekDailyEpisode(id);
  if (!record) throw badRequest('GeekDaily episode not found');
  if (record.status !== 'published') throw badRequest('publish the Rebase GeekDaily episode before sending it to LearnBlockchain');
  if (record.learnBlockchainArticleId) return record;
  const source = await getSourceUrl(`/geekdaily/${record.slug}`);
  const result = await queuePublish(() => publishArticle({ title: `极客日报｜${record.title}`, bodyMarkdown: appendSource(record.bodyMarkdown, source) }));
  await getDb().update(geekdailyEpisodes).set({ learnBlockchainArticleId: result.articleId, updatedAt: new Date() }).where(eq(geekdailyEpisodes.id, id));
  await createAuditEntry({ ...actor, action: 'geekdaily.learnblockchain_publish', targetType: 'geekdaily_episode', targetId: id, summary: `Published GeekDaily ${record.episodeNumber} to LearnBlockchain` });
  return (await getAdminGeekDailyEpisode(id)) as AdminGeekDailyRecord;
};
