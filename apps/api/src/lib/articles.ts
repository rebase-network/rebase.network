import { desc, eq } from 'drizzle-orm';

import { articles } from '@rebase/db';
import type { AdminArticleListItem, ArticleInput } from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { getDb } from './db.js';
import { badRequest, notFound } from './errors.js';
import { ensurePublishedAt, toIsoString } from './utils.js';

const mapArticleListItem = (row: any): AdminArticleListItem => ({
  id: row.id,
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

const ensureUniqueSlug = async (slug: string, currentId?: string) => {
  const db = getDb();
  const rows = await db.select({ id: articles.id }).from(articles).where(eq(articles.slug, slug)).limit(1);
  const existing = rows[0] ?? null;

  if (existing && existing.id !== currentId) {
    throw badRequest('article slug already exists', { field: 'slug' });
  }
};

export const listAdminArticles = async (): Promise<AdminArticleListItem[]> => {
  const db = getDb();
  const rows = await db.select().from(articles).orderBy(desc(articles.updatedAt));
  return rows.map(mapArticleListItem);
};

export const getAdminArticle = async (id: string) => {
  const db = getDb();
  const rows = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  const row = rows[0] ?? null;
  return row ? mapArticleDetail(row) : null;
};

export const createAdminArticle = async (input: ArticleInput, actor: AuditActor) => {
  const db = getDb();
  await ensureUniqueSlug(input.slug);

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

  await ensureUniqueSlug(input.slug, id);

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

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    publishedAt: toIsoString(row.publishedAt),
    readingTime: row.readingTime,
    authors: Array.isArray(row.authorsJson) ? row.authorsJson : [],
    tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
    coverAccent: row.coverAccent,
    coverImageUrl: null,
    body: row.bodyMarkdown,
  }));
};

export const getPublicArticleBySlug = async (slug: string) => {
  const db = getDb();
  const rows = await db
    .select()
    .from(articles)
    .where(eq(articles.slug, slug))
    .limit(1);
  const row = rows[0] ?? null;

  if (!row || row.status !== 'published') {
    return null;
  }

  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    publishedAt: toIsoString(row.publishedAt),
    readingTime: row.readingTime,
    authors: Array.isArray(row.authorsJson) ? row.authorsJson : [],
    tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
    coverAccent: row.coverAccent,
    coverImageUrl: null,
    body: row.bodyMarkdown,
  };
};
