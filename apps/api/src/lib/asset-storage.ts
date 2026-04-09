import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { promisify } from 'node:util';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { AdminAssetUploadConfig } from '@rebase/shared';
import { imageSize } from 'image-size';

import { getEnv } from './env.js';
import { badRequest, serviceUnavailable } from './errors.js';
import { slugify } from './utils.js';

const execFileAsync = promisify(execFile);
const wranglerDevUrlCache = new Map<string, string>();

let s3Client: S3Client | null = null;

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/$/, '');

const detectStorageMode = (): AdminAssetUploadConfig['mode'] => {
  const env = getEnv();

  if (env.r2AccountId && env.r2AccessKeyId && env.r2SecretAccessKey && env.r2Bucket) {
    return 'r2-s3';
  }

  if (env.r2DevUseWrangler && env.r2AccountId && env.r2Bucket) {
    return 'wrangler-cli';
  }

  return 'disabled';
};

const buildMessage = (mode: AdminAssetUploadConfig['mode']) => {
  if (mode === 'r2-s3') {
    return 'R2 upload is configured with the S3-compatible API.';
  }

  if (mode === 'wrangler-cli') {
    return 'R2 upload is using Wrangler for local development.';
  }

  return 'Set R2_BUCKET plus either S3 credentials or R2_DEV_USE_WRANGLER=true to enable uploads.';
};

const ensureImageDimensions = (buffer: Buffer, mimeType: string) => {
  if (!mimeType.startsWith('image/')) {
    return { width: null, height: null };
  }

  try {
    const dimensions = imageSize(buffer);
    return {
      width: dimensions.width ?? null,
      height: dimensions.height ?? null,
    };
  } catch {
    return { width: null, height: null };
  }
};

const extensionFromMimeType = (mimeType: string) => {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/svg+xml':
      return 'svg';
    case 'application/pdf':
      return 'pdf';
    case 'video/mp4':
      return 'mp4';
    case 'text/plain':
      return 'txt';
    default:
      return 'bin';
  }
};

const normalizeExtension = (filename: string, mimeType: string) => {
  const rawExtension = extname(filename).replace(/^\./, '').toLowerCase();
  return rawExtension || extensionFromMimeType(mimeType);
};

const sanitizeFolder = (value: string | null | undefined) => {
  const cleaned = String(value ?? '')
    .split('/')
    .map((segment) => slugify(segment))
    .filter(Boolean)
    .join('/');

  return cleaned || 'uploads';
};

const classifyAssetType = (mimeType: string, providedType: string | null | undefined) => {
  const normalized = String(providedType ?? '').trim().toLowerCase();
  if (normalized) {
    return normalized;
  }

  if (mimeType.startsWith('image/')) {
    return 'image';
  }

  if (mimeType.startsWith('video/')) {
    return 'video';
  }

  if (mimeType === 'application/pdf') {
    return 'document';
  }

  return 'file';
};

