import type { AssetStatus, ContentStatus, ContributorActivityStatus, RegistrationMode, StaffAccountStatus } from '@rebase/shared';

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const toDateTimeInputValue = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetMinutes = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offsetMinutes * 60_000);
  return local.toISOString().slice(0, 16);
};

export const fromDateTimeInputValue = (value: string) => (value ? new Date(value).toISOString() : null);

export const formatContentStatus = (status: ContentStatus) => {
  switch (status) {
    case 'draft':
      return '草稿';
    case 'published':
      return '已发布';
    case 'archived':
      return '已归档';
    default:
      return status;
  }
};

export const formatStaffAccountStatus = (status: StaffAccountStatus) => {
  switch (status) {
    case 'invited':
      return '待激活';
    case 'active':
      return '启用';
    case 'suspended':
      return '暂停';
    case 'disabled':
      return '停用';
    default:
      return status;
  }
};

export const formatContributorActivityStatus = (status: ContributorActivityStatus) => {
  switch (status) {
    case 'active':
      return '活跃';
    case 'inactive':
      return '不活跃';
    default:
      return status;
  }
};

const adminRoleLabelMap: Record<string, string> = {
  super_admin: '超级管理员',
  content_editor: '内容编辑',
  'Super Admin': '超级管理员',
  'Content Editor': '内容编辑',
};

export const formatAdminRoleLabel = (value?: string | null, fallback?: string | null) => {
  if (value && adminRoleLabelMap[value]) {
    return adminRoleLabelMap[value];
  }

  if (fallback && adminRoleLabelMap[fallback]) {
    return adminRoleLabelMap[fallback];
  }

  return value || fallback || '—';
};

export const formatAdminRoleList = (values: string[]) => {
  const labels = values.map((value) => formatAdminRoleLabel(value)).filter(Boolean);
  return labels.length > 0 ? labels.join('、') : '未分配角色';
};

export const formatRegistrationMode = (value: RegistrationMode) => {
  switch (value) {
    case 'external_url':
      return '外部链接';
    case 'announcement_only':
      return '仅公告说明';
    default:
      return value;
  }
};

export const formatAssetStatus = (status: AssetStatus) => {
  switch (status) {
    case 'uploaded':
      return '已上传';
    case 'active':
      return '可用';
    case 'archived':
      return '已归档';
    case 'deleted':
      return '已删除';
    default:
      return status;
  }
};

export const formatAssetVisibility = (value: 'public' | 'private') => {
  switch (value) {
    case 'public':
      return '公开';
    case 'private':
      return '私有';
    default:
      return value;
  }
};

export const formatFileSize = (value?: number | null) => {
  if (!value || value <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let index = 0;

  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }

  const digits = size >= 100 || index === 0 ? 0 : size >= 10 ? 1 : 2;
  return `${size.toFixed(digits)} ${units[index]}`;
};

export const formatAuditAction = (action: string) => {
  const [target, verb] = action.split('.');

  const targetLabelMap: Record<string, string> = {
    article: '文章',
    asset: '媒体',
    contributor: '贡献者',
    contributor_role: '贡献者角色',
    event: '活动',
    geekdaily: '极客日报',
    home: '首页',
    job: '招聘',
    site: '站点',
    about: '关于页',
    staff: '工作人员',
  };

  const verbLabelMap: Record<string, string> = {
    create: '创建',
    update: '更新',
    publish: '发布',
    archive: '归档',
    upload: '上传',
  };

  if (!target || !verb) {
    return action;
  }

  return `${verbLabelMap[verb] ?? verb} ${targetLabelMap[target] ?? target}`;
};

export const formatAuditTargetType = (targetType: string) => {
  const targetTypeMap: Record<string, string> = {
    about_page: '关于页',
    article: '文章',
    asset: '媒体资源',
    contributor: '贡献者',
    contributor_role: '贡献者角色',
    event: '活动',
    geekdaily_episode: '极客日报期数',
    home_page: '首页',
    job: '招聘信息',
    site_settings: '站点设置',
    staff_account: '工作人员账号',
  };

  return targetTypeMap[targetType] ?? targetType;
};

export const formatAuditSummary = (summary: string) => {
  const rules: Array<[RegExp, (match: RegExpExecArray) => string]> = [
    [/^Created staff account (.+)$/i, (m) => `已创建工作人员账号 ${m[1]}`],
    [/^Updated staff account (.+)$/i, (m) => `已更新工作人员账号 ${m[1]}`],
    [/^Created contributor role (.+)$/i, (m) => `已创建贡献者角色 ${m[1]}`],
    [/^Updated contributor role (.+)$/i, (m) => `已更新贡献者角色 ${m[1]}`],
    [/^Created contributor (.+)$/i, (m) => `已创建贡献者 ${m[1]}`],
    [/^Updated contributor (.+)$/i, (m) => `已更新贡献者 ${m[1]}`],
    [/^Created event (.+)$/i, (m) => `已创建活动 ${m[1]}`],
    [/^Updated event (.+)$/i, (m) => `已更新活动 ${m[1]}`],
    [/^Published event (.+)$/i, (m) => `已发布活动 ${m[1]}`],
    [/^Archived event (.+)$/i, (m) => `已归档活动 ${m[1]}`],
    [/^Created job (.+)$/i, (m) => `已创建招聘 ${m[1]}`],
    [/^Updated job (.+)$/i, (m) => `已更新招聘 ${m[1]}`],
    [/^Published job (.+)$/i, (m) => `已发布招聘 ${m[1]}`],
    [/^Archived job (.+)$/i, (m) => `已归档招聘 ${m[1]}`],
    [/^Created article (.+)$/i, (m) => `已创建文章 ${m[1]}`],
    [/^Updated article (.+)$/i, (m) => `已更新文章 ${m[1]}`],
    [/^Published article (.+)$/i, (m) => `已发布文章 ${m[1]}`],
    [/^Archived article (.+)$/i, (m) => `已归档文章 ${m[1]}`],
    [/^Created GeekDaily episode (.+)$/i, (m) => `已创建极客日报第 ${m[1]} 期`],
    [/^Updated GeekDaily episode (.+)$/i, (m) => `已更新极客日报第 ${m[1]} 期`],
    [/^Published GeekDaily episode (.+)$/i, (m) => `已发布极客日报第 ${m[1]} 期`],
    [/^Archived GeekDaily episode (.+)$/i, (m) => `已归档极客日报第 ${m[1]} 期`],
    [/^Created asset (.+)$/i, (m) => `已创建媒体记录 ${m[1]}`],
    [/^Uploaded asset (.+)$/i, (m) => `已上传媒体资源 ${m[1]}`],
    [/^Updated asset (.+)$/i, (m) => `已更新媒体记录 ${m[1]}`],
    [/^Updated global site settings$/i, () => '已更新全局站点设置'],
    [/^Updated homepage content$/i, () => '已更新首页内容'],
    [/^Updated about page$/i, () => '已更新关于页'],
  ];

  for (const [pattern, formatter] of rules) {
    const match = pattern.exec(summary);
    if (match) {
      return formatter(match);
    }
  }

  return summary;
};

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const formatBoolean = (value: boolean) => (value ? '是' : '否');
