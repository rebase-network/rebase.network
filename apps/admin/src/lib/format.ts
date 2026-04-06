import type { ContentStatus, RegistrationMode, StaffAccountStatus } from '@rebase/shared';

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

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const formatBoolean = (value: boolean) => (value ? '是' : '否');
