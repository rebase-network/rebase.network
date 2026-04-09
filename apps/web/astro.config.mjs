import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

const site = process.env.SITE_URL ?? 'https://rebase.network';
const useCloudflareAdapter = process.env.ASTRO_LOCAL_DEV !== 'true';

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
});
