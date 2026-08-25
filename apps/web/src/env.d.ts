/// <reference types="astro/client" />
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type */

type CloudflareRuntime = import('@astrojs/cloudflare').Runtime;

interface ImportMetaEnv {
  readonly API_BASE_URL?: string;
  readonly SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  const __REBASE_BUILD_SHA__: string;

  namespace App {
    interface Locals extends CloudflareRuntime {}
  }
}

export {};
/* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type */
