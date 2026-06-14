import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const args = new Map(
  process.argv.slice(2).map((entry) => {
    const [key, ...rest] = entry.split('=');
    return [key, rest.join('=')];
  }),
);

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);
const rootDir = path.resolve(scriptDir, '..', '..');

const defaultEnvCandidates = ['ops/.env', '.env', 'ops/.env.download'].map((entry) => path.resolve(rootDir, entry));
const usage = `Usage:
  pnpm wechat:thumb-media-id --file=./path/to/cover.jpg [--type=image|thumb] [--env-file=ops/.env]
  node scripts/wechat/get-thumb-media-id.mjs --file=./path/to/cover.jpg [--type=image|thumb] [--appid=APPID --secret=APPSECRET]

Options:
  --file       required, local image path to upload as permanent material
  --type       optional, defaults to image; use thumb for JPG <= 64KB
  --env-file   optional, load env vars from this file before reading process.env
  --appid      optional, overrides WECHAT_OFFICIAL_APP_ID
  --secret     optional, overrides WECHAT_OFFICIAL_APP_SECRET

Env:
  WECHAT_OFFICIAL_APP_ID
  WECHAT_OFFICIAL_APP_SECRET
`;

const mimeTypes = new Map([
  ['.bmp', 'image/bmp'],
  ['.gif', 'image/gif'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.png', 'image/png'],
]);

const loadEnvFile = (envFilePath) => {
  if (!existsSync(envFilePath)) {
    return false;
  }

  process.loadEnvFile(envFilePath);
  return true;
};

const resolvePath = (value) => (path.isAbsolute(value) ? value : path.resolve(process.cwd(), value));

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const readJson = async (response) => {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`unexpected non-JSON response (${response.status}): ${text}`);
  }
};

const getAccessToken = async ({ appId, appSecret }) => {
  const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
  url.searchParams.set('grant_type', 'client_credential');
  url.searchParams.set('appid', appId);
  url.searchParams.set('secret', appSecret);

  const response = await fetch(url);
  const payload = await readJson(response);

  if (!response.ok || payload.errcode || !payload.access_token) {
    throw new Error(`failed to fetch access token: ${JSON.stringify(payload)}`);
  }

  return payload.access_token;
};

const validateFile = async ({ filePath, type }) => {
  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat?.isFile()) {
    fail(`file not found: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  const mimeType = mimeTypes.get(ext);
  if (!mimeType) {
    fail(`unsupported file extension: ${ext || '<none>'}`);
  }

  if (type === 'thumb') {
    if (!['.jpg', '.jpeg'].includes(ext)) {
      fail('thumb material must be a JPG file');
    }

    if (fileStat.size > 64 * 1024) {
      fail(`thumb material must be <= 64KB, got ${fileStat.size} bytes`);
    }
  }

  if (type === 'image' && fileStat.size > 10 * 1024 * 1024) {
    fail(`image material must be <= 10MB, got ${fileStat.size} bytes`);
  }

  return { fileStat, mimeType };
};

const uploadMaterial = async ({ accessToken, filePath, type, mimeType }) => {
  const form = new FormData();
  const body = await readFile(filePath);
  const file = new File([body], path.basename(filePath), { type: mimeType });
  form.set('media', file);

  const url = new URL('https://api.weixin.qq.com/cgi-bin/material/add_material');
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('type', type);

  const response = await fetch(url, {
    method: 'POST',
    body: form,
  });
  const payload = await readJson(response);

  if (!response.ok || payload.errcode || !payload.media_id) {
    throw new Error(`failed to upload material: ${JSON.stringify(payload)}`);
  }

  return payload;
};

const main = async () => {
  if (args.has('--help') || args.has('-h')) {
    console.log(usage);
    return;
  }

  const envFile = args.get('--env-file');
  if (envFile) {
    const resolved = resolvePath(envFile);
    if (!loadEnvFile(resolved)) {
      fail(`env file not found: ${resolved}`);
    }
    console.error(`[wechat] loaded env file: ${resolved}`);
  } else {
    for (const candidate of defaultEnvCandidates) {
      if (loadEnvFile(candidate)) {
        console.error(`[wechat] loaded env file: ${candidate}`);
        break;
      }
    }
  }

  const appId = (args.get('--appid') || process.env.WECHAT_OFFICIAL_APP_ID || '').trim();
  const appSecret = (args.get('--secret') || process.env.WECHAT_OFFICIAL_APP_SECRET || '').trim();
  const fileArg = (args.get('--file') || '').trim();
  const type = (args.get('--type') || 'image').trim().toLowerCase();

  if (!fileArg) {
    fail(`${usage}\nmissing required argument: --file`);
  }

  if (!['image', 'thumb'].includes(type)) {
    fail(`unsupported --type value: ${type}`);
  }

  if (!appId || !appSecret) {
    fail(`${usage}\nmissing WECHAT_OFFICIAL_APP_ID or WECHAT_OFFICIAL_APP_SECRET`);
  }

  const filePath = resolvePath(fileArg);
  const { fileStat, mimeType } = await validateFile({ filePath, type });
  const accessToken = await getAccessToken({ appId, appSecret });
  const payload = await uploadMaterial({ accessToken, filePath, type, mimeType });

  console.log(
    JSON.stringify(
      {
        file: filePath,
        type,
        size: fileStat.size,
        media_id: payload.media_id,
        url: payload.url ?? null,
      },
      null,
      2,
    ),
  );
  console.log(`WECHAT_DEFAULT_THUMB_MEDIA_ID=${payload.media_id}`);

  if (type === 'image') {
    console.error('[wechat] uploaded as type=image');
    console.error('[wechat] if draft cover validation fails on your account, retry with --type=thumb and a JPG <= 64KB');
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
