# Rebase Community Website

This repository contains the new Rebase community website.

The project is now converging on two parallel deliverables:

- a public Rebase website for readers
- a custom Rebase admin workspace for community operators

## Project Status

The legacy implementation has been removed from the working tree.

Git history is preserved, and the repo is being rebuilt around a Rebase-specific architecture.

The target architecture is no longer a headless CMS workflow.

## Target V1 Architecture

- frontend: Astro
- public runtime and deployment: Cloudflare Workers
- admin frontend: Vue
- admin and public API: Hono
- auth: Better Auth
- primary database: PostgreSQL
- database toolkit: Drizzle
- media storage: Cloudflare R2
- visual direction: community media
- editorial format: structured fields plus Markdown bodies

## Key Decisions

- V1 is a content platform, not a complex business platform
- readers do not need to log in
- staff log in through a custom admin workspace
- event registration is out of scope for V1
- GeekDaily search is in scope for V1
- RSS feeds are in scope for V1
- hiring detail pages and hiring RSS are in scope for V1
- GeekDaily detail URLs use `/geekdaily/geekdaily-{episode-number}`
- GeekDaily titles default to `极客日报#{episode-number}` during migration
- RSS feeds default to the latest 3 items per feed in V1
- the admin experience is task-oriented and Rebase-specific, not collection-oriented

## Documentation

- `docs/v1-scope.md`: V1 goals, scope, and non-goals
- `docs/architecture.md`: target system architecture, deployment, caching, and runtime decisions
- `docs/content-model.md`: public content domains, field design, and URL conventions
- `docs/admin-architecture.md`: custom admin and API architecture for Rebase operators
- `docs/admin-information-architecture.md`: admin modules, operator workflows, and task-oriented UI structure
- `docs/admin-data-model.md`: backend tables, relations, constraints, and workflow states
- `docs/implementation-plan.md`: development phases and milestone plan
- `docs/acceptance-criteria.md`: module-level acceptance criteria for product, content, and operations
- `docs/quality-assurance.md`: browser checks, automated checks, sample content, and release validation flow
- `docs/local-development.md`: current local setup, service commands, and archive import notes
- `docs/deployment.md`: Worker, Docker Compose, Tunnel, and rollout commands for production
- `docs/production-config.md`: production inventory, hostnames, Workers, server paths, and config ownership
- `docs/launch-checklist.md`: launch-critical routes, domain preparation, health checks, and observability baseline

## Local Development

Current reality in this repository:

- the public Astro site is implemented and runnable today
- the custom admin workspace and Hono API are the primary local stack
- PostgreSQL, Drizzle seed data, and the bootstrapped operator account are all runnable from this repo

Install dependencies:

```bash
pnpm install
```

Bootstrap the custom local stack:

```bash
cp .env.example .env
pnpm local:bootstrap
```

Useful current commands:

- `pnpm local:bootstrap`: start PostgreSQL, apply migrations, seed content, and bootstrap the default admin account
- `pnpm dev:stack`: run API, admin, and web together
- `pnpm dev:public`: run API and the public site
- `pnpm dev:ops`: run API and the admin workspace
- `pnpm dev:admin`: run the Vue-based admin foundation locally
- `pnpm dev:api`: run the Hono API foundation locally
- `pnpm dev:web`: run the Astro public site locally
- `pnpm build:admin`: build the admin frontend
- `pnpm build:api`: build the API service
- `pnpm typecheck:admin`: typecheck the admin app
- `pnpm typecheck:api`: typecheck the API app
- `pnpm db:up`: start PostgreSQL only
- `pnpm db:migrate`: apply Drizzle migrations
- `pnpm db:seed`: seed baseline content and the GeekDaily archive
- `pnpm admin:bootstrap`: create or refresh the default local operator account
- `pnpm test:smoke`: run Playwright smoke checks against the current build flow

Local service ports:

- public site: `http://127.0.0.1:4321`
- admin: `http://127.0.0.1:5174`
- API: `http://127.0.0.1:8788`
- PostgreSQL: `127.0.0.1:55433`

Default local operator account after `pnpm local:bootstrap`:

- email: `admin@rebase.local`
- password: `RebaseAdmin123456!`

If you receive a refreshed `geekdaily.csv`, regenerate the committed archive SQL with:

```bash
pnpm cms:generate:geekdaily
```

## Deployment Note

The agreed V1 production split is:

- `apps/web` on Cloudflare Workers for `rebase.network` and `rebase.community`
- `apps/admin` on a separate Cloudflare Worker for `admin.rebase.network`
- `apps/api`, PostgreSQL, and `cloudflared` on `rebase@101.33.75.240` via Docker Compose
- `media.rebase.network` on top of the Cloudflare R2 public bucket once the custom domain is attached

Release policy:

- ongoing work continues on `dev`
- merge `dev` into `main` only when the release candidate is validated
- production deployment should track `main`, not `dev`

Remote API and service operations can be run through `ops/manage.sh`.

## Repository Conventions

Agent workflow conventions are documented in `AGENTS.md`.
