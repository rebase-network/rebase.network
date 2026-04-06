import { desc, eq } from 'drizzle-orm';

import { assets } from '@rebase/db';
import type { AdminAssetRecord, AssetInput } from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { getDb } from './db.js';
import { badRequest, notFound } from './errors.js';
import { toIsoString } from './utils.js';

const mapAsset = (row: any): AdminAssetRecord => ({
  id: row.id,
  storageProvider: row.storageProvider,
  bucket: row.bucket,
  objectKey: row.objectKey,
  publicUrl: row.publicUrl,
  visibility: row.visibility,
  assetType: row.assetType,
  mimeType: row.mimeType,
  byteSize: row.byteSize,
  width: row.width,
  height: row.height,
  originalFilename: row.originalFilename,
  altText: row.altText,
  status: row.status,
  createdAt: toIsoString(row.createdAt) ?? new Date().toISOString(),
  updatedAt: toIsoString(row.updatedAt) ?? new Date().toISOString(),
});

const ensureUniqueObjectKey = async (objectKey: string, currentId?: string) => {
  const db = getDb();
  const rows = await db.select({ id: assets.id }).from(assets).where(eq(assets.objectKey, objectKey)).limit(1);
  const existing = rows[0] ?? null;
  if (existing && existing.id !== currentId) {
    throw badRequest('asset object key already exists', { field: 'objectKey' });
  }
};

export const listAdminAssets = async (): Promise<AdminAssetRecord[]> => {
  const db = getDb();
  const rows = await db.select().from(assets).orderBy(desc(assets.updatedAt));
  return rows.map(mapAsset);
};

export const getAdminAsset = async (id: string) => {
  const db = getDb();
  const rows = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
  const row = rows[0] ?? null;
  return row ? mapAsset(row) : null;
};

export const createAdminAsset = async (input: AssetInput, actor: AuditActor) => {
  const db = getDb();
  await ensureUniqueObjectKey(input.objectKey);

  const [created] = await db
    .insert(assets)
    .values({
      storageProvider: input.storageProvider,
      bucket: input.bucket,
      objectKey: input.objectKey,
      publicUrl: input.publicUrl || null,
      visibility: input.visibility,
      assetType: input.assetType,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      width: input.width,
      height: input.height,
      checksum: input.checksum || null,
      originalFilename: input.originalFilename,
      altText: input.altText || null,
      uploadedByStaffId: actor.actorStaffAccountId ?? null,
      status: input.status,
    })
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'asset.create',
    targetType: 'asset',
    targetId: created.id,
    summary: `Created asset ${created.objectKey}`,
  });

  return mapAsset(created);
};

export const updateAdminAsset = async (id: string, input: AssetInput, actor: AuditActor) => {
  const db = getDb();
  const current = await getAdminAsset(id);
  if (!current) {
    throw notFound('asset not found');
  }

  await ensureUniqueObjectKey(input.objectKey, id);

  const [updated] = await db
    .update(assets)
    .set({
      storageProvider: input.storageProvider,
      bucket: input.bucket,
      objectKey: input.objectKey,
      publicUrl: input.publicUrl || null,
      visibility: input.visibility,
      assetType: input.assetType,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      width: input.width,
      height: input.height,
      checksum: input.checksum || null,
      originalFilename: input.originalFilename,
      altText: input.altText || null,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(assets.id, id))
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'asset.update',
    targetType: 'asset',
    targetId: updated.id,
    summary: `Updated asset ${updated.objectKey}`,
  });

  return mapAsset(updated);
};
