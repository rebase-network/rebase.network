import { request as httpRequest } from 'node:http';

import { badRequest, serviceUnavailable } from './errors.js';
import { getEnv } from './env.js';
import type { ExternalChannel } from './external-publishing.js';

export const maxXPostCharacters = 280;

type XPublisherResponse = { tweetId?: string; url?: string; error?: string; details?: Record<string, unknown> };

export const isXConfigured = () => {
  const env = getEnv();
  return env.xPublisherEnabled && Boolean(env.xPublisherSocketPath.trim());
};

const countCharacters = (value: string) => Array.from(value).length;
const truncateCharacters = (value: string, maxLength: number) => Array.from(value).slice(0, maxLength).join('');
const plainText = (value: string) => value.replace(/[`*_>#]/g, '').replace(/\s+/g, ' ').trim();

export const buildXPostText = ({ title, summary, url }: { title: string; summary: string; url: string }) => {
  const normalizedTitle = plainText(title);
  const normalizedSummary = plainText(summary);
  const normalizedUrl = url.trim();
  if (!normalizedTitle || !normalizedUrl) throw badRequest('X post title and URL are required');

  const fixed = `${normalizedTitle}\n\n${normalizedUrl}`;
  const summaryBudget = maxXPostCharacters - countCharacters(fixed) - 2;
  if (summaryBudget < 0) throw badRequest('X post title and URL exceed the 280 character limit');
  if (!normalizedSummary || summaryBudget === 0) return fixed;

  const clippedSummary = truncateCharacters(normalizedSummary, summaryBudget);
  return clippedSummary ? `${normalizedTitle}\n\n${clippedSummary}\n\n${normalizedUrl}` : fixed;
};

const requestPublisher = async (text: string) => {
  const socketPath = getEnv().xPublisherSocketPath.trim();
  if (!socketPath) throw serviceUnavailable('X publishing socket is not configured');

  const body = JSON.stringify({ text });
  const payload = await new Promise<XPublisherResponse>((resolve, reject) => {
    const request = httpRequest(
      {
        socketPath,
        path: '/publish',
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 90_000,
      },
      (response) => {
        let output = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => { output += chunk; });
        response.on('end', () => {
          try {
            resolve(JSON.parse(output) as XPublisherResponse);
          } catch {
            reject(serviceUnavailable('X publisher returned invalid JSON', { status: response.statusCode }));
          }
        });
      },
    );
    request.on('timeout', () => request.destroy(new Error('X publisher request timed out')));
    request.on('error', (error) => reject(error));
    request.write(body);
    request.end();
  }).catch((error) => {
    if (error instanceof Error && 'status' in error) throw error;
    const reason = error instanceof Error ? error.message : String(error);
    throw serviceUnavailable(`X publisher 请求失败：${reason}`, { reason });
  });

  if (!payload.tweetId) {
    const reason = payload.error || 'publisher 未返回 tweet id';
    throw serviceUnavailable(`X 发布失败：${reason}`, { error: payload.error, publisher: payload.details ?? null });
  }
  return { tweetId: payload.tweetId, url: payload.url ?? `https://x.com/status/${payload.tweetId}` };
};

export const xChannel: ExternalChannel = {
  name: 'X',
  auditKey: 'x',
  idField: 'xPostId',
  isConfigured: isXConfigured,
  publish: async ({ title, summary, sourceUrl }) => (await requestPublisher(buildXPostText({ title, summary, url: sourceUrl }))).tweetId,
};
