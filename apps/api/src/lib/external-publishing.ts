import { eq } from 'drizzle-orm';

import { articles, events, geekdailyEpisodes } from '@rebase/db';
import type { AdminArticleRecord, AdminEventRecord, AdminGeekDailyRecord } from '@rebase/shared';

import { getAdminArticle } from './articles.js';
import { createAuditEntry, type AuditActor } from './audit.js';
import { getDb } from './db.js';
import { ApiError, badRequest, serviceUnavailable } from './errors.js';
import { getAdminEvent } from './events.js';
import { getAdminGeekDailyEpisode } from './geekdaily.js';
import { infoqChannel } from './infoq.js';
import { learnBlockchainChannel } from './learnblockchain.js';
import { getPublicSiteConfig } from './site.js';
import { xChannel } from './x.js';

export type ExternalIdField = 'infoqArticleUuid' | 'learnBlockchainArticleId' | 'xPostId';

export type ExternalPublishInput = {
  title: string;
  summary: string;
  bodyMarkdown: string;
  tags: string[];
  sourceUrl: string;
};

export type ExternalChannel = {
  name: string;
  auditKey: string;
  idField: ExternalIdField;
  isConfigured: () => boolean | Promise<boolean>;
  publish: (input: ExternalPublishInput) => Promise<string>;
};

type ContentSource<T> = {
  label: string;
  auditPrefix: string;
  targetType: string;
  get: (id: string) => Promise<T | null>;
  saveExternalId: (id: string, field: ExternalIdField, value: string) => Promise<void>;
  describe: (record: T) => string;
  toPublishInput: (record: T) => Omit<ExternalPublishInput, 'sourceUrl'> & { sourcePath: string };
};

type RecordByKind = {
  article: AdminArticleRecord;
  event: AdminEventRecord;
  geekdaily: AdminGeekDailyRecord;
};

export type ExternalContentKind = keyof RecordByKind;

const contentSources: { [K in ExternalContentKind]: ContentSource<RecordByKind[K]> } = {
  article: {
    label: 'article',
    auditPrefix: 'article',
    targetType: 'article',
    get: getAdminArticle,
    saveExternalId: async (id, field, value) => {
      await getDb().update(articles).set({ [field]: value, updatedAt: new Date() }).where(eq(articles.id, id));
    },
    describe: (record) => `article ${record.title}`,
    toPublishInput: (record) => ({
      title: record.title,
      summary: record.summary,
      bodyMarkdown: record.bodyMarkdown,
      tags: record.tags,
      sourcePath: `/articles/${record.publicNumber}-${record.slug}`,
    }),
  },
  event: {
    label: 'event',
    auditPrefix: 'event',
    targetType: 'event',
    get: getAdminEvent,
    saveExternalId: async (id, field, value) => {
      await getDb().update(events).set({ [field]: value, updatedAt: new Date() }).where(eq(events.id, id));
    },
    describe: (record) => `event ${record.title}`,
    toPublishInput: (record) => {
      const details = [`活动时间：${record.startAt ?? ''} 至 ${record.endAt ?? ''}`, `活动地点：${record.city} ${record.location} ${record.venue}`];
      if (record.registrationUrl) details.push(`报名链接：${record.registrationUrl}`);
      return {
        title: `活动｜${record.title}`,
        summary: record.summary,
        bodyMarkdown: `${details.join('\n')}\n\n${record.bodyMarkdown}`,
        tags: record.tags,
        sourcePath: `/events/${record.publicNumber}-${record.slug}`,
      };
    },
  },
  geekdaily: {
    label: 'GeekDaily episode',
    auditPrefix: 'geekdaily',
    targetType: 'geekdaily_episode',
    get: getAdminGeekDailyEpisode,
    saveExternalId: async (id, field, value) => {
      await getDb().update(geekdailyEpisodes).set({ [field]: value, updatedAt: new Date() }).where(eq(geekdailyEpisodes.id, id));
    },
    describe: (record) => `GeekDaily ${record.episodeNumber}`,
    toPublishInput: (record) => ({
      title: `极客日报｜${record.title}`,
      summary: record.summary,
      bodyMarkdown: record.bodyMarkdown,
      tags: record.tags,
      sourcePath: `/geekdaily/${record.slug}`,
    }),
  },
};

export const externalChannels = {
  infoq: infoqChannel,
  learnblockchain: learnBlockchainChannel,
  x: xChannel,
} satisfies Record<string, ExternalChannel>;

export type ExternalChannelKey = keyof typeof externalChannels;

export const shouldAutoPublish = (channel: ExternalChannel, record: { status: string } & Partial<Record<ExternalIdField, string | null>>) =>
  record.status === 'published' && !record[channel.idField];

