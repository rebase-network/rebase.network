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

export const contributorActivityStatusValues = ['active', 'inactive'] as const;
export type ContributorActivityStatus = (typeof contributorActivityStatusValues)[number];

export const contributorActivityStatusOptions = contributorActivityStatusValues.map((value) => ({
  value,
  label: value,
}));

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
  label: requiredTrimmedString('标签不能为空'),
  href: requiredTrimmedString('链接不能为空'),
});

export const socialLinkSchema = linkItemSchema.extend({
  handle: trimmedString.optional().default(''),
});

export const footerGroupSchema = z.object({
  title: requiredTrimmedString('标题不能为空'),
  slug: requiredTrimmedString('URL 标识不能为空'),
  links: z.array(linkItemSchema).default([]),
});

export const homeStatSchema = z.object({
  value: requiredTrimmedString('内容不能为空'),
  label: requiredTrimmedString('标签不能为空'),
});

export const aboutSectionSchema = z.object({
  title: requiredTrimmedString('标题不能为空'),
  body: requiredTrimmedString('正文不能为空'),
});

export const articleAuthorSchema = z.object({
  name: requiredTrimmedString('作者姓名不能为空'),
  role: trimmedString.optional().default(''),
});

export const geekdailyItemSchema = z.object({
  title: requiredTrimmedString('标题不能为空'),
  authorName: requiredTrimmedString('作者姓名不能为空'),
  sourceUrl: requiredTrimmedString('来源链接不能为空'),
  summary: requiredTrimmedString('推荐语不能为空'),
});

export const geekdailyEditorSchema = requiredTrimmedString('编辑姓名不能为空');

export const siteSettingsSchema = z.object({
  siteName: requiredTrimmedString('站点名称不能为空'),
  tagline: requiredTrimmedString('站点副标题不能为空'),
  description: requiredTrimmedString('描述不能为空'),
  primaryDomain: requiredTrimmedString('主域名不能为空'),
  secondaryDomain: requiredTrimmedString('备用域名不能为空'),
  mediaDomain: requiredTrimmedString('媒体域名不能为空'),
  socialLinks: z.array(socialLinkSchema).default([]),
  footerGroups: z.array(footerGroupSchema).default([]),
  copyrightText: requiredTrimmedString('版权文案不能为空'),
});

export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

export const homePageSchema = z.object({
  heroTitle: requiredTrimmedString('首页主标题不能为空'),
  heroSummary: requiredTrimmedString('首页摘要不能为空'),
  heroPrimaryCtaLabel: requiredTrimmedString('主按钮文案不能为空'),
  heroPrimaryCtaUrl: requiredTrimmedString('主按钮链接不能为空'),
  heroSecondaryCtaLabel: requiredTrimmedString('次按钮文案不能为空'),
  heroSecondaryCtaUrl: requiredTrimmedString('次按钮链接不能为空'),
  homeStats: z.array(homeStatSchema).default([]),
});

export type HomePageInput = z.infer<typeof homePageSchema>;

export const aboutPageSchema = z.object({
  title: requiredTrimmedString('标题不能为空'),
  summary: requiredTrimmedString('摘要不能为空'),
  sections: z.array(aboutSectionSchema).default([]),
  seoTitle: trimmedString.optional().default(''),
  seoDescription: trimmedString.optional().default(''),
});

export type AboutPageInput = z.infer<typeof aboutPageSchema>;

export const articleSchema = z.object({
  slug: requiredTrimmedString('URL 标识不能为空'),
  title: requiredTrimmedString('标题不能为空'),
  summary: requiredTrimmedString('摘要不能为空'),
  bodyMarkdown: requiredTrimmedString('正文不能为空'),
  readingTime: requiredTrimmedString('阅读时长不能为空'),
  coverAssetId: z.string().uuid().optional().nullable().default(null),
  coverAccent: requiredTrimmedString('封面配色不能为空'),
  authors: z.array(articleAuthorSchema).min(1, '至少添加一位作者'),
  tags: z.array(trimmedString).default([]),
  seoTitle: trimmedString.optional().default(''),
  seoDescription: trimmedString.optional().default(''),
  status: z.enum(contentStatusValues).default('draft'),
  publishedAt: optionalTrimmedString,
});

export type ArticleInput = z.infer<typeof articleSchema>;

