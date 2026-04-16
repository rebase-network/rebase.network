import { randomUUID } from 'node:crypto';

import { count, desc, eq, ilike, or } from 'drizzle-orm';

import { jobs, staffAccounts } from '@rebase/db';
import { validateJobInput, type AdminJobListItem, type ContentStatus, type JobInput, type PaginatedResult } from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { getDb } from './db.js';
import { ApiError, notFound } from './errors.js';
import { buildPaginatedMeta, resolvePagination, type PaginationInput } from './pagination.js';
import { combineFilters, toContainsPattern } from './query-filters.js';
import { ensurePublishedAt, toIsoString } from './utils.js';

const internalDraftSlugPrefix = 'draft-job-';

const isInternalDraftSlug = (value: string) => value.startsWith(internalDraftSlugPrefix);
const toStoredJobSlug = (value: string) => {
  const normalizedValue = value.trim();
  return normalizedValue || `${internalDraftSlugPrefix}${randomUUID()}`;
};
const toAdminJobSlug = (value: string | null | undefined) => {
  if (!value || isInternalDraftSlug(value)) {
    return '';
  }

  return value;
};

const assertPublishableJob = (input: JobInput) => {
  const result = validateJobInput({
    ...input,
    status: 'published',
  });

  if (result.valid && result.data) {
    return result.data;
  }

  throw new ApiError(400, 'VALIDATION_ERROR', 'one or more fields failed validation', {
    issues: result.issues ?? [],
  });
};

const mapJobListItem = (row: any): AdminJobListItem => ({
  id: row.job.id,
  slug: toAdminJobSlug(row.job.slug),
  companyName: row.job.companyName,
  roleTitle: row.job.roleTitle,
  editorName: row.editorName ?? null,
  status: row.job.status,
  publishedAt: toIsoString(row.job.publishedAt),
  expiresAt: toIsoString(row.job.expiresAt),
  updatedAt: toIsoString(row.job.updatedAt) ?? new Date().toISOString(),
  supportsRemote: row.job.supportsRemote,
});

const mapJobDetail = (row: any) => ({
  id: row.id,
  slug: toAdminJobSlug(row.slug),
  companyName: row.companyName,
  roleTitle: row.roleTitle,
  salary: row.salary,
  supportsRemote: row.supportsRemote,
  workMode: row.workMode,
  location: row.location,
  summary: row.summary,
  descriptionMarkdown: row.descriptionMarkdown,
  applyUrl: row.applyUrl ?? '',
  applyNote: row.applyNote ?? '',
  contactLabel: row.contactLabel ?? '',
  contactValue: row.contactValue ?? '',
  tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
  seoTitle: row.seoTitle ?? '',
  seoDescription: row.seoDescription ?? '',
  status: row.status,
  expiresAt: toIsoString(row.expiresAt),
  publishedAt: toIsoString(row.publishedAt),
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
});

const resolveJobPublishedAt = (status: ContentStatus, currentPublishedAt?: string | null) => {
  if (currentPublishedAt) {
    return new Date(currentPublishedAt);
  }

  return status === 'published' ? new Date() : null;
};

interface ListAdminJobsInput extends PaginationInput {
  query?: string;
  status?: ContentStatus;
}

export const listAdminJobs = async (input: ListAdminJobsInput = {}): Promise<PaginatedResult<AdminJobListItem>> => {
  const db = getDb();
  const normalizedQuery = input.query?.trim() ?? '';
  const where = combineFilters([
    input.status ? eq(jobs.status, input.status) : undefined,
    normalizedQuery
      ? or(
          ilike(jobs.companyName, toContainsPattern(normalizedQuery)),
          ilike(jobs.roleTitle, toContainsPattern(normalizedQuery)),
          ilike(jobs.slug, toContainsPattern(normalizedQuery)),
        )
      : undefined,
  ]);

  const [countRow, totalAllRow] = await Promise.all([
    db.select({ value: count() }).from(jobs).where(where),
    normalizedQuery || input.status ? db.select({ value: count() }).from(jobs) : Promise.resolve([{ value: 0 }]),
  ]);

  const totalItems = countRow[0]?.value ?? 0;
  const pagination = resolvePagination(input, totalItems);
  const rows =
    totalItems === 0
      ? []
      : await db
          .select({
            job: jobs,
            editorName: staffAccounts.displayName,
          })
          .from(jobs)
          .leftJoin(staffAccounts, eq(staffAccounts.id, jobs.updatedByStaffId))
          .where(where)
          .orderBy(desc(jobs.updatedAt))
          .limit(pagination.pageSize)
          .offset(pagination.offset);

  return {
    items: rows.map(mapJobListItem),
    meta: buildPaginatedMeta(pagination, normalizedQuery || input.status ? totalAllRow[0]?.value ?? totalItems : totalItems),
  };
};

