import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

import { getDb } from './db.js';
import { getEnv, isAuthConfigured } from './env.js';

let authInstance: any = null;

export const getAuth = () => {
  if (!isAuthConfigured()) {
    return null;
  }

  if (authInstance) {
    return authInstance;
  }

  const env = getEnv();

  authInstance = betterAuth({
    baseURL: env.betterAuthUrl,
    secret: env.betterAuthSecret,
    trustedOrigins: env.corsAllowedOrigins,
    advanced: {
      database: {
        generateId: 'uuid',
      },
    },
    database: drizzleAdapter(getDb(), {
      provider: 'pg',
    }),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      modelName: 'users',
      fields: {
        emailVerified: 'emailVerified',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    },
    session: {
      modelName: 'sessions',
      fields: {
        userId: 'userId',
        expiresAt: 'expiresAt',
        ipAddress: 'ipAddress',
        userAgent: 'userAgent',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    },
    account: {
      modelName: 'accounts',
      fields: {
        userId: 'userId',
        accountId: 'accountId',
        providerId: 'providerId',
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
        accessTokenExpiresAt: 'accessTokenExpiresAt',
        refreshTokenExpiresAt: 'refreshTokenExpiresAt',
        idToken: 'idToken',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    },
    verification: {
      modelName: 'verifications',
      fields: {
        expiresAt: 'expiresAt',
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
      },
    },
  });

  return authInstance;
};
