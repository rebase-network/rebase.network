import { asc, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';

import { geekdailyEpisodeItems, geekdailyEpisodes } from '@rebase/db';
import {
  buildGeekDailyBodyMarkdown,
  buildGeekDailySummary,
  extractGeekDailyBodyNote,
  getGeekDailyEpisodeSlug,
  type AdminGeekDailyListItem,
  type ContentStatus,
  type GeekDailyEpisodeInput,
  type PaginatedResult,
} from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { getDb } from './db.js';
import { badRequest, notFound } from './errors.js';
import { buildPaginatedMeta, resolvePagination, type PaginationInput } from './pagination.js';
import { combineFilters, toContainsPattern } from './query-filters.js';
import { toIsoString } from './utils.js';

const mapEpisodeItem = (row: typeof geekdailyEpisodeItems.$inferSelect) => ({
  title: row.title,
  authorName: row.authorName,
  sourceUrl: row.sourceUrl,
  summary: row.summary,
});

const mapSearchEpisodeItem = (row: Pick<typeof geekdailyEpisodeItems.$inferSelect, 'title' | 'authorName' | 'summary'>) => ({
  title: row.title,
  authorName: row.authorName,
  summary: row.summary,
});

const PUBLIC_GEEKDAILY_CACHE_TTL_MS = 5 * 60 * 1000;

const publicGeekDailyCache = new Map<string, { expiresAt: number; value: Promise<unknown> }>();

const withPublicGeekDailyCache = async <T>(key: string, loader: () => Promise<T>) => {
  const now = Date.now();
  const cached = publicGeekDailyCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.value as Promise<T>;
  }

  const promise = loader().catch((error) => {
    const current = publicGeekDailyCache.get(key);
    if (current?.value === promise) {
      publicGeekDailyCache.delete(key);
    }
    throw error;
  });

  publicGeekDailyCache.set(key, {
    expiresAt: now + PUBLIC_GEEKDAILY_CACHE_TTL_MS,
    value: promise,
  });

  return promise;
};

export const invalidatePublicGeekDailyCache = () => {
  publicGeekDailyCache.clear();
};

const loadItemsByEpisodeIds = async (episodeIds?: string[]) => {
  const db = getDb();
  if (episodeIds && episodeIds.length === 0) {
    return new Map<string, ReturnType<typeof mapEpisodeItem>[]>();
  }

  const query = db.select().from(geekdailyEpisodeItems);
  const rows = episodeIds
    ? await query.where(inArray(geekdailyEpisodeItems.episodeId, episodeIds)).orderBy(asc(geekdailyEpisodeItems.sortOrder))
    : await query.orderBy(asc(geekdailyEpisodeItems.sortOrder));
  const result = new Map<string, any[]>();

  for (const row of rows) {
    const current = result.get(row.episodeId) ?? [];
    current.push(mapEpisodeItem(row));
    result.set(row.episodeId, current);
  }

  return result;
};

const loadSearchItemsByEpisodeIds = async (episodeIds: string[]) => {
  const db = getDb();
  if (episodeIds.length === 0) {
    return new Map<string, ReturnType<typeof mapSearchEpisodeItem>[]>();
  }

  const rows = await db
    .select({
      episodeId: geekdailyEpisodeItems.episodeId,
      title: geekdailyEpisodeItems.title,
      authorName: geekdailyEpisodeItems.authorName,
      summary: geekdailyEpisodeItems.summary,
    })
    .from(geekdailyEpisodeItems)
    .where(inArray(geekdailyEpisodeItems.episodeId, episodeIds))
    .orderBy(asc(geekdailyEpisodeItems.sortOrder));
  const result = new Map<string, ReturnType<typeof mapSearchEpisodeItem>[]>();

  for (const row of rows) {
    const current = result.get(row.episodeId) ?? [];
    current.push(mapSearchEpisodeItem(row));
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

const getEditors = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];

const getTags = (value: unknown) =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];

const resolveEpisodeEditors = (actor: AuditActor, fallback: unknown = []) => {
  const actorName = actor.actorDisplayName?.trim();
  if (actorName) {
    return [actorName];
  }

  return getEditors(fallback);
};

