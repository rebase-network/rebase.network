import { asc, desc, eq, inArray } from 'drizzle-orm';

import { contributorRoleBindings, contributorRoles, contributors } from '@rebase/db';
import type { AdminContributorDetailPayload, AdminContributorListItem, AdminContributorRoleRecord, ContributorInput, ContributorRoleInput } from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { getDb } from './db.js';
import { badRequest, notFound } from './errors.js';
import { toIsoString } from './utils.js';

const mapRoleRecord = (row: any): AdminContributorRoleRecord => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  sortOrder: row.sortOrder,
  status: row.status,
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
});

const contributorRoleMap = async () => {
  const db = getDb();
  const rows = await db.select().from(contributorRoles).orderBy(asc(contributorRoles.sortOrder), asc(contributorRoles.name));
  return new Map(rows.map((row) => [row.id, row]));
};

const contributorBindingsMap = async () => {
  const db = getDb();
  const rows = await db.select().from(contributorRoleBindings);
  const result = new Map<string, string[]>();

  for (const row of rows) {
    const current = result.get(row.contributorId) ?? [];
    current.push(row.contributorRoleId);
    result.set(row.contributorId, current);
  }

  return result;
};

const mapContributorDetail = (row: any, roleIds: string[]) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  headline: row.headline,
  bio: row.bio,
  avatarAssetId: row.avatarAssetId,
  avatarSeed: row.avatarSeed,
  twitterUrl: row.twitterUrl ?? '',
  wechat: row.wechat ?? '',
  telegram: row.telegram ?? '',
  sortOrder: row.sortOrder,
  roleIds,
  status: row.status,
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
});

const ensureUniqueRoleSlug = async (slug: string, currentId?: string) => {
  const db = getDb();
  const rows = await db.select({ id: contributorRoles.id }).from(contributorRoles).where(eq(contributorRoles.slug, slug)).limit(1);
  const existing = rows[0] ?? null;
  if (existing && existing.id !== currentId) {
    throw badRequest('contributor role slug already exists', { field: 'slug' });
  }
};

const ensureUniqueContributorSlug = async (slug: string, currentId?: string) => {
  const db = getDb();
  const rows = await db.select({ id: contributors.id }).from(contributors).where(eq(contributors.slug, slug)).limit(1);
  const existing = rows[0] ?? null;
  if (existing && existing.id !== currentId) {
    throw badRequest('contributor slug already exists', { field: 'slug' });
  }
};

const replaceContributorRoleBindings = async (contributorId: string, roleIds: string[]) => {
  const db = getDb();
  await db.delete(contributorRoleBindings).where(eq(contributorRoleBindings.contributorId, contributorId));

  if (roleIds.length > 0) {
    await db.insert(contributorRoleBindings).values(roleIds.map((roleId) => ({ contributorId, contributorRoleId: roleId })));
  }
};

export const listAdminContributorRoles = async (): Promise<AdminContributorRoleRecord[]> => {
  const db = getDb();
  const rows = await db.select().from(contributorRoles).orderBy(asc(contributorRoles.sortOrder), asc(contributorRoles.name));
  return rows.map(mapRoleRecord);
};

export const createAdminContributorRole = async (input: ContributorRoleInput, actor: AuditActor) => {
  const db = getDb();
  await ensureUniqueRoleSlug(input.slug);

  const [created] = await db
    .insert(contributorRoles)
    .values({
      slug: input.slug,
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder,
      status: input.status,
      updatedByStaffId: actor.actorStaffAccountId ?? null,
    })
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'contributor_role.create',
    targetType: 'contributor_role',
    targetId: created.id,
    summary: `Created contributor role ${created.name}`,
  });

  return mapRoleRecord(created);
};

export const updateAdminContributorRole = async (id: string, input: ContributorRoleInput, actor: AuditActor) => {
  const db = getDb();
  const rows = await db.select().from(contributorRoles).where(eq(contributorRoles.id, id)).limit(1);
  const current = rows[0] ?? null;
  if (!current) {
    throw notFound('contributor role not found');
  }

  await ensureUniqueRoleSlug(input.slug, id);

  const [updated] = await db
    .update(contributorRoles)
    .set({
      slug: input.slug,
      name: input.name,
      description: input.description,
      sortOrder: input.sortOrder,
      status: input.status,
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(contributorRoles.id, id))
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'contributor_role.update',
    targetType: 'contributor_role',
    targetId: updated.id,
    summary: `Updated contributor role ${updated.name}`,
  });

  return mapRoleRecord(updated);
};

