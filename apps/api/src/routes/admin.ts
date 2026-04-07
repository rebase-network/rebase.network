import { Hono } from 'hono';

import {
  assetStatusValues,
  contentStatusValues,
  validateAboutPageInput,
  validateArticleInput,
  validateAssetInput,
  validateContributorInput,
  validateContributorRoleInput,
  validateEventInput,
  validateGeekDailyEpisodeInput,
  validateHomePageInput,
  validateJobInput,
  validateSiteSettingsInput,
  validateStaffCreateInput,
  validateStaffUpdateInput,
} from '@rebase/shared';

import { listAuditEntries } from '../lib/audit.js';
import { getDashboardStats } from '../lib/access.js';
import { createAdminArticle, getAdminArticle, listAdminArticles, publishAdminArticle, updateAdminArticle, archiveAdminArticle } from '../lib/articles.js';
import { createAdminAsset, getAdminAsset, getAdminAssetUploadConfig, listAdminAssets, updateAdminAsset, uploadAdminAsset } from '../lib/assets.js';
import { createAdminContributor, createAdminContributorRole, getAdminContributor, listAdminContributorRoles, listAdminContributors, updateAdminContributor, updateAdminContributorRole } from '../lib/contributors.js';
import { createAdminEvent, getAdminEvent, listAdminEvents, publishAdminEvent, updateAdminEvent, archiveAdminEvent } from '../lib/events.js';
import { createAdminGeekDailyEpisode, getAdminGeekDailyEpisode, listAdminGeekDailyEpisodes, publishAdminGeekDailyEpisode, updateAdminGeekDailyEpisode, archiveAdminGeekDailyEpisode } from '../lib/geekdaily.js';
import { handleApiError, jsonError, ok } from '../lib/http.js';
import { createAdminJob, getAdminJob, listAdminJobs, publishAdminJob, updateAdminJob, archiveAdminJob } from '../lib/jobs.js';
import { getAdminSite, updateAboutPage, updateHomePage, updateSiteSettings } from '../lib/site.js';
import { createAdminStaff, getAdminStaff, listAdminRoles, listAdminStaff, updateAdminStaff } from '../lib/staff.js';
import { getAdminMePayload, requireActiveStaff, type AppVariables } from '../middleware/auth.js';
import { readPaginationInput } from '../lib/pagination.js';

export const adminRoutes = new Hono<{ Variables: AppVariables }>();

const getAuditActor = (c: any) => ({
  actorUserId: c.get('user')?.id ?? null,
  actorStaffAccountId: c.get('staffAccount')?.id ?? null,
  actorDisplayName: c.get('staffAccount')?.displayName ?? c.get('user')?.name ?? c.get('user')?.email ?? null,
  requestId: c.get('requestId') ?? null,
  requestIp: c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
  userAgent: c.req.header('user-agent') ?? null,
});

const expectValid = <T>(c: any, result: { valid: boolean; data?: T; issues?: { path: string; message: string }[] }) => {
  if (result.valid && result.data) {
    return result.data;
  }

  c.status(400);
  throw new Error(JSON.stringify({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'one or more fields failed validation',
      details: { issues: result.issues ?? [] },
    },
  }));
};

const readOptionalString = (value: FormDataEntryValue | null) => (typeof value === 'string' ? value : '');
const readEnumQueryValue = <T extends readonly string[]>(value: string | undefined, allowed: T): T[number] | undefined =>
  value && (allowed as readonly string[]).includes(value) ? (value as T[number]) : undefined;
const readAssetVisibility = (value: string | undefined) => (value === 'public' || value === 'private' ? value : undefined);

adminRoutes.use('*', requireActiveStaff());

adminRoutes.get('/me', (c) => c.json(ok(getAdminMePayload(c.var))));
adminRoutes.get('/dashboard', requireActiveStaff('dashboard.read'), async (c) => c.json(ok({ stats: await getDashboardStats() })));

adminRoutes.get('/site', requireActiveStaff('site.manage'), async (c) => c.json(ok(await getAdminSite())));
adminRoutes.patch('/site/settings', requireActiveStaff('site.manage'), async (c) => {
  const payload = expectValid(c, validateSiteSettingsInput(await c.req.json().catch(() => null)));
  return c.json(ok(await updateSiteSettings(payload, getAuditActor(c))));
});
adminRoutes.patch('/site/home', requireActiveStaff('site.manage'), async (c) => {
  const payload = expectValid(c, validateHomePageInput(await c.req.json().catch(() => null)));
  return c.json(ok(await updateHomePage(payload, getAuditActor(c))));
});
adminRoutes.patch('/site/about', requireActiveStaff('site.manage'), async (c) => {
  const payload = expectValid(c, validateAboutPageInput(await c.req.json().catch(() => null)));
  return c.json(ok(await updateAboutPage(payload, getAuditActor(c))));
});

