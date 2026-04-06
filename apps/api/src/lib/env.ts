export interface AppEnv {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
  corsAllowedOrigins: string[];
}

let envCache: AppEnv | null = null;

const parseOrigins = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const getEnv = (): AppEnv => {
  if (envCache) {
    return envCache;
  }

  envCache = {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number.parseInt(process.env.PORT ?? '8788', 10),
    databaseUrl: process.env.DATABASE_URL ?? '',
    betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? '',
    betterAuthUrl: process.env.BETTER_AUTH_URL ?? 'http://localhost:8788',
    corsAllowedOrigins: parseOrigins(
      process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:4321,http://127.0.0.1:4321,http://localhost:5174,http://127.0.0.1:5174',
    ),
  };

  return envCache;
};

export const isDatabaseConfigured = () => Boolean(getEnv().databaseUrl);
export const isAuthConfigured = () => Boolean(getEnv().databaseUrl && getEnv().betterAuthSecret);
