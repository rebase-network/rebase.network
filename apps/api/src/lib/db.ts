import { createDb } from '@rebase/db';

import { getEnv, isDatabaseConfigured } from './env.js';

let dbInstance: ReturnType<typeof createDb> | null = null;

export const getDbContext = () => {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (!dbInstance) {
    dbInstance = createDb(getEnv().databaseUrl);
  }

  return dbInstance;
};

export const getDb = () => getDbContext().db;
export const getPool = () => getDbContext().pool;

export const pingDatabase = async () => {
  const pool = getPool();
  await pool.query('select 1');
};
