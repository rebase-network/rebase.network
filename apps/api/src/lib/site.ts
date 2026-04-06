import { eq } from 'drizzle-orm';

import { aboutPage, homePage, siteSettings } from '@rebase/db';
import type { AboutPageInput, AdminSiteEditorPayload, HomePageInput, SiteSettingsInput } from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { getDb } from './db.js';

const defaultSiteSettings: SiteSettingsInput = {
  siteName: 'Rebase',
  tagline: 'A community media network for builders, researchers, and curious operators.',
  description:
    'Rebase is a community platform for GeekDaily, community writing, events, hiring signals, and contributor stories.',
  primaryDomain: 'https://rebase.network',
  secondaryDomain: 'https://rebase.community',
  mediaDomain: 'https://media.rebase.network',
  socialLinks: [],
  footerGroups: [],
  copyrightText: 'Copyright © Rebase Community. All rights reserved.',
};

const defaultHomePage: HomePageInput = {
  heroTitle: '把社区的日常内容，组织成一个值得反复访问的公共入口。',
  heroSummary:
    'Rebase 新站把 GeekDaily、文章、招聘、活动和贡献者信息组织到同一个公共界面里。我们希望读者一进入首页，就能看见社区最近的节奏、机会与信号。',
  heroPrimaryCtaLabel: '进入 GeekDaily',
  heroPrimaryCtaUrl: '/geekdaily',
  heroSecondaryCtaLabel: '查看招聘板',
  heroSecondaryCtaUrl: '/who-is-hiring',
  homeSignals: [],
  homeStats: [],
};

const defaultAboutPage: AboutPageInput = {
  title: 'About Rebase',
  summary: 'Rebase is a community media network for builders and operators.',
  sections: [],
  seoTitle: 'About Rebase',
  seoDescription: 'Learn about the Rebase community.',
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
      homeSignalsJson: defaultHomePage.homeSignals,
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
      socialLinks: (settings.socialLinksJson as SiteSettingsInput['socialLinks']) ?? [],
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
      homeSignals: (home.homeSignalsJson as HomePageInput['homeSignals']) ?? [],
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
      homeSignalsJson: input.homeSignals,
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
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Who-Is-Hiring', href: '/who-is-hiring' },
      { label: 'GeekDaily', href: '/geekdaily' },
      { label: 'Articles', href: '/articles' },
      { label: 'Events', href: '/events' },
      { label: 'Contributors', href: '/contributors' },
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
    homeSignals: payload.home.homeSignals,
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
