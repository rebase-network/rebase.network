import { createHash, randomUUID } from 'node:crypto';

import { marked } from 'marked';
import { eq } from 'drizzle-orm';

import { articles, events, geekdailyEpisodes } from '@rebase/db';
import type { AdminArticleRecord, AdminEventRecord, AdminGeekDailyRecord } from '@rebase/shared';

import { createAuditEntry, type AuditActor } from './audit.js';
import { getDb } from './db.js';
import { badRequest, serviceUnavailable } from './errors.js';
import { getInfoqCredentials, getPublicSiteConfig } from './site.js';
import { getAdminArticle } from './articles.js';
import { getAdminEvent } from './events.js';
import { getAdminGeekDailyEpisode } from './geekdaily.js';

type InfoqNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: InfoqNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
};

type InfoqArticleInput = {
  title: string;
  summary: string;
  bodyMarkdown: string;
  tags: string[];
};

type InfoqPublishResult = { uuid: string; url: string };
type InfoqResponse<T> = { code?: number; data?: T; error?: { code?: number; msg?: string } };

export const shouldAutoPublishToInfoq = (record: { status: string; infoqArticleUuid?: string | null }) =>
  record.status === 'published' && !record.infoqArticleUuid;

class InfoqApiClient {
  private ticket: string;
  private readonly cookie: string;

  constructor(cookie: string, ticket: string) {
    this.cookie = cookie;
    this.ticket = ticket;
  }

