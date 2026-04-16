declare module '../../../scripts/seed/baseline-data.mjs' {
  export interface BaselineLinkItem {
    label: string;
    href: string;
    handle?: string;
  }

  export interface BaselineFooterGroup {
    title: string;
    slug: string;
    links: BaselineLinkItem[];
  }

  export interface BaselineHomeStat {
    value: string;
    label: string;
  }

  export interface BaselineSiteSettings {
    site_name: string;
    tagline: string;
    description: string;
    primary_domain: string;
    secondary_domain: string;
    media_domain: string;
    hero_title: string;
    hero_summary: string;
    hero_primary_cta_label: string;
    hero_primary_cta_url: string;
    hero_secondary_cta_label: string;
    hero_secondary_cta_url: string;
    social_links: BaselineLinkItem[];
    footer_groups: BaselineFooterGroup[];
    home_stats: BaselineHomeStat[];
    copyright_text: string;
  }

  export interface BaselineAboutSection {
    title: string;
    body: string;
  }

  export interface BaselineAboutPage {
    title: string;
    summary: string;
    sections: BaselineAboutSection[];
  }

  export interface BaselineContributorRole {
    slug: string;
    status: 'draft' | 'published' | 'archived';
    name: string;
    description: string;
  }

  export interface BaselineArticle {
    slug: string;
    status: 'draft' | 'published' | 'archived';
    title: string;
    summary: string;
    body: string;
    published_at: string | null;
    reading_time: string;
    authors: Array<{ name: string; role?: string }>;
    tags: string[];
    cover_image_url: string | null;
    cover_accent: string;
  }

  export interface BaselineJob {
    slug: string;
    status: 'draft' | 'published' | 'archived';
    company_name: string;
    role_title: string;
    salary: string;
    supports_remote: boolean;
    work_mode: string;
    location: string;
    summary: string;
    description: string;
    apply_url: string | null;
    apply_note: string | null;
    contact_label: string | null;
    contact_value: string | null;
    published_at: string | null;
    expires_at: string | null;
    tags: string[];
  }

  export interface BaselineEvent {
    slug: string;
    status: 'draft' | 'published' | 'archived';
    event_status: string;
    title: string;
    summary: string;
    content: string;
    start_at: string;
    end_at: string;
    city: string;
    location: string;
    venue: string;
    registration_url: string | null;
    tags: string[];
  }

  export interface BaselineContributor {
    slug: string;
    status: 'draft' | 'published' | 'archived';
    name: string;
    headline: string;
    bio: string;
    avatar_seed: string;
    twitter_url: string | null;
    wechat: string | null;
    telegram: string | null;
    role_slugs: string[];
  }

  export const siteSettings: BaselineSiteSettings;
  export const aboutPage: BaselineAboutPage;
  export const contributorRoles: BaselineContributorRole[];
  export const contributors: BaselineContributor[];
  export const articles: BaselineArticle[];
  export const jobs: BaselineJob[];
  export const events: BaselineEvent[];
}
