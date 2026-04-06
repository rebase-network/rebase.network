import { asc, desc, eq } from 'drizzle-orm';

import { events } from '@rebase/db';
import type { AdminEventListItem, EventInput } from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { getDb } from './db.js';
import { badRequest, notFound } from './errors.js';
import { ensurePublishedAt, toIsoString } from './utils.js';

const mapEventListItem = (row: any): AdminEventListItem => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  status: row.status,
  startAt: toIsoString(row.startAt) ?? new Date().toISOString(),
  endAt: toIsoString(row.endAt) ?? new Date().toISOString(),
  city: row.city,
  registrationMode: row.registrationMode,
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
});

const mapEventDetail = (row: any) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  summary: row.summary,
  bodyMarkdown: row.bodyMarkdown,
  startAt: toIsoString(row.startAt) ?? new Date().toISOString(),
  endAt: toIsoString(row.endAt) ?? new Date().toISOString(),
  city: row.city,
  location: row.location,
  venue: row.venue,
  coverAssetId: row.coverAssetId,
  registrationMode: row.registrationMode,
  registrationUrl: row.registrationUrl ?? '',
  registrationNote: row.registrationNote ?? '',
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
  const rows = await db.select({ id: events.id }).from(events).where(eq(events.slug, slug)).limit(1);
  const existing = rows[0] ?? null;
  if (existing && existing.id !== currentId) {
    throw badRequest('event slug already exists', { field: 'slug' });
  }
};

export const listAdminEvents = async (): Promise<AdminEventListItem[]> => {
  const db = getDb();
  const rows = await db.select().from(events).orderBy(desc(events.startAt));
  return rows.map(mapEventListItem);
};

export const getAdminEvent = async (id: string) => {
  const db = getDb();
  const rows = await db.select().from(events).where(eq(events.id, id)).limit(1);
  const row = rows[0] ?? null;
  return row ? mapEventDetail(row) : null;
};

export const createAdminEvent = async (input: EventInput, actor: AuditActor) => {
  const db = getDb();
  await ensureUniqueSlug(input.slug);

  const [created] = await db
    .insert(events)
    .values({
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      bodyMarkdown: input.bodyMarkdown,
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      city: input.city,
      location: input.location,
      venue: input.venue,
      coverAssetId: input.coverAssetId,
      registrationMode: input.registrationMode,
      registrationUrl: input.registrationUrl,
      registrationNote: input.registrationNote,
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
    action: 'event.create',
    targetType: 'event',
    targetId: created.id,
    summary: `Created event ${created.title}`,
  });

  return mapEventDetail(created);
};

export const updateAdminEvent = async (id: string, input: EventInput, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminEvent(id);
  if (!current) {
    throw notFound('event not found');
  }

  await ensureUniqueSlug(input.slug, id);

  const [updated] = await db
    .update(events)
    .set({
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      bodyMarkdown: input.bodyMarkdown,
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      city: input.city,
      location: input.location,
      venue: input.venue,
      coverAssetId: input.coverAssetId,
      registrationMode: input.registrationMode,
      registrationUrl: input.registrationUrl,
      registrationNote: input.registrationNote,
      tagsJson: input.tags,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      status: input.status,
      publishedAt: ensurePublishedAt(input.status, input.publishedAt),
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'event.update',
    targetType: 'event',
    targetId: updated.id,
    summary: `Updated event ${updated.title}`,
  });

  return mapEventDetail(updated);
};

export const publishAdminEvent = async (id: string, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminEvent(id);
  if (!current) {
    throw notFound('event not found');
  }

  const [updated] = await db
    .update(events)
    .set({
      status: 'published',
      publishedAt: ensurePublishedAt('published', current.publishedAt),
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'event.publish',
    targetType: 'event',
    targetId: updated.id,
    summary: `Published event ${updated.title}`,
  });

  return mapEventDetail(updated);
};

export const archiveAdminEvent = async (id: string, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminEvent(id);
  if (!current) {
    throw notFound('event not found');
  }

  const [updated] = await db
    .update(events)
    .set({
      status: 'archived',
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id))
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'event.archive',
    targetType: 'event',
    targetId: updated.id,
    summary: `Archived event ${updated.title}`,
  });

  return mapEventDetail(updated);
};

export const listPublicEvents = async () => {
  const db = getDb();
  const rows = await db.select().from(events).where(eq(events.status, 'published')).orderBy(asc(events.startAt));
  const now = Date.now();

  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.bodyMarkdown,
    startAt: toIsoString(row.startAt),
    endAt: toIsoString(row.endAt),
    location: row.location,
    venue: row.venue,
    city: row.city,
    registrationUrl: row.registrationUrl ?? undefined,
    registrationNote: row.registrationNote ?? undefined,
    status: new Date(row.endAt).getTime() < now ? 'past' : 'upcoming',
    tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
    coverImageUrl: undefined,
  }));
};

export const getPublicEventBySlug = async (slug: string) => {
  const db = getDb();
  const rows = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  const row = rows[0] ?? null;
  if (!row || row.status !== 'published') {
    return null;
  }

  const now = Date.now();
  return {
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.bodyMarkdown,
    startAt: toIsoString(row.startAt),
    endAt: toIsoString(row.endAt),
    location: row.location,
    venue: row.venue,
    city: row.city,
    registrationUrl: row.registrationUrl ?? undefined,
    registrationNote: row.registrationNote ?? undefined,
    status: new Date(row.endAt).getTime() < now ? 'past' : 'upcoming',
    tags: Array.isArray(row.tagsJson) ? row.tagsJson : [],
    coverImageUrl: undefined,
  };
};
