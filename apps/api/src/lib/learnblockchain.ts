
import { badRequest, serviceUnavailable } from './errors.js';
import { getEnv } from './env.js';
import type { ExternalChannel } from './external-publishing.js';

export type LearnBlockchainArticleInput = {
  title: string;
  bodyMarkdown: string;
  summary?: string;
  tags?: string[];
  categoryId?: number;
};

type LearnBlockchainResponse = {
  code?: number;
  message?: string;
  article_id?: number | string;
};

export const isLearnBlockchainConfigured = () => Boolean(getEnv().learnBlockchainApiKey.trim());

export const learnBlockchainMinimumContentCharacters = 300;

export const buildLearnBlockchainArticle = (input: LearnBlockchainArticleInput) => {
  const title = input.title.trim();
  const content = input.bodyMarkdown.trim();
  if (!title || !content) throw badRequest('LearnBlockchain article title and content are required');

  const contentCharacters = Array.from(content).length;
  if (contentCharacters < learnBlockchainMinimumContentCharacters) {
    throw badRequest(
      `LearnBlockchain 正文至少需要 ${learnBlockchainMinimumContentCharacters} 个字符，当前 ${contentCharacters} 个字符`,
      { minimumCharacters: learnBlockchainMinimumContentCharacters, actualCharacters: contentCharacters },
    );
  }

  return {
    title,
    content,
    summary: Array.from(input.summary?.trim() || title).slice(0, 200).join(''),
    link: '',
    author_id: '322',
    category_id: String(input.categoryId ?? 8),
    proofread: 'false',
    is_public: 'true',
    tags: input.tags?.map((tag) => tag.trim()).filter(Boolean).join(',') || 'Web3',
    featured: '0',
    level: '1',
    type: '1',
  };
};

const appendSource = (body: string, url: string) => `${body.trim()}\n\n---\n\n原文链接：${url}`;

const publishArticle = async (input: LearnBlockchainArticleInput) => {
  const env = getEnv();
  const apiKey = env.learnBlockchainApiKey.trim();
  const endpoint = env.learnBlockchainUrlPosts.trim();

  if (!apiKey || !endpoint) {
    throw serviceUnavailable('LearnBlockchain publishing is not configured');
  }
  const form = new URLSearchParams(buildLearnBlockchainArticle(input));
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-API-Key': apiKey,
      },
      body: form,
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause : error;
    const code = cause && typeof cause === 'object' && 'code' in cause && typeof cause.code === 'string' ? cause.code : '';
    const message = cause instanceof Error ? cause.message || cause.name : String(cause);
    const reason = [code, message].filter(Boolean).join(': ');
    throw serviceUnavailable(`LearnBlockchain 网络请求失败：${reason}`, { reason });
  }

  const payload = (await response.json().catch(() => null)) as LearnBlockchainResponse | null;
  if (!response.ok || !payload || payload.code !== 0 || payload.article_id === undefined || payload.article_id === null) {
    const reason = payload?.message || (payload ? `业务状态码 ${payload.code ?? '未知'}` : `HTTP ${response.status} 响应不是有效 JSON`);
    throw serviceUnavailable(`LearnBlockchain 发布失败：${reason}`, {
      status: response.status,
      code: payload?.code,
      message: payload?.message,
    });
  }

  return { articleId: String(payload.article_id) };
};

export const learnBlockchainChannel: ExternalChannel = {
  name: 'LearnBlockchain',
  auditKey: 'learnblockchain',
  idField: 'learnBlockchainArticleId',
  isConfigured: isLearnBlockchainConfigured,
  publish: async ({ title, summary, bodyMarkdown, tags, sourceUrl }) =>
    (await publishArticle({ title, bodyMarkdown: appendSource(bodyMarkdown, sourceUrl), summary, tags })).articleId,
};
