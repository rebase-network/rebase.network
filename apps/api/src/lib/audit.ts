import { count, desc, eq, ilike, or } from 'drizzle-orm';

import { auditLogs, staffAccounts, users } from '@rebase/db';
import type { AdminAuditRecord, PaginatedResult } from '@rebase/shared';

import { getDb } from './db.js';
import { buildPaginatedMeta, resolvePagination, type PaginationInput } from './pagination.js';
import { toContainsPattern } from './query-filters.js';
import { toIsoString } from './utils.js';

export interface AuditActor {
  actorUserId: string | null;
  actorStaffAccountId: string | null;
  requestId?: string | null;
  requestIp?: string | null;
  userAgent?: string | null;
}

export interface AuditEntryInput extends AuditActor {
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
  payloadJson?: Record<string, unknown> | null;
}

export const createAuditEntry = async (input: AuditEntryInput) => {
  const db = getDb();

  await db.insert(auditLogs).values({
    actorUserId: input.actorUserId,
    actorStaffAccountId: input.actorStaffAccountId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    summary: input.summary,
    payloadJson: input.payloadJson ?? null,
    requestId: input.requestId ?? null,
    requestIp: input.requestIp ?? null,
    userAgent: input.userAgent ?? null,
  });
};

interface ListAuditEntriesInput extends PaginationInput {
  query?: string;
}

export const listAuditEntries = async (input: ListAuditEntriesInput = {}): Promise<PaginatedResult<AdminAuditRecord>> => {
  const db = getDb();
  const normalizedQuery = input.query?.trim() ?? '';
  const where = normalizedQuery
    ? or(
        ilike(auditLogs.action, toContainsPattern(normalizedQuery)),
        ilike(auditLogs.targetType, toContainsPattern(normalizedQuery)),
        ilike(auditLogs.summary, toContainsPattern(normalizedQuery)),
        ilike(staffAccounts.displayName, toContainsPattern(normalizedQuery)),
        ilike(users.email, toContainsPattern(normalizedQuery)),
      )
    : undefined;

  const [countRow, totalAllRow] = await Promise.all([
    db
      .select({ value: count() })
      .from(auditLogs)
      .leftJoin(staffAccounts, eq(staffAccounts.id, auditLogs.actorStaffAccountId))
      .leftJoin(users, eq(users.id, auditLogs.actorUserId))
      .where(where),
    normalizedQuery ? db.select({ value: count() }).from(auditLogs) : Promise.resolve([{ value: 0 }]),
  ]);

  const totalItems = countRow[0]?.value ?? 0;
  const pagination = resolvePagination(input, totalItems);

  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      summary: auditLogs.summary,
      createdAt: auditLogs.createdAt,
      actorDisplayName: staffAccounts.displayName,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(staffAccounts, eq(staffAccounts.id, auditLogs.actorStaffAccountId))
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(where)
    .orderBy(desc(auditLogs.createdAt))
    .limit(pagination.pageSize)
    .offset(pagination.offset);

  return {
    items: rows.map((row) => ({
      id: row.id,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      summary: row.summary,
      actorDisplayName: row.actorDisplayName,
      actorEmail: row.actorEmail,
      createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
    })),
    meta: buildPaginatedMeta(pagination, normalizedQuery ? totalAllRow[0]?.value ?? totalItems : totalItems),
  };
};
