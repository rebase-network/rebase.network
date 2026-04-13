import { eq } from 'drizzle-orm';

import { aboutPage, homePage, siteSettings } from '@rebase/db';
import type { AboutPageInput, AdminSiteEditorPayload, HomePageInput, SiteSettingsInput } from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { getDb } from './db.js';

const defaultSiteSettings: SiteSettingsInput = {
  siteName: 'Rebase',
  tagline: '由中国开发者业余时间共同建立的非营利开发者社区',
  description:
    'Rebase Community 是由中国开发者们在业余时间用热爱建立的非营利、公益性开发者社区，持续组织 GeekDaily、Who-Is-Hiring、活动、文章与协作项目。',
  primaryDomain: 'https://rebase.network',
  secondaryDomain: 'https://rebase.community',
  mediaDomain: 'https://media.rebase.network',
  socialLinks: [],
  footerGroups: [],
  copyrightText: 'Copyright © Rebase Community. All rights reserved.',
};

const githubSocialLink: SiteSettingsInput['socialLinks'][number] = {
  label: 'GitHub',
  href: 'https://github.com/rebase-network',
  handle: '',
};

const normalizeSocialLinks = (links: SiteSettingsInput['socialLinks']) => {
  const hasGithub = links.some((item) => item.label === githubSocialLink.label || item.href === githubSocialLink.href);
  return hasGithub ? links : [...links, githubSocialLink];
};

const defaultHomePage: HomePageInput = {
  heroTitle: 'Rebase Community 是由中国开发者们在业余时间用热爱建立的开发者社区。',
  heroSummary:
    '我们是非营利、公益性的开发者社区，持续组织 GeekDaily、Who-Is-Hiring、活动、文章与协作项目，让社区交流、机会与长期记录都有稳定入口。',
  heroPrimaryCtaLabel: '进入 GeekDaily',
  heroPrimaryCtaUrl: '/geekdaily',
  heroSecondaryCtaLabel: '查看招聘板',
  heroSecondaryCtaUrl: '/who-is-hiring',
  homeStats: [
    { value: '1809+', label: '极客日报期数' },
    { value: '5458+', label: '极客日报推荐条目' },
    { value: '7', label: '长期协作栏目' },
  ],
};

const defaultAboutPage: AboutPageInput = {
  title: 'Rebase Community 是由中国开发者们在业余时间用热爱建立的开发者社区。',
  summary: 'Rebase Community 是非营利、公益性的开发者社区，专注于技术交流。',
  sections: [],
  seoTitle: '关于 Rebase Community',
  seoDescription: '了解 Rebase Community 的社区定位、栏目结构、联系入口与捐赠方式。',
};

const getFirstRow = async (table: any) => {
  const db = getDb();
  const rows = await db.select().from(table).limit(1);
  return rows[0] ?? null;
};

export const ensureSiteSettings = async () => {
  const db = getDb();
  const existing = await getFirstRow(siteSettings);
  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(siteSettings)
    .values({
      siteName: defaultSiteSettings.siteName,
      tagline: defaultSiteSettings.tagline,
      description: defaultSiteSettings.description,
      primaryDomain: defaultSiteSettings.primaryDomain,
      secondaryDomain: defaultSiteSettings.secondaryDomain,
      mediaDomain: defaultSiteSettings.mediaDomain,
      socialLinksJson: defaultSiteSettings.socialLinks,
      footerGroupsJson: defaultSiteSettings.footerGroups,
      copyrightText: defaultSiteSettings.copyrightText,
    })
    .returning();

  return created;
};

export const ensureHomePage = async () => {
  const db = getDb();
  const existing = await getFirstRow(homePage);
  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(homePage)
    .values({
      heroTitle: defaultHomePage.heroTitle,
      heroSummary: defaultHomePage.heroSummary,
      heroPrimaryCtaLabel: defaultHomePage.heroPrimaryCtaLabel,
      heroPrimaryCtaUrl: defaultHomePage.heroPrimaryCtaUrl,
      heroSecondaryCtaLabel: defaultHomePage.heroSecondaryCtaLabel,
      heroSecondaryCtaUrl: defaultHomePage.heroSecondaryCtaUrl,
      homeStatsJson: defaultHomePage.homeStats,
    })
    .returning();

  return created;
};

export const ensureAboutPage = async () => {
  const db = getDb();
  const existing = await getFirstRow(aboutPage);
  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(aboutPage)
    .values({
      title: defaultAboutPage.title,
      summary: defaultAboutPage.summary,
      sectionsJson: defaultAboutPage.sections,
      seoTitle: defaultAboutPage.seoTitle,
      seoDescription: defaultAboutPage.seoDescription,
    })
    .returning();

  return created;
};

