export interface LinkItem {
  label: string;
  href: string;
}

export interface FooterLink extends LinkItem {
  description?: string;
}

export interface FooterGroup {
  title: string;
  slug: string;
  links: FooterLink[];
}

export interface SocialLink extends LinkItem {
  handle?: string;
}

export interface SiteSettings {
  name: string;
  tagline: string;
  description: string;
  primaryDomain: string;
  secondaryDomain: string;
  mediaDomain: string;
  navigation: LinkItem[];
  socialLinks: SocialLink[];
  footerGroups: FooterGroup[];
  copyright: string;
  heroTitle: string;
  heroSummary: string;
  heroPrimaryCtaLabel: string;
  heroPrimaryCtaUrl: string;
  heroSecondaryCtaLabel: string;
  heroSecondaryCtaUrl: string;
  homeSignals: HomeSignal[];
  homeStats: HomeStat[];
}

export interface HomeSignal {
  eyebrow: string;
  title: string;
  summary: string;
  href: string;
  meta: string;
}

export interface HomeStat {
  value: string;
  label: string;
}

export interface AboutSection {
  title: string;
  body: string;
}

export interface ArticleAuthor {
  name: string;
  role?: string;
}

export interface Article {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  readingTime: string;
  authors: ArticleAuthor[];
  tags: string[];
  coverAccent: string;
  coverImageUrl?: string;
  body: string;
}

export interface Job {
  slug: string;
  companyName: string;
  roleTitle: string;
  salary: string;
  supportsRemote: boolean;
  workMode: string;
  location: string;
  summary: string;
  description: string;
  responsibilities: string[];
  applyUrl: string;
  applyNote: string;
  contactLabel: string;
  contactValue: string;
  publishedAt: string;
  tags: string[];
}

export interface Event {
  slug: string;
  title: string;
  summary: string;
  content: string;
  startAt: string;
  endAt: string;
  location: string;
  venue: string;
  city: string;
  registrationUrl?: string;
  registrationNote?: string;
  status: 'upcoming' | 'past';
  tags: string[];
  coverImageUrl?: string;
}

export interface ContributorRole {
  slug: string;
  name: string;
  description: string;
}

export interface Contributor {
  slug: string;
  name: string;
  avatarUrl?: string;
  avatarSeed: string;
  headline: string;
  bio: string;
  roleSlugs: string[];
  twitterUrl?: string;
  wechat?: string;
  telegram?: string;
}

export interface GeekDailyItem {
  title: string;
  author: string;
  sourceUrl: string;
  summary: string;
}

export interface GeekDailyEpisode {
  slug: string;
  episodeNumber: number;
  title: string;
  summary: string;
  publishedAt: string;
  tags: string[];
  body: string;
  items: GeekDailyItem[];
}

export interface AboutContent {
  intro: {
    title: string;
    summary: string;
  };
  sections: AboutSection[];
}
