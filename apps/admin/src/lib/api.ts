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

const adminMessageTranslations = new Map<string, string>([
  ['one or more fields failed validation', '有字段校验未通过，请检查标红项。'],
  ['response payload is missing the data field', '响应数据缺少 data 字段。'],
  ['article not found', '未找到文章。'],
  ['event not found', '未找到活动。'],
  ['job not found', '未找到招聘信息。'],
]);

const localizeAdminMessage = (message: string) => {
  const translatedMessage = adminMessageTranslations.get(message);

  if (translatedMessage) {
    return translatedMessage;
  }

  const statusMatch = message.match(/^request failed with status (\d+)$/);
  if (statusMatch) {
    return `请求失败（状态码 ${statusMatch[1]}）。`;
  }

  return message;
};

const parseResponse = async <T, M = Record<string, unknown>>(response: Response): Promise<ApiSuccessResponse<T, M>> => {
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiSuccess<T, M> | ApiErrorShape) : null;

  if (!response.ok || (payload && 'error' in payload)) {
    const message = payload && 'error' in payload
      ? localizeAdminMessage(payload.error.message)
      : localizeAdminMessage(`request failed with status ${response.status}`);
    const code = payload && 'error' in payload ? payload.error.code : undefined;
    const details = payload && 'error' in payload ? payload.error.details : undefined;
    throw new AdminApiError(message, response.status, code, details);
  }

  if (!payload || !('data' in payload)) {
    throw new AdminApiError(localizeAdminMessage('response payload is missing the data field'), response.status);
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
      .map((issue) => [issue.path ?? '', localizeAdminMessage(issue.message ?? '')]),
  );
};
