# Rebase Community Website

This repository contains the new Rebase community website.

The first version focuses on:

- public community content pages
- an admin-managed CMS workflow
- a scalable GeekDaily information architecture
- a maintainable frontend deployed on Cloudflare Workers

## Project Status

The legacy implementation has been removed from the working tree.

Git history is preserved, and the repo is now being rebuilt from scratch with a new architecture.

## V1 Baseline

- frontend: Astro
- runtime and deployment: Cloudflare Workers
- CMS: Directus
- primary database: PostgreSQL
- media storage: Cloudflare R2
- visual direction: community media
- editorial format: structured fields plus Markdown bodies

## Key Decisions

- V1 is a content platform, not a complex business platform
- readers do not need to log in
- admins log in through the CMS backend
- event registration is out of scope for V1
- GeekDaily search is in scope for V1
- RSS feeds are in scope for V1
- hiring detail pages and hiring RSS are in scope for V1
- GeekDaily detail URLs use `/geekdaily/episode-{episode-number}`
- GeekDaily titles default to `极客日报#{episode-number}` during migration
- RSS feeds default to the latest 3 items per feed in V1

## Documentation

- `docs/v1-scope.md`: V1 goals, scope, and non-goals
- `docs/architecture.md`: architecture, runtime model, deployment, and integration decisions
- `docs/content-model.md`: CMS collections, field design, and URL conventions
- `docs/implementation-plan.md`: development phases and milestone plan
- `docs/acceptance-criteria.md`: module-level acceptance criteria for product, content, and page behavior
- `docs/quality-assurance.md`: browser checks, automated checks, sample content, and release validation flow
- `docs/local-development.md`: local Directus, PostgreSQL, SQL bootstrap, and daily development commands

## Local Development

Install dependencies:

```bash
pnpm install
```

Bootstrap the local CMS, seed baseline content, and import the committed GeekDaily archive SQL:

```bash
pnpm cms:bootstrap
```

Then start the frontend:

```bash
pnpm dev
```

Other useful commands:

- `pnpm cms:logs`: inspect Directus logs
- `pnpm cms:down`: stop local CMS containers
- `pnpm cms:reset`: recreate the local database and reapply the baseline
- `pnpm test:smoke`: bootstrap CMS, build the app, and run Playwright smoke tests

If you receive a refreshed `geekdaily.csv`, regenerate the committed archive SQL with:

```bash
pnpm cms:generate:geekdaily
```

## Deployment Note

The planned CMS and database deployment target for V1 is the server at `rebase@101.33.75.240`.

## Repository Conventions

Agent workflow conventions are documented in `AGENTS.md`.
