import { createRouter, createWebHistory } from 'vue-router';

import { authClient } from './lib/auth-client';
import { resolveAdminRouteAccess } from './lib/auth-guard';
import ArticleEditorPage from './views/ArticleEditorPage.vue';
import ArticlesPage from './views/ArticlesPage.vue';
import AssetsPage from './views/AssetsPage.vue';
import AuditLogsPage from './views/AuditLogsPage.vue';
import ContributorEditorPage from './views/ContributorEditorPage.vue';
import ContributorsPage from './views/ContributorsPage.vue';
import ContributorRolesPage from './views/ContributorRolesPage.vue';
import DashboardPage from './views/DashboardPage.vue';
import EventEditorPage from './views/EventEditorPage.vue';
import EventsPage from './views/EventsPage.vue';
import GeekDailyEditorPage from './views/GeekDailyEditorPage.vue';
import GeekDailyPage from './views/GeekDailyPage.vue';
import JobEditorPage from './views/JobEditorPage.vue';
import JobsPage from './views/JobsPage.vue';
import LoginPage from './views/LoginPage.vue';
import SiteEditorPage from './views/SiteEditorPage.vue';
import StaffPage from './views/StaffPage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/dashboard', name: 'dashboard', component: DashboardPage, meta: { requiresAuth: true } },
    { path: '/articles', name: 'articles', component: ArticlesPage, meta: { requiresAuth: true } },
    { path: '/articles/new', name: 'article-create', component: ArticleEditorPage, meta: { requiresAuth: true } },
    { path: '/articles/:id/edit', name: 'article-edit', component: ArticleEditorPage, meta: { requiresAuth: true } },
    { path: '/jobs', name: 'jobs', component: JobsPage, meta: { requiresAuth: true } },
    { path: '/jobs/new', name: 'job-create', component: JobEditorPage, meta: { requiresAuth: true } },
    { path: '/jobs/:id/edit', name: 'job-edit', component: JobEditorPage, meta: { requiresAuth: true } },
    { path: '/events', name: 'events', component: EventsPage, meta: { requiresAuth: true } },
    { path: '/events/new', name: 'event-create', component: EventEditorPage, meta: { requiresAuth: true } },
    { path: '/events/:id/edit', name: 'event-edit', component: EventEditorPage, meta: { requiresAuth: true } },
    { path: '/geekdaily', name: 'geekdaily', component: GeekDailyPage, meta: { requiresAuth: true } },
    { path: '/geekdaily/new', name: 'geekdaily-create', component: GeekDailyEditorPage, meta: { requiresAuth: true } },
    { path: '/geekdaily/:id/edit', name: 'geekdaily-edit', component: GeekDailyEditorPage, meta: { requiresAuth: true } },
    { path: '/contributors', name: 'contributors', component: ContributorsPage, meta: { requiresAuth: true } },
    { path: '/contributors/roles', name: 'contributor-roles', component: ContributorRolesPage, meta: { requiresAuth: true } },
    { path: '/contributors/new', name: 'contributor-create', component: ContributorEditorPage, meta: { requiresAuth: true } },
    { path: '/contributors/:id/edit', name: 'contributor-edit', component: ContributorEditorPage, meta: { requiresAuth: true } },
    { path: '/site', name: 'site', component: SiteEditorPage, meta: { requiresAuth: true } },
    { path: '/assets', name: 'assets', component: AssetsPage, meta: { requiresAuth: true } },
    { path: '/staff', name: 'staff', component: StaffPage, meta: { requiresAuth: true } },
    { path: '/audit-logs', name: 'audit-logs', component: AuditLogsPage, meta: { requiresAuth: true } },
  ],
});

router.beforeEach(async (to) => resolveAdminRouteAccess(Boolean(to.meta.requiresAuth), () => authClient.getSession()));
