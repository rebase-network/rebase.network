import type { ApiErrorShape, ApiSuccess } from '@rebase/shared';

import { getAdminApiBaseUrl } from './runtime-config';

export class AdminApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: FormData | string | Record<string, unknown> | Array<unknown> | null;
}

interface ApiSuccessResponse<T, M = Record<string, unknown>> {
  data: T;
  meta?: M;
}

const parseResponse = async <T, M = Record<string, unknown>>(response: Response): Promise<ApiSuccessResponse<T, M>> => {
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiSuccess<T, M> | ApiErrorShape) : null;

  if (!response.ok || (payload && 'error' in payload)) {
    const message = payload && 'error' in payload ? payload.error.message : `request failed with status ${response.status}`;
    const code = payload && 'error' in payload ? payload.error.code : undefined;
    const details = payload && 'error' in payload ? payload.error.details : undefined;
    throw new AdminApiError(message, response.status, code, details);
  }

  if (!payload || !('data' in payload)) {
    throw new AdminApiError('response payload is missing the data field', response.status);
  }

  return {
    data: payload.data,
    meta: payload.meta,
  };
};

const request = async <T, M = Record<string, unknown>>(path: string, options: RequestOptions = {}) => {
  const isFormData = options.body instanceof FormData;
  let body: BodyInit | undefined;

  if (options.body !== undefined && options.body !== null) {
    if (options.body instanceof FormData || typeof options.body === 'string') {
      body = options.body as BodyInit;
    } else {
      body = JSON.stringify(options.body);
    }
  }
  const response = await fetch(new URL(path, getAdminApiBaseUrl()), {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body } : {}),
  });

  return parseResponse<T, M>(response);
};

export const adminFetch = async <T>(path: string) => (await request<T>(path)).data;

export const adminRequest = async <T>(path: string, options: RequestOptions = {}) => (await request<T>(path, options)).data;

export const adminFetchWithMeta = async <T, M = Record<string, unknown>>(path: string) => request<T, M>(path);

export const getValidationIssues = (error: unknown) => {
  if (!(error instanceof AdminApiError)) {
    return {} as Record<string, string>;
  }

  const issues = (error.details as { issues?: Array<{ path?: string; message?: string }> } | undefined)?.issues;
  if (!Array.isArray(issues)) {
    return {} as Record<string, string>;
  }

  return Object.fromEntries(
    issues
      .filter((issue) => typeof issue.path === 'string' && typeof issue.message === 'string')
      .map((issue) => [issue.path ?? '', issue.message ?? '']),
  );
};
