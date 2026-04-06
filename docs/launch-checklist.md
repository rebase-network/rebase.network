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

## Admin and API Routes

Before production rollout, verify these internal or operational routes:

- admin login page
- admin dashboard
- API liveness endpoint such as `/health`
- API readiness endpoint such as `/ready`
- API version endpoint such as `/version`

## Domain Preparation

Primary public domain:

- `rebase.network`

Secondary public domain:

- preferred: `rebase.community` serves the same site directly
- fallback: `rebase.community` returns a `301` redirect to `rebase.network`

Media domain:

- `media.rebase.network` should point to the Cloudflare R2 public bucket after the bucket is created
- until then, use the default R2 public URL for testing and local integration

Operational domain suggestions:

- `admin.rebase.network` for the admin workspace
- `api.rebase.network` if a dedicated API hostname is preferred

## Health and Operations Baseline

Recommended baseline:

- `/healthz` verifies the public site runtime
- `/health` verifies API liveness
- `/ready` verifies API readiness and key dependencies
- external monitoring should probe the public site and API regularly

Recommended production follow-up:

- monitor `/healthz` from an external GitHub Actions workflow or another uptime tool
- monitor the API readiness endpoint
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
- backend observability starts with health checks, audit logs, and external periodic probing
- deeper metrics, dashboards, and alerts can evolve after the first release
