import type { RouteRecordRaw } from 'vue-router';

import DashboardPage from './views/DashboardPage.vue';
import LoginPage from './views/LoginPage.vue';
import ModulePage from './views/ModulePage.vue';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/login',
    component: LoginPage,
  },
  {
    path: '/dashboard',
    component: DashboardPage,
  },
  {
    path: '/geekdaily',
    component: ModulePage,
    props: {
      title: 'GeekDaily',
      summary: 'Design the GeekDaily editor around episodes and ordered recommendation items, not generic JSON fields.',
      highlights: [
        'Episode-first list and editor workflow',
        'Validation for unique episode number and source URLs',
        'Support for historical import and practical preview',
      ],
    },
  },
  {
    path: '/jobs',
    component: ModulePage,
    props: {
      title: 'Who-Is-Hiring',
      summary: 'Jobs should be published through a structured staff form with expiry, remote support, and contact validation.',
      highlights: [
        'Task-friendly job editor',
        'Archive instead of delete',
        'Filters for mode, location, and live status',
      ],
    },
  },
  {
    path: '/articles',
    component: ModulePage,
    props: {
      title: 'Articles',
      summary: 'Long-form publishing will use Markdown plus explicit metadata for authors, cover images, and SEO.',
      highlights: [
        'Draft, publish, and archive actions',
        'Preview before release',
        'Shared contracts with the API',
      ],
    },
  },
  {
    path: '/events',
    component: ModulePage,
    props: {
      title: 'Events',
      summary: 'Events will focus on public listing quality, external registration details, and clean archive handling.',
      highlights: [
        'Upcoming and past segmentation',
        'Registration note and link validation',
        'Date-prefixed public URLs',
      ],
    },
  },
  {
    path: '/contributors',
    component: ModulePage,
    props: {
      title: 'Contributors',
      summary: 'Contributor maintenance should preserve role grouping, social links, and editorial-friendly profile editing.',
      highlights: [
        'Role grouping for volunteers and advisors',
        'Avatar, intro, and social metadata',
        'Sorting and publish controls',
      ],
    },
  },
  {
    path: '/site',
    component: ModulePage,
    props: {
      title: 'Pages and Navigation',
      summary: 'Singleton pages such as Home and About should be edited through section-based forms rather than raw JSON textareas.',
      highlights: [
        'Home, About, and Footer editing',
        'Global site settings and domains',
        'Friendly social and footer link management',
      ],
    },
  },
  {
    path: '/media',
    component: ModulePage,
    props: {
      title: 'Media Library',
      summary: 'Assets should be uploaded to R2 through signed flows and reused across content editors through a shared library.',
      highlights: [
        'Purpose-specific asset metadata',
        'Alt text and visibility controls',
        'Shared media picker integration',
      ],
    },
  },
  {
    path: '/staff',
    component: ModulePage,
    props: {
      title: 'Staff and Permissions',
      summary: 'Only staff access the admin, and roles should remain explicit and auditable.',
      highlights: [
        'Better Auth for identity',
        'Application-owned staff roles and permissions',
        'Future role matrix and staff status controls',
      ],
    },
  },
  {
    path: '/audit',
    component: ModulePage,
    props: {
      title: 'Audit Logs',
      summary: 'Sensitive publishing and permission changes should remain reviewable through a dedicated audit view.',
      highlights: [
        'Actor, action, target, and time filtering',
        'Request correlation readiness',
        'Publish and role-change traceability',
      ],
    },
  },
];
