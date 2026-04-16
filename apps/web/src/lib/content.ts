import type {
  AboutContent,
  Article,
  Contributor,
  ContributorRole,
  Event,
  GeekDailyEpisode,
  Job,
  SiteSettings,
} from '@rebase/types';

import { fetchPublicApi } from '@/lib/api';

interface PublicSiteConfigPayload {
  siteName: string;
  tagline: string;
  description: string;
  primaryDomain: string;
  secondaryDomain: string;
  mediaDomain: string;
  navigation: Array<{ label: string; href: string }>;
  socialLinks: Array<{ label: string; href: string; handle?: string }>;
  footerGroups: Array<{ title: string; slug: string; links: Array<{ label: string; href: string }> }>;
  copyright: string;
  heroTitle: string;
  heroSummary: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaUrl: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaUrl: string;
  homeStats: Array<{ value: string; label: string }>;
}

interface ContributorGroupPayload {
  role: ContributorRole;
  contributors: Contributor[];
}

interface HomeContributorPreviewPayload {
  slug: string;
  name: string;
  avatarUrl?: string;
  avatarSeed: string;
}

interface PublicGeekDailyItemPayload {
  title: string;
  authorName: string;
  sourceUrl: string;
  summary: string;
}

type GeekDailyEpisodePreview = Omit<GeekDailyEpisode, 'body'>;

interface PublicGeekDailyPreviewPayload extends Omit<GeekDailyEpisodePreview, 'items'> {
  items: PublicGeekDailyItemPayload[];
}

interface PublicGeekDailyEpisodePayload extends Omit<GeekDailyEpisode, 'items'> {
  items: PublicGeekDailyItemPayload[];
}

interface GeekDailyArchiveOverviewPayload {
  totalEpisodes: number;
  years: number[];
  featuredTags: string[];
}

interface HomeFeedPayload {
  latestGeekDaily: PublicGeekDailyEpisodePayload | null;
  recentArticles: Article[];
  recentJobs: Job[];
  upcomingEvents: Event[];
  recentGeekDaily: PublicGeekDailyEpisodePayload[];
  featuredContributors: HomeContributorPreviewPayload[];
  dynamicFeed: Array<{
    type: 'article' | 'job' | 'event' | 'geekdaily';
    title: string;
    summary: string;
    href: string;
    publishedAt?: string | null;
  }>;
}

const contributorKey = (contributor: Contributor) => contributor.slug;

