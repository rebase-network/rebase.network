export function getArticlePath(slug: string) {
  return `/articles/${slug}`;
}

export function getEventPath(date: string, slug: string) {
  return `/events/${date.slice(0, 10)}-${slug}`;
}

export function getGeekDailyPath(episodeNumber: number) {
  return `/geekdaily/episode-${episodeNumber}`;
}

export function getJobPath(slug: string) {
  return `/who-is-hiring/${slug}`;
}
