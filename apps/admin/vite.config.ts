import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const packageJsonPath = path.resolve(__dirname, './package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as { version?: string };

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
      cwd: path.resolve(__dirname, '../..'),
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'local';
  }
};

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version ?? '0.0.0'),
    __APP_BUILD_SHA__: JSON.stringify(resolveBuildSha()),
  },
  resolve: {
    alias: {
      '@rebase/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});
