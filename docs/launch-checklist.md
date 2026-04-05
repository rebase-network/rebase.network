# Launch Checklist

This document captures the minimum launch and post-launch baseline for the first Rebase website release.

It is intentionally practical rather than exhaustive.

## Public Runtime Routes

Before production rollout, verify that these routes return successfully:

- `/`
- `/about`
- `/who-is-hiring`
- `/geekdaily`
- `/articles`
- `/events`
- `/contributors`
- `/rss.xml`
- `/geekdaily/rss.xml`
- `/articles/rss.xml`
- `/events/rss.xml`
- `/who-is-hiring/rss.xml`
- `/robots.txt`
- `/sitemap.xml`
- `/healthz`

## Domain Preparation

Primary public domain:

- `rebase.network`

Secondary public domain:

- preferred: `rebase.community` serves the same site directly
- fallback: `rebase.community` returns a `301` redirect to `rebase.network`

Media domain:

- `media.rebase.network` should point to the Cloudflare R2 public bucket after the bucket is created
- until then, use the default R2 public URL for testing and local integration

Operational domain suggestion:

- `admin.rebase.network` for Directus when production CMS is exposed

## Health and Operations Baseline

Current local baseline:

- `pnpm cms:health` verifies Directus core health and the public website-token read path
- `/healthz` verifies the public site can still reach Directus and load public site settings

Recommended production follow-up:

- monitor `/healthz` from an external GitHub Actions workflow or another uptime tool
- monitor the CMS endpoint `/server/health`
- alert on repeated failures rather than single transient failures

## SEO and Discovery Baseline

Verify before launch:

- canonical URLs point to `https://rebase.network`
- Open Graph and Twitter metadata are present
- fallback social image resolves correctly
- `robots.txt` advertises the sitemap
- `sitemap.xml` includes key public routes and content detail pages

## Analytics and Observability Notes

V1 does not require a finalized frontend analytics stack before launch.

Current agreement:

- frontend analytics can be added later
- backend observability starts with health checks and external periodic probing
- deeper metrics, dashboards, and alerts can evolve after the first release