// ponytail: one process-wide publish queue per channel; use a durable job worker if volume requires parallelism.
const publishQueues = new Map<string, Promise<void>>();
const queuePublish = <T>(channel: ExternalChannel, task: () => Promise<T>) => {
  const next = (publishQueues.get(channel.name) ?? Promise.resolve()).then(task);
  publishQueues.set(channel.name, next.then(() => undefined, () => undefined));
  return next;
};

const getSourceUrl = async (path: string) => new URL(path, `${(await getPublicSiteConfig()).primaryDomain}/`).toString();

const describeError = (error: unknown) => {
  if (error instanceof ApiError) return { message: error.message, status: error.status, code: error.code, details: error.details ?? null };
  if (error instanceof Error) return { message: error.message, name: error.name, stack: error.stack };
  return { message: String(error) };
};

// One JSON line per publish attempt so `manage.sh logs api` can be grepped by channel or target.
const logPublishEvent = (level: 'info' | 'error', event: string, fields: Record<string, unknown>) => {
  const line = JSON.stringify({ time: new Date().toISOString(), level, event, ...fields });
  if (level === 'error') console.error(line);
  else console.log(line);
};

const recordPublishFailure = async <T>(
  source: ContentSource<T>,
  channel: ExternalChannel,
  id: string,
  actor: AuditActor,
  record: T,
  error: unknown,
  context: Record<string, unknown>,
) => {
  const failure = describeError(error);
  logPublishEvent('error', 'external_publish_failed', { ...context, error: failure });
  try {
    await createAuditEntry({
      ...actor,
      action: `${source.auditPrefix}.${channel.auditKey}_publish_failed`,
      targetType: source.targetType,
      targetId: id,
      summary: `Failed to publish ${source.describe(record)} to ${channel.name}: ${failure.message}`.slice(0, 500),
      payloadJson: { ...context, error: { ...failure, stack: undefined } },
    });
  } catch (auditError) {
    logPublishEvent('error', 'external_publish_failure_audit_failed', { ...context, error: describeError(auditError) });
  }
};

export const publishToExternal = async <K extends ExternalContentKind>(
  kind: K,
  channelKey: ExternalChannelKey,
  id: string,
  actor: AuditActor,
): Promise<RecordByKind[K]> => {
  const source = contentSources[kind] as ContentSource<RecordByKind[K]>;
  const channel: ExternalChannel = externalChannels[channelKey];
  const record = await source.get(id);
  if (!record) throw badRequest(`${source.label} not found`);
  if (record.status !== 'published') throw badRequest(`publish the Rebase ${source.label} before sending it to ${channel.name}`);
  if (record[channel.idField]) return record;
  const startedAt = Date.now();
  const context = { channel: channel.name, kind, targetId: id, title: source.describe(record) };
  let externalId: string | null;
  try {
    externalId = await queuePublish(channel, async () => {
      const latest = await source.get(id);
      if (!latest) throw badRequest(`${source.label} not found`);
      if (latest[channel.idField]) return null;
      const { sourcePath, ...input } = source.toPublishInput(latest);
      return channel.publish({ ...input, sourceUrl: await getSourceUrl(sourcePath) });
    });
  } catch (error) {
    await recordPublishFailure(source, channel, id, actor, record, error, { ...context, durationMs: Date.now() - startedAt });
    throw error;
  }
  if (!externalId) return (await source.get(id)) as RecordByKind[K];
  logPublishEvent('info', 'external_publish_succeeded', { ...context, externalId, durationMs: Date.now() - startedAt });
  await source.saveExternalId(id, channel.idField, externalId);
  await createAuditEntry({
    ...actor,
    action: `${source.auditPrefix}.${channel.auditKey}_publish`,
    targetType: source.targetType,
    targetId: id,
    summary: `Published ${source.describe(record)} to ${channel.name}`,
  });
  return (await source.get(id)) as RecordByKind[K];
};

export const autoPublishToExternal = async <K extends ExternalContentKind>(kind: K, record: RecordByKind[K] | null, actor: AuditActor) => {
  if (!record) return record;
  let next = record;
  let firstError: unknown = null;
  const failures: string[] = [];

  for (const [channelKey, channel] of Object.entries(externalChannels) as Array<[ExternalChannelKey, ExternalChannel]>) {
    if (!shouldAutoPublish(channel, next) || !(await channel.isConfigured())) continue;
    try {
      next = await publishToExternal(kind, channelKey, next.id, actor);
    } catch (error) {
      firstError ??= error;
      failures.push(`${channel.name}：${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (firstError) {
    const message = `站内内容已保存，但外部发布失败：${failures.join('；')}`;
    if (firstError instanceof ApiError) {
      throw new ApiError(firstError.status, firstError.code, message, {
        ...firstError.details,
        failures,
      });
    }
    throw serviceUnavailable(message, { failures });
  }
  return next;
};
