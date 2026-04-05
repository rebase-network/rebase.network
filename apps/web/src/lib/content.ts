import type {
  AboutContent,
  Article,
  Contributor,
  ContributorRole,
  Event,
  GeekDailyEpisode,
  GeekDailyItem,
  Job,
  SiteSettings,
} from '@rebase/types';
import { readItems, readSingleton } from '@/lib/directus';

const navigation = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Who-Is-Hiring', href: '/who-is-hiring' },
  { label: 'GeekDaily', href: '/geekdaily' },
  { label: 'Articles', href: '/articles' },
  { label: 'Events', href: '/events' },
  { label: 'Contributors', href: '/contributors' },
] as const;

function stringOrFallback(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function objectArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    : [];
}

function mapSiteSettings(record: Record<string, unknown>): SiteSettings {
  return {
    name: stringOrFallback(record.site_name, 'Rebase'),
    tagline: stringOrFallback(record.tagline),
    description: stringOrFallback(record.description),
    primaryDomain: stringOrFallback(record.primary_domain, 'https://rebase.network'),
    secondaryDomain: stringOrFallback(record.secondary_domain, 'https://rebase.community'),
    mediaDomain: stringOrFallback(record.media_domain, 'https://media.rebase.network'),
    navigation: [...navigation],
    socialLinks: objectArray(record.social_links).map((item) => ({
      label: stringOrFallback(item.label),
      href: stringOrFallback(item.href),
      handle: stringOrFallback(item.handle) || undefined,
    })),
    footerGroups: objectArray(record.footer_groups).map((group) => ({
      title: stringOrFallback(group.title),
      slug: stringOrFallback(group.slug),
      links: objectArray(group.links).map((link) => ({
        label: stringOrFallback(link.label),
        href: stringOrFallback(link.href),
      })),
    })),
    copyright: stringOrFallback(record.copyright_text),
    heroTitle: stringOrFallback(record.hero_title),
    heroSummary: stringOrFallback(record.hero_summary),
    heroPrimaryCtaLabel: stringOrFallback(record.hero_primary_cta_label),
    heroPrimaryCtaUrl: stringOrFallback(record.hero_primary_cta_url),
    heroSecondaryCtaLabel: stringOrFallback(record.hero_secondary_cta_label),
    heroSecondaryCtaUrl: stringOrFallback(record.hero_secondary_cta_url),
    homeSignals: objectArray(record.home_signals).map((item) => ({
      eyebrow: stringOrFallback(item.eyebrow),
      title: stringOrFallback(item.title),
      summary: stringOrFallback(item.summary),
      href: stringOrFallback(item.href),
      meta: stringOrFallback(item.meta),
    })),
    homeStats: objectArray(record.home_stats).map((item) => ({
      value: stringOrFallback(item.value),
      label: stringOrFallback(item.label),
    })),
  };
}

function mapArticle(record: Record<string, unknown>): Article {
  return {
    slug: stringOrFallback(record.slug),
    title: stringOrFallback(record.title),
    summary: stringOrFallback(record.summary),
    publishedAt: stringOrFallback(record.published_at),
    readingTime: stringOrFallback(record.reading_time, '5 min read'),
    authors: objectArray(record.authors).map((author) => ({
      name: stringOrFallback(author.name),
      role: stringOrFallback(author.role) || undefined,
    })),
    tags: stringArray(record.tags),
    coverAccent: stringOrFallback(record.cover_accent, 'linear-gradient(135deg, #0f766e 0%, #f59e0b 100%)'),
    coverImageUrl: stringOrFallback(record.cover_image_url) || undefined,
    body: stringOrFallback(record.body),
  };
}

function mapJob(record: Record<string, unknown>): Job {
  return {
    slug: stringOrFallback(record.slug),
    companyName: stringOrFallback(record.company_name),
    roleTitle: stringOrFallback(record.role_title),
    salary: stringOrFallback(record.salary),
    supportsRemote: Boolean(record.supports_remote),
    workMode: stringOrFallback(record.work_mode),
    location: stringOrFallback(record.location),
    summary: stringOrFallback(record.summary),
    description: stringOrFallback(record.description),
    responsibilities: stringArray(record.responsibilities),
    applyUrl: stringOrFallback(record.apply_url),
    applyNote: stringOrFallback(record.apply_note),
    contactLabel: stringOrFallback(record.contact_label),
    contactValue: stringOrFallback(record.contact_value),
    publishedAt: stringOrFallback(record.published_at),
    tags: stringArray(record.tags),
  };
}

function mapEvent(record: Record<string, unknown>): Event {
  const status = stringOrFallback(record.event_status, 'upcoming') === 'past' ? 'past' : 'upcoming';

  return {
    slug: stringOrFallback(record.slug),
    title: stringOrFallback(record.title),
    summary: stringOrFallback(record.summary),
    content: stringOrFallback(record.content),
    startAt: stringOrFallback(record.start_at),
    endAt: stringOrFallback(record.end_at),
    location: stringOrFallback(record.location),
    venue: stringOrFallback(record.venue),
    city: stringOrFallback(record.city),
    registrationUrl: stringOrFallback(record.registration_url) || undefined,
    registrationNote: stringOrFallback(record.registration_note) || undefined,
    status,
    tags: stringArray(record.tags),
    coverImageUrl: stringOrFallback(record.cover_image_url) || undefined,
  };
}

