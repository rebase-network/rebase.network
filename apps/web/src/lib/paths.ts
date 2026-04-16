const CONTENT_ROUTE_NUMBER_PATTERN = /^([1-9]\d*)(?:-(.+))?$/;

const buildContentRouteParam = (publicNumber: number, slug?: string) => {
  const normalizedSlug = slug?.trim() ?? '';
  return normalizedSlug ? `${publicNumber}-${normalizedSlug}` : String(publicNumber);
};

const getContentPublicNumberFromRouteParam = (routeParam: string) => {
  const match = routeParam.match(CONTENT_ROUTE_NUMBER_PATTERN);
  if (!match) {
    return undefined;
  }

  const parsed = Number.parseInt(match[1], 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export function getArticlePath(publicNumber: number, slug: string) {
  return `/articles/${buildContentRouteParam(publicNumber, slug)}`;
}

export function getArticlePublicNumberFromRouteParam(routeParam: string) {
  return getContentPublicNumberFromRouteParam(routeParam);
}

export function getEventPath(publicNumber: number, slug: string) {
  return `/events/${buildContentRouteParam(publicNumber, slug)}`;
}

export function getEventPublicNumberFromRouteParam(routeParam: string) {
  return getContentPublicNumberFromRouteParam(routeParam);
}

export function getGeekDailyPath(episodeNumber: number) {
  return `/geekdaily/geekdaily-${episodeNumber}`;
}

export function getJobPath(publicNumber: number, slug: string) {
  return `/who-is-hiring/${buildContentRouteParam(publicNumber, slug)}`;
}

export function getJobPublicNumberFromRouteParam(routeParam: string) {
  return getContentPublicNumberFromRouteParam(routeParam);
}
