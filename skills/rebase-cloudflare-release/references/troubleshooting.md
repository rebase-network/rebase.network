# Cloudflare Troubleshooting

## `ERR_PNPM_OUTDATED_LOCKFILE`

Symptom:

- Cloudflare fails during `pnpm install --frozen-lockfile`
- log mentions `package.json` specifiers not matching `pnpm-lock.yaml`

Fix:

1. Keep the intended dependencies in `package.json`.
2. Run `pnpm install` locally.
3. Commit the updated `pnpm-lock.yaml` together with the manifest changes.
4. Re-run `pnpm install --frozen-lockfile` locally before pushing.

## Compatibility Date Error

Symptom:

- `This Worker requires compatibility date "2026-04-09", but the newest date supported by this server binary is "2026-04-08"`

Rebase-specific fix:

- make `apps/web/astro.config.mjs` pass `configPath: './wrangler.template.jsonc'` into the Cloudflare adapter
- keep `apps/web/wrangler.template.jsonc` as the explicit source of truth for `compatibility_date`

This prevents Astro/Cloudflare build tooling from drifting to an implicit future date during build.

## Duplicate KV Namespace Provisioning

Symptom:

- Wrangler tries to create `rebase-web-session`
- Cloudflare returns `a namespace with this account ID and title already exists`

Fix:

- set `SESSION_KV_NAMESPACE_ID` in Workers Builds
- set `SESSION_KV_NAMESPACE_PREVIEW_ID` too
- keep `scripts/deploy/prepare-web-assets.mjs` in the release path so the generated deploy config binds the existing namespace instead of provisioning a new one

## Production Domain Returns `hello world`

Check these in order:

1. the correct Worker is attached to the custom domain
2. the Cloudflare build used `main`
3. the production deploy command points at the generated config file
4. the latest merge actually contains the expected app code

## Local Build Works Poorly but Cloudflare Should Still Build

There are two separate classes of problems:

- lockfile or manifest mismatch: must be fixed in git
- local Miniflare/runtime mismatch: often only affects local builds and should be verified against the repo's explicit wrangler config

Do not assume they are the same issue.

## Repo Files To Check Before Patching

- `apps/web/astro.config.mjs`
- `apps/web/wrangler.template.jsonc`
- `apps/admin/wrangler.production.jsonc`
- `scripts/deploy/prepare-web-assets.mjs`
- `docs/deployment.md`
- `docs/production-config.md`