function mapContributorRole(record: Record<string, unknown>): ContributorRole {
  return {
    slug: stringOrFallback(record.slug),
    name: stringOrFallback(record.name),
    description: stringOrFallback(record.description),
  };
}

function mapContributor(record: Record<string, unknown>): Contributor {
  return {
    slug: stringOrFallback(record.slug),
    name: stringOrFallback(record.name),
    avatarUrl: stringOrFallback(record.avatar_url) || undefined,
    avatarSeed: stringOrFallback(record.avatar_seed, stringOrFallback(record.slug, 'rebase')),
    headline: stringOrFallback(record.headline),
    bio: stringOrFallback(record.bio),
    roleSlugs: stringArray(record.role_slugs),
    twitterUrl: stringOrFallback(record.twitter_url) || undefined,
    wechat: stringOrFallback(record.wechat) || undefined,
    telegram: stringOrFallback(record.telegram) || undefined,
  };
}

function mapGeekDailyItem(record: Record<string, unknown>): GeekDailyItem {
  return {
    title: stringOrFallback(record.title),
    author: stringOrFallback(record.author),
    sourceUrl: stringOrFallback(record.sourceUrl),
    summary: stringOrFallback(record.summary),
  };
}

function mapGeekDailyEpisode(record: Record<string, unknown>): GeekDailyEpisode {
  return {
    slug: stringOrFallback(record.slug),
    episodeNumber: Number(record.episode_number ?? 0),
    title: stringOrFallback(record.title),
    summary: stringOrFallback(record.summary),
    publishedAt: stringOrFallback(record.published_at),
    tags: stringArray(record.tags),
    body: stringOrFallback(record.body),
    items: objectArray(record.items).map(mapGeekDailyItem),
  };
}

export async function getSiteSettings() {
  const record = await readSingleton('site_settings', 1, [
    'site_name',
    'tagline',
    'description',
    'primary_domain',
    'secondary_domain',
    'media_domain',
    'hero_title',
    'hero_summary',
    'hero_primary_cta_label',
    'hero_primary_cta_url',
    'hero_secondary_cta_label',
    'hero_secondary_cta_url',
    'social_links',
    'footer_groups',
    'home_signals',
    'home_stats',
    'copyright_text',
  ]);

  return mapSiteSettings(record);
}

export async function getAboutContent(): Promise<AboutContent> {
  const record = await readSingleton('about_page', 1, ['title', 'summary', 'sections']);

  return {
    intro: {
      title: stringOrFallback(record.title),
      summary: stringOrFallback(record.summary),
    },
    sections: objectArray(record.sections).map((section) => ({
      title: stringOrFallback(section.title),
      body: stringOrFallback(section.body),
    })),
  };
}

export async function getArticles(): Promise<Article[]> {
  const records = await readItems('articles', {
    fields: ['slug', 'title', 'summary', 'body', 'published_at', 'reading_time', 'authors', 'tags', 'cover_image_url', 'cover_accent'],
    filter: { status: { _eq: 'published' } },
    sort: '-published_at',
    limit: -1,
  });

  return records.map(mapArticle);
}

export async function getArticleBySlug(slug: string) {
  const records = await readItems('articles', {
    fields: ['slug', 'title', 'summary', 'body', 'published_at', 'reading_time', 'authors', 'tags', 'cover_image_url', 'cover_accent'],
    filter: {
      status: { _eq: 'published' },
      slug: { _eq: slug },
    },
    limit: 1,
  });

  return records.length > 0 ? mapArticle(records[0]) : undefined;
}

export async function getJobs(): Promise<Job[]> {
  const records = await readItems('jobs', {
    fields: ['slug', 'company_name', 'role_title', 'salary', 'supports_remote', 'work_mode', 'location', 'summary', 'description', 'responsibilities', 'apply_url', 'apply_note', 'contact_label', 'contact_value', 'published_at', 'tags'],
    filter: { status: { _eq: 'published' } },
    sort: '-published_at',
    limit: -1,
  });

  return records.map(mapJob);
}

export async function getJobBySlug(slug: string) {
  const records = await readItems('jobs', {
    fields: ['slug', 'company_name', 'role_title', 'salary', 'supports_remote', 'work_mode', 'location', 'summary', 'description', 'responsibilities', 'apply_url', 'apply_note', 'contact_label', 'contact_value', 'published_at', 'tags'],
    filter: {
      status: { _eq: 'published' },
      slug: { _eq: slug },
    },
    limit: 1,
  });

  return records.length > 0 ? mapJob(records[0]) : undefined;
}

export async function getEvents(): Promise<Event[]> {
  const records = await readItems('events', {
    fields: ['slug', 'title', 'summary', 'content', 'start_at', 'end_at', 'location', 'venue', 'city', 'registration_url', 'registration_note', 'event_status', 'tags', 'cover_image_url'],
    filter: { status: { _eq: 'published' } },
    sort: 'start_at',
    limit: -1,
  });

  return records.map(mapEvent);
}

