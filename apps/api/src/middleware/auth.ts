import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

import type { AdminMePayload, StaffAccountStatus } from '@rebase/shared';

import { getStaffAccess } from '../lib/access.js';
import { getAuth } from '../lib/auth.js';
import { jsonError } from '../lib/http.js';
import { isAuthConfigured } from '../lib/env.js';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}

export interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: Date | string;
  token: string;
}

export interface AppVariables {
  authReady: boolean;
  requestStartedAt: number;
  requestId: string;
  user: SessionUser | null;
  session: SessionRecord | null;
  staffAccount: {
    id: string;
    userId: string;
    status: StaffAccountStatus;
    displayName: string;
  } | null;
  roleCodes: string[];
  permissionCodes: string[];
}

export const requestContextMiddleware = createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
  c.set('authReady', isAuthConfigured());
  c.set('requestStartedAt', Date.now());
  c.set('requestId', crypto.randomUUID());
  c.set('user', null);
  c.set('session', null);
  c.set('staffAccount', null);
  c.set('roleCodes', []);
  c.set('permissionCodes', []);

  const auth = getAuth();

  if (!auth) {
    await next();
    return;
  }

  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      await next();
      return;
    }

    c.set('user', session.user as SessionUser);
    c.set('session', session.session as SessionRecord);

    const access = await getStaffAccess(session.user.id);
    c.set('staffAccount', access.staffAccount);
    c.set('roleCodes', access.roles);
    c.set('permissionCodes', access.permissions);
  } catch {
    c.set('user', null);
    c.set('session', null);
    c.set('staffAccount', null);
    c.set('roleCodes', []);
    c.set('permissionCodes', []);
  }

  await next();
});

export const requireActiveStaff = (requiredPermission?: string): MiddlewareHandler<{ Variables: AppVariables }> =>
  createMiddleware<{ Variables: AppVariables }>(async (c, next) => {
    if (!c.get('authReady')) {
      return jsonError(c, 503, 'AUTH_NOT_CONFIGURED', 'authentication is not configured');
    }

    if (!c.get('user') || !c.get('session')) {
      return jsonError(c, 401, 'UNAUTHENTICATED', 'please sign in to continue');
    }

    const staffAccount = c.get('staffAccount');
    if (!staffAccount || staffAccount.status !== 'active') {
      return jsonError(c, 403, 'FORBIDDEN', 'an active staff account is required');
    }

    if (requiredPermission && !c.get('permissionCodes').includes(requiredPermission)) {
      return jsonError(c, 403, 'FORBIDDEN', `missing required permission: ${requiredPermission}`);
    }

    await next();
  });

export const getAdminMePayload = (variables: Pick<AppVariables, 'user' | 'session' | 'staffAccount' | 'roleCodes' | 'permissionCodes'>): AdminMePayload => ({
  user: variables.user,
  session: variables.session
    ? {
        id: variables.session.id,
        userId: variables.session.userId,
        expiresAt: new Date(variables.session.expiresAt).toISOString(),
      }
    : null,
  staffAccount: variables.staffAccount,
  roles: variables.roleCodes,
  permissions: variables.permissionCodes,
});
