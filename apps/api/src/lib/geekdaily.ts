import { asc, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { geekdailyEpisodeItems, geekdailyEpisodes } from '@rebase/db';
import { getGeekDailyEpisodeSlug, type AdminGeekDailyListItem, type ContentStatus, type GeekDailyEpisodeInput, type PaginatedResult } from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { getDb } from './db.js';
import { badRequest, notFound } from './errors.js';
import { buildPaginatedMeta, resolvePagination, type PaginationInput } from './pagination.js';
import { combineFilters, toContainsPattern } from './query-filters.js';
import { toIsoString } from './utils.js';

const loadItemsByEpisodeId = async () => {
  const db = getDb();
  const rows = await db.select().from(geekdailyEpisodeItems).orderBy(asc(geekdailyEpisodeItems.sortOrder));
  const result = new Map<string, any[]>();

  for (const row of rows) {
    const current = result.get(row.episodeId) ?? [];
    current.push({
      title: row.title,
      authorName: row.authorName,
      sourceUrl: row.sourceUrl,
      summary: row.summary,
    });
    result.set(row.episodeId, current);
  }

  return result;
};

const getAlternateGeekDailySlug = (slug: string) => {
  if (/^geekdaily-\d+$/.test(slug)) {
    return `episode-${slug.slice('geekdaily-'.length)}`;
  }

  if (/^episode-\d+$/.test(slug)) {
    return getGeekDailyEpisodeSlug(Number(slug.slice('episode-'.length)));
  }

  return null;
};

const getEpisodeRecordBySlug = async (slug: string) => {
  const db = getDb();
  const candidates = [slug, getAlternateGeekDailySlug(slug)].filter((value, index, list): value is string => Boolean(value) && list.indexOf(value) === index);

  for (const candidate of candidates) {
    const rows = await db.select().from(geekdailyEpisodes).where(eq(geekdailyEpisodes.slug, candidate)).limit(1);
    if (rows[0]) {
      return rows[0];
    }
  }

  return null;
};

const mapEpisodeDetail = (row: any, items: any[]) => ({
  id: row.id,
  slug: getGeekDailyEpisodeSlug(row.episodeNumber),
  episodeNumber: row.episodeNumber,
  title: row.title,
  summary: row.summary,
  bodyMarkdown: row.bodyMarkdown,
  tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
  status: row.status,
  publishedAt: toIsoString(row.publishedAt) ?? new Date().toISOString(),
  items,
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
});

const ensureEpisodeNumberAvailable = async (episodeNumber: number, currentId?: string) => {
  const db = getDb();
  const rows = await db
    .select({ id: geekdailyEpisodes.id })
    .from(geekdailyEpisodes)
    .where(eq(geekdailyEpisodes.episodeNumber, episodeNumber))
    .limit(1);
  const existing = rows[0] ?? null;
  if (existing && existing.id !== currentId) {
    throw badRequest('episode number already exists', { field: 'episodeNumber' });
  }
};

const replaceItems = async (episodeId: string, items: GeekDailyEpisodeInput['items']) => {
  const db = getDb();
  await db.delete(geekdailyEpisodeItems).where(eq(geekdailyEpisodeItems.episodeId, episodeId));
  await db.insert(geekdailyEpisodeItems).values(
    items.map((item, index) => ({
      episodeId,
      sortOrder: index,
      title: item.title,
      authorName: item.authorName,
      sourceUrl: item.sourceUrl,
      summary: item.summary,
    })),
  );
};

interface ListAdminGeekDailyEpisodesInput extends PaginationInput {
  query?: string;
  status?: ContentStatus;
}

const countItemsByEpisodeIds = async (episodeIds: string[]) => {
  const db = getDb();
  if (episodeIds.length === 0) {
    return new Map<string, number>();
  }

  const rows = await db
    .select({
      episodeId: geekdailyEpisodeItems.episodeId,
      value: count(),
    })
    .from(geekdailyEpisodeItems)
    .where(inArray(geekdailyEpisodeItems.episodeId, episodeIds))
    .groupBy(geekdailyEpisodeItems.episodeId);

  return new Map(rows.map((row) => [row.episodeId, row.value]));
};

export const listAdminGeekDailyEpisodes = async (
  input: ListAdminGeekDailyEpisodesInput = {},
): Promise<PaginatedResult<AdminGeekDailyListItem>> => {
  const db = getDb();
  const normalizedQuery = input.query?.trim() ?? '';
  const where = combineFilters([
    input.status ? eq(geekdailyEpisodes.status, input.status) : undefined,
    normalizedQuery
      ? or(
          ilike(geekdailyEpisodes.title, toContainsPattern(normalizedQuery)),
          ilike(geekdailyEpisodes.slug, toContainsPattern(normalizedQuery)),
          sql`${geekdailyEpisodes.episodeNumber}::text ilike ${toContainsPattern(normalizedQuery)}`,
        )
      : undefined,
  ]);

  const [countRow, totalAllRow] = await Promise.all([
    db.select({ value: count() }).from(geekdailyEpisodes).where(where),
    normalizedQuery || input.status ? db.select({ value: count() }).from(geekdailyEpisodes) : Promise.resolve([{ value: 0 }]),
  ]);

  const totalItems = countRow[0]?.value ?? 0;
  const pagination = resolvePagination(input, totalItems);
  const rows =
    totalItems === 0
      ? []
      : await db
          .select()
          .from(geekdailyEpisodes)
          .where(where)
          .orderBy(desc(geekdailyEpisodes.episodeNumber))
          .limit(pagination.pageSize)
          .offset(pagination.offset);

  const itemCounts = await countItemsByEpisodeIds(rows.map((row) => row.id));

  return {
    items: rows.map((row) => ({
      id: row.id,
      slug: getGeekDailyEpisodeSlug(row.episodeNumber),
      episodeNumber: row.episodeNumber,
      title: row.title,
      status: row.status,
      publishedAt: toIsoString(row.publishedAt) ?? new Date().toISOString(),
      itemCount: itemCounts.get(row.id) ?? 0,
      updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
    })),
    meta: buildPaginatedMeta(pagination, normalizedQuery || input.status ? totalAllRow[0]?.value ?? totalItems : totalItems),
  };
};

export const getAdminGeekDailyEpisode = async (id: string) => {
  const db = getDb();
  const [rows, itemsByEpisode] = await Promise.all([
    db.select().from(geekdailyEpisodes).where(eq(geekdailyEpisodes.id, id)).limit(1),
    loadItemsByEpisodeId(),
  ]);
  const row = rows[0] ?? null;
  return row ? mapEpisodeDetail(row, itemsByEpisode.get(row.id) ?? []) : null;
};

export const createAdminGeekDailyEpisode = async (input: GeekDailyEpisodeInput, actor: AuditActor) => {
  const db = getDb();
  await ensureEpisodeNumberAvailable(input.episodeNumber);

  const [created] = await db
    .insert(geekdailyEpisodes)
    .values({
      slug: getGeekDailyEpisodeSlug(input.episodeNumber),
      episodeNumber: input.episodeNumber,
      title: input.title,
      summary: input.summary,
      bodyMarkdown: input.bodyMarkdown,
      tagsJson: input.tags,
      status: input.status,
      publishedAt: new Date(input.publishedAt),
      updatedByStaffId: actor.actorStaffAccountId ?? null,
    })
    .returning();

  await replaceItems(created.id, input.items);

  await createAuditEntry({
    ...actor,
    action: 'geekdaily.create',
    targetType: 'geekdaily_episode',
    targetId: created.id,
    summary: `Created GeekDaily episode ${created.episodeNumber}`,
  });

  return getAdminGeekDailyEpisode(created.id);
};

export const updateAdminGeekDailyEpisode = async (id: string, input: GeekDailyEpisodeInput, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminGeekDailyEpisode(id);
  if (!current) {
    throw notFound('GeekDaily episode not found');
  }

  await ensureEpisodeNumberAvailable(input.episodeNumber, id);

  await db
    .update(geekdailyEpisodes)
    .set({
      slug: getGeekDailyEpisodeSlug(input.episodeNumber),
      episodeNumber: input.episodeNumber,
      title: input.title,
      summary: input.summary,
      bodyMarkdown: input.bodyMarkdown,
      tagsJson: input.tags,
      status: input.status,
      publishedAt: new Date(input.publishedAt),
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(geekdailyEpisodes.id, id));

  await replaceItems(id, input.items);

  await createAuditEntry({
    ...actor,
    action: 'geekdaily.update',
    targetType: 'geekdaily_episode',
    targetId: id,
    summary: `Updated GeekDaily episode ${input.episodeNumber}`,
  });

  return getAdminGeekDailyEpisode(id);
};

export const publishAdminGeekDailyEpisode = async (id: string, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminGeekDailyEpisode(id);
  if (!current) {
    throw notFound('GeekDaily episode not found');
  }

  await db
    .update(geekdailyEpisodes)
    .set({
      status: 'published',
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(geekdailyEpisodes.id, id));

  await createAuditEntry({
    ...actor,
    action: 'geekdaily.publish',
    targetType: 'geekdaily_episode',
    targetId: id,
    summary: `Published GeekDaily episode ${current.episodeNumber}`,
  });

  return getAdminGeekDailyEpisode(id);
};

export const archiveAdminGeekDailyEpisode = async (id: string, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminGeekDailyEpisode(id);
  if (!current) {
    throw notFound('GeekDaily episode not found');
  }

  await db
    .update(geekdailyEpisodes)
    .set({
      status: 'archived',
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(geekdailyEpisodes.id, id));

  await createAuditEntry({
    ...actor,
    action: 'geekdaily.archive',
    targetType: 'geekdaily_episode',
    targetId: id,
    summary: `Archived GeekDaily episode ${current.episodeNumber}`,
  });

  return getAdminGeekDailyEpisode(id);
};

export const listPublicGeekDailyEpisodes = async (limit = -1) => {
  const db = getDb();
  const query = db
    .select()
    .from(geekdailyEpisodes)
    .where(eq(geekdailyEpisodes.status, 'published'))
    .orderBy(desc(geekdailyEpisodes.episodeNumber));
  const rows = limit > 0 ? await query.limit(limit) : await query;
  const itemsByEpisode = await loadItemsByEpisodeId();

  return rows.map((row) => ({
    slug: getGeekDailyEpisodeSlug(row.episodeNumber),
    episodeNumber: row.episodeNumber,
    title: row.title,
    summary: row.summary,
    publishedAt: toIsoString(row.publishedAt) ?? new Date().toISOString(),
    tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
    body: row.bodyMarkdown,
    items: itemsByEpisode.get(row.id) ?? [],
  }));
};

export const getPublicGeekDailyEpisodeBySlug = async (slug: string) => {
  const [row, itemsByEpisode] = await Promise.all([getEpisodeRecordBySlug(slug), loadItemsByEpisodeId()]);
  if (!row || row.status !== 'published') {
    return null;
  }

  return {
    slug: getGeekDailyEpisodeSlug(row.episodeNumber),
    episodeNumber: row.episodeNumber,
    title: row.title,
    summary: row.summary,
    publishedAt: toIsoString(row.publishedAt) ?? new Date().toISOString(),
    tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
    body: row.bodyMarkdown,
    items: itemsByEpisode.get(row.id) ?? [],
  };
};

export const getGeekDailySearchDocuments = async () => {
  const episodes = await listPublicGeekDailyEpisodes();
  return episodes.map((episode) => ({
    slug: episode.slug,
    episodeNumber: episode.episodeNumber,
    title: episode.title,
    summary: episode.summary,
    body: episode.body,
    tags: episode.tags,
    publishedAt: episode.publishedAt,
    year: String(new Date(episode.publishedAt).getUTCFullYear()),
    itemTitles: episode.items.map((item: any) => item.title),
    searchableText: [
      episode.title,
      episode.summary,
      episode.body,
      episode.tags.join(' '),
      ...episode.items.flatMap((item: any) => [item.title, item.authorName, item.summary]),
    ]
      .join(' ')
      .toLowerCase(),
  }));
};
