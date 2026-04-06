# Rebase Community Website

This repository contains the new Rebase community website.

The project is now converging on two parallel deliverables:

- a public Rebase website for readers
- a custom Rebase admin workspace for community operators

## Project Status

The legacy implementation has been removed from the working tree.

Git history is preserved, and the repo is being rebuilt around a Rebase-specific architecture.

A temporary Directus-based prototype still exists in the repository as a transition baseline for local content verification.

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
- GeekDaily detail URLs use `/geekdaily/episode-{episode-number}`
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
- `docs/local-development.md`: current local prototype notes and migration-era development guidance
- `docs/launch-checklist.md`: launch-critical routes, domain preparation, health checks, and observability baseline

## Local Development

Current reality in this repository:

- the public Astro site is implemented and runnable today
- the custom admin workspace and Hono API foundation are now scaffolded in the repo
- the committed local content prototype still uses Directus bootstrap scripts
- the long-term direction is to replace that prototype with a custom admin and API stack

Install dependencies:

```bash
pnpm install
```

If you want to verify the current prototype data baseline before the custom admin migration lands:

```bash
pnpm cms:bootstrap
pnpm dev
```

Useful current commands:

- `pnpm dev:admin`: run the Vue-based admin foundation locally
- `pnpm dev:api`: run the Hono API foundation locally
- `pnpm build:admin`: build the admin frontend
- `pnpm build:api`: build the API service
- `pnpm typecheck:admin`: typecheck the admin app
- `pnpm typecheck:api`: typecheck the API app
- `pnpm cms:logs`: inspect Directus prototype logs
- `pnpm cms:down`: stop the local prototype containers
- `pnpm cms:health`: verify the temporary prototype health path
- `pnpm cms:reset`: recreate the local prototype database and baseline
- `pnpm test:smoke`: bootstrap the current prototype, build the app, and run Playwright smoke tests

If you receive a refreshed `geekdaily.csv`, regenerate the committed archive SQL with:

```bash
pnpm cms:generate:geekdaily
```

## Deployment Note

The planned production host target for the Rebase admin/API and database stack is `rebase@101.33.75.240`.

The public website remains planned for Cloudflare Workers.

## Repository Conventions

Agent workflow conventions are documented in `AGENTS.md`.
