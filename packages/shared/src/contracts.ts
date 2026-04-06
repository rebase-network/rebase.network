export interface ApiSuccess<T, M = Record<string, unknown>> {
  data: T;
  meta?: M;
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
