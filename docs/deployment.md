# Deployment Manual

This is the production operator handbook. Use `docs/production-config.md` for settings and `docs/launch-checklist.md` for release verification.

## Core Rules

- daily work stays on `dev`
- release candidates move from `dev` to `main` through a pull request
- frontend production publishes after Cloudflare detects updates on `main`
- backend production is manual and must be deployed from the intended `main` commit
- local `wrangler deploy` is not the normal production path
- SSH examples use `rebase@rebase.host`; operator machines must resolve `rebase.host` to the backend server through local hosts or internal DNS

## Scenario 1: Initial Setup

### 1. Configure Cloudflare frontend projects

Configure the frontend Workers using the current values in `docs/production-config.md`.

For the first rollout, confirm at least:

- `rebase-web` and `rebase-admin` are connected to the GitHub repository
- production branch is `main`
- custom domains are attached
- required Cloudflare-managed values are present

### 2. Prepare the backend server

Sync the repo to the server:

```bash
./ops/manage.sh sync
```

Create the production env file on the server:

```bash
ssh rebase@rebase.host
cd /home/rebase/rebase.network
cp infra/production/server.env.example infra/production/server.env
```

Fill the required backend and R2 values listed in `docs/production-config.md`.

Production R2 mode should use S3-compatible credentials with `R2_DEV_USE_WRANGLER=false`.

### 3. Deploy the backend stack

```bash
./ops/manage.sh deploy stack
```

For the first production database only:

```bash
./ops/manage.sh seed
./ops/manage.sh bootstrap-admin
```

### 4. Verify the initial rollout

Run the `Initial Launch Only`, `Route Checks`, and relevant `Functional Checks` sections in `docs/launch-checklist.md`.

## Scenario 2: Release

Choose the smallest release path that matches the change set.

### Frontend-only release

1. validate the change on `dev`
2. push `dev`
3. open and merge the `dev` -> `main` pull request
4. wait for Cloudflare to deploy `rebase-web` and/or `rebase-admin`
5. run the relevant checks in `docs/launch-checklist.md`

### Backend-only release

1. merge the backend change to `main`
2. update the deploy machine to the matching `main` commit
3. confirm the working tree is clean
4. run `./ops/manage.sh deploy api` or `./ops/manage.sh deploy stack`
5. run the relevant checks in `docs/launch-checklist.md`

Recommended local checks before backend deploys:

```bash
git checkout main
git pull --ff-only
git status --short
git rev-parse --short HEAD
```

### Full-stack release

1. validate on `dev`
2. push `dev` and open the `dev` -> `main` pull request
3. merge to `main`
4. wait for Cloudflare frontend deploys to finish
5. update the deploy machine to the matching `main` commit
6. run `./ops/manage.sh deploy api` or `./ops/manage.sh deploy stack`
7. run the relevant checks in `docs/launch-checklist.md`

## Scenario 3: Maintenance

### Routine commands

```bash
./ops/manage.sh check
./ops/manage.sh deploy api
./ops/manage.sh deploy stack
./ops/manage.sh ps
./ops/manage.sh logs api 200
./ops/manage.sh ready
./ops/manage.sh db query "select count(*) from geekdaily_episodes;"
./ops/manage.sh db backup
./ops/manage.sh db list-backups
./ops/manage.sh db export articles
```

### Command guide

| Command | Use |
| --- | --- |
| `./ops/manage.sh check` | verify host, compose file, env file, and running services |
| `./ops/manage.sh deploy api` | deploy API and shared-package changes |
| `./ops/manage.sh deploy stack` | deploy compose-level or full-stack changes |
| `./ops/manage.sh logs api 200` | inspect API logs |
| `./ops/manage.sh ready` | verify API readiness from the server side |
| `./ops/manage.sh db backup` | create a remote PostgreSQL backup |
| `./ops/manage.sh db download <remote-path> [local-path]` | download a remote backup or export to the local machine |
| `./ops/manage.sh db list-backups` | list remote PostgreSQL backup files |
| `./ops/manage.sh db list-exports` | list remote CSV export files |
| `./ops/manage.sh db export <table> [remote-path]` | export a PostgreSQL table to a remote CSV file |
| `./ops/manage.sh db export-query "<select ...>" [remote-path]` | export a query result to a remote CSV file |

### Recommended backup and export flow

For routine operations, follow this order:

1. before risky schema or data work, run `./ops/manage.sh db backup`
2. confirm the new backup with `./ops/manage.sh db list-backups`
3. if the backup should be retained outside the server, pull it locally with `./ops/manage.sh db download <remote-path> [local-path]`
4. use `./ops/manage.sh db export <table>` for table-level exports and `./ops/manage.sh db export-query "<select ...>"` for one-off reporting or review
5. after any export, use `./ops/manage.sh db list-exports` and `./ops/manage.sh db download <remote-path> [local-path]` when a local copy is needed

Treat server-side backups and exports as read-only operational artifacts. Do not overwrite production data through ad-hoc restore steps.

### Common export-query examples

```bash
./ops/manage.sh db export-query \
  "select id, display_name, status, created_at from staff_accounts order by created_at desc" \
  exports/staff_accounts.csv

./ops/manage.sh db export-query \
  "select slug, title, status, published_at from articles order by published_at desc nulls last" \
  exports/articles-latest.csv

./ops/manage.sh db export-query \
  "select episode_number, slug, status, published_at from geekdaily_episodes order by episode_number desc limit 100" \
  exports/geekdaily-latest.csv
```

### Local verification commands

```bash
pnpm deploy:web:dry-run
pnpm deploy:admin:dry-run
pnpm deploy:server:config
```

### Failure handling

Frontend failure:

1. inspect the Cloudflare build logs
2. reproduce locally with `pnpm build:web:prod`, `pnpm build:admin:prod`, or the matching `*:dry-run` command
3. check the Cloudflare settings in `docs/production-config.md`
4. only use manual `wrangler deploy` as an explicit emergency action, and record it in the release notes

Backend failure:

1. run `./ops/manage.sh logs api 200`
2. run `./ops/manage.sh ready`
3. confirm the deploy machine is on the intended `main` commit
4. redeploy from the correct commit if the synced code was wrong
