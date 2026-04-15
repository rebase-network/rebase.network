# Rebase Community Website

This repository contains the Rebase community website and internal admin workspace.

The repository covers two parallel deliverables:

- a public Rebase website for readers
- a custom Rebase admin workspace for community operators

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

- `DESIGN.md`: design-document index for the repository
- `apps/web/design_principles.md`: public-site design intent, interaction rules, and content hierarchy guidance
- `apps/web/DESIGN.md`: public-site hard spec in DESIGN.md format
- `apps/admin/design_principles.md`: admin UX intent, density rules, and operator workflow guidance
- `apps/admin/DESIGN.md`: admin hard spec in DESIGN.md format
- `docs/v1-scope.md`: V1 goals, scope, and non-goals
- `docs/architecture.md`: target system architecture, deployment, caching, and runtime decisions
- `docs/content-model.md`: public content domains, field design, and URL conventions
- `docs/admin-architecture.md`: custom admin and API architecture for Rebase operators
- `docs/admin-information-architecture.md`: admin modules, operator workflows, and task-oriented UI structure
- `docs/admin-data-model.md`: backend tables, relations, constraints, and workflow states
- `docs/implementation-plan.md`: development phases and milestone plan
- `docs/acceptance-criteria.md`: module-level acceptance criteria for product, content, and operations
- `docs/quality-assurance.md`: development validation standards and smoke checks
- `docs/local-development.md`: local setup, daily commands, and archive import notes
- `docs/deployment.md`: operator handbook
- `docs/production-config.md`: production settings index
- `docs/launch-checklist.md`: release verification checklist

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
- `pnpm db:seed`: seed baseline content and load the GeekDaily archive when `geekdaily.csv` is available
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

If you have an archived or refreshed `geekdaily.csv`, re-run the seed step to reload GeekDaily history into the local database:

```bash
pnpm db:seed
```

## Production Docs

Use these docs as the entry points:

- `docs/deployment.md`: operator handbook
- `docs/production-config.md`: production settings index
- `docs/launch-checklist.md`: release verification checklist

## Repository Conventions

Agent workflow conventions are documented in `AGENTS.md`.
