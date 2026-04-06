# Local Development

This document is transitional.

The repository currently contains a Directus-based local content prototype, but the target architecture is moving to a custom Rebase admin and API stack.

## Current Situation

Today, the repository has:

- a working public Astro site in `apps/web`
- a custom admin scaffold in `apps/admin`
- a Hono API scaffold in `apps/api`
- shared contracts in `packages/shared`
- a Drizzle-backed schema package in `packages/db`
- temporary Directus bootstrap scripts and SQL used to unblock frontend development
- committed GeekDaily archive SQL generated from `geekdaily.csv`

The target direction is:

- `apps/web` for the public site
- `apps/admin` for the staff workspace
- `apps/api` for admin and public APIs
- `packages/db` for schema and migrations
- `packages/shared` for contracts and validation helpers

## Temporary Prototype Stack

Until the custom admin migration lands, the current local prototype uses:

- PostgreSQL in Docker through `infra/directus/docker-compose.yml`
- Directus in Docker at `http://127.0.0.1:8055`
- Astro reading prototype content through the temporary Directus flow

## Current Prototype Commands

Use these commands only to verify the existing frontend baseline during the transition period:

- `pnpm cms:up`
- `pnpm cms:down`
- `pnpm cms:logs`
- `pnpm cms:health`
- `pnpm cms:bootstrap`
- `pnpm cms:reset`
- `pnpm cms:generate:schema`
- `pnpm cms:generate:seed`
- `pnpm cms:generate:geekdaily`

Useful flow today:

```bash
pnpm cms:bootstrap
pnpm dev
```

## Current Custom Workspace Commands

The new custom admin and API foundation can already be run and validated locally:

- `pnpm dev:admin`
- `pnpm dev:api`
- `pnpm build:admin`
- `pnpm build:api`
- `pnpm typecheck:admin`
- `pnpm typecheck:api`

Useful validation flow for the new workspace foundation:

```bash
pnpm typecheck:admin
pnpm typecheck:api
pnpm build:admin
pnpm build:api
```

## Prototype Notes

The current prototype still uses:

- `infra/directus/sql/001_schema.sql`
- `infra/directus/sql/002_seed.sql`
- `infra/directus/sql/003_geekdaily_archive.sql`

The third file remains valuable even after the admin rewrite because it captures the historical GeekDaily import baseline.

## Target Local Development After Migration

Once the custom admin migration lands, local development should converge on:

1. PostgreSQL locally
2. admin API locally
3. admin frontend locally
4. Astro public site locally
5. optional local object storage or direct R2 integration for media testing

That future stack should expose separate commands for:

- database migrate and seed
- bootstrap first admin user
- run API
- run admin
- run web
- run smoke and browser checks

## Frontend Expectations

During and after the migration:

- readers do not log in
- staff log in through the custom admin
- the public site should eventually read Rebase-owned public APIs instead of the temporary Directus prototype
- smoke tests should continue to validate the public routes throughout the migration