  async request<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(`https://xie.infoq.cn${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Origin: 'https://xie.infoq.cn',
        Referer: 'https://xie.infoq.cn/',
        Cookie: this.cookie,
        Ticket: this.ticket,
        'X-GEEK-REQ-ID': `${randomUUID()}@1@api`,
      },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => null)) as InfoqResponse<T> | null;
    const errorCode = payload?.error?.code ?? payload?.code;
    if (!response.ok || !payload || errorCode !== 0) {
      throw serviceUnavailable(`InfoQ API request failed: ${path}`, {
        status: response.status,
        code: errorCode,
        message: payload?.error?.msg,
      });
    }

    const nextTicket = response.headers.get('set-ticket');
    if (nextTicket) this.ticket = nextTicket;
    return payload.data as T;
  }
}

const getSetCookies = (headers: Headers) => {
  const get = (headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  return get ? get.call(headers) : (headers.get('set-cookie') ?? '').split(/,(?=[^;=]+=[^;]+)/g).filter(Boolean);
};

const mergeCookies = (...headers: Headers[]) => {
  const values = new Map<string, string>();
  for (const header of headers) {
    for (const cookie of getSetCookies(header)) {
      const pair = cookie.split(';', 1)[0];
      const name = pair.slice(0, pair.indexOf('='));
      if (name) values.set(name, pair);
    }
  }
  return [...values.values()].join('; ');
};

const loginInfoqApi = async (): Promise<InfoqApiClient> => {
  const credentials = await getInfoqCredentials();
  const loginResponse = await fetch('https://account.geekbang.org/account/ticket/login', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: 'https://account.geekbang.org',
      Referer: 'https://account.geekbang.org/infoq/signin',
    },
    body: JSON.stringify({
      platform: 3,
      appid: 5,
      remember: 1,
      data: '',
      source: '',
      ucode: '',
      sc: { uid: '', report_source: 'Web', user_unique_id: '', refer: 'InfoQ 网页' },
      country: 86,
      cellphone: credentials.username,
      password: credentials.password,
    }),
  });
  const loginPayload = (await loginResponse.json().catch(() => null)) as InfoqResponse<{ oss_token?: string }> | null;
  if (!loginResponse.ok || loginPayload?.code !== 0 || !loginPayload.data?.oss_token) {
    throw serviceUnavailable('InfoQ login failed', {
      status: loginResponse.status,
      code: loginPayload?.error?.code ?? loginPayload?.code,
      message: loginPayload?.error?.msg,
    });
  }

  const tokenResponse = await fetch('https://account.infoq.cn/account/ticket/token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: 'https://account.infoq.cn',
      Referer: 'https://account.infoq.cn/syncinfoq/',
    },
    body: JSON.stringify({ token: loginPayload.data.oss_token }),
  });
  const tokenPayload = (await tokenResponse.json().catch(() => null)) as InfoqResponse<unknown> | null;
  if (!tokenResponse.ok || tokenPayload?.code !== 0) {
    throw serviceUnavailable('InfoQ session exchange failed', {
      status: tokenResponse.status,
      code: tokenPayload?.error?.code ?? tokenPayload?.code,
      message: tokenPayload?.error?.msg,
    });
  }

  const client = new InfoqApiClient(
    mergeCookies(loginResponse.headers, tokenResponse.headers),
    tokenResponse.headers.get('set-ticket') ?? loginResponse.headers.get('set-ticket') ?? '',
  );
  await client.request('/public/v1/user/get_user', {});
  return client;
};

const paragraphAttrs = () => ({ indent: 0, number: 0, align: null, origin: null });

const inlineNodes = (tokens: any[] = [], marks: InfoqNode['marks'] = []): InfoqNode[] => tokens.flatMap((token) => {
  if (token.type === 'text' || token.type === 'escape') return token.text ? [{ type: 'text', text: token.text, ...(marks.length ? { marks } : {}) }] : [];
  if (token.type === 'strong') return inlineNodes(token.tokens, [...marks, { type: 'strong' }]);
  if (token.type === 'em') return inlineNodes(token.tokens, [...marks, { type: 'italic' }]);
  if (token.type === 'del') return inlineNodes(token.tokens, [...marks, { type: 'del' }]);
  if (token.type === 'codespan') return [{ type: 'codeinline', content: [{ type: 'text', text: token.text }] }];
  if (token.type === 'link') return [{
    type: 'link',
    attrs: { href: token.href, title: token.title ?? '', type: null },
    content: inlineNodes(token.tokens),
  }];
  if (token.type === 'br') return [{ type: 'text', text: '\n', ...(marks.length ? { marks } : {}) }];
  if (token.type === 'html') {
    const text = token.text.replace(/<[^>]+>/g, '');
    return text ? [{ type: 'text', text, ...(marks.length ? { marks } : {}) }] : [];
  }
  if (token.tokens) return inlineNodes(token.tokens, marks);
  return token.text ? [{ type: 'text', text: token.text, ...(marks.length ? { marks } : {}) }] : [];
});

const blockNodes = (tokens: any[]): InfoqNode[] => tokens.flatMap((token) => {
  if (token.type === 'space') return [];
  if (token.type === 'heading') return [{ type: 'heading', attrs: { level: token.depth, align: null }, content: inlineNodes(token.tokens) }];
  if (token.type === 'paragraph' || token.type === 'text') return [{ type: 'paragraph', attrs: paragraphAttrs(), content: inlineNodes(token.tokens ?? [{ type: 'text', text: token.text }]) }];
  if (token.type === 'blockquote') return [{ type: 'blockquote', content: blockNodes(token.tokens ?? []) }];
  if (token.type === 'code') return [{ type: 'codeblock', attrs: { lang: token.lang || 'text' }, content: token.text ? [{ type: 'text', text: token.text }] : undefined }];
  if (token.type === 'hr') return [{ type: 'horizontalrule' }];
  if (token.type === 'list') {
    return [{
      type: token.ordered ? 'numberedlist' : 'bulletedlist',
      ...(token.ordered ? { attrs: { start: Number(token.start) || 1 } } : {}),
      content: (token.items ?? []).map((item: any) => ({
        type: 'listitem',
        content: item.tokens?.some((child: any) => child.type === 'paragraph')
          ? blockNodes(item.tokens)
          : [{ type: 'paragraph', attrs: paragraphAttrs(), content: inlineNodes(item.tokens ?? [{ type: 'text', text: item.text }]) }],
      })),
    }];
  }
  if (token.type === 'table') {
    const text = typeof token.raw === 'string' ? token.raw.trim() : [token.header, ...(token.rows ?? []).flat()].join(' | ');
    return text ? [{ type: 'paragraph', attrs: paragraphAttrs(), content: [{ type: 'text', text }] }] : [];
  }
  return token.text ? [{ type: 'paragraph', attrs: paragraphAttrs(), content: [{ type: 'text', text: token.text }] }] : [];
});

export const markdownToDoc = (markdown: string): InfoqNode => ({ type: 'doc', content: blockNodes(marked.lexer(markdown)) });
const textContent = (node: InfoqNode): string => node.text ?? (node.content ?? []).map(textContent).join('');

const truncateDoc = (doc: InfoqNode, maxLength: number): InfoqNode => {
  let remaining = maxLength;
  const truncate = (node: InfoqNode): InfoqNode | null => {
    if (node.text !== undefined) {
      const text = Array.from(node.text).slice(0, remaining).join('');
      remaining -= text.length;
      return text ? { ...node, text } : null;
    }
    const content = (node.content ?? []).map(truncate).filter((value): value is InfoqNode => Boolean(value));
    return content.length ? { ...node, content } : null;
  };
  return { type: 'doc', content: (doc.content ?? []).map(truncate).filter((value): value is InfoqNode => Boolean(value)) };
};

export const infoqWordCount = (value: string) => Math.ceil(Array.from(value).reduce((sum, character) => sum + (character.charCodeAt(0) <= 0x7e ? 0.5 : 1), 0));
const trimUtf8 = (value: string, maxBytes: number) => {
  let result = '';
  for (const character of value.trim()) {
    if (Buffer.byteLength(result + character, 'utf8') > maxBytes) break;
    result += character;
  }
  return result;
};
const firstParagraph = (markdown: string) => markdown.split(/\n\s*\n/).map((part) => part.replace(/^#+\s+|[*_`>-]/g, '').trim()).find(Boolean) ?? '';
const appendSource = (body: string, url: string) => `${body.trim()}\n\n---\n\n原文链接：${url}`;
const publicUrl = async (path: string) => new URL(path, `${(await getPublicSiteConfig()).primaryDomain}/`).toString();

