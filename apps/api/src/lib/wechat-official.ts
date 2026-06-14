import { getEnv } from './env.js';
import { serviceUnavailable } from './errors.js';

interface WechatApiPayload {
  errcode?: number;
  errmsg?: string;
}

interface WechatAccessTokenPayload extends WechatApiPayload {
  access_token?: string;
  expires_in?: number;
}

interface WechatDraftAddPayload extends WechatApiPayload {
  media_id?: string;
}

export interface WechatNewsDraftInput {
  title: string;
  author: string;
  digest: string;
  content: string;
  contentSourceUrl: string;
  thumbMediaId: string;
}

let accessTokenCache: { appId: string; accessToken: string; expiresAt: number } | null = null;

const requestTimeoutMs = 15_000;
const accessTokenRefreshBufferMs = 5 * 60 * 1000;

const createWechatApiError = (stage: string, payload: unknown) =>
  serviceUnavailable(`wechat official account ${stage} failed`, {
    stage,
    payload,
  });

const parseJson = async <T>(response: Response): Promise<T> => {
  const text = await response.text();

  try {
    return JSON.parse(text) as T;
  } catch {
    throw createWechatApiError('response parsing', {
      status: response.status,
      body: text,
    });
  }
};

const getWechatCredentials = () => {
  const env = getEnv();
  const appId = env.wechatOfficialAppId.trim();
  const appSecret = env.wechatOfficialAppSecret.trim();
  const missing = [
    !appId && 'WECHAT_OFFICIAL_APP_ID',
    !appSecret && 'WECHAT_OFFICIAL_APP_SECRET',
  ].filter(Boolean);

  if (missing.length > 0) {
    throw serviceUnavailable('wechat official account is not configured', { missing });
  }

  return { appId, appSecret };
};

const fetchWechatAccessToken = async () => {
  const { appId, appSecret } = getWechatCredentials();
  const cached = accessTokenCache;

  if (cached && cached.appId === appId && cached.expiresAt > Date.now()) {
    return cached.accessToken;
  }

  const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
  url.searchParams.set('grant_type', 'client_credential');
  url.searchParams.set('appid', appId);
  url.searchParams.set('secret', appSecret);

  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch (error) {
    throw createWechatApiError('access token request', {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const payload = await parseJson<WechatAccessTokenPayload>(response);
  if (!response.ok || payload.errcode || !payload.access_token || !payload.expires_in) {
    throw createWechatApiError('access token response', payload);
  }

  accessTokenCache = {
    appId,
    accessToken: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000 - accessTokenRefreshBufferMs,
  };

  return payload.access_token;
};

export const createWechatOfficialDraft = async (input: WechatNewsDraftInput) => {
  const accessToken = await fetchWechatAccessToken();
  const url = new URL('https://api.weixin.qq.com/cgi-bin/draft/add');
  url.searchParams.set('access_token', accessToken);

  const body = {
    articles: [
      {
        article_type: 'news',
        title: input.title,
        author: input.author,
        digest: input.digest,
        content: input.content,
        content_source_url: input.contentSourceUrl,
        thumb_media_id: input.thumbMediaId,
      },
    ],
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch (error) {
    throw createWechatApiError('draft request', {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const payload = await parseJson<WechatDraftAddPayload>(response);
  if (!response.ok || payload.errcode || !payload.media_id) {
    throw createWechatApiError('draft response', payload);
  }

  return {
    mediaId: payload.media_id,
  };
};
