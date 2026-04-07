import { getAdminApiBaseUrl } from './runtime-config';

interface AuthClientError {
  message: string;
  status?: number;
  statusText?: string;
}

interface AuthClientResponse<T> {
  data: T | null;
  error: AuthClientError | null;
}

interface SessionPayload {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  };
}

const parseAuthPayload = async <T>(response: Response): Promise<AuthClientResponse<T>> => {
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T | { message?: string; error?: { message?: string } }) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload && payload.error?.message) ||
      (payload && typeof payload === 'object' && 'message' in payload && payload.message) ||
      response.statusText ||
      'request failed';

    return {
      data: null,
      error: {
        message,
        status: response.status,
        statusText: response.statusText,
      },
    };
  }

  return {
    data: (payload as T | null) ?? null,
    error: null,
  };
};

const authRequest = async <T>(path: string, init?: RequestInit): Promise<AuthClientResponse<T>> => {
  const response = await fetch(new URL(path, getAdminApiBaseUrl()), {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  return parseAuthPayload<T>(response);
};

export const authClient = {
  getSession: () => authRequest<SessionPayload>('/api/auth/get-session'),
  signOut: () => authRequest<null>('/api/auth/sign-out', { method: 'POST' }),
  signIn: {
    email: (payload: { email: string; password: string }) =>
      authRequest<SessionPayload>('/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },
};
