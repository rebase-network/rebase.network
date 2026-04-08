import { marked } from 'marked';
import { z } from 'zod';

const trimmedString = z.string().trim();
const requiredTrimmedString = (message: string) => z.string().trim().min(1, message);
const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => {
    if (!value) {
      return null;
    }

    return value;
  });

export const contentStatusValues = ['draft', 'published', 'archived'] as const;
export type ContentStatus = (typeof contentStatusValues)[number];

export const contentStatusOptions = contentStatusValues.map((value) => ({
  value,
  label: value,
}));

export const staffAccountStatusValues = ['invited', 'active', 'suspended', 'disabled'] as const;
export type StaffAccountStatus = (typeof staffAccountStatusValues)[number];

export const assetStatusValues = ['uploaded', 'active', 'archived', 'deleted'] as const;
export type AssetStatus = (typeof assetStatusValues)[number];

export const registrationModeValues = ['external_url', 'announcement_only'] as const;
export type RegistrationMode = (typeof registrationModeValues)[number];

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  issues?: ValidationIssue[];
}

const formatIssues = (error: z.ZodError): ValidationIssue[] =>
  error.issues.map((issue) => ({
    path: issue.path.join('.') || 'root',
    message: issue.message,
  }));

const safeParse = <TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  payload: unknown,
): ValidationResult<z.output<TSchema>> => {
  const result = schema.safeParse(payload);

  if (result.success) {
    return {
      valid: true,
      data: result.data,
    };
  }

  return {
    valid: false,
    issues: formatIssues(result.error),
  };
};

export const linkItemSchema = z.object({
  label: requiredTrimmedString('label is required'),
  href: requiredTrimmedString('href is required'),
});

export const socialLinkSchema = linkItemSchema.extend({
  handle: trimmedString.optional().default(''),
});

export const footerGroupSchema = z.object({
  title: requiredTrimmedString('title is required'),
  slug: requiredTrimmedString('slug is required'),
  links: z.array(linkItemSchema).default([]),
});

export const homeSignalSchema = z.object({
  eyebrow: requiredTrimmedString('eyebrow is required'),
  title: requiredTrimmedString('title is required'),
  summary: requiredTrimmedString('summary is required'),
  href: requiredTrimmedString('href is required'),
  meta: trimmedString.default(''),
});

export const homeStatSchema = z.object({
  value: requiredTrimmedString('value is required'),
  label: requiredTrimmedString('label is required'),
});

export const aboutSectionSchema = z.object({
  title: requiredTrimmedString('title is required'),
  body: requiredTrimmedString('body is required'),
});

export const articleAuthorSchema = z.object({
  name: requiredTrimmedString('author name is required'),
  role: trimmedString.optional().default(''),
});

export const geekdailyItemSchema = z.object({
  title: requiredTrimmedString('title is required'),
  authorName: requiredTrimmedString('author name is required'),
  sourceUrl: requiredTrimmedString('source url is required'),
  summary: requiredTrimmedString('recommendation note is required'),
});

export const geekdailyEditorSchema = requiredTrimmedString('editor name is required');