const dedupeContributors = (contributors: Contributor[]) => {
  const seen = new Set<string>();
  return contributors.filter((contributor) => {
    const key = contributorKey(contributor);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const mapSiteSettings = (payload: PublicSiteConfigPayload): SiteSettings => ({
  name: payload.siteName,
  tagline: payload.tagline,
  description: payload.description,
  primaryDomain: payload.primaryDomain,
  secondaryDomain: payload.secondaryDomain,
  mediaDomain: payload.mediaDomain,
  navigation: payload.navigation,
  socialLinks: payload.socialLinks,
  footerGroups: payload.footerGroups,
  copyright: payload.copyright,
  heroTitle: payload.heroTitle,
  heroSummary: payload.heroSummary,
  heroPrimaryCtaLabel: payload.heroPrimaryCtaLabel,
  heroPrimaryCtaUrl: payload.heroPrimaryCtaUrl,
  heroSecondaryCtaLabel: payload.heroSecondaryCtaLabel,
  heroSecondaryCtaUrl: payload.heroSecondaryCtaUrl,
  homeStats: payload.homeStats,
});

const mapGeekDailyEpisode = (episode: PublicGeekDailyEpisodePayload): GeekDailyEpisode => ({
  ...episode,
  items: episode.items.map((item) => ({
    title: item.title,
    author: item.authorName,
    sourceUrl: item.sourceUrl,
    summary: item.summary,
  })),
});

const mapGeekDailyEpisodePreview = (episode: PublicGeekDailyPreviewPayload): GeekDailyEpisodePreview => ({
  ...episode,
  items: episode.items.map((item) => ({
    title: item.title,
    author: item.authorName,
    sourceUrl: item.sourceUrl,
    summary: item.summary,
  })),
});

export async function getSiteSettings() {
  return mapSiteSettings(await fetchPublicApi<PublicSiteConfigPayload>('/api/public/v1/site-config'));
}

export async function getAboutContent(): Promise<AboutContent> {
  return fetchPublicApi<AboutContent>('/api/public/v1/about');
}

export async function getArticles(): Promise<Article[]> {
  return fetchPublicApi<Article[]>('/api/public/v1/articles');
}

export async function getArticleById(id: string) {
  if (!id) {
    return undefined;
  }

  try {
    return await fetchPublicApi<Article>(`/api/public/v1/articles/${id}`);
  } catch {
    return undefined;
  }
}

export async function getJobs(): Promise<Job[]> {
  return fetchPublicApi<Job[]>('/api/public/v1/jobs');
}

export async function getJobById(id: string) {
  if (!id) {
    return undefined;
  }

  try {
    return await fetchPublicApi<Job>(`/api/public/v1/jobs/${id}`);
  } catch {
    return undefined;
  }
}

export async function getEvents(): Promise<Event[]> {
  return fetchPublicApi<Event[]>('/api/public/v1/events');
}

export async function getEventById(id: string) {
  if (!id) {
    return undefined;
  }

  try {
    return await fetchPublicApi<Event>(`/api/public/v1/events/${id}`);
  } catch {
    return undefined;
  }
}

export async function getUpcomingEvents() {
  return fetchPublicApi<Event[]>('/api/public/v1/events?status=upcoming');
}

export async function getPastEvents() {
  return fetchPublicApi<Event[]>('/api/public/v1/events?status=past');
}

export async function getContributorRoles() {
  const groups = await getContributorsByRole();
  return groups.map((group) => group.role);
}

export async function getContributors() {
  const groups = await getContributorsByRole();
  return dedupeContributors(groups.flatMap((group) => group.contributors));
}

export async function getContributorsByRole() {
  return fetchPublicApi<ContributorGroupPayload[]>('/api/public/v1/contributors');
}

export async function getGeekDailyEpisodes(limit = -1): Promise<GeekDailyEpisodePreview[]> {
  const suffix = limit > 0 ? `?limit=${limit}` : '';
  const episodes = await fetchPublicApi<PublicGeekDailyPreviewPayload[]>(`/api/public/v1/geekdaily${suffix}`);
  return episodes.map(mapGeekDailyEpisodePreview);
}

export async function getGeekDailyEpisodeBySlug(slug: string) {
  try {
    return mapGeekDailyEpisode(await fetchPublicApi<PublicGeekDailyEpisodePayload>(`/api/public/v1/geekdaily/${slug}`));
  } catch {
    return undefined;
  }
}

export async function getGeekDailyArchiveOverview() {
  return fetchPublicApi<GeekDailyArchiveOverviewPayload>('/api/public/v1/geekdaily/overview');
}

export async function getLatestArticles(count = 3) {
  return fetchPublicApi<Article[]>(`/api/public/v1/articles?limit=${count}`);
}

export async function getLatestJobs(count = 3) {
  return fetchPublicApi<Job[]>(`/api/public/v1/jobs?limit=${count}`);
}

export async function getLatestGeekDaily(count = 3) {
  const previews = await fetchPublicApi<PublicGeekDailyPreviewPayload[]>(`/api/public/v1/geekdaily?limit=${count}`);
  const episodes = await Promise.all(
    previews.map((episode) => fetchPublicApi<PublicGeekDailyEpisodePayload>(`/api/public/v1/geekdaily/${episode.slug}`)),
  );
  return episodes.map(mapGeekDailyEpisode);
}

export async function getLatestUpcomingEvents(count = 2) {
  const events = await getUpcomingEvents();
  return events.slice(0, count);
}

export async function getHomeFeed() {
  const payload = await fetchPublicApi<HomeFeedPayload>('/api/public/v1/home');

  return {
    latestArticles: payload.recentArticles,
    latestJobs: payload.recentJobs,
    latestEvents: payload.upcomingEvents,
    latestGeekDaily: payload.latestGeekDaily ? mapGeekDailyEpisode(payload.latestGeekDaily) : undefined,
    recentGeekDaily: payload.recentGeekDaily.map(mapGeekDailyEpisode),
    featuredContributors: payload.featuredContributors,
    dynamicFeed: payload.dynamicFeed,
  };
}