const resolveLabels = async (client: InfoqApiClient, tags: string[]) => {
  const labels: number[] = [];
  for (const rawTag of tags.slice(0, 5)) {
    const tag = trimUtf8(rawTag, 12);
    if (!tag) continue;
    const result = await client.request<{ list?: Array<{ tag_id?: number; tag?: string }> }>('/api/v1/label/search', {
      keyword: tag,
      num: 5,
      type: 1,
    });
    const exact = result.list?.find((item) => item.tag === tag && Number.isInteger(item.tag_id));
    const label = exact ?? (await client.request<{ id?: number }>('/api/v1/label/add', { label: tag }));
    const id = Number('tag_id' in label ? label.tag_id : (label as { id?: number }).id);
    if (Number.isInteger(id) && id > 0) labels.push(id);
  }
  return labels;
};

const publish = async (input: InfoqArticleInput): Promise<InfoqPublishResult> => {
  if (input.bodyMarkdown.trim().length < 50) throw badRequest('InfoQ article body must contain at least 50 characters');
  const doc = markdownToDoc(input.bodyMarkdown);
  const content = JSON.stringify(doc);
  const wordNum = infoqWordCount(textContent(doc));
  const client = await loginInfoqApi();
  const draft = await client.request<{ id: number }>('/api/v1/draft/create', {});
  try {
    const title = trimUtf8(input.title, 128);
    const summary = trimUtf8(input.summary || firstParagraph(input.bodyMarkdown), 120);
    const labels = await resolveLabels(client, input.tags);
    await client.request('/api/v1/draft/pushFull', { id: draft.id, content, version: 0, cover: '', title, summary });
    const contentHtml = marked.parse(input.bodyMarkdown, { async: false }) as string;
    const result = await client.request<{ uuid: string }>('/api/v1/article/publish', {
      id: draft.id,
      content,
      cover: '',
      title,
      word_num: wordNum,
      content_short: JSON.stringify(truncateDoc(doc, 500)),
      content_html: contentHtml,
      sign: createHash('md5').update(content + wordNum).digest('hex'),
      desc: summary,
      articleInfo: {},
      summary,
      copyright: 0,
      labels,
      is_horde: 0,
    });
    if (!result?.uuid) throw serviceUnavailable('InfoQ publish returned no article id');
    return { uuid: result.uuid, url: `https://xie.infoq.cn/article/${result.uuid}` };
  } catch (error) {
    await client.request('/api/v1/draft/del', { id: draft.id }).catch(() => undefined);
    throw error;
  }
};

