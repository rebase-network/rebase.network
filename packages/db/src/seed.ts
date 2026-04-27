import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { count } from 'drizzle-orm';

import {
  aboutPage,
  accounts,
  articles,
  assets,
  auditLogs,
  contributorRoleBindings,
  contributorRoles,
  contributors,
  events,
  geekdailyEpisodeItems,
  geekdailyEpisodes,
  homePage,
  jobs,
  permissions,
  rolePermissionBindings,
  roles,
  sessions,
  siteSettings,
  staffAccounts,
  staffRoleBindings,
  users,
  type Database,
  createDb,
} from './index.js';
import { getBaselineGeekDailyArchive, loadGeekDailyArchive } from './geekdaily.js';

import {
  type ContentStatus,
} from '@rebase/shared';

interface BaselineLinkItem {
  label: string;
  href: string;
  handle?: string;
}

interface BaselineFooterGroup {
  title: string;
  slug: string;
  links: BaselineLinkItem[];
}

interface BaselineHomeStat {
  value: string;
  label: string;
}

interface BaselineSiteSettings {
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

interface BaselineAboutPage {
  title: string;
  summary: string;
  sections: Array<{ title: string; body: string }>;
}

interface BaselineContributorRole {
  slug: string;
  status: ContentStatus;
  name: string;
  description: string;
}

interface BaselineArticle {
  slug: string;
  status: ContentStatus;
  title: string;
  summary: string;
  body: string;
  published_at: string | null;
  reading_time: string;
  authors: Array<{ name: string; role?: string }>;
  tags: string[];
  cover_accent: string;
}

interface BaselineJob {
  slug: string;
  status: ContentStatus;
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

interface BaselineEvent {
  slug: string;
  status: ContentStatus;
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

interface BaselineContributor {
  slug: string;
  status: ContentStatus;
  name: string;
  headline: string;
  bio: string;
  avatar_seed: string;
  twitter_url: string | null;
  wechat: string | null;
  telegram: string | null;
  role_slugs: string[];
}

interface BaselineData {
  siteSettings: BaselineSiteSettings;
  aboutPage: BaselineAboutPage;
  contributorRoles: BaselineContributorRole[];
  contributors: BaselineContributor[];
  articles: BaselineArticle[];
  jobs: BaselineJob[];
  events: BaselineEvent[];
}

const loadBaselineData = async (): Promise<BaselineData> => {
  const moduleUrl = new URL('../../../scripts/seed/baseline-data.mjs', import.meta.url).href;
  return (await import(moduleUrl)) as unknown as BaselineData;
};

const databaseUrl = process.env.DATABASE_URL ?? '';

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for seeding.');
}

const { db, pool } = createDb(databaseUrl);

const permissionDefinitions = [
  ['dashboard.read', 'Dashboard Read', 'dashboard', 'read'],
  ['site.manage', 'Site Manage', 'site', 'manage'],
  ['article.read', 'Article Read', 'article', 'read'],
  ['article.write', 'Article Write', 'article', 'write'],
  ['article.publish', 'Article Publish', 'article', 'publish'],
  ['job.read', 'Job Read', 'job', 'read'],
  ['job.write', 'Job Write', 'job', 'write'],
  ['job.publish', 'Job Publish', 'job', 'publish'],
  ['event.read', 'Event Read', 'event', 'read'],
  ['event.write', 'Event Write', 'event', 'write'],
  ['event.publish', 'Event Publish', 'event', 'publish'],
  ['contributor.read', 'Contributor Read', 'contributor', 'read'],
  ['contributor.write', 'Contributor Write', 'contributor', 'write'],
  ['contributor.publish', 'Contributor Publish', 'contributor', 'publish'],
  ['geekdaily.read', 'GeekDaily Read', 'geekdaily', 'read'],
  ['geekdaily.write', 'GeekDaily Write', 'geekdaily', 'write'],
  ['geekdaily.publish', 'GeekDaily Publish', 'geekdaily', 'publish'],
  ['asset.manage', 'Asset Manage', 'asset', 'manage'],
  ['staff.manage', 'Staff Manage', 'staff', 'manage'],
  ['audit_log.read', 'Audit Log Read', 'audit_log', 'read'],
] as const;

const roleDefinitions = [
  {
    code: 'super_admin',
    name: 'Super Admin',
    description: 'Full access to the Rebase admin workspace.',
    isSystem: true,
    permissionCodes: permissionDefinitions.map(([code]) => code),
  },
  {
    code: 'content_editor',
    name: 'Content Editor',
    description: 'Manages site pages, articles, jobs, events, contributors, and GeekDaily.',
    isSystem: true,
    permissionCodes: [
      'dashboard.read',
      'site.manage',
      'article.read',
      'article.write',
      'article.publish',
      'job.read',
      'job.write',
      'job.publish',
      'event.read',
      'event.write',
      'event.publish',
      'contributor.read',
      'contributor.write',
      'contributor.publish',
      'geekdaily.read',
      'geekdaily.write',
      'geekdaily.publish',
      'asset.manage',
      'audit_log.read',
    ],
  },
] as const;

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const insertChunks = async <T extends Record<string, unknown>>(database: Database, table: any, rows: T[], size = 200) => {
  for (const batch of chunk(rows, size)) {
    if (batch.length > 0) {
      await database.insert(table).values(batch);
    }
  }
};

const seedAccessControl = async (database: Database) => {
  await database.delete(rolePermissionBindings);
  await database.delete(staffRoleBindings);
  await database.delete(permissions);
  await database.delete(roles);

  const insertedPermissions = await database
    .insert(permissions)
    .values(
      permissionDefinitions.map(([code, name, resource, action]) => ({
        code,
        name,
        resource,
        action,
      })),
    )
    .returning({ id: permissions.id, code: permissions.code });

  const insertedRoles = await database
    .insert(roles)
    .values(
      roleDefinitions.map((role) => ({
        code: role.code,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      })),
    )
    .returning({ id: roles.id, code: roles.code });

  const permissionIdByCode = new Map(insertedPermissions.map((row) => [row.code, row.id]));
  const roleIdByCode = new Map(insertedRoles.map((row) => [row.code, row.id]));

  await insertChunks(
    database,
    rolePermissionBindings,
    roleDefinitions.flatMap((role) =>
      role.permissionCodes.map((permissionCode) => ({
        roleId: roleIdByCode.get(role.code) ?? '',
        permissionId: permissionIdByCode.get(permissionCode) ?? '',
      })),
    ),
  );
};

const seedSingletons = async (
  database: Database,
  baselineData: BaselineData,
  totalEpisodes: number,
  totalItems: number,
) => {
  const { aboutPage: aboutPageSeed, siteSettings: siteSettingsSeed } = baselineData;

  await database.delete(aboutPage);
  await database.delete(homePage);
  await database.delete(siteSettings);

  await database.insert(siteSettings).values({
    siteName: siteSettingsSeed.site_name,
    tagline: siteSettingsSeed.tagline,
    description: siteSettingsSeed.description,
    primaryDomain: siteSettingsSeed.primary_domain,
    secondaryDomain: siteSettingsSeed.secondary_domain,
    mediaDomain: siteSettingsSeed.media_domain,
    socialLinksJson: siteSettingsSeed.social_links,
    footerGroupsJson: siteSettingsSeed.footer_groups,
    copyrightText: siteSettingsSeed.copyright_text,
  });

  await database.insert(homePage).values({
    heroTitle: siteSettingsSeed.hero_title,
    heroSummary: siteSettingsSeed.hero_summary,
    heroPrimaryCtaLabel: siteSettingsSeed.hero_primary_cta_label,
    heroPrimaryCtaUrl: siteSettingsSeed.hero_primary_cta_url,
    heroSecondaryCtaLabel: siteSettingsSeed.hero_secondary_cta_label,
    heroSecondaryCtaUrl: siteSettingsSeed.hero_secondary_cta_url,
    homeStatsJson: [
      { value: `${totalEpisodes}+`, label: '极客日报期数' },
      { value: `${totalItems}+`, label: '极客日报推荐条目' },
      { value: '7', label: '长期协作栏目' },
    ],
  });

  await database.insert(aboutPage).values({
    title: aboutPageSeed.title,
    summary: aboutPageSeed.summary,
    sectionsJson: aboutPageSeed.sections,
    seoTitle: '关于 Rebase Community',
    seoDescription: aboutPageSeed.summary,
  });
};

const seedContent = async (database: Database, baselineData: BaselineData) => {
  const {
    articles: articleSeeds,
    contributorRoles: contributorRoleSeeds,
    contributors: contributorSeeds,
    events: eventSeeds,
    jobs: jobSeeds,
  } = baselineData;

  await database.delete(contributorRoleBindings);
  await database.delete(contributors);
  await database.delete(contributorRoles);
  await database.delete(events);
  await database.delete(jobs);
  await database.delete(articles);
  await database.delete(assets);

  const demoAssets = [
    {
      contentSlug: 'building-rebase-in-public',
      contentType: 'article',
      objectKey: 'demo/articles/building-rebase-in-public.svg',
      publicUrl: '/media/demo/article-builder-dispatch.svg',
      originalFilename: 'article-builder-dispatch.svg',
      altText: 'Editorial cover for the article about building Rebase in public.',
    },
    {
      contentSlug: 'signal-over-noise',
      contentType: 'article',
      objectKey: 'demo/articles/signal-over-noise.svg',
      publicUrl: '/media/demo/article-signal-over-noise.svg',
      originalFilename: 'article-signal-over-noise.svg',
      altText: 'Editorial cover for the Signal over Noise article.',
    },
    {
      contentSlug: 'community-archives-should-stay-readable',
      contentType: 'article',
      objectKey: 'demo/articles/community-archives-should-stay-readable.svg',
      publicUrl: '/media/demo/article-community-archive.svg',
      originalFilename: 'article-community-archive.svg',
      altText: 'Editorial cover for the community archives article.',
    },
    {
      contentSlug: 'rebase-shanghai-builder-night',
      contentType: 'event',
      objectKey: 'demo/events/rebase-shanghai-builder-night.svg',
      publicUrl: '/media/demo/event-builder-night.svg',
      originalFilename: 'event-builder-night.svg',
      altText: 'Event cover for Rebase Shanghai Builder Night.',
    },
    {
      contentSlug: 'geekdaily-editor-roundtable',
      contentType: 'event',
      objectKey: 'demo/events/geekdaily-editor-roundtable.svg',
      publicUrl: '/media/demo/event-roundtable.svg',
      originalFilename: 'event-roundtable.svg',
      altText: 'Event cover for the GeekDaily editor roundtable.',
    },
    {
      contentSlug: 'community-media-retrospective',
      contentType: 'event',
      objectKey: 'demo/events/community-media-retrospective.svg',
      publicUrl: '/media/demo/event-retrospective.svg',
      originalFilename: 'event-retrospective.svg',
      altText: 'Event cover for the community media retrospective.',
    },
  ] as const;

  const insertedAssets = await database
    .insert(assets)
    .values(
      demoAssets.map((asset) => ({
        storageProvider: 'local-demo',
        bucket: 'rebase-media',
        objectKey: asset.objectKey,
        publicUrl: asset.publicUrl,
        visibility: 'public' as const,
        assetType: 'image',
        mimeType: 'image/svg+xml',
        byteSize: 4096,
        width: 1600,
        height: 960,
        originalFilename: asset.originalFilename,
        altText: asset.altText,
        status: 'active' as const,
      })),
    )
    .returning({ id: assets.id, objectKey: assets.objectKey });

  const assetIdByObjectKey = new Map(insertedAssets.map((item) => [item.objectKey, item.id]));
  const articleCoverAssetIdBySlug = new Map<string, string | null>(
    demoAssets
      .filter((asset) => asset.contentType === 'article')
      .map((asset) => [asset.contentSlug, assetIdByObjectKey.get(asset.objectKey) ?? null]),
  );
  const eventCoverAssetIdBySlug = new Map<string, string | null>(
    demoAssets
      .filter((asset) => asset.contentType === 'event')
      .map((asset) => [asset.contentSlug, assetIdByObjectKey.get(asset.objectKey) ?? null]),
  );

  await insertChunks(
    database,
    articles,
    articleSeeds.map((article) => ({
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      bodyMarkdown: article.body,
      readingTime: article.reading_time,
      coverAssetId: articleCoverAssetIdBySlug.get(article.slug) ?? null,
      coverAccent: article.cover_accent,
      authorsJson: article.authors,
      tagsJson: article.tags,
      status: article.status,
      publishedAt: article.published_at ? new Date(article.published_at) : null,
    })),
  );

  await insertChunks(
    database,
    jobs,
    jobSeeds.map((job) => ({
      slug: job.slug,
      companyName: job.company_name,
      roleTitle: job.role_title,
      salary: job.salary,
      supportsRemote: job.supports_remote,
      workMode: job.work_mode,
      location: job.location,
      summary: job.summary,
      descriptionMarkdown: job.description,
      applyUrl: job.apply_url,
      applyNote: job.apply_note,
      contactLabel: job.contact_label,
      contactValue: job.contact_value,
      tagsJson: job.tags,
      status: job.status,
      expiresAt: job.expires_at ? new Date(job.expires_at) : null,
      publishedAt: job.published_at ? new Date(job.published_at) : null,
    })),
  );

  await insertChunks(
    database,
    events,
    eventSeeds.map((event) => ({
      slug: event.slug,
      title: event.title,
      summary: event.summary,
      bodyMarkdown: event.content,
      startAt: new Date(event.start_at),
      endAt: new Date(event.end_at),
      city: event.city,
      location: event.location,
      venue: event.venue,
      coverAssetId: eventCoverAssetIdBySlug.get(event.slug) ?? null,
      registrationMode: event.registration_url ? 'external_url' : 'announcement_only',
      registrationUrl: event.registration_url,
      tagsJson: event.tags,
      status: event.status,
      publishedAt: new Date(event.start_at),
    })),
  );

  const insertedRoles = await database
    .insert(contributorRoles)
    .values(
      contributorRoleSeeds.map((role, index) => ({
        slug: role.slug,
        name: role.name,
        description: role.description,
        sortOrder: index,
        status: role.status,
      })),
    )
    .returning({ id: contributorRoles.id, slug: contributorRoles.slug, name: contributorRoles.name });

  const insertedContributors = await database
    .insert(contributors)
    .values(
      contributorSeeds.map((contributor, index) => ({
        slug: contributor.slug,
        name: contributor.name,
        headline: contributor.headline,
        bio: contributor.bio,
        avatarSeed: contributor.avatar_seed,
        twitterUrl: contributor.twitter_url,
        wechat: contributor.wechat,
        telegram: contributor.telegram,
        sortOrder: index,
        status: contributor.status,
      })),
    )
    .returning({ id: contributors.id, slug: contributors.slug });

  const contributorIdBySlug = new Map(insertedContributors.map((item) => [item.slug, item.id]));
  const roleIdBySlug = new Map(insertedRoles.map((item) => [item.slug, item.id]));

  await insertChunks(
    database,
    contributorRoleBindings,
    contributorSeeds.flatMap((contributor) =>
      contributor.role_slugs.map((roleSlug) => ({
        contributorId: contributorIdBySlug.get(contributor.slug) ?? '',
        contributorRoleId: roleIdBySlug.get(roleSlug) ?? '',
      })),
    ),
  );
};

const seedGeekDaily = async (database: Database) => {
  await database.delete(geekdailyEpisodeItems);
  await database.delete(geekdailyEpisodes);

  const sourcePath = fileURLToPath(new URL('../../../geekdaily.csv', import.meta.url));
  const archiveEpisodes = existsSync(sourcePath) ? loadGeekDailyArchive(sourcePath) : [];
  const episodes = archiveEpisodes.length > 0 ? archiveEpisodes : getBaselineGeekDailyArchive();
  const source = archiveEpisodes.length > 0 ? 'archive' : 'fixture';
  const insertedEpisodes = await database
    .insert(geekdailyEpisodes)
    .values(
      episodes.map((episode) => ({
        slug: episode.slug,
        episodeNumber: episode.episodeNumber,
        title: episode.title,
        summary: episode.summary,
        bodyMarkdown: episode.bodyMarkdown,
        editorsJson: episode.editors,
        tagsJson: episode.tags,
        status: 'published' as const,
        publishedAt: new Date(episode.publishedAt),
      })),
    )
    .returning({ id: geekdailyEpisodes.id, episodeNumber: geekdailyEpisodes.episodeNumber });

  const episodeIdByNumber = new Map(insertedEpisodes.map((episode) => [episode.episodeNumber, episode.id]));

  const itemRows = episodes.flatMap((episode) =>
    episode.items.map((item, index) => ({
      episodeId: episodeIdByNumber.get(episode.episodeNumber) ?? '',
      sortOrder: index,
      title: item.title,
      authorName: item.authorName,
      sourceUrl: item.sourceUrl,
      summary: item.summary,
    })),
  );

  await insertChunks(database, geekdailyEpisodeItems, itemRows, 400);

  return {
    totalEpisodes: episodes.length,
    totalItems: itemRows.length,
    source,
  };
};

const summarize = async (database: Database) => {
  const [articleCount] = await database.select({ value: count() }).from(articles);
  const [jobCount] = await database.select({ value: count() }).from(jobs);
  const [eventCount] = await database.select({ value: count() }).from(events);
  const [contributorCount] = await database.select({ value: count() }).from(contributors);
  const [episodeCount] = await database.select({ value: count() }).from(geekdailyEpisodes);
  return {
    articles: articleCount?.value ?? 0,
    jobs: jobCount?.value ?? 0,
    events: eventCount?.value ?? 0,
    contributors: contributorCount?.value ?? 0,
    geekdailyEpisodes: episodeCount?.value ?? 0,
  };
};

const main = async () => {
  try {
    const baselineData = await loadBaselineData();

    let geekdailySeedSource = 'fixture';
    let geekdailySeedItems = 0;

    await db.transaction(async (transaction) => {
      await transaction.delete(auditLogs);
      await transaction.delete(sessions);
      await transaction.delete(accounts);

      await seedAccessControl(transaction);
      await seedContent(transaction, baselineData);
      const geekdailyStats = await seedGeekDaily(transaction);
      geekdailySeedSource = geekdailyStats.source;
      geekdailySeedItems = geekdailyStats.totalItems;
      await seedSingletons(transaction, baselineData, geekdailyStats.totalEpisodes, geekdailyStats.totalItems);
    });

    console.log(
      JSON.stringify(
        {
          ...(await summarize(db)),
          geekdailySeedSource,
          geekdailyEpisodeItems: geekdailySeedItems,
        },
        null,
        2,
      ),
    );
  } finally {
    await pool.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
