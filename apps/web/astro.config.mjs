import { execSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

const site = process.env.SITE_URL ?? 'https://rebase.network';
const useCloudflareAdapter = process.env.ASTRO_LOCAL_DEV !== 'true';
const projectRoot = dirname(fileURLToPath(import.meta.url));

const resolveBuildSha = () => {
  const envSha =
    process.env.REBASE_BUILD_SHA ??
    process.env.GITHUB_SHA ??
    process.env.CF_PAGES_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA;

  if (envSha) {
    return envSha.slice(0, 7);
  }

  try {
    return execSync('git rev-parse --short HEAD', {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'local';
  }
};

export default defineConfig({
  adapter: useCloudflareAdapter
    ? cloudflare({
        configPath: './wrangler.template.jsonc',
      })
    : undefined,
  site,
  output: 'server',
  server: {
    host: true,
    port: 4321,
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.rebase.network https://cloudflareinsights.com https://*.cloudflareinsights.com",
        "font-src 'self' data:",
      ],
      scriptDirective: {
        resources: ["'self'", 'https://static.cloudflareinsights.com'],
      },
      styleDirective: {
        resources: ["'self'"],
      },
    },
  },
  vite: {
    define: {
      __REBASE_BUILD_SHA__: JSON.stringify(resolveBuildSha()),
    },
  },
});
