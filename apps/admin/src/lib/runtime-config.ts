type ImportMetaEnvWithApiBase = ImportMeta & {
  env?: {
    VITE_API_BASE_URL?: string;
  };
};

const isLocalHostname = (value: string) => value === 'localhost' || value === '127.0.0.1';

const normalizeLocalApiHostname = (baseUrl: string) => {
  if (typeof window === 'undefined') {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    const currentHostname = window.location.hostname;

    if (isLocalHostname(url.hostname) && isLocalHostname(currentHostname) && url.hostname !== currentHostname) {
      url.hostname = currentHostname;
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    return baseUrl;
  }
};

export const getAdminApiBaseUrl = () =>
  normalizeLocalApiHostname(
    (import.meta as ImportMetaEnvWithApiBase).env?.VITE_API_BASE_URL ??
      (typeof process !== 'undefined' ? process.env.VITE_API_BASE_URL : undefined) ??
      'http://127.0.0.1:8788',
  );
