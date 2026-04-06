import { defaultAdminPageSize, maxAdminPageSize, type PaginatedMeta } from '@rebase/shared';

export interface PaginationInput {
  page?: number;
  pageSize?: number;
}

export interface ResolvedPagination extends Required<PaginationInput> {
  offset: number;
  totalItems: number;
  totalPages: number;
}

const normalizePositiveInteger = (value: number | undefined, fallback: number) => {
  if (!Number.isFinite(value) || !value || value < 1) {
    return fallback;
  }

  return Math.floor(value);
};

export const readPaginationInput = (values: { page?: string; pageSize?: string }): PaginationInput => ({
  page: Number.parseInt(values.page ?? '', 10),
  pageSize: Number.parseInt(values.pageSize ?? '', 10),
});

export const resolvePagination = (input: PaginationInput, totalItems: number): ResolvedPagination => {
  const requestedPageSize = normalizePositiveInteger(input.pageSize, defaultAdminPageSize);
  const pageSize = Math.min(requestedPageSize, maxAdminPageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = totalItems === 0 ? 1 : Math.min(normalizePositiveInteger(input.page, 1), totalPages);

  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    offset: (page - 1) * pageSize,
  };
};

export const buildPaginatedMeta = (pagination: ResolvedPagination, totalAllItems = pagination.totalItems): PaginatedMeta => ({
  page: pagination.page,
  pageSize: pagination.pageSize,
  totalItems: pagination.totalItems,
  totalPages: pagination.totalPages,
  totalAllItems,
  hasPrevPage: pagination.page > 1,
  hasNextPage: pagination.page < pagination.totalPages,
});