export const siteSettingsSchema = z.object({
  siteName: requiredTrimmedString('site name is required'),
  tagline: requiredTrimmedString('tagline is required'),
  description: requiredTrimmedString('description is required'),
  primaryDomain: requiredTrimmedString('primary domain is required'),
  secondaryDomain: requiredTrimmedString('secondary domain is required'),
  mediaDomain: requiredTrimmedString('media domain is required'),
  socialLinks: z.array(socialLinkSchema).default([]),
  footerGroups: z.array(footerGroupSchema).default([]),
  copyrightText: requiredTrimmedString('copyright is required'),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

export const homePageSchema = z.object({
  heroTitle: requiredTrimmedString('hero title is required'),
  heroSummary: requiredTrimmedString('hero summary is required'),
  heroPrimaryCtaLabel: requiredTrimmedString('primary cta label is required'),
  heroPrimaryCtaUrl: requiredTrimmedString('primary cta url is required'),
  heroSecondaryCtaLabel: requiredTrimmedString('secondary cta label is required'),
  heroSecondaryCtaUrl: requiredTrimmedString('secondary cta url is required'),
  homeSignals: z.array(homeSignalSchema).default([]),
  homeStats: z.array(homeStatSchema).default([]),
});

export type HomePageInput = z.infer<typeof homePageSchema>;

export const aboutPageSchema = z.object({
  title: requiredTrimmedString('title is required'),
  summary: requiredTrimmedString('summary is required'),
  sections: z.array(aboutSectionSchema).default([]),
  seoTitle: trimmedString.optional().default(''),
  seoDescription: trimmedString.optional().default(''),
});

export type AboutPageInput = z.infer<typeof aboutPageSchema>;

export const articleSchema = z.object({
  slug: requiredTrimmedString('slug is required'),
  title: requiredTrimmedString('title is required'),
  summary: requiredTrimmedString('summary is required'),
  bodyMarkdown: requiredTrimmedString('body is required'),
  readingTime: requiredTrimmedString('reading time is required'),
  coverAssetId: z.string().uuid().optional().nullable().default(null),
  coverAccent: requiredTrimmedString('cover accent is required'),
  authors: z.array(articleAuthorSchema).min(1, 'at least one author is required'),
  tags: z.array(trimmedString).default([]),
  seoTitle: trimmedString.optional().default(''),
  seoDescription: trimmedString.optional().default(''),
  status: z.enum(contentStatusValues).default('draft'),
  publishedAt: optionalTrimmedString,
});

export type ArticleInput = z.infer<typeof articleSchema>;

export const jobSchema = z
  .object({
    slug: requiredTrimmedString('slug is required'),
    companyName: requiredTrimmedString('company name is required'),
    roleTitle: requiredTrimmedString('role title is required'),
    salary: requiredTrimmedString('salary is required'),
    supportsRemote: z.boolean().default(false),
    workMode: requiredTrimmedString('work mode is required'),
    location: requiredTrimmedString('location is required'),
    summary: requiredTrimmedString('summary is required'),
    descriptionMarkdown: requiredTrimmedString('description is required'),
    responsibilities: z.array(requiredTrimmedString('responsibility is required')).default([]),
    applyUrl: optionalTrimmedString,
    applyNote: trimmedString.optional().default(''),
    contactLabel: trimmedString.optional().default(''),
    contactValue: trimmedString.optional().default(''),
    tags: z.array(trimmedString).default([]),
    seoTitle: trimmedString.optional().default(''),
    seoDescription: trimmedString.optional().default(''),
    status: z.enum(contentStatusValues).default('draft'),
    expiresAt: optionalTrimmedString,
    publishedAt: optionalTrimmedString,
  })
  .superRefine((value, ctx) => {
    if (!value.applyUrl && !value.contactValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applyUrl'],
        message: 'either apply url or contact value is required',
      });
    }
  });

export type JobInput = z.infer<typeof jobSchema>;

export const eventSchema = z
  .object({
    slug: requiredTrimmedString('slug is required'),
    title: requiredTrimmedString('title is required'),
    summary: requiredTrimmedString('summary is required'),
    bodyMarkdown: requiredTrimmedString('body is required'),
    startAt: requiredTrimmedString('start time is required'),
    endAt: requiredTrimmedString('end time is required'),
    city: requiredTrimmedString('city is required'),
    location: requiredTrimmedString('location is required'),
    venue: requiredTrimmedString('venue is required'),
    coverAssetId: z.string().uuid().optional().nullable().default(null),
    registrationMode: z.enum(registrationModeValues).default('external_url'),
    registrationUrl: optionalTrimmedString,
    registrationNote: trimmedString.optional().default(''),
    tags: z.array(trimmedString).default([]),
    seoTitle: trimmedString.optional().default(''),
    seoDescription: trimmedString.optional().default(''),
    status: z.enum(contentStatusValues).default('draft'),
    publishedAt: optionalTrimmedString,
  })
  .superRefine((value, ctx) => {
    if (value.registrationMode === 'external_url' && !value.registrationUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['registrationUrl'],
        message: 'registration url is required for external registrations',
      });
    }

    if (Date.parse(value.startAt) >= Date.parse(value.endAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endAt'],
        message: 'end time must be after start time',
      });
    }
  });