adminRoutes.get('/articles', requireActiveStaff('article.read'), async (c) => {
  const result = await listAdminArticles({
    ...readPaginationInput({ page: c.req.query('page'), pageSize: c.req.query('pageSize') }),
    query: c.req.query('query') ?? '',
    status: readEnumQueryValue(c.req.query('status'), contentStatusValues),
  });
  return c.json(ok(result.items, result.meta));
});
adminRoutes.post('/articles', requireActiveStaff('article.write'), async (c) => {
  const payload = expectValid(c, validateArticleInput(await c.req.json().catch(() => null)));
  return c.json(ok(await createAdminArticle(payload, getAuditActor(c))), 201);
});
adminRoutes.get('/articles/:id', requireActiveStaff('article.read'), async (c) => {
  const record = await getAdminArticle(c.req.param('id'));
  if (!record) {
    return jsonError(c, 404, 'NOT_FOUND', 'article not found');
  }
  return c.json(ok(record));
});
adminRoutes.patch('/articles/:id', requireActiveStaff('article.write'), async (c) => {
  const payload = expectValid(c, validateArticleInput(await c.req.json().catch(() => null)));
  return c.json(ok(await updateAdminArticle(c.req.param('id'), payload, getAuditActor(c))));
});
adminRoutes.post('/articles/:id/publish', requireActiveStaff('article.publish'), async (c) => c.json(ok(await publishAdminArticle(c.req.param('id'), getAuditActor(c)))));
adminRoutes.post('/articles/:id/archive', requireActiveStaff('article.publish'), async (c) => c.json(ok(await archiveAdminArticle(c.req.param('id'), getAuditActor(c)))));

adminRoutes.get('/jobs', requireActiveStaff('job.read'), async (c) => {
  const result = await listAdminJobs({
    ...readPaginationInput({ page: c.req.query('page'), pageSize: c.req.query('pageSize') }),
    query: c.req.query('query') ?? '',
    status: readEnumQueryValue(c.req.query('status'), contentStatusValues),
  });
  return c.json(ok(result.items, result.meta));
});
adminRoutes.post('/jobs', requireActiveStaff('job.write'), async (c) => {
  const payload = expectValid(c, validateJobInput(await c.req.json().catch(() => null)));
  return c.json(ok(await createAdminJob(payload, getAuditActor(c))), 201);
});
adminRoutes.get('/jobs/:id', requireActiveStaff('job.read'), async (c) => {
  const record = await getAdminJob(c.req.param('id'));
  if (!record) {
    return jsonError(c, 404, 'NOT_FOUND', 'job not found');
  }
  return c.json(ok(record));
});
adminRoutes.patch('/jobs/:id', requireActiveStaff('job.write'), async (c) => {
  const payload = expectValid(c, validateJobInput(await c.req.json().catch(() => null)));
  return c.json(ok(await updateAdminJob(c.req.param('id'), payload, getAuditActor(c))));
});
adminRoutes.post('/jobs/:id/publish', requireActiveStaff('job.publish'), async (c) => c.json(ok(await publishAdminJob(c.req.param('id'), getAuditActor(c)))));
adminRoutes.post('/jobs/:id/archive', requireActiveStaff('job.publish'), async (c) => c.json(ok(await archiveAdminJob(c.req.param('id'), getAuditActor(c)))));

