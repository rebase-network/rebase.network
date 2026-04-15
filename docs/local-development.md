# Local Development

This document covers the default local workflow only. Production operations live in `docs/deployment.md`, `docs/production-config.md`, and `docs/launch-checklist.md`.

## Local Stack

The active local stack is:

- PostgreSQL in Docker from `infra/postgres/docker-compose.yml`
- Hono API in `apps/api`
- Vue admin workspace in `apps/admin`
- Astro public site in `apps/web`
- shared validation and contracts in `packages/shared`
- Drizzle schema, migrations, and seed data in `packages/db`

The public site now runs in Astro server mode, so published content changes should appear on the next request instead of waiting for a full static rebuild.

For local `astro dev`, the repo intentionally skips the Cloudflare adapter and uses Astro's normal dev server to avoid Miniflare-specific startup issues. Production Worker settings live in `docs/production-config.md`.

## One-Time Setup

Recommended local toolchain:

- Node: `22.21.1` via `nvm`
- package manager: `pnpm@10.6.5`
- package manager launcher: `corepack`

Repository hints:

- `.nvmrc` pins the recommended local Node version
- `package.json` pins `pnpm@10.6.5` through the `packageManager` field

Suggested first-time setup:

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.6.5 --activate
pnpm install
```

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

## Node And Package Manager Conventions

This repository expects:

- `node` to come from `nvm`
- `pnpm` to match the version pinned in `package.json`
- `corepack` to be the normal way to activate that `pnpm` version

Quick checks:

```bash
which node
node -v
which pnpm
pnpm -v
```

Healthy output should look like:

- `node` resolves under `~/.nvm/versions/node/...`
- `pnpm` resolves under the same active Node installation, not `/usr/local/bin/pnpm`

If `pnpm` is broken because an old global shim is still on the machine, recover with:

```bash
rm -f /usr/local/bin/pnpm /usr/local/bin/pnpx
hash -r
corepack enable
corepack prepare pnpm@10.6.5 --activate
hash -r
```

Then re-check:

```bash
which pnpm
pnpm -v
```

If you only need a temporary workaround, run commands through Corepack directly:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm build:admin:prod
```

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

## GeekDaily Archive Import Input

The committed GeekDaily archive still depends on `geekdaily.csv`.

If the CSV is refreshed, regenerate the migration SQL with:

```bash
pnpm cms:generate:geekdaily
```

The generated file remains:

- `infra/directus/sql/003_geekdaily_archive.sql`

The path still lives under `infra/directus/` because the historical archive generator has not been renamed yet, but the active runtime stack is the custom Rebase admin + API system.