export type EventInput = z.infer<typeof eventSchema>;

export const contributorRoleSchema = z.object({
  slug: requiredTrimmedString('slug is required'),
  name: requiredTrimmedString('name is required'),
  description: requiredTrimmedString('description is required'),
  sortOrder: z.number().int().default(0),
  status: z.enum(contentStatusValues).default('draft'),
});

export type ContributorRoleInput = z.infer<typeof contributorRoleSchema>;

export const contributorSchema = z.object({
  slug: requiredTrimmedString('slug is required'),
  name: requiredTrimmedString('name is required'),
  headline: requiredTrimmedString('headline is required'),
  bio: requiredTrimmedString('bio is required'),
  avatarAssetId: z.string().uuid().optional().nullable().default(null),
  avatarSeed: requiredTrimmedString('avatar seed is required'),
  twitterUrl: trimmedString.optional().default(''),
  wechat: trimmedString.optional().default(''),
  telegram: trimmedString.optional().default(''),
  sortOrder: z.number().int().default(0),
  roleIds: z.array(z.string().uuid()).min(1, 'at least one contributor role is required'),
  status: z.enum(contentStatusValues).default('draft'),
});

export type ContributorInput = z.infer<typeof contributorSchema>;

export const geekdailyEpisodeSchema = z.object({
  episodeNumber: z.number().int().positive(),
  title: requiredTrimmedString('title is required'),
  summary: trimmedString.default(''),
  bodyMarkdown: trimmedString.default(''),
  editors: z.array(geekdailyEditorSchema).default([]),
  tags: z.array(trimmedString).default([]),
  status: z.enum(contentStatusValues).default('draft'),
  publishedAt: trimmedString.default(''),
  items: z.array(geekdailyItemSchema).min(1, 'at least one item is required'),
});

export type GeekDailyEpisodeInput = z.infer<typeof geekdailyEpisodeSchema>;

export function getGeekDailyEpisodeSlug(episodeNumber: number) {
  return `geekdaily-${episodeNumber}`;
}

export function getGeekDailyEpisodePath(episodeNumber: number) {
  return `/geekdaily/${getGeekDailyEpisodeSlug(episodeNumber)}`;
}

const geekDailyTemplateItemsHeading = '## 本期推荐';
const geekDailyTemplateNoteHeading = '## 本期补充';
export const geekDailyTemplateOutro =
  'Rebase 极客日报由社区志愿者共同维护，持续整理值得关注的技术内容与行业信号。';

