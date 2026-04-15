# Architecture

## Overview

The new Rebase website is now designed around a custom community publishing stack.

It separates:

- the public website
- the Rebase admin workspace
- the Rebase admin and public API layer
- the media storage layer
- the primary relational database

This keeps the public experience lightweight while giving staff a purpose-built internal tool instead of a generic headless CMS.

The target architecture for Rebase is the custom admin and API stack described in this document.

## Technology Stack

- public frontend: Astro
- public runtime and deployment: Cloudflare Workers
- admin frontend: Vue
- admin and public API: Hono
- auth: Better Auth
- primary database: PostgreSQL
- schema and migrations: Drizzle
- media storage: Cloudflare R2

## Product and Editorial Defaults

- visual direction: community media
- editorial format: structured fields plus Markdown bodies
- GeekDaily search implementation in V1: frontend search backed by a Rebase-owned search index payload
- future search expansion may use a third-party service or plugin if needed

## Why This Architecture

### Astro

- good fit for content-heavy public experiences
- strong component model
- flexible rendering strategies
- works well with Cloudflare deployment targets

### Custom Admin Frontend

- lets Rebase shape the UI around staff tasks such as publishing GeekDaily or jobs
- avoids forcing operators to think in raw collections and schema tables
- can reuse proven interaction patterns from the TGO admin implementation

### Hono API Layer

- keeps write access behind explicit authenticated APIs
- centralizes validation, workflow transitions, permissions, and audit logging
- gives the public site a stable read API instead of coupling it to admin-only structures

### Better Auth

- handles identity and sessions cleanly
- keeps authentication concerns separate from business permissions
- aligns with the existing custom-admin pattern already proven in TGO

### PostgreSQL plus Drizzle

- strong fit for structured editorial and operational data
- supports explicit constraints and indexes for publication workflows
- keeps schema and migrations in version control

### R2

- keeps staff-managed media separate from code
- fits the Cloudflare-based delivery model
- avoids storing operational content media in git history

## System Diagram

```text
reader browser
    |
    v
cloudflare edge
    |
    v
public worker (`apps/web`)
    |
    v
`api.rebase.network`
    |
    v
cloudflare tunnel (`cloudflared`)
    |
    v
api service (`apps/api`)
    |
    +--> postgresql
    +--> r2

staff browser
    |
    v
cloudflare edge
    |
    v
admin worker (`apps/admin`)
    |
    v
`api.rebase.network`
    |
    v
cloudflare tunnel (`cloudflared`)
    |
    v
api service (`apps/api`)
    |
    +--> better auth
    +--> postgresql
    +--> r2
```

## Runtime Model

### Public Read Flow

1. A reader requests a public page on `rebase.network` or `rebase.community`.
2. The Astro app runs on the public Cloudflare Worker.
3. The worker fetches published content from `api.rebase.network`.
4. Cloudflare routes that hostname through `cloudflared` to the API service on the private backend host.
5. The API reads structured content from PostgreSQL and media metadata from the assets table.
6. Media assets are served from R2-backed URLs.
7. Cloudflare cache is applied to improve repeat access performance.

### Staff Content Flow

1. A staff member opens `admin.rebase.network`.
2. The admin UI is served by a dedicated Cloudflare Worker for `apps/admin`.
3. The admin app calls authenticated routes on `api.rebase.network`.
4. Cloudflare routes API traffic through `cloudflared` to the API service on the private backend host.
5. The API validates the request, checks permissions, and applies business rules.
6. Structured data is written to PostgreSQL.
7. Uploaded media is stored in R2 and referenced by metadata records.
8. Sensitive actions write audit logs.
9. The public site reads the latest published content through the public API.

## Deployment Targets

Steady-state production target for V1:

- `apps/web` on a Cloudflare Worker bound to `rebase.network` and `rebase.community`
- `apps/admin` on a separate Cloudflare Worker bound to `admin.rebase.network`
- `apps/api` in Docker Compose on the private backend host
- PostgreSQL in the same Docker Compose stack on the private backend host
- `cloudflared` in the same Docker Compose stack to expose `api.rebase.network` through Cloudflare Tunnel
- public media served from Cloudflare R2 on `media.rebase.network`

For the production settings index and operator handbook, see `docs/production-config.md` and `docs/deployment.md`.

