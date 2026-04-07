import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { runCommand } from './helpers.mjs';

const cwd = new URL('../../', import.meta.url);
const rootPath = fileURLToPath(cwd);
const apiPort = Number.parseInt(process.env.SMOKE_API_PORT ?? '8789', 10);
const webPort = Number.parseInt(process.env.SMOKE_WEB_PORT ?? '4324', 10);
const apiBaseUrl = process.env.API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;
const env = {
  ...process.env,
  API_BASE_URL: apiBaseUrl,
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForApiReady(timeoutMs = 120_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    try {
      const response = await fetch(`${apiBaseUrl}/ready`);
      if (response.ok) {
        return;
      }
    } catch {
      // Ignore startup failures while waiting for the API.
    }

    await wait(1_000);
  }

  throw new Error(`timed out waiting for API readiness at ${apiBaseUrl}/ready`);
}

let previewProcess;
let shuttingDown = false;

const shutdown = (signal = 'SIGTERM') => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  if (previewProcess && !previewProcess.killed) {
    previewProcess.kill(signal);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

await waitForApiReady();
await runCommand('pnpm', ['--filter', '@rebase/web', 'build'], { cwd, env });

previewProcess = spawn(
  'pnpm',
  ['--filter', '@rebase/web', 'exec', 'astro', 'preview', '--host', '127.0.0.1', '--port', String(webPort), '--strictPort'],
  {
    cwd: rootPath,
    env,
    stdio: 'inherit',
  },
);

await new Promise((resolve, reject) => {
  previewProcess.on('error', reject);
  previewProcess.on('exit', (code, signal) => {
    if (shuttingDown && (code === 0 || signal)) {
      resolve();
      return;
    }

    if (code === 0) {
      resolve();
      return;
    }

    const detail = signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`;
    reject(new Error(`web preview failed with ${detail}`));
  });
});
