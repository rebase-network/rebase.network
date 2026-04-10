export interface AdminModule {
  key: string;
  label: string;
  href: string;
  summary: string;
  permission?: string;
}

export const adminModules: ReadonlyArray<AdminModule> = [
  {
    key: 'dashboard',
    label: '概览',
    href: '/dashboard',
    summary: '查看内容概览与系统状态。',
    permission: 'dashboard.read',
  },
  {
    key: 'geekdaily',
    label: '极客日报',
    href: '/geekdaily',
    summary: '按 episode 维护与发布 GeekDaily。',
    permission: 'geekdaily.read',
  },
  {
    key: 'jobs',
    label: '招聘',
    href: '/jobs',
    summary: '维护社区招聘信息与投递方式。',
    permission: 'job.read',
  },
  {
    key: 'articles',
    label: '文章',
    href: '/articles',
    summary: '维护社区文章内容与发布状态。',
    permission: 'article.read',
  },
  {
    key: 'events',
    label: '活动',
    href: '/events',
    summary: '维护社区活动与报名说明。',
    permission: 'event.read',
  },
  {
    key: 'contributors',
    label: '贡献者',
    href: '/contributors',
    summary: '维护贡献者资料、活跃状态与角色入口。',
    permission: 'contributor.read',
  },
  {
    key: 'site',
    label: '站点页面',
    href: '/site',
    summary: '维护首页、关于页、页脚与全局设置。',
    permission: 'site.manage',
  },
  {
    key: 'media',
    label: '媒体库',
    href: '/assets',
    summary: '上传并复用 R2 媒体资源。',
    permission: 'asset.manage',
  },
  {
    key: 'staff',
    label: '工作人员',
    href: '/staff',
    summary: '管理工作人员账号与权限。',
    permission: 'staff.manage',
  },
  {
    key: 'audit',
    label: '审计日志',
    href: '/audit-logs',
    summary: '查看关键发布与权限变更记录。',
    permission: 'audit_log.read',
  },
];

export interface AdminFoundationCard {
  title: string;
  body: string;
}

export const adminFoundationCards: ReadonlyArray<AdminFoundationCard> = [
  {
    title: '任务导向编辑',
    body: 'Rebase 后台围绕运营动作组织，而不是直接暴露底层数据集合。',
  },
  {
    title: '校验后发布',
    body: '所有发布动作都通过明确的 API 校验和状态流转执行。',
  },
  {
    title: '共享契约',
    body: '后台与 API 共享同一套 DTO、枚举和模块定义。',
  },
];
