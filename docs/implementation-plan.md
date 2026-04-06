# Implementation Plan

## Goal

Turn the agreed V1 scope into a working first release in controlled phases.

Each completed batch of work should be committed promptly following the repository commit convention.

## Proposed Repository Structure

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
```

The Rebase admin is now in scope for this repository.

The repository should converge on a custom admin and API stack rather than a separately managed headless CMS.

Planned admin/API and database deployment target:

- `rebase@101.33.75.240`

## Phase 1: Foundation and Direction Reset

Deliverables:

- freeze the custom-admin architecture and data model
- update docs and implementation assumptions
- preserve the current public frontend baseline while planning the transition away from Directus

Definition of done:

- the custom admin direction is documented clearly
- the repo has an agreed target structure
- the transition plan away from the prototype is explicit

## Phase 2: Backend and Shared Foundations

Deliverables:

- scaffold `apps/admin`, `apps/api`, `packages/db`, and `packages/shared`
- Better Auth baseline
- RBAC baseline
- PostgreSQL schema and migrations
- health and observability baseline
- media metadata model

Definition of done:

- staff can authenticate into the admin shell
- admin and public API baselines run locally
- schema and migrations are reproducible

## Phase 3: Core Rebase Admin Modules

Deliverables:

- site settings and singleton pages
- articles admin flows
- jobs admin flows
- events admin flows
- contributors and role management
- media library baseline
- audit log baseline

Definition of done:

- staff can create, edit, publish, and archive the core content types through the custom admin
- public API routes can serve published content for those modules

## Phase 4: GeekDaily Workflow

Deliverables:

- episode-based GeekDaily schema
- dedicated episode and item editor UX
- CSV-informed migration strategy
- search index output for frontend search
- SQL or import workflow for historical GeekDaily archive

Definition of done:

- GeekDaily list and detail pages work with episode-level URLs
- staff can edit episodes through a dedicated workflow rather than generic JSON editing
- historical CSV import output remains reproducible

## Phase 5: Public Site Data Transition

Deliverables:

- replace Directus-based frontend fetching with Rebase public API fetching
- preserve existing public routes and RSS behavior
- keep R2-backed media handling aligned with the new API
- remove obsolete data access assumptions from the public site

Definition of done:

- pages render published content through Rebase-owned public APIs
- the public site no longer depends on the temporary Directus prototype

## Phase 6: Hardening and Launch Preparation

Deliverables:

- SEO baseline
- metadata and social cards
- RSS feeds
- cache strategy review
- domain configuration checklist
- analytics and observability basics
- simple backend health-check baseline
- deployment runbooks for admin, API, and database

Definition of done:

- core SEO is in place
- launch-critical routes are validated
- deployment and domain steps are documented
- basic service health checks are documented

## Open Decisions to Resolve Before Launch

- whether both public domains can remain directly accessible in production
- exact Cloudflare cache policy by route
- final analytics stack
- whether the admin UI is served directly from the server or a separate static host

## Working Rules During Implementation

- keep V1 scope tight
- avoid adding registration, user systems, or custom member features beyond staff auth
- prefer stable and maintainable choices over clever complexity
- commit after each coherent batch of completed work
- treat the existing Directus prototype as temporary migration scaffolding, not the end state
