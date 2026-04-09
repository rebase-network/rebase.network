---
name: rebase-cloudflare-release
description: Deploy and troubleshoot the Rebase Cloudflare Workers frontend stack. Use when working on `apps/web` or `apps/admin`, configuring Cloudflare Workers Builds, fixing build or deploy failures, checking custom domains, KV bindings, or compatibility date issues, or performing the Rebase `dev to main to Cloudflare` release flow.
---

# Rebase Cloudflare Release

## Overview

Use this skill for the Rebase public and admin Workers release path. Keep the release flow anchored to the repo's `dev -> PR -> main -> Cloudflare Builds` policy and use the runbooks in `references/` before changing dashboard settings or patching build configuration.

## Release Workflow

1. Work on `dev`, not `main`.
2. Validate locally before pushing:
   - `pnpm install --frozen-lockfile`
   - `pnpm --filter @rebase/web check`
   - `pnpm build:web:prod`
   - `pnpm build:admin:prod`
3. Push to `origin/dev`.
4. Create a pull request from `dev` to `main`.
5. Merge only through GitHub; do not merge `main` locally as the normal release path.
6. Let Cloudflare Workers Builds publish from `main`.
7. Verify production domains after the build finishes.

## Current Production Split

- Public Worker: `rebase-web`
- Public domains: `rebase.network`, `rebase.community`
- Admin Worker: `rebase-admin`
- Admin domain: `admin.rebase.network`
- Public API origin used by Workers: `https://api.rebase.network`

Use `references/build-settings.md` when you need the exact dashboard settings, commands, bindings, and watch-path rules.

## When To Read References

- Read `references/build-settings.md` before editing Cloudflare dashboard settings, worker build commands, bindings, or domains.
- Read `references/troubleshooting.md` when Cloudflare logs show install failures, compatibility date errors, duplicate KV provisioning, `hello world` on the production domain, or mismatched branch output.

## Guardrails

- Treat Cloudflare dashboard configuration as part of production state; update `docs/deployment.md` and `docs/production-config.md` when it changes.
- Prefer `pnpm deploy:web:dry-run` and `pnpm deploy:admin:dry-run` for local verification.
- Do not use local manual production deploys as the default path.
- If the task also includes backend rollout, pair this skill with `rebase-api-rollout`.
