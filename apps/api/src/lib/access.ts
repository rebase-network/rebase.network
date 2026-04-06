import { count, eq } from 'drizzle-orm';

import {
  articles,
  auditLogs,
  assets,
  contributorRoles,
  contributors,
  events,
  geekdailyEpisodes,
  jobs,
  permissions,
  rolePermissionBindings,
  roles,
  staffAccounts,
  staffRoleBindings,
  users,
} from '@rebase/db';
import type { AdminDashboardStats, StaffAccountStatus } from '@rebase/shared';

import { getDb } from './db.js';

export interface StaffAccess {
  staffAccount: {
    id: string;
    userId: string;
    status: StaffAccountStatus;
    displayName: string;
  } | null;
  roles: string[];
  permissions: string[];
}

export const getStaffAccess = async (userId: string): Promise<StaffAccess> => {
  const db = getDb();

  const rows = await db
    .select({
      staffAccountId: staffAccounts.id,
      staffUserId: staffAccounts.userId,
      staffStatus: staffAccounts.status,
      staffDisplayName: staffAccounts.displayName,
      roleCode: roles.code,
      permissionCode: permissions.code,
    })
    .from(staffAccounts)
    .leftJoin(staffRoleBindings, eq(staffRoleBindings.staffAccountId, staffAccounts.id))
    .leftJoin(roles, eq(roles.id, staffRoleBindings.roleId))
    .leftJoin(rolePermissionBindings, eq(rolePermissionBindings.roleId, roles.id))
    .leftJoin(permissions, eq(permissions.id, rolePermissionBindings.permissionId))
    .where(eq(staffAccounts.userId, userId));

  if (rows.length === 0) {
    return {
      staffAccount: null,
      roles: [],
      permissions: [],
    };
  }

  const [first] = rows;

  return {
    staffAccount: {
      id: first.staffAccountId,
      userId: first.staffUserId,
      status: first.staffStatus,
      displayName: first.staffDisplayName,
    },
    roles: [...new Set(rows.map((row) => row.roleCode).filter((value): value is string => Boolean(value)))],
    permissions: [...new Set(rows.map((row) => row.permissionCode).filter((value): value is string => Boolean(value)))],
  };
};

export const getDashboardStats = async (): Promise<AdminDashboardStats> => {
  const db = getDb();

  const [articleCount] = await db.select({ value: count() }).from(articles);
  const [jobCount] = await db.select({ value: count() }).from(jobs);
  const [eventCount] = await db.select({ value: count() }).from(events);
  const [contributorCount] = await db.select({ value: count() }).from(contributors);
  const [contributorRoleCount] = await db.select({ value: count() }).from(contributorRoles);
  const [geekdailyCount] = await db.select({ value: count() }).from(geekdailyEpisodes);
  const [assetCount] = await db.select({ value: count() }).from(assets);
  const [auditCount] = await db.select({ value: count() }).from(auditLogs);
  const [staffCount] = await db.select({ value: count() }).from(staffAccounts);

  return {
    articles: articleCount?.value ?? 0,
    jobs: jobCount?.value ?? 0,
    events: eventCount?.value ?? 0,
    contributors: contributorCount?.value ?? 0,
    contributorRoles: contributorRoleCount?.value ?? 0,
    geekdailyEpisodes: geekdailyCount?.value ?? 0,
    assets: assetCount?.value ?? 0,
    staff: staffCount?.value ?? 0,
    auditLogs: auditCount?.value ?? 0,
  };
};

export const findUserByEmail = async (email: string) => {
  const db = getDb();
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
};