adminRoutes.get('/events', requireActiveStaff('event.read'), async (c) => {
  const result = await listAdminEvents({
    ...readPaginationInput({ page: c.req.query('page'), pageSize: c.req.query('pageSize') }),
    query: c.req.query('query') ?? '',
    status: readEnumQueryValue(c.req.query('status'), contentStatusValues),
  });
  return c.json(ok(result.items, result.meta));
});
adminRoutes.post('/events', requireActiveStaff('event.write'), async (c) => {
  const payload = expectValid(c, validateEventInput(await c.req.json().catch(() => null)));
  return c.json(ok(await createAdminEvent(payload, getAuditActor(c))), 201);
});
adminRoutes.get('/events/:id', requireActiveStaff('event.read'), async (c) => {
  const record = await getAdminEvent(c.req.param('id'));
  if (!record) {
    return jsonError(c, 404, 'NOT_FOUND', 'event not found');
  }
  return c.json(ok(record));
});
adminRoutes.patch('/events/:id', requireActiveStaff('event.write'), async (c) => {
  const payload = expectValid(c, validateEventInput(await c.req.json().catch(() => null)));
  return c.json(ok(await updateAdminEvent(c.req.param('id'), payload, getAuditActor(c))));
});
adminRoutes.post('/events/:id/publish', requireActiveStaff('event.publish'), async (c) => c.json(ok(await publishAdminEvent(c.req.param('id'), getAuditActor(c)))));
adminRoutes.post('/events/:id/archive', requireActiveStaff('event.publish'), async (c) => c.json(ok(await archiveAdminEvent(c.req.param('id'), getAuditActor(c)))));

adminRoutes.get('/contributors/roles', requireActiveStaff('contributor.read'), async (c) => c.json(ok(await listAdminContributorRoles())));
adminRoutes.post('/contributors/roles', requireActiveStaff('contributor.write'), async (c) => {
  const payload = expectValid(c, validateContributorRoleInput(await c.req.json().catch(() => null)));
  return c.json(ok(await createAdminContributorRole(payload, getAuditActor(c))), 201);
});
adminRoutes.patch('/contributors/roles/:id', requireActiveStaff('contributor.write'), async (c) => {
  const payload = expectValid(c, validateContributorRoleInput(await c.req.json().catch(() => null)));
  return c.json(ok(await updateAdminContributorRole(c.req.param('id'), payload, getAuditActor(c))));
});
adminRoutes.get('/contributors', requireActiveStaff('contributor.read'), async (c) => {
  const result = await listAdminContributors(readPaginationInput({ page: c.req.query('page'), pageSize: c.req.query('pageSize') }));
  return c.json(ok(result.items, result.meta));
});
adminRoutes.post('/contributors', requireActiveStaff('contributor.write'), async (c) => {
  const payload = expectValid(c, validateContributorInput(await c.req.json().catch(() => null)));
  return c.json(ok(await createAdminContributor(payload, getAuditActor(c))), 201);
});
adminRoutes.get('/contributors/:id', requireActiveStaff('contributor.read'), async (c) => {
  const record = await getAdminContributor(c.req.param('id'));
  if (!record) {
    return jsonError(c, 404, 'NOT_FOUND', 'contributor not found');
  }
  return c.json(ok(record));
});
adminRoutes.patch('/contributors/:id', requireActiveStaff('contributor.write'), async (c) => {
  const payload = expectValid(c, validateContributorInput(await c.req.json().catch(() => null)));
  return c.json(ok(await updateAdminContributor(c.req.param('id'), payload, getAuditActor(c))));
});

adminRoutes.get('/geekdaily', requireActiveStaff('geekdaily.read'), async (c) => {
  const result = await listAdminGeekDailyEpisodes({
    ...readPaginationInput({ page: c.req.query('page'), pageSize: c.req.query('pageSize') }),
    query: c.req.query('query') ?? '',
    status: readEnumQueryValue(c.req.query('status'), contentStatusValues),
  });
  return c.json(ok(result.items, result.meta));
});
adminRoutes.post('/geekdaily', requireActiveStaff('geekdaily.write'), async (c) => {
  const payload = expectValid(c, validateGeekDailyEpisodeInput(await c.req.json().catch(() => null)));
  return c.json(ok(await createAdminGeekDailyEpisode(payload, getAuditActor(c))), 201);
});
adminRoutes.get('/geekdaily/:id', requireActiveStaff('geekdaily.read'), async (c) => {
  const record = await getAdminGeekDailyEpisode(c.req.param('id'));
  if (!record) {
    return jsonError(c, 404, 'NOT_FOUND', 'GeekDaily episode not found');
  }
  return c.json(ok(record));
});
adminRoutes.patch('/geekdaily/:id', requireActiveStaff('geekdaily.write'), async (c) => {
  const payload = expectValid(c, validateGeekDailyEpisodeInput(await c.req.json().catch(() => null)));
  return c.json(ok(await updateAdminGeekDailyEpisode(c.req.param('id'), payload, getAuditActor(c))));
});
adminRoutes.post('/geekdaily/:id/publish', requireActiveStaff('geekdaily.publish'), async (c) => c.json(ok(await publishAdminGeekDailyEpisode(c.req.param('id'), getAuditActor(c)))));
adminRoutes.post('/geekdaily/:id/archive', requireActiveStaff('geekdaily.publish'), async (c) => c.json(ok(await archiveAdminGeekDailyEpisode(c.req.param('id'), getAuditActor(c)))));

