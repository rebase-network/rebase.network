# Cloudflare Worker Build Settings

## Build Targets

### `rebase-web`

- production branch: `main`
- non-production branch builds: enabled
- root directory: `/`
- build command: `pnpm build:web:prod`
- deploy command: `pnpm exec wrangler deploy --config apps/web/dist/server/wrangler.production.json`
- non-production deploy command: `pnpm exec wrangler versions upload --config apps/web/dist/server/wrangler.production.json`
- config source in repo: `apps/web/wrangler.template.jsonc`
- Astro adapter config source: `apps/web/astro.config.mjs`

Required Workers Builds env:

- `SESSION_KV_NAMESPACE_ID`
- `SESSION_KV_NAMESPACE_PREVIEW_ID` (usually same as production id)

Runtime vars:

- `SITE_URL=https://rebase.network`
- `API_BASE_URL=https://api.rebase.network`

### `rebase-admin`

- production branch: `main`
- non-production branch builds: enabled
- root directory: `/`
- build command: `pnpm build:admin:prod`
- deploy command: `pnpm exec wrangler deploy --config apps/admin/wrangler.production.jsonc`
- non-production deploy command: `pnpm exec wrangler versions upload --config apps/admin/wrangler.production.jsonc`

Build-time targets:

- `VITE_API_BASE_URL=https://api.rebase.network`
- `VITE_PUBLIC_SITE_BASE_URL=https://rebase.network`

## Why Root Directory Must Stay `/`

Keep `/` as the Workers Builds root because:

- root `package.json` contains the workspace release scripts
- `pnpm-lock.yaml` and `pnpm-workspace.yaml` live at repo root
- the public Worker build writes `apps/web/dist/server/wrangler.production.json`

## Release Validation Commands

Run these locally before handing the build to Cloudflare:

```bash
pnpm install --frozen-lockfile
pnpm --filter @rebase/web check
pnpm build:web:prod
pnpm build:admin:prod
pnpm deploy:web:dry-run
pnpm deploy:admin:dry-run
```

## Production Verification

After a successful Cloudflare build, verify:

- `https://rebase.network`
- `https://rebase.community`
- `https://admin.rebase.network`
- public site content is not stale
- admin login still works
- Worker routes no longer return placeholder output such as `hello world`
