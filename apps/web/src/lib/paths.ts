const CONTENT_ROUTE_ID_PATTERN = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:-(.+))?$/i;

const buildContentRouteParam = (id: string, slug?: string) => {
  const normalizedSlug = slug?.trim() ?? '';
  return normalizedSlug ? `${id}-${normalizedSlug}` : id;
};

const getContentIdFromRouteParam = (routeParam: string) => {
  const match = routeParam.match(CONTENT_ROUTE_ID_PATTERN);
  return match ? match[1] : routeParam;
};

export function getArticlePath(id: string, slug: string) {
  return `/articles/${buildContentRouteParam(id, slug)}`;
}

export function getArticleIdFromRouteParam(routeParam: string) {
  return getContentIdFromRouteParam(routeParam);
}

export function getEventPath(id: string, slug: string) {
  return `/events/${buildContentRouteParam(id, slug)}`;
}

export function getEventIdFromRouteParam(routeParam: string) {
  return getContentIdFromRouteParam(routeParam);
}

export function getGeekDailyPath(episodeNumber: number) {
  return `/geekdaily/geekdaily-${episodeNumber}`;
}

export function getJobPath(id: string, slug: string) {
  return `/who-is-hiring/${buildContentRouteParam(id, slug)}`;
}

export function getJobIdFromRouteParam(routeParam: string) {
  return getContentIdFromRouteParam(routeParam);
}
