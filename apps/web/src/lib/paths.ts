export function getArticlePath(slug: string) {
  return `/articles/${slug}`;
}

export function getEventPath(_date: string, slug: string) {
  return `/events/${slug}`;
}

export function getGeekDailyPath(episodeNumber: number) {
  return `/geekdaily/geekdaily-${episodeNumber}`;
}

export function getJobPath(slug: string) {
  return `/who-is-hiring/${slug}`;
}