export const getAdminJob = async (id: string) => {
  const db = getDb();
  const rows = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  const row = rows[0] ?? null;
  return row ? mapJobDetail(row) : null;
};

export const createAdminJob = async (input: JobInput, actor: AuditActor) => {
  const db = getDb();
  const storedSlug = toStoredJobSlug(input.slug);

  const [created] = await db
    .insert(jobs)
    .values({
      slug: storedSlug,
      companyName: input.companyName,
      roleTitle: input.roleTitle,
      salary: input.salary,
      supportsRemote: input.supportsRemote,
      workMode: input.workMode,
      location: input.location,
      summary: input.summary,
      descriptionMarkdown: input.descriptionMarkdown,
      applyUrl: input.applyUrl,
      applyNote: input.applyNote,
      contactLabel: input.contactLabel,
      contactValue: input.contactValue,
      tagsJson: input.tags,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      status: input.status,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      publishedAt: resolveJobPublishedAt(input.status),
      updatedByStaffId: actor.actorStaffAccountId ?? null,
    })
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'job.create',
    targetType: 'job',
    targetId: created.id,
    summary: `Created job ${created.roleTitle}`,
  });

  return mapJobDetail(created);
};

export const updateAdminJob = async (id: string, input: JobInput, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminJob(id);
  if (!current) {
    throw notFound('job not found');
  }

  const storedSlug = toStoredJobSlug(input.slug);

  const [updated] = await db
    .update(jobs)
    .set({
      slug: storedSlug,
      companyName: input.companyName,
      roleTitle: input.roleTitle,
      salary: input.salary,
      supportsRemote: input.supportsRemote,
      workMode: input.workMode,
      location: input.location,
      summary: input.summary,
      descriptionMarkdown: input.descriptionMarkdown,
      applyUrl: input.applyUrl,
      applyNote: input.applyNote,
      contactLabel: input.contactLabel,
      contactValue: input.contactValue,
      tagsJson: input.tags,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      status: input.status,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      publishedAt: resolveJobPublishedAt(input.status, current.publishedAt),
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, id))
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'job.update',
    targetType: 'job',
    targetId: updated.id,
    summary: `Updated job ${updated.roleTitle}`,
  });

  return mapJobDetail(updated);
};

export const publishAdminJob = async (id: string, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminJob(id);
  if (!current) {
    throw notFound('job not found');
  }

  assertPublishableJob(current);

  const [updated] = await db
    .update(jobs)
    .set({
      status: 'published',
      publishedAt: ensurePublishedAt('published', current.publishedAt),
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, id))
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'job.publish',
    targetType: 'job',
    targetId: updated.id,
    summary: `Published job ${updated.roleTitle}`,
  });

  return mapJobDetail(updated);
};

export const archiveAdminJob = async (id: string, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminJob(id);
  if (!current) {
    throw notFound('job not found');
  }

  const [updated] = await db
    .update(jobs)
    .set({
      status: 'archived',
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, id))
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'job.archive',
    targetType: 'job',
    targetId: updated.id,
    summary: `Archived job ${updated.roleTitle}`,
  });

  return mapJobDetail(updated);
};

export const listPublicJobs = async () => {
  const db = getDb();
  const rows = await db.select().from(jobs).where(eq(jobs.status, 'published')).orderBy(desc(jobs.publishedAt));

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    companyName: row.companyName,
    roleTitle: row.roleTitle,
    salary: row.salary,
    supportsRemote: row.supportsRemote,
    workMode: row.workMode,
    location: row.location,
    summary: row.summary,
    description: row.descriptionMarkdown,
    applyUrl: row.applyUrl ?? '',
    applyNote: row.applyNote ?? '',
    contactLabel: row.contactLabel ?? '',
    contactValue: row.contactValue ?? '',
    publishedAt: toIsoString(row.publishedAt),
    expiresAt: toIsoString(row.expiresAt),
    tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
  }));
};

export const getPublicJobById = async (id: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return null;
  }

  const db = getDb();
  const rows = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  const row = rows[0] ?? null;
  if (!row || row.status !== 'published') {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    companyName: row.companyName,
    roleTitle: row.roleTitle,
    salary: row.salary,
    supportsRemote: row.supportsRemote,
    workMode: row.workMode,
    location: row.location,
    summary: row.summary,
    description: row.descriptionMarkdown,
    applyUrl: row.applyUrl ?? '',
    applyNote: row.applyNote ?? '',
    contactLabel: row.contactLabel ?? '',
    contactValue: row.contactValue ?? '',
    publishedAt: toIsoString(row.publishedAt),
    expiresAt: toIsoString(row.expiresAt),
    tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
  };
};