export const listAdminContributors = async (): Promise<AdminContributorListItem[]> => {
  const db = getDb();
  const [rows, roleMap, bindings] = await Promise.all([
    db.select().from(contributors).orderBy(asc(contributors.sortOrder), desc(contributors.updatedAt)),
    contributorRoleMap(),
    contributorBindingsMap(),
  ]);

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    headline: row.headline,
    status: row.status,
    roleNames: (bindings.get(row.id) ?? []).map((roleId) => roleMap.get(roleId)?.name ?? '').filter(Boolean),
    sortOrder: row.sortOrder,
    updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
  }));
};

export const getAdminContributor = async (id: string): Promise<AdminContributorDetailPayload | null> => {
  const db = getDb();
  const [rows, roles, bindings] = await Promise.all([
    db.select().from(contributors).where(eq(contributors.id, id)).limit(1),
    listAdminContributorRoles(),
    contributorBindingsMap(),
  ]);
  const row = rows[0] ?? null;
  if (!row) {
    return null;
  }

  return {
    contributor: mapContributorDetail(row, bindings.get(row.id) ?? []),
    availableRoles: roles,
  };
};

export const createAdminContributor = async (input: ContributorInput, actor: AuditActor) => {
  const db = getDb();
  await ensureUniqueContributorSlug(input.slug);

  const [created] = await db
    .insert(contributors)
    .values({
      slug: input.slug,
      name: input.name,
      headline: input.headline,
      bio: input.bio,
      avatarAssetId: input.avatarAssetId,
      avatarSeed: input.avatarSeed,
      twitterUrl: input.twitterUrl,
      wechat: input.wechat,
      telegram: input.telegram,
      sortOrder: input.sortOrder,
      status: input.status,
      updatedByStaffId: actor.actorStaffAccountId ?? null,
    })
    .returning();

  await replaceContributorRoleBindings(created.id, input.roleIds);

  await createAuditEntry({
    ...actor,
    action: 'contributor.create',
    targetType: 'contributor',
    targetId: created.id,
    summary: `Created contributor ${created.name}`,
  });

  return getAdminContributor(created.id);
};

export const updateAdminContributor = async (id: string, input: ContributorInput, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminContributor(id);
  if (!current) {
    throw notFound('contributor not found');
  }

  await ensureUniqueContributorSlug(input.slug, id);

  await db
    .update(contributors)
    .set({
      slug: input.slug,
      name: input.name,
      headline: input.headline,
      bio: input.bio,
      avatarAssetId: input.avatarAssetId,
      avatarSeed: input.avatarSeed,
      twitterUrl: input.twitterUrl,
      wechat: input.wechat,
      telegram: input.telegram,
      sortOrder: input.sortOrder,
      status: input.status,
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(contributors.id, id));

  await replaceContributorRoleBindings(id, input.roleIds);

  await createAuditEntry({
    ...actor,
    action: 'contributor.update',
    targetType: 'contributor',
    targetId: id,
    summary: `Updated contributor ${input.name}`,
  });

  return getAdminContributor(id);
};

export const listPublicContributorGroups = async () => {
  const db = getDb();
  const [roleRows, contributorRows, bindings] = await Promise.all([
    db
      .select()
      .from(contributorRoles)
      .where(eq(contributorRoles.status, 'published'))
      .orderBy(asc(contributorRoles.sortOrder), asc(contributorRoles.name)),
    db
      .select()
      .from(contributors)
      .where(eq(contributors.status, 'published'))
      .orderBy(asc(contributors.sortOrder), asc(contributors.name)),
    contributorBindingsMap(),
  ]);

  const roleMap = new Map(roleRows.map((role) => [role.id, role]));
  const contributorsByRole = new Map<string, any[]>();

  for (const contributor of contributorRows) {
    for (const roleId of bindings.get(contributor.id) ?? []) {
      const current = contributorsByRole.get(roleId) ?? [];
      current.push({
        slug: contributor.slug,
        name: contributor.name,
        avatarUrl: undefined,
        avatarSeed: contributor.avatarSeed,
        headline: contributor.headline,
        bio: contributor.bio,
        roleSlugs: (bindings.get(contributor.id) ?? []).map((bindingRoleId) => roleMap.get(bindingRoleId)?.slug ?? '').filter(Boolean),
        twitterUrl: contributor.twitterUrl ?? undefined,
        wechat: contributor.wechat ?? undefined,
        telegram: contributor.telegram ?? undefined,
      });
      contributorsByRole.set(roleId, current);
    }
  }

  return roleRows.map((role) => ({
    role: {
      slug: role.slug,
      name: role.name,
      description: role.description,
    },
    contributors: contributorsByRole.get(role.id) ?? [],
  }));
};
