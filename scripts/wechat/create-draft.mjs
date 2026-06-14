import { readFile } from 'node:fs/promises';
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

const defaultEnvCandidates = ['infra/production/server.env', 'ops/.env', '.env', 'ops/.env.download'].map((entry) =>
  path.resolve(rootDir, entry),
);

const usage = `Usage:
  pnpm wechat:create-draft [--env-file=infra/production/server.env] [--title="Rebase 测试草稿"]
  node scripts/wechat/create-draft.mjs [--title="Rebase 测试草稿"] [--content-file=./draft.html]

Options:
  --env-file            optional, load env vars from this file before reading process.env
  --title               optional, defaults to a timestamped test draft title
  --author              optional, defaults to Rebase
  --digest              optional, defaults to a short smoke-test summary
  --content-file        optional, local HTML file used as draft content
  --content-html        optional, inline HTML string used as draft content
  --content-source-url  optional, defaults to https://rebase.network
  --thumb-media-id      optional, overrides WECHAT_DEFAULT_THUMB_MEDIA_ID
  --appid               optional, overrides WECHAT_OFFICIAL_APP_ID
  --secret              optional, overrides WECHAT_OFFICIAL_APP_SECRET

Env:
  WECHAT_OFFICIAL_APP_ID
  WECHAT_OFFICIAL_APP_SECRET
  WECHAT_DEFAULT_THUMB_MEDIA_ID
`;

const requestTimeoutMs = 15_000;

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

const truncateByCodePoints = (value, maxLength) => Array.from(value).slice(0, maxLength).join('');

const getAccessToken = async ({ appId, appSecret }) => {
  const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
  url.searchParams.set('grant_type', 'client_credential');
  url.searchParams.set('appid', appId);
  url.searchParams.set('secret', appSecret);

  const response = await fetch(url, {
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  const payload = await readJson(response);

  if (!response.ok || payload.errcode || !payload.access_token) {
    throw new Error(`failed to fetch access token: ${JSON.stringify(payload)}`);
  }

  return payload.access_token;
};

const createDraft = async ({ accessToken, article }) => {
  const url = new URL('https://api.weixin.qq.com/cgi-bin/draft/add');
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      articles: [article],
    }),
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
  const payload = await readJson(response);

  if (!response.ok || payload.errcode || !payload.media_id) {
    throw new Error(`failed to create draft: ${JSON.stringify(payload)}`);
  }

  return payload;
};

const loadHtmlContent = async ({ contentFile, contentHtml, title }) => {
  if (contentFile) {
    const filePath = resolvePath(contentFile);
    if (!existsSync(filePath)) {
      fail(`content file not found: ${filePath}`);
    }

    return readFile(filePath, 'utf8');
  }

  if (contentHtml) {
    return contentHtml;
  }

  const createdAt = new Date().toISOString();
  return [
    `<h2>${title}</h2>`,
    '<p>这是一个由服务器端脚本创建的微信公众号测试草稿。</p>',
    `<p>创建时间：${createdAt}</p>`,
    '<p>用途：验证远端服务器可以使用白名单 IP 正常调用微信草稿接口。</p>',
  ].join('');
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
  const thumbMediaId = (args.get('--thumb-media-id') || process.env.WECHAT_DEFAULT_THUMB_MEDIA_ID || '').trim();

  if (!appId || !appSecret || !thumbMediaId) {
    fail(
      `${usage}\nmissing required configuration: WECHAT_OFFICIAL_APP_ID, WECHAT_OFFICIAL_APP_SECRET, or WECHAT_DEFAULT_THUMB_MEDIA_ID`,
    );
  }

  const defaultTitle = `Rebase 微信测试草稿 ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`;
  const title = truncateByCodePoints((args.get('--title') || defaultTitle).trim(), 32);
  const author = truncateByCodePoints((args.get('--author') || 'Rebase').trim(), 16);
  const digest = truncateByCodePoints(
    (args.get('--digest') || '用于验证远端服务器可正常调用微信公众号草稿接口的测试稿。').trim(),
    128,
  );
  const contentSourceUrl = (args.get('--content-source-url') || 'https://rebase.network').trim();
  const content = await loadHtmlContent({
    contentFile: args.get('--content-file') || '',
    contentHtml: args.get('--content-html') || '',
    title,
  });

  if (!content.trim()) {
    fail('draft content is empty');
  }

  const accessToken = await getAccessToken({ appId, appSecret });
  const payload = await createDraft({
    accessToken,
    article: {
      article_type: 'news',
      title,
      author,
      digest,
      content,
      content_source_url: contentSourceUrl,
      thumb_media_id: thumbMediaId,
    },
  });

  console.log(
    JSON.stringify(
      {
        title,
        author,
        digest,
        media_id: payload.media_id,
        thumb_media_id: thumbMediaId,
        content_source_url: contentSourceUrl,
      },
      null,
      2,
    ),
  );
  console.log(`WECHAT_DRAFT_MEDIA_ID=${payload.media_id}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