const coerceDate = (value: Date | string | null | undefined) => {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const mapEpisodeDetail = (row: any, items: any[]) => ({
  id: row.id,
  slug: getGeekDailyEpisodeSlug(row.episodeNumber),
  episodeNumber: row.episodeNumber,
  title: row.title,
  summary: row.summary,
  bodyMarkdown: row.bodyMarkdown,
  editors: getEditors(row.editorsJson),
  tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
  status: row.status,
  publishedAt: toIsoString(row.publishedAt) ?? new Date().toISOString(),
  items,
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
});

const mapPublicEpisodePreview = (row: any, items: any[]) => ({
  slug: getGeekDailyEpisodeSlug(row.episodeNumber),
  episodeNumber: row.episodeNumber,
  title: row.title,
  summary: row.summary,
  publishedAt: toIsoString(row.publishedAt) ?? new Date().toISOString(),
  editors: getEditors(row.editorsJson),
  tags: getTags(row.tagsJson),
  items,
});

const mapPublicEpisode = (row: any, items: any[]) => ({
  ...mapPublicEpisodePreview(row, items),
  body: row.bodyMarkdown,
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
    loadItemsByEpisodeIds([id]),
  ]);
  const row = rows[0] ?? null;
  return row ? mapEpisodeDetail(row, itemsByEpisode.get(row.id) ?? []) : null;
};

