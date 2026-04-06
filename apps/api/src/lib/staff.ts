import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';

import { roles, staffAccounts, staffRoleBindings, users } from '@rebase/db';
import type { AdminRoleRecord, AdminStaffDetailPayload, AdminStaffRecord, PaginatedResult, StaffCreateInput, StaffUpdateInput } from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { getAuth } from './auth.js';
import { getDb } from './db.js';
import { badRequest, notFound } from './errors.js';
import { buildPaginatedMeta, resolvePagination, type PaginationInput } from './pagination.js';
import { toIsoString } from './utils.js';

const buildRoleMaps = async () => {
  const db = getDb();
  const roleRows = await db.select().from(roles).orderBy(asc(roles.name));
  return {
    roles: roleRows.map((row) => ({ id: row.id, code: row.code, name: row.name, description: row.description })),
    roleCodeById: new Map(roleRows.map((row) => [row.id, row.code])),
  };
};

const loadBindings = async (staffIds?: string[]) => {
  const db = getDb();
  const rows = staffIds?.length
    ? await db.select().from(staffRoleBindings).where(inArray(staffRoleBindings.staffAccountId, staffIds))
    : await db.select().from(staffRoleBindings);
  const result = new Map<string, string[]>();

  for (const row of rows) {
    const current = result.get(row.staffAccountId) ?? [];
    current.push(row.roleId);
    result.set(row.staffAccountId, current);
  }

  return result;
};

const mapStaffRecord = (user: any, staff: any, roleIds: string[], roleCodeById: Map<string, string>): AdminStaffRecord => ({
  id: staff.id,
  userId: user.id,
  email: user.email,
  name: user.name,
  displayName: staff.displayName,
  status: staff.status,
  roleIds,
  roleCodes: roleIds.map((roleId) => roleCodeById.get(roleId) ?? '').filter(Boolean),
  notes: staff.notes,
  lastLoginAt: toIsoString(staff.lastLoginAt),
  createdAt: toIsoString(staff.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(staff.updatedAt) ?? new Date().toISOString(),
});

const replaceBindings = async (staffAccountId: string, roleIds: string[]) => {
  const db = getDb();
  await db.delete(staffRoleBindings).where(eq(staffRoleBindings.staffAccountId, staffAccountId));
  if (roleIds.length > 0) {
    await db.insert(staffRoleBindings).values(roleIds.map((roleId) => ({ staffAccountId, roleId })));
  }
};

export const listAdminRoles = async (): Promise<AdminRoleRecord[]> => {
  const { roles } = await buildRoleMaps();
  return roles;
};

export const listAdminStaff = async (input: PaginationInput = {}): Promise<PaginatedResult<AdminStaffRecord>> => {
  const db = getDb();
  const [countRow, roleMeta] = await Promise.all([
    db.select({ value: count() }).from(staffAccounts),
    buildRoleMaps(),
  ]);

  const totalItems = countRow[0]?.value ?? 0;
  const pagination = resolvePagination(input, totalItems);
  const rows =
    totalItems === 0
      ? []
      : await db
          .select({
            user: users,
            staff: staffAccounts,
          })
          .from(staffAccounts)
          .innerJoin(users, eq(users.id, staffAccounts.userId))
          .orderBy(desc(staffAccounts.updatedAt), asc(staffAccounts.displayName))
          .limit(pagination.pageSize)
          .offset(pagination.offset);

  const bindings = await loadBindings(rows.map((row) => row.staff.id));

  return {
    items: rows.map((row) => mapStaffRecord(row.user, row.staff, bindings.get(row.staff.id) ?? [], roleMeta.roleCodeById)),
    meta: buildPaginatedMeta(pagination),
  };
};

export const getAdminStaff = async (id: string): Promise<AdminStaffDetailPayload | null> => {
  const db = getDb();
  const [roleMeta, bindings, rows] = await Promise.all([
    buildRoleMaps(),
    loadBindings([id]),
    db
      .select({
        user: users,
        staff: staffAccounts,
      })
      .from(staffAccounts)
      .innerJoin(users, eq(users.id, staffAccounts.userId))
      .where(eq(staffAccounts.id, id))
      .limit(1),
  ]);

  const row = rows[0] ?? null;
  if (!row) {
    return null;
  }

  return {
    staff: mapStaffRecord(row.user, row.staff, bindings.get(row.staff.id) ?? [], roleMeta.roleCodeById),
    roles: roleMeta.roles,
  };
};

export const createAdminStaff = async (input: StaffCreateInput, actor: AuditActor) => {
  const db = getDb();
  const auth = getAuth();
  if (!auth) {
    throw badRequest('authentication is not configured');
  }

  const existingUsers = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
  if (existingUsers[0]) {
    throw badRequest('staff email already exists', { field: 'email' });
  }

  await auth.api.signUpEmail({
    body: {
      email: input.email,
      password: input.password,
      name: input.name,
    },
  });

  const user = (await db.select().from(users).where(eq(users.email, input.email)).limit(1))[0] ?? null;
  if (!user) {
    throw badRequest('failed to create staff user');
  }

  const [created] = await db
    .insert(staffAccounts)
    .values({
      userId: user.id,
      status: 'active',
      displayName: input.displayName,
      notes: input.notes,
      invitedByStaffId: actor.actorStaffAccountId ?? null,
      invitedAt: new Date(),
      activatedAt: new Date(),
    })
    .returning();

  await replaceBindings(created.id, input.roleIds);

  await createAuditEntry({
    ...actor,
    action: 'staff.create',
    targetType: 'staff_account',
    targetId: created.id,
    summary: `Created staff account ${input.email}`,
  });

  return getAdminStaff(created.id);
};

export const updateAdminStaff = async (id: string, input: StaffUpdateInput, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminStaff(id);
  if (!current) {
    throw notFound('staff account not found');
  }

  await db
    .update(staffAccounts)
    .set({
      displayName: input.displayName,
      status: input.status,
      notes: input.notes,
      updatedAt: new Date(),
    })
    .where(eq(staffAccounts.id, id));

  await replaceBindings(id, input.roleIds);

  await createAuditEntry({
    ...actor,
    action: 'staff.update',
    targetType: 'staff_account',
    targetId: id,
    summary: `Updated staff account ${current.staff.email}`,
  });

  return getAdminStaff(id);
};