export const getAdminSite = async (): Promise<AdminSiteEditorPayload> => {
  const settings = await ensureSiteSettings();
  const home = await ensureHomePage();
  const about = await ensureAboutPage();

  return {
    settings: {
      id: settings.id,
      siteName: settings.siteName,
      tagline: settings.tagline,
      description: settings.description,
      primaryDomain: settings.primaryDomain,
      secondaryDomain: settings.secondaryDomain,
      mediaDomain: settings.mediaDomain,
      socialLinks: normalizeSocialLinks((settings.socialLinksJson as SiteSettingsInput['socialLinks']) ?? []),
      footerGroups: (settings.footerGroupsJson as SiteSettingsInput['footerGroups']) ?? [],
      copyrightText: settings.copyrightText,
    },
    home: {
      id: home.id,
      heroTitle: home.heroTitle,
      heroSummary: home.heroSummary,
      heroPrimaryCtaLabel: home.heroPrimaryCtaLabel,
      heroPrimaryCtaUrl: home.heroPrimaryCtaUrl,
      heroSecondaryCtaLabel: home.heroSecondaryCtaLabel,
      heroSecondaryCtaUrl: home.heroSecondaryCtaUrl,
      homeStats: (home.homeStatsJson as HomePageInput['homeStats']) ?? [],
    },
    about: {
      id: about.id,
      title: about.title,
      summary: about.summary,
      sections: (about.sectionsJson as AboutPageInput['sections']) ?? [],
      seoTitle: about.seoTitle ?? '',
      seoDescription: about.seoDescription ?? '',
    },
  };
};

export const updateSiteSettings = async (input: SiteSettingsInput, actor: AuditActor) => {
  const db = getDb();
  const current = await ensureSiteSettings();

  await db
    .update(siteSettings)
    .set({
      siteName: input.siteName,
      tagline: input.tagline,
      description: input.description,
      primaryDomain: input.primaryDomain,
      secondaryDomain: input.secondaryDomain,
      mediaDomain: input.mediaDomain,
      socialLinksJson: input.socialLinks,
      footerGroupsJson: input.footerGroups,
      copyrightText: input.copyrightText,
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(siteSettings.id, current.id));

  await createAuditEntry({
    ...actor,
    action: 'site.update',
    targetType: 'site_settings',
    targetId: current.id,
    summary: 'Updated global site settings',
  });

  return getAdminSite();
};

export const updateHomePage = async (input: HomePageInput, actor: AuditActor) => {
  const db = getDb();
  const current = await ensureHomePage();

  await db
    .update(homePage)
    .set({
      heroTitle: input.heroTitle,
      heroSummary: input.heroSummary,
      heroPrimaryCtaLabel: input.heroPrimaryCtaLabel,
      heroPrimaryCtaUrl: input.heroPrimaryCtaUrl,
      heroSecondaryCtaLabel: input.heroSecondaryCtaLabel,
      heroSecondaryCtaUrl: input.heroSecondaryCtaUrl,
      homeStatsJson: input.homeStats,
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(homePage.id, current.id));

  await createAuditEntry({
    ...actor,
    action: 'home.update',
    targetType: 'home_page',
    targetId: current.id,
    summary: 'Updated homepage content',
  });

  return getAdminSite();
};

export const updateAboutPage = async (input: AboutPageInput, actor: AuditActor) => {
  const db = getDb();
  const current = await ensureAboutPage();

  await db
    .update(aboutPage)
    .set({
      title: input.title,
      summary: input.summary,
      sectionsJson: input.sections,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      updatedByStaffId: actor.actorStaffAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(aboutPage.id, current.id));

  await createAuditEntry({
    ...actor,
    action: 'about.update',
    targetType: 'about_page',
    targetId: current.id,
    summary: 'Updated about page',
  });

  return getAdminSite();
};

export const getPublicSiteConfig = async () => {
  const payload = await getAdminSite();

  return {
    siteName: payload.settings.siteName,
    tagline: payload.settings.tagline,
    description: payload.settings.description,
    primaryDomain: payload.settings.primaryDomain,
    secondaryDomain: payload.settings.secondaryDomain,
    mediaDomain: payload.settings.mediaDomain,
    navigation: [
      { label: '首页', href: '/' },
      { label: '极客日报', href: '/geekdaily' },
      { label: 'Who-Is-Hiring', href: '/who-is-hiring' },
      { label: '文章', href: '/articles' },
      { label: '活动', href: '/events' },
      { label: '贡献者们', href: '/contributors' },
      { label: '关于Rebase', href: '/about' },
    ],
    socialLinks: payload.settings.socialLinks,
    footerGroups: payload.settings.footerGroups,
    copyright: payload.settings.copyrightText,
    heroTitle: payload.home.heroTitle,
    heroSummary: payload.home.heroSummary,
    heroPrimaryCtaLabel: payload.home.heroPrimaryCtaLabel,
    heroPrimaryCtaUrl: payload.home.heroPrimaryCtaUrl,
    heroSecondaryCtaLabel: payload.home.heroSecondaryCtaLabel,
    heroSecondaryCtaUrl: payload.home.heroSecondaryCtaUrl,
    homeStats: payload.home.homeStats,
  };
};

export const getPublicAboutPage = async () => {
  const payload = await getAdminSite();

  return {
    intro: {
      title: payload.about.title,
      summary: payload.about.summary,
    },
    sections: payload.about.sections,
  };
};
