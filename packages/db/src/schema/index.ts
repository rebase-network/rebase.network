import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

const createdAt = timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = timestamp('updated_at', { withTimezone: true }).defaultNow().notNull();

export const staffAccountStatusEnum = pgEnum('staff_account_status', ['invited', 'active', 'suspended', 'disabled']);
export const contentStatusEnum = pgEnum('content_status', ['draft', 'published', 'archived']);
export const assetStatusEnum = pgEnum('asset_status', ['uploaded', 'active', 'archived', 'deleted']);
export const assetVisibilityEnum = pgEnum('asset_visibility', ['public', 'private']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt,
  updatedAt,
});

export const staffAccounts = pgTable('staff_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: staffAccountStatusEnum('status').default('invited').notNull(),
  displayName: text('display_name').notNull(),
  notes: text('notes'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  invitedByStaffId: uuid('invited_by_staff_id'),
  invitedAt: timestamp('invited_at', { withTimezone: true }),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  createdAt,
  updatedAt,
}, (table) => [uniqueIndex('staff_accounts_user_idx').on(table.userId)]);

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  isSystem: boolean('is_system').default(false).notNull(),
  createdAt,
  updatedAt,
});

export const permissions = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  createdAt,
  updatedAt,
});

export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  storageProvider: text('storage_provider').notNull(),
  bucket: text('bucket').notNull(),
  objectKey: text('object_key').notNull().unique(),
  visibility: assetVisibilityEnum('visibility').default('public').notNull(),
  assetType: text('asset_type').notNull(),
  mimeType: text('mime_type').notNull(),
  byteSize: integer('byte_size').notNull(),
  width: integer('width'),
  height: integer('height'),
  checksum: text('checksum'),
  originalFilename: text('original_filename').notNull(),
  altText: text('alt_text'),
  status: assetStatusEnum('status').default('uploaded').notNull(),
  createdAt,
  updatedAt,
});

export const siteSettings = pgTable('site_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteName: text('site_name').notNull(),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  primaryDomain: text('primary_domain').notNull(),
  secondaryDomain: text('secondary_domain').notNull(),
  mediaDomain: text('media_domain').notNull(),
  socialLinksJson: jsonb('social_links_json').notNull(),
  footerGroupsJson: jsonb('footer_groups_json').notNull(),
  copyrightText: text('copyright_text').notNull(),
  updatedByStaffId: uuid('updated_by_staff_id').references(() => staffAccounts.id, { onDelete: 'set null' }),
  createdAt,
  updatedAt,
});

export const aboutPage = pgTable('about_page', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  sectionsJson: jsonb('sections_json').notNull(),
  createdAt,
  updatedAt,
});

export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  bodyMarkdown: text('body_markdown').notNull(),
  authorsJson: jsonb('authors_json').notNull(),
  tagsJson: jsonb('tags_json').notNull(),
  coverAssetId: uuid('cover_asset_id').references(() => assets.id, { onDelete: 'set null' }),
  status: contentStatusEnum('status').default('draft').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  updatedByStaffId: uuid('updated_by_staff_id').references(() => staffAccounts.id, { onDelete: 'set null' }),
  createdAt,
  updatedAt,
});

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  companyName: text('company_name').notNull(),
  roleTitle: text('role_title').notNull(),
  salary: text('salary'),
  supportsRemote: boolean('supports_remote').default(false).notNull(),
  workMode: text('work_mode'),
  location: text('location'),
  summary: text('summary').notNull(),
  descriptionMarkdown: text('description_markdown').notNull(),
  responsibilitiesJson: jsonb('responsibilities_json').notNull(),
  applyUrl: text('apply_url'),
  applyNote: text('apply_note'),
  contactLabel: text('contact_label'),
  contactValue: text('contact_value'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  status: contentStatusEnum('status').default('draft').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  updatedByStaffId: uuid('updated_by_staff_id').references(() => staffAccounts.id, { onDelete: 'set null' }),
  createdAt,
  updatedAt,
});

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  bodyMarkdown: text('body_markdown').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  city: text('city').notNull(),
  location: text('location').notNull(),
  venue: text('venue').notNull(),
  coverAssetId: uuid('cover_asset_id').references(() => assets.id, { onDelete: 'set null' }),
  registrationMode: text('registration_mode').notNull(),
  registrationUrl: text('registration_url'),
  registrationNote: text('registration_note'),
  status: contentStatusEnum('status').default('draft').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  updatedByStaffId: uuid('updated_by_staff_id').references(() => staffAccounts.id, { onDelete: 'set null' }),
  createdAt,
  updatedAt,
});

export const contributorRoles = pgTable('contributor_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0).notNull(),
  status: contentStatusEnum('status').default('draft').notNull(),
  createdAt,
  updatedAt,
});

export const contributors = pgTable('contributors', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  headline: text('headline').notNull(),
  bio: text('bio').notNull(),
  avatarAssetId: uuid('avatar_asset_id').references(() => assets.id, { onDelete: 'set null' }),
  avatarSeed: text('avatar_seed').notNull(),
  twitterUrl: text('twitter_url'),
  wechat: text('wechat'),
  telegram: text('telegram'),
  sortOrder: integer('sort_order').default(0).notNull(),
  status: contentStatusEnum('status').default('draft').notNull(),
  createdAt,
  updatedAt,
});

export const geekdailyEpisodes = pgTable('geekdaily_episodes', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  episodeNumber: integer('episode_number').notNull().unique(),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  bodyMarkdown: text('body_markdown').notNull(),
  tagsJson: jsonb('tags_json').notNull(),
  status: contentStatusEnum('status').default('draft').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  updatedByStaffId: uuid('updated_by_staff_id').references(() => staffAccounts.id, { onDelete: 'set null' }),
  createdAt,
  updatedAt,
});

export const geekdailyEpisodeItems = pgTable('geekdaily_episode_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  episodeId: uuid('episode_id').notNull().references(() => geekdailyEpisodes.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').default(0).notNull(),
  title: text('title').notNull(),
  authorName: text('author_name').notNull(),
  sourceUrl: text('source_url').notNull(),
  summary: text('summary').notNull(),
  createdAt,
  updatedAt,
}, (table) => [uniqueIndex('geekdaily_episode_items_episode_sort_idx').on(table.episodeId, table.sortOrder)]);

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  actorStaffAccountId: uuid('actor_staff_account_id').references(() => staffAccounts.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  targetType: text('target_type').notNull(),
  targetId: uuid('target_id'),
  summary: text('summary').notNull(),
  payloadJson: jsonb('payload_json'),
  requestId: text('request_id'),
  requestIp: text('request_ip'),
  userAgent: text('user_agent'),
  createdAt,
});
