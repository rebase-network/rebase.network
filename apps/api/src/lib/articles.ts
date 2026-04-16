import { count, desc, eq, ilike, or, sql } from 'drizzle-orm';

import { articles } from '@rebase/db';
import type { AdminArticleListItem, ArticleInput, ContentStatus, PaginatedResult } from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { listPublicAssetUrlsById } from './assets.js';
import { getDb } from './db.js';
import { notFound } from './errors.js';
import { buildPaginatedMeta, resolvePagination, type PaginationInput } from './pagination.js';
import { combineFilters, toContainsPattern } from './query-filters.js';
import { ensurePublishedAt, parsePublicNumber, toIsoString } from './utils.js';

const mapArticleListItem = (row: any): AdminArticleListItem => ({
  id: row.id,
  publicNumber: row.publicNumber,
  slug: row.slug,
  title: row.title,
  status: row.status,
  publishedAt: toIsoString(row.publishedAt),
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
  readingTime: row.readingTime,
  authorNames: Array.isArray(row.authorsJson) ? row.authorsJson.map((item: any) => item.name).filter(Boolean) : [],
});

const mapArticleDetail = (row: any) => ({
  id: row.id,
  publicNumber: row.publicNumber,
  slug: row.slug,
  title: row.title,
  summary: row.summary,
  bodyMarkdown: row.bodyMarkdown,
  readingTime: row.readingTime,
  coverAssetId: row.coverAssetId,
  coverAccent: row.coverAccent,
  authors: Array.isArray(row.authorsJson) ? row.authorsJson : [],
  tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
  seoTitle: row.seoTitle ?? '',
  seoDescription: row.seoDescription ?? '',
  status: row.status,
  publishedAt: toIsoString(row.publishedAt),
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
});

interface ListAdminArticlesInput extends PaginationInput {
  query?: string;
  status?: ContentStatus;
}

export const listAdminArticles = async (input: ListAdminArticlesInput = {}): Promise<PaginatedResult<AdminArticleListItem>> => {
  const db = getDb();
  const normalizedQuery = input.query?.trim() ?? '';
  const where = combineFilters([
    input.status ? eq(articles.status, input.status) : undefined,
    normalizedQuery
      ? or(
          ilike(articles.title, toContainsPattern(normalizedQuery)),
          ilike(articles.slug, toContainsPattern(normalizedQuery)),
          sql`${articles.authorsJson}::text ilike ${toContainsPattern(normalizedQuery)}`,
        )
      : undefined,
  ]);

  const [countRow, totalAllRow] = await Promise.all([
    db.select({ value: count() }).from(articles).where(where),
    normalizedQuery || input.status ? db.select({ value: count() }).from(articles) : Promise.resolve([{ value: 0 }]),
  ]);

  const totalItems = countRow[0]?.value ?? 0;
  const pagination = resolvePagination(input, totalItems);
  const rows =
    totalItems === 0
      ? []
      : await db.select().from(articles).where(where).orderBy(desc(articles.updatedAt)).limit(pagination.pageSize).offset(pagination.offset);

  return {
    items: rows.map(mapArticleListItem),
    meta: buildPaginatedMeta(pagination, normalizedQuery || input.status ? totalAllRow[0]?.value ?? totalItems : totalItems),
  };
};

export const getAdminArticle = async (id: string) => {
  const db = getDb();
  const rows = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  const row = rows[0] ?? null;
  return row ? mapArticleDetail(row) : null;
};

export const createAdminArticle = async (input: ArticleInput, actor: AuditActor) => {
  const db = getDb();

  const [created] = await db
    .insert(articles)
    .values({
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      bodyMarkdown: input.bodyMarkdown,
      readingTime: input.readingTime,
      coverAssetId: input.coverAssetId,
      coverAccent: input.coverAccent,
      authorsJson: input.authors,
      tagsJson: input.tags,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      status: input.status,
      publishedAt: ensurePublishedAt(input.status, input.publishedAt),
      updatedByStaffId: actor.actorStaffAccountId ?? null,
    })
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'article.create',
    targetType: 'article',
    targetId: created.id,
    summary: `Created article ${created.title}`,
  });

  return mapArticleDetail(created);
};

export const updateAdminArticle = async (id: string, input: ArticleInput, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminArticle(id);
  if (!current) {
    throw notFound('article not found');
  }

  const [updated] = await db
    .update(articles)
    .set({
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      bodyMarkdown: input.bodyMarkdown,
      readingTime: input.readingTime,
      coverAssetId: input.coverAssetId,
      coverAccent: input.coverAccent,
      authorsJson: input.authors,
      tagsJson: input.tags,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      status: input.status,
      publishedAt: ensurePublishedAt(input.status, input.publishedAt),
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'article.update',
    targetType: 'article',
    targetId: updated.id,
    summary: `Updated article ${updated.title}`,
  });

  return mapArticleDetail(updated);
};

export const publishAdminArticle = async (id: string, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminArticle(id);
  if (!current) {
    throw notFound('article not found');
  }

  const [updated] = await db
    .update(articles)
    .set({
      status: 'published',
      publishedAt: ensurePublishedAt('published', current.publishedAt),
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'article.publish',
    targetType: 'article',
    targetId: updated.id,
    summary: `Published article ${updated.title}`,
  });

  return mapArticleDetail(updated);
};

export const archiveAdminArticle = async (id: string, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminArticle(id);
  if (!current) {
    throw notFound('article not found');
  }

  const [updated] = await db
    .update(articles)
    .set({
      status: 'archived',
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id))
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'article.archive',
    targetType: 'article',
    targetId: updated.id,
    summary: `Archived article ${updated.title}`,
  });

  return mapArticleDetail(updated);
};

export const listPublicArticles = async () => {
  const db = getDb();
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishedAt));
  const assetUrls = await listPublicAssetUrlsById(rows.map((row) => row.coverAssetId));

  return rows.map((row) => ({
    publicNumber: row.publicNumber,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    publishedAt: toIsoString(row.publishedAt),
    readingTime: row.readingTime,
    authors: Array.isArray(row.authorsJson) ? row.authorsJson : [],
    tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
    coverAccent: row.coverAccent,
    coverImageUrl: row.coverAssetId ? assetUrls.get(row.coverAssetId) : undefined,
    body: row.bodyMarkdown,
  }));
};

export const getPublicArticleByPublicNumber = async (value: string | number) => {
  const publicNumber = parsePublicNumber(value);

  if (!publicNumber) {
    return null;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.publicNumber, publicNumber))
    .limit(1);
  const row = rows[0] ?? null;

  if (!row || row.status !== 'published') {
    return null;
  }

  const assetUrls = await listPublicAssetUrlsById([row.coverAssetId]);

  return {
    publicNumber: row.publicNumber,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    publishedAt: toIsoString(row.publishedAt),
    readingTime: row.readingTime,
    authors: Array.isArray(row.authorsJson) ? row.authorsJson : [],
    tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
    coverAccent: row.coverAccent,
    coverImageUrl: row.coverAssetId ? assetUrls.get(row.coverAssetId) : undefined,
    body: row.bodyMarkdown,
  };
};
