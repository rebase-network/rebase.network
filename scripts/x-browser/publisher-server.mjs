#!/usr/bin/env node

import { createServer } from 'node:http';
import { mkdirSync } from 'node:fs';
import { chmod, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { publishTweetWithProfile } from './profile-client.mjs';

const profilePath = resolve(process.env.X_PROFILE_DIR || '/home/rebase/.local/share/rebase-x-profile');
const expectedHandle = process.env.X_HANDLE || 'RebaseCommunity';
const chromePath = process.env.CHROME_PATH || '/usr/bin/google-chrome-stable';
const socketPath = process.env.X_PUBLISHER_SOCKET_PATH || '/home/rebase/.local/state/rebase-x-browser/publisher.sock';
const bodyLimit = 16 * 1024;

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

  try {
    const payload = await readJson(request);
    const result = await queuePublish(() => publishTweetWithProfile({
      profilePath,
      expectedHandle,
      chromePath,
      headless: true,
      text: payload.text,
    }));
    writeJson(response, 200, result);
  } catch (error) {
    console.error(`[x-publisher] ${error instanceof Error ? error.message : String(error)}`);
    writeJson(response, 502, { error: error instanceof Error ? error.message : String(error) });
  }
});

mkdirSync(dirname(socketPath), { recursive: true });
await unlink(socketPath).catch(() => undefined);
server.listen(socketPath, async () => {
  await chmod(socketPath, 0o600);
  console.log(`X publisher listening on ${socketPath}`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
