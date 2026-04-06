import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema/index.js';

export type Database = NodePgDatabase<typeof schema>;

export const createPool = (connectionString: string) =>
  new Pool({
    connectionString,
  });

export const createDb = (connectionString: string): { db: Database; pool: Pool } => {
  const pool = createPool(connectionString);

  return {
    pool,
    db: drizzle(pool, { schema }),
  };
};

export { schema };
