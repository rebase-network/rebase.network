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
    label: 'Dashboard',
    href: '/dashboard',
    summary: 'See drafts, publishing status, and system health.',
    permission: 'dashboard.read',
  },
  {
    key: 'geekdaily',
    label: 'GeekDaily',
    href: '/geekdaily',
    summary: 'Publish daily episodes through an episode-first workflow.',
    permission: 'geekdaily.read',
  },
  {
    key: 'jobs',
    label: 'Who-Is-Hiring',
    href: '/jobs',
    summary: 'Manage community hiring posts with expiry and contact checks.',
    permission: 'job.read',
  },
  {
    key: 'articles',
    label: 'Articles',
    href: '/articles',
    summary: 'Write, preview, and publish long-form Rebase content.',
    permission: 'article.read',
  },
  {
    key: 'events',
    label: 'Events',
    href: '/events',
    summary: 'Manage current and historical event pages and registration notes.',
    permission: 'event.read',
  },
  {
    key: 'contributors',
    label: 'Contributors',
    href: '/contributors',
    summary: 'Maintain contributor profiles and role groupings.',
    permission: 'contributor.read',
  },
  {
    key: 'site',
    label: 'Pages and Navigation',
    href: '/site',
    summary: 'Update home, about, footer, and global site settings.',
    permission: 'site.manage',
  },
  {
    key: 'media',
    label: 'Media Library',
    href: '/assets',
    summary: 'Upload and reuse R2-backed media assets.',
    permission: 'asset.manage',
  },
  {
    key: 'staff',
    label: 'Staff and Permissions',
    href: '/staff',
    summary: 'Manage staff accounts, roles, and access rules.',
    permission: 'staff.manage',
  },
  {
    key: 'audit',
    label: 'Audit Logs',
    href: '/audit-logs',
    summary: 'Review sensitive publishing and permission changes.',
    permission: 'audit_log.read',
  },
];

export interface AdminFoundationCard {
  title: string;
  body: string;
}

export const adminFoundationCards: ReadonlyArray<AdminFoundationCard> = [
  {
    title: 'Task-oriented editing',
    body: 'The Rebase admin will be organized by operator workflows, not generic collections.',
  },
  {
    title: 'Validated publishing',
    body: 'All publish paths will move through explicit API validation and workflow states.',
  },
  {
    title: 'Shared contracts',
    body: 'Admin and API will share DTOs, enums, and module definitions from this package.',
  },
];