export const createAdminGeekDailyEpisode = async (input: GeekDailyEpisodeInput, actor: AuditActor) => {
  const db = getDb();
  await ensureEpisodeNumberAvailable(input.episodeNumber);
  const editors = resolveEpisodeEditors(actor, input.editors);

  const [created] = await db
    .insert(geekdailyEpisodes)
    .values({
      slug: getGeekDailyEpisodeSlug(input.episodeNumber),
      episodeNumber: input.episodeNumber,
      title: input.title,
      summary: buildGeekDailySummary(input),
      bodyMarkdown: buildGeekDailyBodyMarkdown({ ...input, editors }),
      editorsJson: editors,
      tagsJson: input.tags,
      status: 'draft',
      publishedAt: new Date(),
      updatedByStaffId: actor.actorStaffAccountId ?? null,
    })
    .returning();

  await replaceItems(created.id, input.items);
  invalidatePublicGeekDailyCache();

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
  const editors = resolveEpisodeEditors(actor, current.editors);

  await db
    .update(geekdailyEpisodes)
    .set({
      slug: getGeekDailyEpisodeSlug(input.episodeNumber),
      episodeNumber: input.episodeNumber,
      title: input.title,
      summary: buildGeekDailySummary(input),
      bodyMarkdown: buildGeekDailyBodyMarkdown({ ...input, editors }),
      editorsJson: editors,
      tagsJson: input.tags,
      status: current.status,
      publishedAt: coerceDate(current.publishedAt),
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(geekdailyEpisodes.id, id));

  await replaceItems(id, input.items);
  invalidatePublicGeekDailyCache();

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
  const editors = resolveEpisodeEditors(actor, current.editors);

  await db
    .update(geekdailyEpisodes)
    .set({
      status: 'published',
      publishedAt: new Date(),
      editorsJson: editors,
      bodyMarkdown: buildGeekDailyBodyMarkdown({
        episodeNumber: current.episodeNumber,
        editors,
        items: current.items,
        bodyMarkdown: extractGeekDailyBodyNote(current.bodyMarkdown),
      }),
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(geekdailyEpisodes.id, id));
  invalidatePublicGeekDailyCache();

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
  invalidatePublicGeekDailyCache();

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
  return withPublicGeekDailyCache(`episodes:${limit}`, async () => {
    const db = getDb();
    const query = db
      .select({
        id: geekdailyEpisodes.id,
        episodeNumber: geekdailyEpisodes.episodeNumber,
        title: geekdailyEpisodes.title,
        summary: geekdailyEpisodes.summary,
        bodyMarkdown: geekdailyEpisodes.bodyMarkdown,
        editorsJson: geekdailyEpisodes.editorsJson,
        tagsJson: geekdailyEpisodes.tagsJson,
        publishedAt: geekdailyEpisodes.publishedAt,
      })
      .from(geekdailyEpisodes)
      .where(eq(geekdailyEpisodes.status, 'published'))
      .orderBy(desc(geekdailyEpisodes.episodeNumber));
    const rows = limit > 0 ? await query.limit(limit) : await query;
    const itemsByEpisode = await loadItemsByEpisodeIds(rows.map((row) => row.id));

    return rows.map((row) => mapPublicEpisode(row, itemsByEpisode.get(row.id) ?? []));
  });
};

export const listPublicGeekDailyEpisodePreviews = async (limit = -1) => {
  return withPublicGeekDailyCache(`previews:${limit}`, async () => {
    const db = getDb();
    const query = db
      .select({
        id: geekdailyEpisodes.id,
        episodeNumber: geekdailyEpisodes.episodeNumber,
        title: geekdailyEpisodes.title,
        summary: geekdailyEpisodes.summary,
        editorsJson: geekdailyEpisodes.editorsJson,
        tagsJson: geekdailyEpisodes.tagsJson,
        publishedAt: geekdailyEpisodes.publishedAt,
      })
      .from(geekdailyEpisodes)
      .where(eq(geekdailyEpisodes.status, 'published'))
      .orderBy(desc(geekdailyEpisodes.episodeNumber));
    const rows = limit > 0 ? await query.limit(limit) : await query;
    const itemsByEpisode = await loadItemsByEpisodeIds(rows.map((row) => row.id));

    return rows.map((row) => mapPublicEpisodePreview(row, itemsByEpisode.get(row.id) ?? []));
  });
};

export const getPublicGeekDailyEpisodeBySlug = async (slug: string) => {
  return withPublicGeekDailyCache(`episode:${slug}`, async () => {
    const row = await getEpisodeRecordBySlug(slug);
    if (!row || row.status !== 'published') {
      return null;
    }
    const itemsByEpisode = await loadItemsByEpisodeIds([row.id]);

    return mapPublicEpisode(row, itemsByEpisode.get(row.id) ?? []);
  });
};

export const getPublicGeekDailyOverview = async () => {
  return withPublicGeekDailyCache('overview', async () => {
    const db = getDb();
    const [countRow, yearRows, tagRows] = await Promise.all([
      db.select({ value: count() }).from(geekdailyEpisodes).where(eq(geekdailyEpisodes.status, 'published')),
      db
        .select({
          year: sql<number>`extract(year from ${geekdailyEpisodes.publishedAt})::int`,
        })
        .from(geekdailyEpisodes)
        .where(eq(geekdailyEpisodes.status, 'published'))
        .groupBy(sql`1`)
        .orderBy(desc(sql`1`)),
      db
        .select({
          tagsJson: geekdailyEpisodes.tagsJson,
        })
        .from(geekdailyEpisodes)
        .where(eq(geekdailyEpisodes.status, 'published')),
    ]);

    const years = yearRows.map((row) => row.year).filter(Number.isFinite);
    const featuredTags = [...new Set(tagRows.flatMap((row) => getTags(row.tagsJson)))].slice(0, 8);

    return {
      totalEpisodes: countRow[0]?.value ?? 0,
      years,
      featuredTags,
    };
  });
};

export const getGeekDailySearchDocuments = async () => {
  return withPublicGeekDailyCache('search-documents', async () => {
    const db = getDb();
    const rows = await db
      .select({
        id: geekdailyEpisodes.id,
        episodeNumber: geekdailyEpisodes.episodeNumber,
        title: geekdailyEpisodes.title,
        summary: geekdailyEpisodes.summary,
        tagsJson: geekdailyEpisodes.tagsJson,
        publishedAt: geekdailyEpisodes.publishedAt,
      })
      .from(geekdailyEpisodes)
      .where(eq(geekdailyEpisodes.status, 'published'))
      .orderBy(desc(geekdailyEpisodes.episodeNumber));
    const itemsByEpisode = await loadSearchItemsByEpisodeIds(rows.map((row) => row.id));

    return rows.map((row) => {
      const publishedAt = toIsoString(row.publishedAt) ?? new Date().toISOString();

      return {
        slug: getGeekDailyEpisodeSlug(row.episodeNumber),
        episodeNumber: row.episodeNumber,
        title: row.title,
        summary: row.summary,
        tags: getTags(row.tagsJson),
        publishedAt,
        year: String(new Date(publishedAt).getUTCFullYear()),
        items: itemsByEpisode.get(row.id) ?? [],
      };
    });
  });
};
