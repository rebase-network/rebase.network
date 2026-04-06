import { desc, eq } from 'drizzle-orm';

import { auditLogs, staffAccounts, users } from '@rebase/db';
import type { AdminAuditRecord } from '@rebase/shared';

import { getDb } from './db.js';
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

export const listAuditEntries = async (): Promise<AdminAuditRecord[]> => {
  const db = getDb();

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
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    summary: row.summary,
    actorDisplayName: row.actorDisplayName,
    actorEmail: row.actorEmail,
    createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  }));
};