export async function getEventBySlug(slug: string) {
  const records = await readItems('events', {
    fields: ['slug', 'title', 'summary', 'content', 'start_at', 'end_at', 'location', 'venue', 'city', 'registration_url', 'registration_note', 'event_status', 'tags', 'cover_image_url'],
    filter: {
      status: { _eq: 'published' },
      slug: { _eq: slug },
    },
    limit: 1,
  });

  return records.length > 0 ? mapEvent(records[0]) : undefined;
}

export async function getUpcomingEvents() {
  const events = await getEvents();
  return events.filter((item) => item.status === 'upcoming');
}

export async function getPastEvents() {
  const events = await getEvents();
  return events.filter((item) => item.status === 'past').sort((a, b) => +new Date(b.startAt) - +new Date(a.startAt));
}

export async function getContributorRoles() {
  const records = await readItems('contributor_roles', {
    fields: ['slug', 'name', 'description'],
    filter: { status: { _eq: 'published' } },
    sort: 'sort',
    limit: -1,
  });

  return records.map(mapContributorRole);
}

export async function getContributors() {
  const records = await readItems('contributors', {
    fields: ['slug', 'name', 'avatar_url', 'avatar_seed', 'headline', 'bio', 'role_slugs', 'twitter_url', 'wechat', 'telegram'],
    filter: { status: { _eq: 'published' } },
    sort: 'sort',
    limit: -1,
  });

  return records.map(mapContributor);
}

export async function getContributorsByRole() {
  const [roles, contributors] = await Promise.all([getContributorRoles(), getContributors()]);

  return roles.map((role) => ({
    role,
    contributors: contributors.filter((person) => person.roleSlugs.includes(role.slug)),
  }));
}

export async function getGeekDailyEpisodes(limit = -1): Promise<GeekDailyEpisode[]> {
  const records = await readItems('geekdaily_episodes', {
    fields: ['slug', 'episode_number', 'title', 'summary', 'body', 'published_at', 'tags', 'items'],
    filter: { status: { _eq: 'published' } },
    sort: '-episode_number',
    limit,
  });

  return records.map(mapGeekDailyEpisode);
}

export async function getGeekDailyEpisodeBySlug(slug: string) {
  const records = await readItems('geekdaily_episodes', {
    fields: ['slug', 'episode_number', 'title', 'summary', 'body', 'published_at', 'tags', 'items'],
    filter: {
      status: { _eq: 'published' },
      slug: { _eq: slug },
    },
    limit: 1,
  });

  return records.length > 0 ? mapGeekDailyEpisode(records[0]) : undefined;
}

export async function getGeekDailyArchiveOverview() {
  const records = await readItems('geekdaily_episodes', {
    fields: ['episode_number', 'published_at', 'tags'],
    filter: { status: { _eq: 'published' } },
    sort: '-episode_number',
    limit: -1,
  });

  const years = [...new Set(records.map((record) => new Date(stringOrFallback(record.published_at)).getUTCFullYear()))].filter(Number.isFinite);
  const featuredTags = [...new Set(records.flatMap((record) => stringArray(record.tags)))].slice(0, 8);

  return {
    totalEpisodes: records.length,
    years,
    featuredTags,
  };
}

export async function getGeekDailySearchDocuments() {
  const episodes = await getGeekDailyEpisodes();

  return episodes.map((episode) => ({
    slug: episode.slug,
    episodeNumber: episode.episodeNumber,
    title: episode.title,
    summary: episode.summary,
    body: episode.body,
    tags: episode.tags,
    publishedAt: episode.publishedAt,
    year: String(new Date(episode.publishedAt).getUTCFullYear()),
    itemTitles: episode.items.map((item) => item.title),
    searchableText: [
      episode.title,
      episode.summary,
      episode.body,
      episode.tags.join(' '),
      ...episode.items.flatMap((item) => [item.title, item.author, item.summary]),
    ]
      .join(' ')
      .toLowerCase(),
  }));
}

export async function getLatestArticles(count = 3) {
  const articles = await getArticles();
  return articles.slice(0, count);
}

export async function getLatestJobs(count = 3) {
  const jobs = await getJobs();
  return jobs.slice(0, count);
}

export async function getLatestGeekDaily(count = 3) {
  const episodes = await getGeekDailyEpisodes(count);
  return episodes.slice(0, count);
}

export async function getLatestUpcomingEvents(count = 2) {
  const events = await getUpcomingEvents();
  return events.slice(0, count);
}

export async function getHomeFeed() {
  const [latestArticles, latestJobs, latestEvents, latestGeekDaily] = await Promise.all([
    getLatestArticles(),
    getLatestJobs(),
    getLatestUpcomingEvents(),
    getLatestGeekDaily(1),
  ]);

  return {
    latestArticles,
    latestJobs,
    latestEvents,
    latestGeekDaily: latestGeekDaily[0],
  };
}
