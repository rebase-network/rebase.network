import { desc } from 'drizzle-orm';

export const toIsoString = (value: Date | string | null | undefined) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
};

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const ensurePublishedAt = (status: string, value?: string | null) => {
  if (status !== 'published') {
    return value ? new Date(value) : null;
  }

  return value ? new Date(value) : new Date();
};

export const parsePublicNumber = (value: number | string | null | undefined) => {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value > 0 ? value : null;
  }

  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

export const latestFirst = <T extends { updatedAt: Date | string }>(field: T['updatedAt']) => desc(field as never);
