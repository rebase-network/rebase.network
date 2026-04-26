const { defineConfig, devices } = require('@playwright/test');

const smokeApiPort = Number.parseInt(process.env.SMOKE_API_PORT || '8789', 10);
const smokeWebPort = Number.parseInt(process.env.SMOKE_WEB_PORT || '4324', 10);
const smokeApiBaseUrl = `http://127.0.0.1:${smokeApiPort}`;
const smokeWebBaseUrl = `http://127.0.0.1:${smokeWebPort}`;

module.exports = defineConfig({
  testDir: './tests/smoke',
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: true,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: smokeWebBaseUrl,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1080 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
  webServer: [
    {
      command: `PORT=${smokeApiPort} BETTER_AUTH_URL=${smokeApiBaseUrl} CORS_ALLOWED_ORIGINS=${smokeWebBaseUrl} pnpm --filter @rebase/api start`,
      url: smokeApiBaseUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: `SMOKE_API_PORT=${smokeApiPort} SMOKE_WEB_PORT=${smokeWebPort} API_BASE_URL=${smokeApiBaseUrl} node scripts/local/smoke-web-server.mjs`,
      url: smokeWebBaseUrl,
      reuseExistingServer: !process.env.CI,
      timeout: 240000,
    },
  ],
});
