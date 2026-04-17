# Rebase Community Website

This repository contains the Rebase public website, the internal admin workspace, and the shared backend services that support both surfaces.

## What Lives In This Repo

- public site for readers in `apps/web`
- admin workspace for operators in `apps/admin`
- API and auth services in `apps/api`
- shared database, contracts, and UI packages in `packages/*`
- local and deployment scripts in `scripts/*` and `infra/*`

## Current V1 Direction

Rebase V1 is a content platform rather than a complex business platform.

- readers do not log in
- staff operate through a custom admin workspace
- event registration is out of scope for V1
- GeekDaily search is in scope for V1
- RSS feeds are in scope for V1
- hiring detail pages and hiring RSS are in scope for V1
- GeekDaily detail URLs use `/geekdaily/geekdaily-{episode-number}`
- GeekDaily titles default to `极客日报#{episode-number}` during migration
- RSS feeds default to the latest 3 items per feed in V1

## Stack At A Glance

- public frontend: Astro
- public runtime: Cloudflare Workers
- admin frontend: Vue
- API runtime: Hono
- auth: Better Auth
- primary database: PostgreSQL
- ORM and migrations: Drizzle
- media storage: Cloudflare R2

## Quick Start

1. Install the recommended Node version.
2. Enable Corepack and the pinned pnpm version.
3. Copy `.env.example` to `.env`.
4. Install dependencies.
5. Bootstrap the local stack.
6. Start the development services.

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

`pnpm local:bootstrap` starts PostgreSQL, applies migrations, seeds baseline content, and creates the default local admin account.

## Local Services

- public site: `http://127.0.0.1:4321`
- admin workspace: `http://127.0.0.1:5174`
- API: `http://127.0.0.1:8788`
- PostgreSQL: `127.0.0.1:55433`

Default local admin credentials after `pnpm local:bootstrap` or `pnpm admin:bootstrap`:

- email: `admin@rebase.local`
- password: `RebaseAdmin123456!`
- display name: `Rebase Super Admin`

These values come from `DEV_ADMIN_EMAIL`, `DEV_ADMIN_PASSWORD`, and `DEV_ADMIN_NAME` in `.env`. If you change them, re-run `pnpm admin:bootstrap` to refresh the local account.

## Common Commands

- `pnpm local:bootstrap`: start PostgreSQL, apply migrations, seed content, and bootstrap the local admin account
- `pnpm dev:stack`: run API, admin, and web together
- `pnpm dev:public`: run API and the public site
- `pnpm dev:ops`: run API and the admin workspace
- `pnpm dev:web`: run the Astro public site
- `pnpm dev:admin`: run the Vue admin workspace
- `pnpm dev:api`: run the Hono API
- `pnpm db:up`: start PostgreSQL only
- `pnpm db:migrate`: apply Drizzle migrations
- `pnpm db:seed`: reseed baseline content and import `geekdaily.csv` when available
- `pnpm admin:bootstrap`: recreate or refresh the local admin account
- `pnpm test:smoke`: run Playwright smoke checks

## Repository Layout

- `apps/web`: public website
- `apps/admin`: internal admin workspace
- `apps/api`: API, auth, and admin bootstrap script
- `packages/db`: Drizzle schema, migrations, and seed data
- `packages/shared`: shared validation and contracts
- `packages/types`: shared types
- `packages/ui`: shared UI building blocks
- `infra/postgres`: local PostgreSQL container setup
- `infra/production`: production deployment configuration
- `tests/smoke`: Playwright smoke coverage

## Documentation Guide

Start here when you need project context:

- `README.md`: repository overview and quick start
- `DESIGN.md`: design-document index for the repository
- `docs/v1-scope.md`: V1 goals, scope, and non-goals
- `docs/local-development.md`: local setup, commands, and archive import notes

Product, content, and delivery:

- `docs/content-model.md`: public content domains, field rules, and URL conventions
- `docs/implementation-plan.md`: delivery phases and milestone expectations
- `docs/acceptance-criteria.md`: product and module-level acceptance criteria
- `docs/quality-assurance.md`: validation standards and smoke-check expectations

Engineering and admin architecture:

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

Agent workflow conventions are documented in `AGENTS.md`.
