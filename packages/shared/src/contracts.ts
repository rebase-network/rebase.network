export interface ApiSuccess<T, M = Record<string, unknown>> {
  data: T;
  meta?: M;
}

export const defaultAdminPageSize = 20;
export const maxAdminPageSize = 200;

export interface PaginatedMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  totalAllItems?: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginatedMeta;
}

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export function ok<T, M = Record<string, unknown>>(data: T, meta?: M): ApiSuccess<T, M> {
  return meta ? { data, meta } : { data };
}
