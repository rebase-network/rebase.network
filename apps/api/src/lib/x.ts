import { request as httpRequest } from 'node:http';

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

export const maxXPostCharacters = 280;

type XPublisherResponse = { tweetId?: string; url?: string; error?: string };

export const isXConfigured = () => {
  const env = getEnv();
  return env.xPublisherEnabled && Boolean(env.xPublisherSocketPath.trim());
};

export const shouldAutoPublishToX = (record: { status: string; xPostId?: string | null }) =>
  record.status === 'published' && !record.xPostId;

const countCharacters = (value: string) => Array.from(value).length;
const truncateCharacters = (value: string, maxLength: number) => Array.from(value).slice(0, maxLength).join('');
const plainText = (value: string) => value.replace(/[`*_>#]/g, '').replace(/\s+/g, ' ').trim();

export const buildXPostText = ({ title, summary, url }: { title: string; summary: string; url: string }) => {
  const normalizedTitle = plainText(title);
  const normalizedSummary = plainText(summary);
  const normalizedUrl = url.trim();
  if (!normalizedTitle || !normalizedUrl) throw badRequest('X post title and URL are required');

  const fixed = `${normalizedTitle}\n\n${normalizedUrl}`;
  const summaryBudget = maxXPostCharacters - countCharacters(fixed) - 2;
  if (summaryBudget < 0) throw badRequest('X post title and URL exceed the 280 character limit');
  if (!normalizedSummary || summaryBudget === 0) return fixed;

  const clippedSummary = truncateCharacters(normalizedSummary, summaryBudget);
  return clippedSummary ? `${normalizedTitle}\n\n${clippedSummary}\n\n${normalizedUrl}` : fixed;
};

const requestPublisher = async (text: string) => {
  const socketPath = getEnv().xPublisherSocketPath.trim();
  if (!socketPath) throw serviceUnavailable('X publishing socket is not configured');

  const body = JSON.stringify({ text });
  const payload = await new Promise<XPublisherResponse>((resolve, reject) => {
    const request = httpRequest(
      {
        socketPath,
        path: '/publish',
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 90_000,
      },
      (response) => {
        let output = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { output += chunk; });
        response.on('end', () => {
          try {
            resolve(JSON.parse(output) as XPublisherResponse);
          } catch {
            reject(serviceUnavailable('X publisher returned invalid JSON', { status: response.statusCode }));
          }
        });
      },
    );
    request.on('timeout', () => request.destroy(new Error('X publisher request timed out')));
    request.on('error', (error) => reject(error));
    request.write(body);
    request.end();
  }).catch((error) => {
    if (error instanceof Error && 'status' in error) throw error;
    throw serviceUnavailable('X publisher request failed', { reason: error instanceof Error ? error.message : String(error) });
  });

  if (!payload.tweetId) throw serviceUnavailable('X publisher returned no tweet id', { error: payload.error });
  return { tweetId: payload.tweetId, url: payload.url ?? `https://x.com/status/${payload.tweetId}` };
};

const appendSource = (title: string, summary: string, url: string) => buildXPostText({ title, summary, url });
const getSourceUrl = async (path: string) => new URL(path, `${(await getPublicSiteConfig()).primaryDomain}/`).toString();

// ponytail: one process-wide publish queue; use a durable job worker if volume requires parallelism.
let publishQueue = Promise.resolve();
const queuePublish = <T>(task: () => Promise<T>) => {
  const next = publishQueue.then(task);
  publishQueue = next.then(() => undefined, () => undefined);
  return next;
};

export const publishAdminArticleToX = async (id: string, actor: AuditActor): Promise<AdminArticleRecord> => {
  const record = await getAdminArticle(id);
  if (!record) throw badRequest('article not found');
  if (record.status !== 'published') throw badRequest('publish the Rebase article before sending it to X');
  if (record.xPostId) return record;
  const source = await getSourceUrl(`/articles/${record.publicNumber}-${record.slug}`);
  const text = appendSource(record.title, record.summary, source);
  const result = await queuePublish(() => requestPublisher(text));
  await getDb().update(articles).set({ xPostId: result.tweetId, updatedAt: new Date() }).where(eq(articles.id, id));
  await createAuditEntry({ ...actor, action: 'article.x_publish', targetType: 'article', targetId: id, summary: `Published article ${record.title} to X` });
  return (await getAdminArticle(id)) as AdminArticleRecord;
};

export const publishAdminEventToX = async (id: string, actor: AuditActor): Promise<AdminEventRecord> => {
  const record = await getAdminEvent(id);
  if (!record) throw badRequest('event not found');
  if (record.status !== 'published') throw badRequest('publish the Rebase event before sending it to X');
  if (record.xPostId) return record;
  const source = await getSourceUrl(`/events/${record.publicNumber}-${record.slug}`);
  const result = await queuePublish(() => requestPublisher(appendSource(`活动｜${record.title}`, record.summary, source)));
  await getDb().update(events).set({ xPostId: result.tweetId, updatedAt: new Date() }).where(eq(events.id, id));
  await createAuditEntry({ ...actor, action: 'event.x_publish', targetType: 'event', targetId: id, summary: `Published event ${record.title} to X` });
  return (await getAdminEvent(id)) as AdminEventRecord;
};

export const publishAdminGeekDailyToX = async (id: string, actor: AuditActor): Promise<AdminGeekDailyRecord> => {
  const record = await getAdminGeekDailyEpisode(id);
  if (!record) throw badRequest('GeekDaily episode not found');
  if (record.status !== 'published') throw badRequest('publish the Rebase GeekDaily episode before sending it to X');
  if (record.xPostId) return record;
  const source = await getSourceUrl(`/geekdaily/${record.slug}`);
  const result = await queuePublish(() => requestPublisher(appendSource(`极客日报｜${record.title}`, record.summary, source)));
  await getDb().update(geekdailyEpisodes).set({ xPostId: result.tweetId, updatedAt: new Date() }).where(eq(geekdailyEpisodes.id, id));
  await createAuditEntry({ ...actor, action: 'geekdaily.x_publish', targetType: 'geekdaily_episode', targetId: id, summary: `Published GeekDaily ${record.episodeNumber} to X` });
  return (await getAdminGeekDailyEpisode(id)) as AdminGeekDailyRecord;
};
