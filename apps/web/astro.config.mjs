import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL ?? 'https://rebase.network';

export default defineConfig({
  site,
  output: 'static',
  server: {
    host: true,
    port: 4321,
  },
});
