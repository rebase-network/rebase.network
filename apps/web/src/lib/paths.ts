export function getArticlePath(slug: string) {
  return `/articles/${slug}`;
}

export function getEventRouteParam(startAt: string, slug: string) {
  return `${startAt.slice(0, 10)}-${slug}`;
}

export function getEventSlugFromRouteParam(routeParam: string) {
  const match = routeParam.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  return match ? match[1] : routeParam;
}

export function getEventPath(startAt: string, slug: string) {
  return `/events/${getEventRouteParam(startAt, slug)}`;
}

export function getGeekDailyPath(episodeNumber: number) {
  return `/geekdaily/geekdaily-${episodeNumber}`;
}

export function getJobPath(slug: string) {
  return `/who-is-hiring/${slug}`;
}
