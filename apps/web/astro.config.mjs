import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

const site = process.env.SITE_URL ?? 'https://rebase.network';

export default defineConfig({
  adapter: cloudflare(),
  site,
  output: 'server',
  server: {
    host: true,
    port: 4321,
  },
});