const normalizeStringList = (items: string[]) =>
  Array.from(
    new Set(
      items
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );

export function buildGeekDailySummary(input: Pick<GeekDailyEpisodeInput, 'items'>) {
  const previewTitles = input.items
    .map((item) => item.title.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join('、');
  const suffix = input.items.length > 3 ? ' 等内容。' : '。';
  return `本期收录 ${input.items.length} 条社区推荐，涉及 ${previewTitles}${suffix}`;
}

export function buildGeekDailyBodyMarkdown(
  input: Pick<GeekDailyEpisodeInput, 'episodeNumber' | 'editors' | 'items' | 'bodyMarkdown'>,
) {
  const editors = normalizeStringList(input.editors);
  const customNote = input.bodyMarkdown.trim();
  const itemBlocks = input.items.map(
    (item, index) =>
      `### ${index + 1}. ${item.title}\n\n- 推荐人：${item.authorName}\n- 链接：${item.sourceUrl}\n- 推荐语：${item.summary}`,
  );
  const sections = [
    `极客日报#${input.episodeNumber}\n\n本期共收录 ${input.items.length} 条推荐内容。\n\n本期整理编辑：${
      editors.length > 0 ? editors.join('、') : '待补充'
    }。`,
    `${geekDailyTemplateItemsHeading}\n\n${itemBlocks.join('\n\n')}`,
  ];

  if (customNote) {
    sections.push(`${geekDailyTemplateNoteHeading}\n\n${customNote}`);
  }

  sections.push(`---\n\n${geekDailyTemplateOutro}`);

  return sections.join('\n\n').trim();
}

export function extractGeekDailyBodyNote(bodyMarkdown: string) {
  const normalized = bodyMarkdown.trim();

  if (!normalized) {
    return '';
  }

  if (!normalized.endsWith(geekDailyTemplateOutro)) {
    return '';
  }

  const outroMarker = `\n\n---\n\n${geekDailyTemplateOutro}`;
  const noteMarker = `\n\n${geekDailyTemplateNoteHeading}\n\n`;
  const noteStart = normalized.indexOf(noteMarker);
  const outroStart = normalized.lastIndexOf(outroMarker);

  if (noteStart === -1 || outroStart === -1 || outroStart <= noteStart) {
    return '';
  }

  const note = normalized.slice(noteStart + noteMarker.length, outroStart).trim();
  if (!note) {
    return '';
  }

  return note;
}

export const assetSchema = z.object({
  storageProvider: requiredTrimmedString('storage provider is required'),
  bucket: requiredTrimmedString('bucket is required'),
  objectKey: requiredTrimmedString('object key is required'),
  publicUrl: trimmedString.optional().default(''),
  visibility: z.enum(['public', 'private']).default('public'),
  assetType: requiredTrimmedString('asset type is required'),
  mimeType: requiredTrimmedString('mime type is required'),
  byteSize: z.number().int().nonnegative(),
  width: z.number().int().nonnegative().nullable().optional().default(null),
  height: z.number().int().nonnegative().nullable().optional().default(null),
  checksum: trimmedString.optional().default(''),
  originalFilename: requiredTrimmedString('original filename is required'),
  altText: trimmedString.optional().default(''),
  status: z.enum(assetStatusValues).default('active'),
});

export type AssetInput = z.infer<typeof assetSchema>;

export const staffCreateSchema = z.object({
  email: z.string().email(),
  name: requiredTrimmedString('name is required'),
  password: z.string().min(8, 'password must be at least 8 characters'),
  displayName: requiredTrimmedString('display name is required'),
  roleIds: z.array(z.string().uuid()).min(1, 'at least one role is required'),
  notes: trimmedString.optional().default(''),
});

export type StaffCreateInput = z.infer<typeof staffCreateSchema>;

export const staffUpdateSchema = z.object({
  displayName: requiredTrimmedString('display name is required'),
  status: z.enum(staffAccountStatusValues),
  roleIds: z.array(z.string().uuid()).min(1, 'at least one role is required'),
  notes: trimmedString.optional().default(''),
});

export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;

export interface AdminMePayload {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
  } | null;
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  } | null;
  staffAccount: {
    id: string;
    userId: string;
    status: StaffAccountStatus;
    displayName: string;
  } | null;
  roles: string[];
  permissions: string[];
}

export interface AdminDashboardStats {
  articles: number;
  jobs: number;
  events: number;
  contributors: number;
  contributorRoles: number;
  geekdailyEpisodes: number;
  assets: number;
  staff: number;
  auditLogs: number;
}

export interface AdminArticleListItem {
  id: string;
  slug: string;
  title: string;
  status: ContentStatus;
  publishedAt: string | null;
  updatedAt: string;
  readingTime: string;
  authorNames: string[];
}

