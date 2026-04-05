# Local Development

This document describes the local CMS and database workflow for the first Rebase website version.

## Local Stack

- PostgreSQL runs in Docker through `infra/directus/docker-compose.yml`
- Directus runs in Docker and exposes the local CMS at `http://127.0.0.1:8055`
- Astro reads public content from Directus through the read-only website token
- The baseline SQL files live in `infra/directus/sql/`

## Environment Files

- `infra/directus/.env.example` is the committed baseline
- `infra/directus/.env.local` is an optional local override and is ignored by git
- The helper scripts automatically prefer `.env.local` and fall back to `.env.example`

Key defaults:

- Directus URL: `http://127.0.0.1:8055`
- Directus admin email: `admin@rebase.network`
- Directus admin password: `rebase-local-admin-password`
- Website read token: `rebase-local-website-token`
- Local PostgreSQL port: `55432`

## Bootstrap Flow

Run:

```bash
pnpm cms:bootstrap
```

The bootstrap script does the following:

1. regenerates `infra/directus/sql/001_schema.sql`
2. regenerates `infra/directus/sql/002_seed.sql`
3. starts PostgreSQL and Directus with Docker Compose
4. applies schema SQL directly to PostgreSQL
5. applies baseline seed SQL directly to PostgreSQL
6. applies the committed GeekDaily archive SQL from `infra/directus/sql/003_geekdaily_archive.sql`
7. restarts Directus so the new collections are recognized
8. verifies the website token can read public data

`pnpm cms:reset` is destructive for local CMS data. It removes the local Compose volumes and rebuilds the baseline from scratch.

## Commands

- `pnpm cms:up`: start PostgreSQL and Directus
- `pnpm cms:down`: stop the local CMS containers
- `pnpm cms:logs`: show recent Directus logs
- `pnpm cms:health`: verify Directus core health and the public website token read path
- `pnpm cms:bootstrap`: apply the full local baseline
- `pnpm cms:reset`: recreate the local CMS volumes and baseline
- `pnpm cms:generate:schema`: regenerate Directus collection schema SQL
- `pnpm cms:generate:seed`: regenerate baseline content SQL
- `pnpm cms:generate:geekdaily`: regenerate the GeekDaily archive SQL from `geekdaily.csv`

## SQL Files

- `infra/directus/sql/001_schema.sql`: collection tables, Directus metadata, and public read policy
- `infra/directus/sql/002_seed.sql`: site settings, about page, articles, jobs, events, contributor roles, and contributors
- `infra/directus/sql/003_geekdaily_archive.sql`: episode-level GeekDaily archive generated from `geekdaily.csv`

The third file is committed so CI and other local environments do not need the original CSV file.

## Frontend Expectations

- the public site reads Directus content with the website token
- readers do not log in
- admins log in through Directus
- smoke tests rely on `pnpm cms:bootstrap` before launching the built Astro app