const buildObjectKey = (filename: string, mimeType: string, folder: string) => {
  const extension = normalizeExtension(filename, mimeType);
  const basename = filename.replace(/\.[^.]+$/, '');
  const slug = slugify(basename) || 'asset';
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${folder}/${year}/${month}/${slug}-${randomUUID().slice(0, 8)}.${extension}`;
};

const getS3Client = () => {
  if (s3Client) {
    return s3Client;
  }

  const env = getEnv();
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.r2AccessKeyId,
      secretAccessKey: env.r2SecretAccessKey,
    },
  });
  return s3Client;
};

const findWorkspaceBinary = (binaryName: string) => {
  let currentDir = process.cwd();

  while (true) {
    const candidate = join(currentDir, 'node_modules', '.bin', binaryName);
    if (existsSync(candidate)) {
      return candidate;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  return binaryName;
};

const getWranglerExecutable = () => {
  const configured = process.env.WRANGLER_BIN?.trim();
  if (configured) {
    return configured;
  }

  return findWorkspaceBinary('wrangler');
};

const toTrimmedOutput = (value: unknown) => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }

  return normalized.slice(0, 400);
};

const runWrangler = async (args: string[]) => {
  const env = getEnv();
  const executable = getWranglerExecutable();

  try {
    return await execFileAsync(executable, args, {
      env: {
        ...process.env,
        CLOUDFLARE_ACCOUNT_ID: env.r2AccountId,
      },
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      throw serviceUnavailable('Wrangler CLI is not available for R2 uploads', {
        hint: 'set WRANGLER_BIN or expose node_modules/.bin on PATH',
        executable,
      });
    }

    const details: Record<string, unknown> = {
      hint: 'check the mounted Wrangler profile, CLI login state, and bucket permissions',
      executable,
      reason: error instanceof Error ? error.message : String(error),
    };
    const stderr = typeof error === 'object' && error !== null && 'stderr' in error ? toTrimmedOutput(error.stderr) : undefined;
    const stdout = typeof error === 'object' && error !== null && 'stdout' in error ? toTrimmedOutput(error.stdout) : undefined;
    if (stderr) {
      details.stderr = stderr;
    }
    if (stdout) {
      details.stdout = stdout;
    }

    throw serviceUnavailable('Wrangler CLI failed while accessing R2', {
      ...details,
    });
  }
};

const getWranglerPublicBaseUrl = async (bucket: string) => {
  const cached = wranglerDevUrlCache.get(bucket);
  if (cached) {
    return cached;
  }

  const result = await runWrangler(['r2', 'bucket', 'dev-url', 'get', bucket]);

  const output = `${result.stdout}\n${result.stderr}`;
  const match = output.match(/https:\/\/[^\s]+/);
  if (!match) {
    throw serviceUnavailable('unable to determine the R2 public URL', {
      hint: 'set R2_PUBLIC_BASE_URL or enable the bucket r2.dev URL',
    });
  }

  const baseUrl = normalizeBaseUrl(match[0]);
  wranglerDevUrlCache.set(bucket, baseUrl);
  return baseUrl;
};

const getPublicBaseUrl = async () => {
  const env = getEnv();
  if (env.r2PublicBaseUrl) {
    return normalizeBaseUrl(env.r2PublicBaseUrl);
  }

  if (detectStorageMode() === 'wrangler-cli') {
    return getWranglerPublicBaseUrl(env.r2Bucket);
  }

  throw serviceUnavailable('R2 uploads require a public base URL', {
    hint: 'set R2_PUBLIC_BASE_URL to your r2.dev URL or custom media domain',
  });
};

const uploadWithS3 = async (objectKey: string, body: Buffer, mimeType: string) => {
  const env = getEnv();
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: env.r2Bucket,
      Key: objectKey,
      Body: body,
      ContentType: mimeType,
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
};

const uploadWithWrangler = async (objectKey: string, body: Buffer, mimeType: string) => {
  const env = getEnv();
  const tempDir = await mkdtemp(join(tmpdir(), 'rebase-r2-'));
  const tempFile = join(tempDir, 'upload.bin');

  try {
    await writeFile(tempFile, body);
    await runWrangler(['r2', 'object', 'put', `${env.r2Bucket}/${objectKey}`, '--remote', '--file', tempFile, '--content-type', mimeType]);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
};

export const getAssetUploadConfig = (): AdminAssetUploadConfig => {
  const env = getEnv();
  const mode = detectStorageMode();
  return {
    enabled: mode !== 'disabled',
    mode,
    storageProvider: 'r2',
    bucket: env.r2Bucket,
    publicBaseUrl: env.r2PublicBaseUrl ? normalizeBaseUrl(env.r2PublicBaseUrl) : null,
    message: buildMessage(mode),
  };
};

export interface UploadedAssetPayload {
  storageProvider: string;
  bucket: string;
  objectKey: string;
  publicUrl: string;
  visibility: 'public' | 'private';
  assetType: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  checksum: string;
  originalFilename: string;
  altText: string;
  status: 'active';
}

export interface UploadAssetOptions {
  file: File;
  folder?: string | null;
  visibility?: 'public' | 'private';
  altText?: string | null;
  assetType?: string | null;
}

export const uploadAssetToR2 = async ({
  file,
  folder,
  visibility = 'public',
  altText,
  assetType,
}: UploadAssetOptions): Promise<UploadedAssetPayload> => {
  const env = getEnv();
  const mode = detectStorageMode();

  if (mode === 'disabled') {
    throw serviceUnavailable('R2 upload is not configured');
  }

  if (!(file instanceof File)) {
    throw badRequest('file is required');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength === 0) {
    throw badRequest('file is empty');
  }

  const mimeType = file.type || 'application/octet-stream';
  const originalFilename = file.name || `upload-${Date.now()}`;
  const normalizedFolder = sanitizeFolder(folder);
  const objectKey = buildObjectKey(originalFilename, mimeType, normalizedFolder);
  const checksum = createHash('sha256').update(buffer).digest('hex');
  const dimensions = ensureImageDimensions(buffer, mimeType);
  const normalizedAssetType = classifyAssetType(mimeType, assetType);

  if (mode === 'r2-s3') {
    await uploadWithS3(objectKey, buffer, mimeType);
  } else if (mode === 'wrangler-cli') {
    await uploadWithWrangler(objectKey, buffer, mimeType);
  }

  const publicBaseUrl = await getPublicBaseUrl();

  return {
    storageProvider: 'r2',
    bucket: env.r2Bucket,
    objectKey,
    publicUrl: `${publicBaseUrl}/${objectKey}`,
    visibility,
    assetType: normalizedAssetType,
    mimeType,
    byteSize: buffer.byteLength,
    width: dimensions.width,
    height: dimensions.height,
    checksum,
    originalFilename,
    altText: String(altText ?? '').trim(),
    status: 'active',
  };
};
