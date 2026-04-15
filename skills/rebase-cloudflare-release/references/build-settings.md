# Cloudflare Worker Build Settings

Use `docs/production-config.md` as the single source of truth for exact Cloudflare dashboard values.

Use this note only for release-time reminders.

## What To Check

Before changing Cloudflare dashboard settings, confirm in `docs/production-config.md`:

- worker names
- domains
- production branch
- root directory
- install, build, and deploy commands
- Cloudflare-managed values such as KV bindings

## Local Validation Commands

Run these locally before handing a release to Cloudflare:

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
- `https://rebase.community` when active for the release
- `https://admin.rebase.network`
- public site content is not stale
- admin login still works
- Worker routes no longer return placeholder output such as `hello world`
