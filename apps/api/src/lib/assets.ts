import { and, desc, eq, inArray } from 'drizzle-orm';

import { assets } from '@rebase/db';
import type { AdminAssetRecord, AssetInput } from '@rebase/shared';

import { getAssetUploadConfig, type UploadAssetOptions, uploadAssetToR2 } from './asset-storage.js';
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
  checksum: row.checksum,
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

export const listPublicAssetUrlsById = async (assetIds: Array<string | null | undefined>) => {
  const db = getDb();
  const ids = [...new Set(assetIds.filter((value): value is string => Boolean(value)))];

  if (ids.length === 0) {
    return new Map<string, string>();
  }

  const rows = await db
    .select({
      id: assets.id,
      publicUrl: assets.publicUrl,
    })
    .from(assets)
    .where(and(inArray(assets.id, ids), eq(assets.visibility, 'public'), eq(assets.status, 'active')));

  return new Map(
    rows
      .filter((row) => typeof row.publicUrl === 'string' && row.publicUrl.length > 0)
      .map((row) => [row.id, row.publicUrl as string]),
  );
};

export const getAdminAsset = async (id: string) => {
  const db = getDb();
  const rows = await db.select().from(assets).where(eq(assets.id, id)).limit(1);
  const row = rows[0] ?? null;
  return row ? mapAsset(row) : null;
};

export const getAdminAssetUploadConfig = async () => getAssetUploadConfig();

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

export const uploadAdminAsset = async (input: UploadAssetOptions, actor: AuditActor) => {
  const db = getDb();
  const uploaded = await uploadAssetToR2(input);
  await ensureUniqueObjectKey(uploaded.objectKey);

  const [created] = await db
    .insert(assets)
    .values({
      storageProvider: uploaded.storageProvider,
      bucket: uploaded.bucket,
      objectKey: uploaded.objectKey,
      publicUrl: uploaded.publicUrl,
      visibility: uploaded.visibility,
      assetType: uploaded.assetType,
      mimeType: uploaded.mimeType,
      byteSize: uploaded.byteSize,
      width: uploaded.width,
      height: uploaded.height,
      checksum: uploaded.checksum,
      originalFilename: uploaded.originalFilename,
      altText: uploaded.altText || null,
      uploadedByStaffId: actor.actorStaffAccountId ?? null,
      status: uploaded.status,
    })
    .returning();

  await createAuditEntry({
    ...actor,
    action: 'asset.upload',
    targetType: 'asset',
    targetId: created.id,
    summary: `Uploaded asset ${created.objectKey}`,
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
