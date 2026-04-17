# Rebase Community Website

This monorepo powers `rebase.network`: the public community website, the internal admin workspace, and the backend services that support both.

## Project Overview

The repository brings together four parts of the product in one place:

- a public site for readers in `apps/web`
- a custom admin workspace for editors and operators in `apps/admin`
- API and auth services in `apps/api`
- shared database, validation, and UI packages in `packages/*`

## V1 Focus

Rebase V1 is intentionally content-first.

- readers do not log in
- staff work through a purpose-built admin workspace
- GeekDaily search is in scope
- GeekDaily detail pages use `/geekdaily/geekdaily-{episode-number}`
- GeekDaily titles default to `极客日报#{episode-number}` during migration
- hiring detail pages and hiring RSS are in scope
- RSS feeds publish the latest 3 items per feed in V1
- event registration is out of scope

## Tech Snapshot

The current stack is:

- Astro for the public site
- Vue for the admin workspace
- Hono for the API runtime
- Better Auth for authentication
- PostgreSQL and Drizzle for data and migrations
- Cloudflare Workers and R2 for runtime and media storage

## Quick Start

For the full local setup guide, use `docs/local-development.md`. The shortest path to a working local stack is:

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.6.5 --activate
cp .env.example .env
pnpm install
pnpm local:bootstrap
pnpm dev:stack
```

What this does:

- starts local PostgreSQL
- applies Drizzle migrations
- seeds baseline content and archive data
- bootstraps a local admin account
- runs the web app, admin app, and API together

Local services:

- public site: `http://127.0.0.1:4321`
- admin workspace: `http://127.0.0.1:5174`
- API: `http://127.0.0.1:8788`
- PostgreSQL: `127.0.0.1:55433`

If you need the default local admin credentials or want to override them, see `docs/local-development.md`.

## Common Commands

- `pnpm local:bootstrap`: prepare the full local stack from database startup through admin bootstrap
- `pnpm dev:stack`: run API, admin, and web together
- `pnpm dev:public`: run API and the public site
- `pnpm dev:ops`: run API and the admin workspace
- `pnpm dev:web`: run only the Astro public site
- `pnpm dev:admin`: run only the Vue admin workspace
- `pnpm dev:api`: run only the Hono API
- `pnpm db:migrate`: apply Drizzle migrations
- `pnpm db:seed`: reseed baseline content and import `geekdaily.csv` when available
- `pnpm admin:bootstrap`: recreate or refresh the local admin account
- `pnpm test:smoke`: run Playwright smoke checks

## Repository Map

- `apps/web`: public website
- `apps/admin`: internal admin workspace
- `apps/api`: API, auth, and admin bootstrap script
- `packages/db`: schema, migrations, and seed data
- `packages/shared`: shared validation and contracts
- `packages/types`: shared types
- `packages/ui`: shared UI building blocks
- `infra/postgres`: local PostgreSQL container setup
- `infra/production`: production deployment configuration
- `scripts/local`: local development scripts
- `tests/smoke`: Playwright smoke coverage

## Documentation Index

Start here:

- `README.md`: repository overview and contributor quick start
- `DESIGN.md`: design-document index for the repository
- `docs/local-development.md`: local setup, commands, and archive import notes
- `docs/v1-scope.md`: V1 goals, scope, and non-goals

Product and delivery:

- `docs/content-model.md`: public content domains, field rules, and URL conventions
- `docs/implementation-plan.md`: delivery phases and milestone expectations
- `docs/acceptance-criteria.md`: product and module-level acceptance criteria
- `docs/quality-assurance.md`: validation standards and smoke-check expectations

Architecture and admin system:

- `docs/architecture.md`: system architecture, deployment, caching, and runtime decisions
- `docs/admin-architecture.md`: custom admin, API, auth, and media architecture
- `docs/admin-information-architecture.md`: operator workflows and admin module structure
- `docs/admin-data-model.md`: backend tables, workflow states, and validation-critical constraints

Design references:

- `apps/web/design_principles.md`: public-site design intent and interaction rules
- `apps/web/DESIGN.md`: public-site visual specification
- `apps/admin/design_principles.md`: admin UX intent and workflow guidance
- `apps/admin/DESIGN.md`: admin visual specification

Operations and release:

- `docs/deployment.md`: operator handbook
- `docs/production-config.md`: production settings index
- `docs/launch-checklist.md`: release verification checklist

## Repository Conventions

Workflow conventions for coding agents live in `AGENTS.md`.
