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
  summary?: string;
  tags?: string[];
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

export const learnBlockchainMinimumContentCharacters = 300;

export const buildLearnBlockchainArticle = (input: LearnBlockchainArticleInput) => {
  const title = input.title.trim();
  const content = input.bodyMarkdown.trim();
  if (!title || !content) throw badRequest('LearnBlockchain article title and content are required');

  const contentCharacters = Array.from(content).length;
  if (contentCharacters < learnBlockchainMinimumContentCharacters) {
    throw badRequest(
      `LearnBlockchain 正文至少需要 ${learnBlockchainMinimumContentCharacters} 个字符，当前 ${contentCharacters} 个字符`,
      { minimumCharacters: learnBlockchainMinimumContentCharacters, actualCharacters: contentCharacters },
    );
  }

  return {
    title,
    content,
    summary: Array.from(input.summary?.trim() || title).slice(0, 200).join(''),
    link: '',
    author_id: '322',
    category_id: String(input.categoryId ?? 8),
    proofread: 'false',
    is_public: 'true',
    tags: input.tags?.map((tag) => tag.trim()).filter(Boolean).join(',') || 'Web3',
    featured: '0',
    level: '1',
    type: '1',
  };
};

const appendSource = (body: string, url: string) => `${body.trim()}\n\n---\n\n原文链接：${url}`;

const getSourceUrl = async (path: string) => new URL(path, `${(await getPublicSiteConfig()).primaryDomain}/`).toString();

const publishArticle = async (input: LearnBlockchainArticleInput) => {
  const env = getEnv();
  const apiKey = env.learnBlockchainApiKey.trim();
  const endpoint = env.learnBlockchainUrlPosts.trim();

  if (!apiKey || !endpoint) {
    throw serviceUnavailable('LearnBlockchain publishing is not configured');
  }
  const form = new URLSearchParams(buildLearnBlockchainArticle(input));
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-API-Key': apiKey,
      },
      body: form,
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error;
    const code = cause && typeof cause === 'object' && 'code' in cause && typeof cause.code === 'string' ? cause.code : '';
    const message = cause instanceof Error ? cause.message || cause.name : String(cause);
    const reason = [code, message].filter(Boolean).join(': ');
    throw serviceUnavailable(`LearnBlockchain 网络请求失败：${reason}`, { reason });
  }

  const payload = (await response.json().catch(() => null)) as LearnBlockchainResponse | null;
  if (!response.ok || !payload || payload.code !== 0 || payload.article_id === undefined || payload.article_id === null) {
    const reason = payload?.message || (payload ? `业务状态码 ${payload.code ?? '未知'}` : `HTTP ${response.status} 响应不是有效 JSON`);
    throw serviceUnavailable(`LearnBlockchain 发布失败：${reason}`, {
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
  const result = await queuePublish(() => publishArticle({
    title: record.title,
    bodyMarkdown: appendSource(record.bodyMarkdown, source),
    summary: record.summary,
    tags: record.tags,
  }));
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
  const result = await queuePublish(() => publishArticle({
    title: `活动｜${record.title}`,
    bodyMarkdown: appendSource(`${details.join('\n')}\n\n${record.bodyMarkdown}`, source),
    summary: record.summary,
    tags: record.tags,
  }));
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
  const result = await queuePublish(() => publishArticle({
    title: `极客日报｜${record.title}`,
    bodyMarkdown: appendSource(record.bodyMarkdown, source),
    summary: record.summary,
    tags: record.tags,
  }));
  await getDb().update(geekdailyEpisodes).set({ learnBlockchainArticleId: result.articleId, updatedAt: new Date() }).where(eq(geekdailyEpisodes.id, id));
  await createAuditEntry({ ...actor, action: 'geekdaily.learnblockchain_publish', targetType: 'geekdaily_episode', targetId: id, summary: `Published GeekDaily ${record.episodeNumber} to LearnBlockchain` });
  return (await getAdminGeekDailyEpisode(id)) as AdminGeekDailyRecord;
};
