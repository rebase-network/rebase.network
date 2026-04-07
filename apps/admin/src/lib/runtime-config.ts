type ImportMetaEnvWithApiBase = ImportMeta & {
  env?: {
    VITE_API_BASE_URL?: string;
    VITE_PUBLIC_SITE_BASE_URL?: string;
  };
};

const isLocalHostname = (value: string) => value === 'localhost' || value === '127.0.0.1';

const getDefaultPublicSiteBaseUrl = () => {
  if (typeof window !== 'undefined' && isLocalHostname(window.location.hostname)) {
    return `${window.location.protocol}//${window.location.hostname}:4321`;
  }

  return 'https://rebase.network';
};

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

const normalizeLocalPublicSiteBaseUrl = (baseUrl: string) => {
  if (typeof window === 'undefined') {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    const currentHostname = window.location.hostname;

    if (isLocalHostname(url.hostname) && isLocalHostname(currentHostname)) {
      if (url.hostname !== currentHostname) {
        url.hostname = currentHostname;
      }

      url.port = '4321';
      url.protocol = window.location.protocol;
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

export const getPublicSiteBaseUrl = () =>
  normalizeLocalPublicSiteBaseUrl(
    (import.meta as ImportMetaEnvWithApiBase).env?.VITE_PUBLIC_SITE_BASE_URL ??
      (typeof process !== 'undefined' ? process.env.VITE_PUBLIC_SITE_BASE_URL : undefined) ??
      getDefaultPublicSiteBaseUrl(),
  );

export const getPublicSiteUrl = (pathname: string) => new URL(pathname, `${getPublicSiteBaseUrl()}/`).toString();
