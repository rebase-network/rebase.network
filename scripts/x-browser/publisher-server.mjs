#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { chmod, unlink } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

import { countTweetCharacters, publishTweetWithProfile } from './profile-client.mjs';

const profilePath = resolve(process.env.X_PROFILE_DIR || '/home/rebase/.local/share/rebase-x-profile');
const expectedHandle = process.env.X_HANDLE || 'RebaseCommunity';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
const socketPath = process.env.X_PUBLISHER_SOCKET_PATH || '/home/rebase/.local/state/rebase-x-browser/publisher.sock';
const bodyLimit = 16 * 1024;
const diagnosticsDir = resolve(process.env.X_PUBLISHER_DIAGNOSTICS_DIR || join(dirname(socketPath), 'diagnostics'));

// One JSON line per event; publisher.log is appended across restarts by publisher-service.sh.
const log = (level, event, fields = {}) => {
  const line = JSON.stringify({ time: new Date().toISOString(), level, event, ...fields });
  if (level === 'error') console.error(line);
  else console.log(line);
};

const writeJson = (response, status, payload) => {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
};

const readJson = async (request) => {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > bodyLimit) throw new Error('request body is too large');
  }
  return JSON.parse(body || '{}');
};

let publishQueue = Promise.resolve();
const queuePublish = (task) => {
  const next = publishQueue.then(task);
  publishQueue = next.then(() => undefined, () => undefined);
  return next;
};

const server = createServer(async (request, response) => {
  if (request.method === 'GET' && request.url === '/ready') {
    writeJson(response, 200, { ok: true });
    return;
  }

  if (request.method !== 'POST' || request.url !== '/publish') {
    writeJson(response, 404, { error: 'not found' });
    return;
  }

  const requestId = randomUUID();
  const receivedAt = Date.now();
  let textFields = {};
  try {
    const payload = await readJson(request);
    const text = String(payload.text ?? '');
    textFields = {
      textCharacters: countTweetCharacters(text),
      textSha256: createHash('sha256').update(text).digest('hex').slice(0, 16),
      textPreview: Array.from(text).slice(0, 80).join(''),
    };
    log('info', 'publish_received', { requestId, ...textFields });
    const result = await queuePublish(() => {
      log('info', 'publish_started', { requestId, queuedMs: Date.now() - receivedAt });
      return publishTweetWithProfile({
        profilePath,
        expectedHandle,
        chromePath,
        headless: true,
        diagnosticsDir,
        text,
      });
    });
    log('info', 'publish_succeeded', { requestId, durationMs: Date.now() - receivedAt, tweetId: result.tweetId, url: result.url });
    writeJson(response, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const details = { requestId, stage: 'open_session', ...(error?.details ?? {}) };
    log('error', 'publish_failed', { durationMs: Date.now() - receivedAt, ...textFields, error: message, details, stack: error instanceof Error ? error.stack : undefined });
    writeJson(response, 502, { error: message, details });
  }
});

mkdirSync(dirname(socketPath), { recursive: true });
await unlink(socketPath).catch(() => undefined);
server.listen(socketPath, async () => {
  await chmod(socketPath, 0o600);
  log('info', 'publisher_listening', { socketPath, diagnosticsDir, pid: process.pid });
});

const shutdown = (signal) => {
  log('info', 'publisher_stopping', { signal });
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