export const jobSchema = z
  .object({
    slug: trimmedString.optional().default(''),
    companyName: trimmedString.optional().default(''),
    roleTitle: trimmedString.optional().default(''),
    salary: trimmedString.optional().default(''),
    supportsRemote: z.boolean().default(false),
    isExpired: z.boolean().default(false),
    workMode: trimmedString.optional().default(''),
    location: trimmedString.optional().default(''),
    summary: trimmedString.optional().default(''),
    descriptionMarkdown: trimmedString.optional().default(''),
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
    const requiresPublishReadyDetails = value.status === 'published';

    if (requiresPublishReadyDetails && !value.slug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['slug'],
        message: 'URL 标识不能为空',
      });
    }

    if (requiresPublishReadyDetails && !value.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyName'],
        message: '团队 / 公司不能为空',
      });
    }

    if (requiresPublishReadyDetails && !value.roleTitle) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['roleTitle'],
        message: '岗位名称不能为空',
      });
    }

    if (requiresPublishReadyDetails && !value.salary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['salary'],
        message: '薪资范围不能为空',
      });
    }

    if (requiresPublishReadyDetails && !value.workMode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['workMode'],
        message: '工作模式不能为空',
      });
    }

    if (requiresPublishReadyDetails && !value.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['location'],
        message: '地点不能为空',
      });
    }

    if (requiresPublishReadyDetails && !value.summary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['summary'],
        message: '摘要不能为空',
      });
    }

    if (requiresPublishReadyDetails && !value.descriptionMarkdown) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['descriptionMarkdown'],
        message: '描述不能为空',
      });
    }

    if (requiresPublishReadyDetails && !value.applyUrl && !value.contactValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['applyUrl'],
        message: '请填写投递链接或联系方式',
      });
    }
  });

export type JobInput = z.infer<typeof jobSchema>;

export const eventSchema = z
  .object({
    slug: trimmedString.optional().default(''),
    title: requiredTrimmedString('标题不能为空'),
    summary: requiredTrimmedString('摘要不能为空'),
    bodyMarkdown: requiredTrimmedString('正文不能为空'),
    startAt: optionalTrimmedString,
    endAt: optionalTrimmedString,
    city: trimmedString.optional().default(''),
    location: trimmedString.optional().default(''),
    venue: trimmedString.optional().default(''),
    coverAssetId: z.string().uuid().optional().nullable().default(null),
    registrationMode: z.enum(registrationModeValues).default('external_url'),
    registrationUrl: optionalTrimmedString,
    tags: z.array(trimmedString).default([]),
    seoTitle: trimmedString.optional().default(''),
    seoDescription: trimmedString.optional().default(''),
    status: z.enum(contentStatusValues).default('draft'),
    publishedAt: optionalTrimmedString,
  })
  .superRefine((value, ctx) => {
    const requiresPublishReadyDetails = value.status === 'published';

    if (requiresPublishReadyDetails && !value.slug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['slug'],
        message: 'URL 标识不能为空',
      });
    }

    if (requiresPublishReadyDetails && !value.startAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startAt'],
        message: '开始时间不能为空',
      });
    }

    if (requiresPublishReadyDetails && !value.endAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endAt'],
        message: '结束时间不能为空',
      });
    }

    if (requiresPublishReadyDetails && !value.city) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['city'],
        message: '城市不能为空',
      });
    }

    if (requiresPublishReadyDetails && !value.location) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['location'],
        message: '地点不能为空',
      });
    }

    if (requiresPublishReadyDetails && !value.venue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['venue'],
        message: '场地名称不能为空',
      });
    }

    if (requiresPublishReadyDetails && value.registrationMode === 'external_url' && !value.registrationUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['registrationUrl'],
        message: '选择外部链接报名时，报名链接不能为空',
      });
    }

    const startAtTimestamp = value.startAt ? Date.parse(value.startAt) : Number.NaN;
    const endAtTimestamp = value.endAt ? Date.parse(value.endAt) : Number.NaN;

    if (value.startAt && Number.isNaN(startAtTimestamp)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startAt'],
        message: '开始时间格式不正确',
      });
    }

    if (value.endAt && Number.isNaN(endAtTimestamp)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endAt'],
        message: '结束时间格式不正确',
      });
    }

    if (!Number.isNaN(startAtTimestamp) && !Number.isNaN(endAtTimestamp) && startAtTimestamp >= endAtTimestamp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endAt'],
        message: '结束时间必须晚于开始时间',
      });
    }
  });

export type EventInput = z.infer<typeof eventSchema>;

