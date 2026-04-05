import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://rebase.network',
  output: 'server',
  adapter: cloudflare(),
  server: {
    host: true,
    port: 4321,
  },
});
