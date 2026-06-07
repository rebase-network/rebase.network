# Implementation Roadmap

## Purpose

This file tracks the current implementation roadmap for the repository.

It replaces the original phased buildout plan now that the V1 foundation already exists in the codebase.

## Current Baseline

The repository already includes:

- `apps/web` for the public Astro site
- `apps/admin` for the internal Vue workspace
- `apps/api` for public and admin APIs plus auth/bootstrap flows
- `packages/db`, `packages/shared`, and `packages/types` for shared foundations
- local bootstrap scripts, smoke tests, and production rollout helpers

This means the main job is no longer "build the stack from scratch". The main job is to harden, maintain, and evolve the current implementation without letting the docs drift away from reality.

## Active Workstreams

### 1. Public Site Stability and Content Quality

Focus:

- keep archive, list, and detail pages stable across desktop and mobile
- preserve route, RSS, sitemap, and health-check behavior
- fold lasting UX and visual rules into `apps/web/design_principles.md` and `apps/web/DESIGN.md`
- prevent regressions around misleading CTAs, broken search or pagination, metadata duplication, and placeholder content quality

Definition of done:

- affected public routes still pass smoke coverage
- changed page types are reviewed in a browser on desktop and mobile
- source-of-truth docs are updated when the default behavior changes

### 2. Admin Workflow Hardening

Focus:

- improve validation, publish/archive flows, and editor ergonomics for site settings, articles, jobs, events, contributors, GeekDaily, assets, staff, and audit views
- keep role and permission behavior aligned with `docs/architecture/admin-architecture.md` and `docs/architecture/admin-information-architecture.md`
- reduce operator reliance on manual cleanup or direct database intervention

Definition of done:

- target editorial workflows can be completed end-to-end from the admin UI
- empty states, validation failures, and permission failures are explicit
- admin behavior changes are reflected in the relevant docs

### 3. Backend and Data Reliability

Focus:

- keep public and admin API contracts aligned with `docs/product/content-model.md` and `docs/architecture/admin-data-model.md`
- preserve reproducible migrations, seed data, GeekDaily import behavior, runtime content freshness, and asset handling
- maintain health and readiness visibility around API and database changes

Definition of done:

- migrations and seeds remain reproducible on a clean local setup
- content updates appear through the expected runtime path
- backend changes do not silently break public routes, feeds, or admin flows

### 4. Release and Operations Hardening

Focus:

- keep `ops/manage.sh`, `infra/production/*`, `docs/operations/deployment.md`, `docs/operations/production-config.md`, and `docs/operations/launch-checklist.md` in sync
- prefer small, reviewable releases through the `dev` -> `main` pull request flow
- validate dry-run deployment paths before production-impacting changes

Definition of done:

- local and production procedures match the documented commands
- release-critical checks remain current
- rollback, backup, and readiness expectations stay clear to operators

### 5. Documentation Governance

Focus:

- keep the `docs/` root limited to active baseline and operational source-of-truth files
- archive dated process notes, redesign plans, and one-off review artifacts instead of mixing them into the live doc set
- remove stale planning language, commands, and paths promptly when implementation changes

Definition of done:

- active docs reflect the current repo structure and scripts
- low-value historical materials are removed or moved out of the live documentation path
- future redesign work updates the durable design docs instead of creating a new shadow source of truth

## Near-Term Priorities

- expand verification around admin login and critical publish flows, which currently have less automated coverage than the public site
- keep deployment and launch docs aligned with the actual release workflow and helper scripts
- continue tightening public content quality and content-state handling without reopening broad V1 scope

## Working Rules

- keep V1 scope tight unless a requirement is explicitly re-scoped
- commit after each coherent batch of completed work
- update the matching source-of-truth doc when implementation changes become the new default
- prefer archiving dated process material over leaving it in the live documentation root

## Update Rule

Revise this file when repository priorities materially change.

Do not use it as a one-off feature plan or redesign scratchpad.