// ponytail: one process-wide publish queue; use a durable job worker if volume requires parallelism.
let publishQueue = Promise.resolve();
const queuePublish = <T>(task: () => Promise<T>) => {
  const next = publishQueue.then(task);
  publishQueue = next.then(() => undefined, () => undefined);
  return next;
};

export const publishAdminArticleToInfoq = async (id: string, actor: AuditActor): Promise<AdminArticleRecord> => {
  const record = await getAdminArticle(id);
  if (!record) throw badRequest('article not found');
  if (record.status !== 'published') throw badRequest('publish the Rebase article before sending it to InfoQ');
  if (record.infoqArticleUuid) return record;
  const source = await publicUrl(`/articles/${record.publicNumber}-${record.slug}`);
  const result = await queuePublish(() => publish({ title: record.title, summary: record.summary, bodyMarkdown: appendSource(record.bodyMarkdown, source), tags: record.tags }));
  await getDb().update(articles).set({ infoqArticleUuid: result.uuid, updatedAt: new Date() }).where(eq(articles.id, id));
  await createAuditEntry({ ...actor, action: 'article.infoq_publish', targetType: 'article', targetId: id, summary: `Published article ${record.title} to InfoQ` });
  return (await getAdminArticle(id)) as AdminArticleRecord;
};

export const publishAdminEventToInfoq = async (id: string, actor: AuditActor): Promise<AdminEventRecord> => {
  const record = await getAdminEvent(id);
  if (!record) throw badRequest('event not found');
  if (record.status !== 'published') throw badRequest('publish the Rebase event before sending it to InfoQ');
  if (record.infoqArticleUuid) return record;
  const source = await publicUrl(`/events/${record.publicNumber}-${record.slug}`);
  const details = [`活动时间：${record.startAt ?? ''} 至 ${record.endAt ?? ''}`, `活动地点：${record.city} ${record.location} ${record.venue}`];
  if (record.registrationUrl) details.push(`报名链接：${record.registrationUrl}`);
  const result = await queuePublish(() => publish({ title: `活动｜${record.title}`, summary: record.summary, bodyMarkdown: appendSource(`${details.join('\n')}\n\n${record.bodyMarkdown}`, source), tags: record.tags }));
  await getDb().update(events).set({ infoqArticleUuid: result.uuid, updatedAt: new Date() }).where(eq(events.id, id));
  await createAuditEntry({ ...actor, action: 'event.infoq_publish', targetType: 'event', targetId: id, summary: `Published event ${record.title} to InfoQ` });
  return (await getAdminEvent(id)) as AdminEventRecord;
};

export const publishAdminGeekDailyToInfoq = async (id: string, actor: AuditActor): Promise<AdminGeekDailyRecord> => {
  const record = await getAdminGeekDailyEpisode(id);
  if (!record) throw badRequest('GeekDaily episode not found');
  if (record.status !== 'published') throw badRequest('publish the Rebase GeekDaily episode before sending it to InfoQ');
  if (record.infoqArticleUuid) return record;
  const source = await publicUrl(`/geekdaily/${record.slug}`);
  const result = await queuePublish(() => publish({ title: `极客日报｜${record.title}`, summary: record.summary, bodyMarkdown: appendSource(record.bodyMarkdown, source), tags: record.tags }));
  await getDb().update(geekdailyEpisodes).set({ infoqArticleUuid: result.uuid, updatedAt: new Date() }).where(eq(geekdailyEpisodes.id, id));
  await createAuditEntry({ ...actor, action: 'geekdaily.infoq_publish', targetType: 'geekdaily_episode', targetId: id, summary: `Published GeekDaily ${record.episodeNumber} to InfoQ` });
  return (await getAdminGeekDailyEpisode(id)) as AdminGeekDailyRecord;
};