export const contributorRoleSchema = z.object({
  slug: requiredTrimmedString('URL 标识不能为空'),
  name: requiredTrimmedString('名称不能为空'),
  description: requiredTrimmedString('描述不能为空'),
  sortOrder: z.number().int().default(0),
  status: z.enum(contentStatusValues).default('draft'),
});

export type ContributorRoleInput = z.infer<typeof contributorRoleSchema>;

export const contributorSchema = z.object({
  slug: requiredTrimmedString('URL 标识不能为空'),
  name: requiredTrimmedString('名称不能为空'),
  headline: requiredTrimmedString('头衔不能为空'),
  bio: requiredTrimmedString('简介不能为空'),
  avatarAssetId: z.string().uuid().optional().nullable().default(null),
  avatarSeed: requiredTrimmedString('头像种子不能为空'),
  twitterUrl: trimmedString.optional().default(''),
  wechat: trimmedString.optional().default(''),
  telegram: trimmedString.optional().default(''),
  sortOrder: z.number().int().default(0),
  roleIds: z.array(z.string().uuid()).min(1, '至少选择一个贡献者角色'),
  status: z.enum(contentStatusValues).default('draft'),
  activityStatus: z.enum(contributorActivityStatusValues).default('active'),
});

export type ContributorInput = z.infer<typeof contributorSchema>;

export const geekdailyEpisodeSchema = z.object({
  episodeNumber: z.number().int().positive(),
  title: requiredTrimmedString('标题不能为空'),
  summary: trimmedString.default(''),
  bodyMarkdown: trimmedString.default(''),
  editors: z.array(geekdailyEditorSchema).default([]),
  tags: z.array(trimmedString).default([]),
  status: z.enum(contentStatusValues).default('draft'),
  publishedAt: trimmedString.default(''),
  items: z.array(geekdailyItemSchema).min(1, '至少添加一条内容'),
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
  storageProvider: requiredTrimmedString('存储服务不能为空'),
  bucket: requiredTrimmedString('存储桶不能为空'),
  objectKey: requiredTrimmedString('对象键不能为空'),
  publicUrl: trimmedString.optional().default(''),
  visibility: z.enum(['public', 'private']).default('public'),
  assetType: requiredTrimmedString('资源类型不能为空'),
  mimeType: requiredTrimmedString('MIME 类型不能为空'),
  byteSize: z.number().int().nonnegative(),
  width: z.number().int().nonnegative().nullable().optional().default(null),
  height: z.number().int().nonnegative().nullable().optional().default(null),
  checksum: trimmedString.optional().default(''),
  originalFilename: requiredTrimmedString('原始文件名不能为空'),
  altText: trimmedString.optional().default(''),
  status: z.enum(assetStatusValues).default('active'),
});

export type AssetInput = z.infer<typeof assetSchema>;

export const staffCreateSchema = z.object({
  email: z.string().email(),
  name: requiredTrimmedString('名称不能为空'),
  password: z.string().min(8, '密码至少需要 8 个字符'),
  displayName: requiredTrimmedString('显示名称不能为空'),
  roleIds: z.array(z.string().uuid()).min(1, '至少选择一个角色'),
  notes: trimmedString.optional().default(''),
});

export type StaffCreateInput = z.infer<typeof staffCreateSchema>;

export const staffUpdateSchema = z.object({
  displayName: requiredTrimmedString('显示名称不能为空'),
  status: z.enum(staffAccountStatusValues),
  roleIds: z.array(z.string().uuid()).min(1, '至少选择一个角色'),
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
  publicNumber: number;
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
  publicNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminJobListItem {
  id: string;
  publicNumber: number;
  slug: string;
  companyName: string;
  roleTitle: string;
  editorName: string | null;
  status: ContentStatus;
  isExpired: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  updatedAt: string;
  supportsRemote: boolean;
}

export interface AdminJobRecord extends JobInput {
  id: string;
  publicNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminEventListItem {
  id: string;
  publicNumber: number;
  slug: string;
  title: string;
  editorName: string | null;
  status: ContentStatus;
  startAt: string | null;
  endAt: string | null;
  city: string;
  registrationMode: RegistrationMode;
  updatedAt: string;
}

export interface AdminEventRecord extends EventInput {
  id: string;
  publicNumber: number;
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
  activityStatus: ContributorActivityStatus;
  roleNames: string[];
  sortOrder: number;
  updatedAt: string;
}

export interface AdminGeekDailyListItem {
  id: string;
  slug: string;
  episodeNumber: number;
  title: string;
  editors: string[];
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