adminRoutes.get('/assets/upload-config', requireActiveStaff('asset.manage'), async (c) => c.json(ok(await getAdminAssetUploadConfig())));
adminRoutes.post('/assets/upload', requireActiveStaff('asset.manage'), async (c) => {
  const form = await c.req.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return jsonError(c, 400, 'BAD_REQUEST', 'file is required');
  }

  const visibilityValue = readOptionalString(form.get('visibility'));
  const visibility = visibilityValue === 'private' ? 'private' : 'public';

  return c.json(
    ok(
      await uploadAdminAsset(
        {
          file,
          folder: readOptionalString(form.get('folder')),
          altText: readOptionalString(form.get('altText')),
          visibility,
          assetType: readOptionalString(form.get('assetType')),
        },
        getAuditActor(c),
      ),
    ),
    201,
  );
});
adminRoutes.get('/assets', requireActiveStaff('asset.manage'), async (c) => {
  const result = await listAdminAssets({
    ...readPaginationInput({ page: c.req.query('page'), pageSize: c.req.query('pageSize') }),
    query: c.req.query('query') ?? '',
    status: readEnumQueryValue(c.req.query('status'), assetStatusValues),
    visibility: readAssetVisibility(c.req.query('visibility')),
  });
  return c.json(ok(result.items, result.meta));
});
adminRoutes.post('/assets', requireActiveStaff('asset.manage'), async (c) => {
  const payload = expectValid(c, validateAssetInput(await c.req.json().catch(() => null)));
  return c.json(ok(await createAdminAsset(payload, getAuditActor(c))), 201);
});
adminRoutes.get('/assets/:id', requireActiveStaff('asset.manage'), async (c) => {
  const record = await getAdminAsset(c.req.param('id'));
  if (!record) {
    return jsonError(c, 404, 'NOT_FOUND', 'asset not found');
  }
  return c.json(ok(record));
});
adminRoutes.patch('/assets/:id', requireActiveStaff('asset.manage'), async (c) => {
  const payload = expectValid(c, validateAssetInput(await c.req.json().catch(() => null)));
  return c.json(ok(await updateAdminAsset(c.req.param('id'), payload, getAuditActor(c))));
});

adminRoutes.get('/roles', requireActiveStaff('staff.manage'), async (c) => c.json(ok(await listAdminRoles())));
adminRoutes.get('/staff', requireActiveStaff('staff.manage'), async (c) => {
  const result = await listAdminStaff(readPaginationInput({ page: c.req.query('page'), pageSize: c.req.query('pageSize') }));
  return c.json(ok(result.items, result.meta));
});
adminRoutes.post('/staff', requireActiveStaff('staff.manage'), async (c) => {
  const payload = expectValid(c, validateStaffCreateInput(await c.req.json().catch(() => null)));
  return c.json(ok(await createAdminStaff(payload, getAuditActor(c))), 201);
});
adminRoutes.get('/staff/:id', requireActiveStaff('staff.manage'), async (c) => {
  const record = await getAdminStaff(c.req.param('id'));
  if (!record) {
    return jsonError(c, 404, 'NOT_FOUND', 'staff account not found');
  }
  return c.json(ok(record));
});
adminRoutes.patch('/staff/:id', requireActiveStaff('staff.manage'), async (c) => {
  const payload = expectValid(c, validateStaffUpdateInput(await c.req.json().catch(() => null)));
  return c.json(ok(await updateAdminStaff(c.req.param('id'), payload, getAuditActor(c))));
});

adminRoutes.get('/audit', requireActiveStaff('audit_log.read'), async (c) => {
  const result = await listAuditEntries({
    ...readPaginationInput({ page: c.req.query('page'), pageSize: c.req.query('pageSize') }),
    query: c.req.query('query') ?? '',
  });
  return c.json(ok(result.items, result.meta));
});

adminRoutes.onError((error, c) => {
  try {
    const parsed = JSON.parse(error.message);
    if (parsed?.error?.code === 'VALIDATION_ERROR') {
      return c.json(parsed, 400);
    }
  } catch {
    // ignore
  }

  return handleApiError(c, error);
});
