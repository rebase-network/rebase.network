export interface AppEnv {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  betterAuthSecret: string;
  betterAuthUrl: string;
  corsAllowedOrigins: string[];
  r2AccountId: string;
  r2AccessKeyId: string;
  r2SecretAccessKey: string;
  r2Bucket: string;
  r2PublicBaseUrl: string;
  wechatOfficialAppId: string;
  wechatOfficialAppSecret: string;
  wechatDefaultThumbMediaId: string;
  infoqCredentialsKey: string;
  learnBlockchainApiKey: string;
  learnBlockchainUrlPosts: string;
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
    r2AccountId: process.env.R2_ACCOUNT_ID ?? process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    r2Bucket: process.env.R2_BUCKET ?? 'rebase-media',
    r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? '',
    wechatOfficialAppId: process.env.WECHAT_OFFICIAL_APP_ID ?? '',
    wechatOfficialAppSecret: process.env.WECHAT_OFFICIAL_APP_SECRET ?? '',
    wechatDefaultThumbMediaId: process.env.WECHAT_DEFAULT_THUMB_MEDIA_ID ?? '',
    infoqCredentialsKey: process.env.INFOQ_CREDENTIALS_KEY ?? process.env.BETTER_AUTH_SECRET ?? '',
    learnBlockchainApiKey: process.env.LEARNBLOCKCHAIN_API_KEY ?? '',
    learnBlockchainUrlPosts: process.env.LEARNBLOCKCHAIN_URL_POSTS ?? 'https://learnblockchain.cn/api/post/article',
  };

  return envCache;
};

export const isDatabaseConfigured = () => Boolean(getEnv().databaseUrl);
export const isAuthConfigured = () => Boolean(getEnv().databaseUrl && getEnv().betterAuthSecret);