export interface AdminArticleRecord extends ArticleInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminJobListItem {
  id: string;
  slug: string;
  companyName: string;
  roleTitle: string;
  status: ContentStatus;
  publishedAt: string | null;
  expiresAt: string | null;
  updatedAt: string;
  supportsRemote: boolean;
}

export interface AdminJobRecord extends JobInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEventListItem {
  id: string;
  slug: string;
  title: string;
  status: ContentStatus;
  startAt: string;
  endAt: string;
  city: string;
  registrationMode: RegistrationMode;
  updatedAt: string;
}

export interface AdminEventRecord extends EventInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContributorRoleRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminContributorListItem {
  id: string;
  slug: string;
  name: string;
  headline: string;
  status: ContentStatus;
  roleNames: string[];
  sortOrder: number;
  updatedAt: string;
}

export interface AdminGeekDailyListItem {
  id: string;
  slug: string;
  episodeNumber: number;
  title: string;
  status: ContentStatus;
  publishedAt: string;
  itemCount: number;
  updatedAt: string;
}

export interface AdminGeekDailyRecord extends GeekDailyEpisodeInput {
  id: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAssetRecord {
  id: string;
  storageProvider: string;
  bucket: string;
  objectKey: string;
  publicUrl: string | null;
  visibility: 'public' | 'private';
  assetType: string;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
  checksum: string | null;
  originalFilename: string;
  altText: string | null;
  status: AssetStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAssetUploadConfig {
  enabled: boolean;
  mode: 'r2-s3' | 'wrangler-cli' | 'disabled';
  storageProvider: 'r2';
  bucket: string;
  publicBaseUrl: string | null;
  message: string;
}

export interface AdminRoleRecord {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface AdminStaffRecord {
  id: string;
  userId: string;
  email: string;
  name: string;
  displayName: string;
  status: StaffAccountStatus;
  roleIds: string[];
  roleCodes: string[];
  notes: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditRecord {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  actorDisplayName: string | null;
  actorEmail: string | null;
  createdAt: string;
}

export interface AdminSiteEditorPayload {
  settings: SiteSettingsInput & { id: string };
  home: HomePageInput & { id: string };
  about: AboutPageInput & { id: string };
}

export interface AdminContributorDetailPayload {
  contributor: ContributorInput & { id: string; createdAt: string; updatedAt: string };
  availableRoles: AdminContributorRoleRecord[];
}

export interface AdminStaffDetailPayload {
  staff: AdminStaffRecord;
  roles: AdminRoleRecord[];
}

export const validateSiteSettingsInput = (payload: unknown) => safeParse(siteSettingsSchema, payload);
export const validateHomePageInput = (payload: unknown) => safeParse(homePageSchema, payload);
export const validateAboutPageInput = (payload: unknown) => safeParse(aboutPageSchema, payload);
export const validateArticleInput = (payload: unknown) => safeParse(articleSchema, payload);
export const validateJobInput = (payload: unknown) => safeParse(jobSchema, payload);
export const validateEventInput = (payload: unknown) => safeParse(eventSchema, payload);
export const validateContributorRoleInput = (payload: unknown) => safeParse(contributorRoleSchema, payload);
export const validateContributorInput = (payload: unknown) => safeParse(contributorSchema, payload);
export const validateGeekDailyEpisodeInput = (payload: unknown) => safeParse(geekdailyEpisodeSchema, payload);
export const validateAssetInput = (payload: unknown) => safeParse(assetSchema, payload);
export const validateStaffCreateInput = (payload: unknown) => safeParse(staffCreateSchema, payload);
export const validateStaffUpdateInput = (payload: unknown) => safeParse(staffUpdateSchema, payload);

marked.setOptions({
  breaks: true,
  gfm: true,
});

export const renderMarkdownToHtml = (source: string) => marked.parse(source) as string;
