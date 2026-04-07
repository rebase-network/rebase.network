# Local Development

This repository now treats the custom Rebase stack as the default local workflow.

## Local Stack

The active local stack is:

- PostgreSQL in Docker from `infra/postgres/docker-compose.yml`
- Hono API in `apps/api`
- Vue admin workspace in `apps/admin`
- Astro public site in `apps/web`
- shared validation and contracts in `packages/shared`
- Drizzle schema, migrations, and seed data in `packages/db`

Legacy Directus files still exist in the repository, but only as migration-era reference material.

The public site now runs in Astro server mode, so published content changes should appear on the next request instead of waiting for a full static rebuild.

For local `astro dev`, the repo intentionally skips the Cloudflare adapter and uses Astro's normal dev server to avoid Miniflare-specific startup issues. Production builds still use the Cloudflare adapter.

## One-Time Setup

1. Copy `.env.example` to `.env`
2. Install dependencies with `pnpm install`
3. Run:

```bash
pnpm local:bootstrap
```

`pnpm local:bootstrap` will:

- start PostgreSQL
- wait for the database container to become healthy
- apply Drizzle migrations
- seed baseline site content and the GeekDaily archive
- bootstrap the default local admin account

Default local operator credentials:

- email: `admin@rebase.local`
- password: `RebaseAdmin123456!`

## Daily Development Commands

Run the whole stack:

```bash
pnpm dev:stack
```

Run only the public site and API:

```bash
pnpm dev:public
```

Run only the admin workspace and API:

```bash
pnpm dev:ops
```

Run individual services:

- `pnpm dev:web`
- `pnpm dev:admin`
- `pnpm dev:api`

## Local Ports

- public site: `http://127.0.0.1:4321`
- admin: `http://127.0.0.1:5174`
- API: `http://127.0.0.1:8788`
- PostgreSQL: `127.0.0.1:55433`

## Useful Maintenance Commands

- `pnpm db:up`: start PostgreSQL only
- `pnpm db:down`: stop PostgreSQL
- `pnpm db:logs`: inspect PostgreSQL logs
- `pnpm db:migrate`: apply Drizzle migrations
- `pnpm db:seed`: reseed baseline content and GeekDaily archive
- `pnpm admin:bootstrap`: recreate or refresh the default local operator account
- `pnpm build:api`: build the API bundle
- `pnpm build:admin`: build the admin workspace
- `pnpm typecheck:api`: typecheck the API
- `pnpm typecheck:admin`: typecheck the admin workspace
- `pnpm test:smoke`: run Playwright smoke checks

## GeekDaily Migration Input

The committed GeekDaily archive still depends on `geekdaily.csv`.

If the CSV is refreshed, regenerate the migration SQL with:

```bash
pnpm cms:generate:geekdaily
```

The generated file remains:

- `infra/directus/sql/003_geekdaily_archive.sql`

It is kept because it documents the imported historical archive, even though the runtime stack is no longer Directus-based.

## Legacy Reference Commands

Use these only if you intentionally need to inspect the old prototype artifacts:

- `pnpm cms:up`
- `pnpm cms:down`
- `pnpm cms:logs`
- `pnpm cms:health`
- `pnpm cms:bootstrap`
- `pnpm cms:reset`
- `pnpm cms:generate:schema`
- `pnpm cms:generate:seed`