### Why Cloudflare Tunnel for the API

- keeps the API origin off the public internet in V1
- avoids adding Caddy or Nginx just to terminate HTTPS
- lets Cloudflare handle the external TLS edge while the tunnel secures edge-to-origin traffic
- keeps PostgreSQL private to the server and Docker network

## Rendering Strategy

V1 should use a mixed rendering strategy.

### Good Candidates for Static or Stable Rendering

- about page
- contributors page
- fixed site configuration sections

### Good Candidates for Dynamic or Cached Rendering

- home page
- GeekDaily list page
- GeekDaily detail page
- jobs page
- article list and detail pages
- event list and detail pages

This strategy avoids unnecessary full-site rebuilds when content changes frequently.

## Domain Strategy

Public domains:

- `rebase.network`
- `rebase.community`

Operational domains:

- `admin.rebase.network` for the admin worker
- `api.rebase.network` for the tunneled API hostname
- `media.rebase.network` for the R2 public bucket

Preferred behavior:

- both public domains should access the site directly if practical

Fallback behavior:

- `rebase.community` may redirect with `301` to `rebase.network` if direct dual-domain delivery becomes impractical

## Release Strategy

- daily development continues on `dev`
- merge `dev` into `main` only when the release candidate is ready
- production deployments should run from `main`, not directly from `dev`
- release procedures and operator rules live in `docs/deployment.md`

## API Boundary

### Public Read API

V1 should read published content from Rebase-owned public API routes.

The public site should not depend on a generic CMS delivery API.

### Admin Write API

All admin writes should go through authenticated admin routes.

There should be no direct browser-to-database write path.

### Public Write API

V1 still does not include event registration forms.

As a result, V1 does not require a public write API for forms or submissions.

## Media Strategy

### Store in the Repository

- logo
- favicon
- fixed decorative assets
- default placeholders
- fallback social card assets

### Store in R2

- article cover images
- event posters
- contributor avatars
- job-related media
- future GeekDaily media attachments if needed

## Caching Strategy

V1 should use practical cache control instead of complex invalidation from day one.

Suggested approach:

- rely on Cloudflare edge caching in V1
- cache public GET responses at the edge
- keep TTLs conservative for dynamic list pages
- allow faster refresh for pages with frequent content updates
- add targeted purge rules later if needed

## Search Strategy

V1 includes GeekDaily search only.

Recommended scope:

- search against episode-level metadata
- include title, summary, tags, date, episode number, and recommendation item titles
- keep the first version lightweight and practical

V1 does not require a heavyweight dedicated search engine.

V1 should implement GeekDaily search in the frontend while sourcing a Rebase-owned search index payload from the API or build layer.

## Feed Strategy

V1 includes RSS output for public content distribution.

Recommended feeds:

- `/rss.xml`
- `/geekdaily/rss.xml`
- `/articles/rss.xml`
- `/events/rss.xml`
- `/who-is-hiring/rss.xml`

Feed generation should happen in the public website layer and consume published content from the Rebase public API.

GeekDaily feed items should map to episode pages, not individual links inside an episode.

Hiring feed items should map to public hiring detail pages rather than external apply links.

V1 feed defaults:

- each feed returns the latest 3 published items
- article, event, and hiring feed descriptions use summary content
- GeekDaily feed descriptions use the episode body content or a body-like generated summary

## Operations Baseline

V1 should include a simple health-check strategy for backend services.

Recommended baseline:

- a public website health endpoint at `/healthz`
- an API liveness endpoint such as `/health`
- an API readiness endpoint such as `/ready`
- a database reachability check through API readiness or deployment tooling
- follow-up external periodic checks and notifications may be implemented from another repository with GitHub Actions

## SEO Baseline

V1 should ship with a lightweight but complete SEO baseline.

Recommended baseline:

- canonical URLs on public pages
- default Open Graph and Twitter metadata
- a shared social card asset fallback
- `/robots.txt`
- `/sitemap.xml`

## Security Baseline

- readers never need authentication
- admin access is handled by Better Auth plus application-level staff permissions
- admin credentials never reach the public client
- media write access stays behind authenticated admin APIs
- public site only consumes published content

## V1 Non-Goals

- complex event operations
- public member system
- advanced workflow automation
- full-site search across all collections
- multi-language content system
- email subscription infrastructure
