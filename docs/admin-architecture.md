# Admin Architecture

## Goal

Build a Rebase-specific admin workspace and API that help community staff maintain content reliably.

The admin is not a generic CMS shell.

It is a task-oriented internal product for publishing, curation, and operational maintenance.

## Product Principles

- optimize for staff workflows, not table CRUD
- keep the public site read-only for readers
- keep all writes behind authenticated admin APIs
- validate content before it can be published
- prefer explicit workflow states over hidden conventions
- keep media, content, auth, and audit concerns separated
- reuse proven technical patterns from the TGO custom admin where they fit

## Target Stack

- public website: Astro in `apps/web`
- admin frontend: Vue in `apps/admin`
- admin and public API: Hono in `apps/api`
- auth: Better Auth
- database: PostgreSQL
- schema and migrations: Drizzle in `packages/db`
- shared DTOs, enums, and validation helpers: `packages/shared`
- media storage: Cloudflare R2

## Repository Shape

```text
apps/
  web/
  admin/
  api/
packages/
  db/
  shared/
  ui/
docs/
infra/
```

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

## Runtime Responsibilities

### `apps/web`

- renders the public Rebase website
- only consumes published content
- never holds admin credentials
- generates feeds, sitemap, robots, and public-facing metadata
- uses the public API rather than reading the database directly

### `apps/admin`

- provides the operator-facing workspace
- groups content by real Rebase tasks such as GeekDaily, jobs, events, and contributors
- offers list, editor, preview, publish, archive, and audit-aware flows
- renders navigation based on staff permissions

### `apps/api`

- exposes authenticated admin routes for all write actions
- exposes public read routes for the website
- centralizes validation, workflow transitions, permission checks, and audit logging
- provides health and readiness endpoints for deployment checks

### `packages/db`

- owns PostgreSQL schema definitions
- owns migrations and seed scripts
- expresses database-level constraints that backstop application validation

### `packages/shared`

- holds shared enums, DTOs, validation helpers, markdown helpers, and admin/public contracts
- keeps admin and API aligned on field shapes and status values

## Auth and Access Model

Better Auth should handle:

- user identity
- session issuance and validation
- password reset and future login extensions

Application-owned tables should handle:

- which users are staff
- which roles a staff account has
- which permissions a role grants
- which actions must be audited

Readers never authenticate.

Only staff use the admin.

## Validation Model

Every write path should be guarded at four levels:

1. form validation in the admin UI
2. API input validation in `apps/api`
3. business rule validation in domain services
4. PostgreSQL constraints in `packages/db`

Examples:

- GeekDaily episode number must be unique
- a job must have an apply URL or an alternate contact method
- an external-registration event must include a registration URL
- a contributor must belong to at least one published role

## Workflow States

Recommended default content states:

- `draft`
- `published`
- `archived`

Optional later extension:

- `scheduled`
- `in_review`

The first working release should prioritize clear draft, publish, and archive behavior over complex approval flows.

## Media Model

Use R2 for staff-managed media.

Recommended media flow:

1. admin requests an upload intent from the API
2. API issues a signed upload flow to R2
3. admin finalizes the upload with metadata such as alt text and asset purpose
4. content editors choose existing assets from the media library

The database should store media metadata, not binary file content.

## Public Read API

The public site should consume explicit published-content routes such as:

- `/api/public/v1/site-config`
- `/api/public/v1/home`
- `/api/public/v1/about`
- `/api/public/v1/articles`
- `/api/public/v1/articles/:slug`
- `/api/public/v1/jobs`
- `/api/public/v1/jobs/:slug`
- `/api/public/v1/events`
- `/api/public/v1/events/:slug`
- `/api/public/v1/contributors`
- `/api/public/v1/geekdaily`
- `/api/public/v1/geekdaily/:slug`
- `/api/public/v1/geekdaily/search-index`

This keeps the public site decoupled from admin-only models and permissions.

## Audit and Observability

Sensitive admin actions should create audit records.

At minimum, audit:

- create
- update
- publish
- archive
- role changes
- staff changes
- media finalize and archive actions

Recommended runtime probes:

- public website: `/healthz`
- API liveness: `/health`
- API readiness: `/ready`
- version probe: `/version`

## Deployment Model

Steady-state production split:

- `apps/web` on a Cloudflare Worker for `rebase.network` and `rebase.community`
- `apps/admin` on a separate Cloudflare Worker for `admin.rebase.network`
- `apps/api` on `rebase@rebase.network` inside Docker Compose
- PostgreSQL on `rebase@rebase.network` inside the same Docker Compose stack
- `cloudflared` on `rebase@rebase.network` to publish `api.rebase.network` through Cloudflare Tunnel
- R2 for media on `media.rebase.network`

This keeps the public and admin frontends at the edge while the writable backend stays on the server without exposing PostgreSQL publicly.

Current rollout note, verified on 2026-04-15:

- `admin.rebase.network` is deployed through the dedicated GitHub-connected admin Worker
- the backend stack is already live on `rebase@rebase.network`
- the public site is deployed through the GitHub-connected public Worker

See `docs/production-config.md` for the verified live routing and `docs/deployment.md` for the current hybrid deployment runbook.

## Non-Goals for the First Admin Release

- complex multi-step approval engines
- collaborative realtime editing
- inline visual page builders
- member self-service profile editing
- generic low-code schema editing in production
