import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { ok } from '@rebase/shared';

import { ApiError } from './errors.js';

export const jsonError = (
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) =>
  c.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    status,
  );

export const handleApiError = (c: Context, error: unknown) => {
  if (error instanceof ApiError) {
    return jsonError(c, error.status as ContentfulStatusCode, error.code, error.message, error.details);
  }

  throw error;
};

export { ok };
