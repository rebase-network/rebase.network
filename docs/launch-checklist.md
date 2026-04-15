# Launch Checklist

Use this checklist with `docs/deployment.md`.

Keep it focused on launch and release verification. Do not repeat deployment procedures here.

## Initial Launch Only

Before the first production launch, confirm:

- `rebase.network` and `admin.rebase.network` are published by the GitHub-connected Cloudflare Workers
- `api.rebase.network` is routed through Cloudflare Tunnel to the private backend stack
- `media.rebase.network` is attached to the R2 bucket
- the initial backend deployment scenario in `docs/deployment.md` has been completed
- the first admin account can sign in

## Every Production Release

Before a release, confirm:

- the operator is following the matching scenario in `docs/deployment.md`
- the release candidate moved from `dev` to `main` through the normal pull request flow
- frontend changes, if any, were published by the GitHub-connected Cloudflare flow
- backend changes, if any, were deployed from the intended `main` commit with `./ops/manage.sh`
- production secrets and runtime settings are still the intended ones

## Route Checks

Verify these public routes:

- `https://rebase.network/`
- `https://rebase.network/about`
- `https://rebase.network/who-is-hiring`
- `https://rebase.network/geekdaily`
- `https://rebase.network/articles`
- `https://rebase.network/events`
- `https://rebase.network/contributors`
- `https://rebase.network/rss.xml`
- `https://rebase.network/geekdaily/rss.xml`
- `https://rebase.network/articles/rss.xml`
- `https://rebase.network/events/rss.xml`
- `https://rebase.network/who-is-hiring/rss.xml`
- `https://rebase.network/robots.txt`
- `https://rebase.network/sitemap.xml`
- `https://rebase.network/healthz`

Verify these admin and API routes:

- `https://admin.rebase.network`
- admin login
- admin dashboard
- `https://api.rebase.network/health`
- `https://api.rebase.network/ready`
- `https://api.rebase.network/version`

If `rebase.community` is part of the active public routing policy for the release, verify that domain too.

## Functional Checks

Verify at least one real operator flow when the related area changed:

- content edit round trip
- media upload round trip
- affected public detail page or list page refresh

## Domain And SEO Checks

Verify:

- canonical URLs point to `https://rebase.network`
- Open Graph and Twitter metadata are present
- fallback social image resolves correctly
- `robots.txt` advertises the sitemap
- `sitemap.xml` includes key public routes and content pages
- at least one real uploaded asset resolves from `https://media.rebase.network`

## Post-Release Monitoring

Confirm after release:

- `/healthz` stays healthy
- `/ready` stays healthy
- `cloudflared` remains connected
- PostgreSQL is still private to the server
- external monitoring is probing the public site and API
- repeated failures alert the team instead of being silently ignored
