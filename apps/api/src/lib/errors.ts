export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (message: string, details?: Record<string, unknown>) =>
  new ApiError(404, 'NOT_FOUND', message, details);

export const badRequest = (message: string, details?: Record<string, unknown>) =>
  new ApiError(400, 'BAD_REQUEST', message, details);

export const forbidden = (message: string, details?: Record<string, unknown>) =>
  new ApiError(403, 'FORBIDDEN', message, details);
