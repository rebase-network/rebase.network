# Deployment Manual

This is the production operator handbook. Use `docs/operations/production-config.md` for settings and `docs/operations/launch-checklist.md` for release verification.

## Core Rules

- daily work stays on `dev`
- release candidates move from `dev` to `main` through a pull request
- frontend production publishes after Cloudflare detects updates on `main`
- backend production is manual and must be deployed from the intended `main` commit
- local `wrangler deploy` is not the normal production path
- SSH examples use `rebase@rebase.host`; operator machines must resolve `rebase.host` to the backend server through local hosts or internal DNS

## Scenario 1: Initial Setup

### 1. Configure Cloudflare frontend projects

Configure the frontend Workers using the current values in `docs/operations/production-config.md`.

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

Fill the required backend and R2 values listed in `docs/operations/production-config.md`.

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

Run the `Initial Launch Only`, `Route Checks`, and relevant `Functional Checks` sections in `docs/operations/launch-checklist.md`.

## Scenario 2: Release

Choose the smallest release path that matches the change set.

### Frontend-only release

1. validate the change on `dev`
2. push `dev`
3. open and merge the `dev` -> `main` pull request
4. wait for Cloudflare to deploy `rebase-web` and/or `rebase-admin`
5. run the relevant checks in `docs/operations/launch-checklist.md`

### Backend-only release

1. merge the backend change to `main`
2. update the deploy machine to the matching `main` commit
3. confirm the working tree is clean
4. for API or schema changes, prefer `./ops/manage.sh rollout api`; use `./ops/manage.sh deploy api` only when you intentionally do not want the backup + migrate flow
5. run the relevant checks in `docs/operations/launch-checklist.md`

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
6. for backend changes that include the API or schema, prefer `./ops/manage.sh rollout api`; use `./ops/manage.sh deploy stack` when compose-level services also changed
7. run the relevant checks in `docs/operations/launch-checklist.md`

## Scenario 3: Maintenance

### Routine commands

```bash
./ops/manage.sh check
./ops/manage.sh health
./ops/manage.sh rollout api
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
| `./ops/manage.sh health` | verify API liveness from the server side |
| `./ops/manage.sh rollout api` | create a DB backup, deploy the API, run DB migrations, and verify readiness |
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

### Recommended API rollout

For most backend releases that touch runtime code or Drizzle migrations, use:

```bash
./ops/manage.sh rollout api
```

This performs the production-safe default sequence:

1. create a remote PostgreSQL backup
2. deploy the API container
3. run database migrations inside the API container
4. verify `/ready`

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

Frontend release checks:

```bash
pnpm install --frozen-lockfile
pnpm --filter @rebase/web check
pnpm build:web:prod
pnpm build:admin:prod
```

Deploy-path checks:

```bash
pnpm deploy:web:dry-run
pnpm deploy:admin:dry-run
pnpm deploy:server:config
```

### Failure handling

Frontend failure:

1. inspect the Cloudflare build logs
2. reproduce locally with `pnpm build:web:prod`, `pnpm build:admin:prod`, or the matching `*:dry-run` command
3. check the Cloudflare settings in `docs/operations/production-config.md`
4. only use manual `wrangler deploy` as an explicit emergency action, and record it in the release notes

Common Cloudflare-specific failures:

- `ERR_PNPM_OUTDATED_LOCKFILE`: run `pnpm install`, commit the updated `pnpm-lock.yaml`, and re-run `pnpm install --frozen-lockfile` locally before pushing
- compatibility date mismatch: keep `apps/web/astro.config.mjs` aligned with `apps/web/wrangler.template.jsonc` so the Cloudflare adapter does not drift to an implicit future date
- duplicate KV provisioning: set `SESSION_KV_NAMESPACE_ID` and `SESSION_KV_NAMESPACE_PREVIEW_ID` in Workers Builds so deploys bind the existing namespace instead of trying to create a new one
- production domain returns `hello world`: verify the correct Worker is attached to the domain, the build ran from `main`, and the deploy command still points at the generated config
- local Miniflare/runtime problems and Cloudflare build problems are not always the same class of failure; do not assume one explains the other

Backend failure:

1. run `./ops/manage.sh logs api 200`
2. run `./ops/manage.sh ready`
3. confirm the deploy machine is on the intended `main` commit
4. redeploy from the correct commit if the synced code was wrong

If `./ops/manage.sh check` fails, inspect these in order:

1. SSH access to the current server host in `docs/operations/production-config.md`
2. the remote project dir in `docs/operations/production-config.md` exists
3. remote `infra/production/server.env` exists
4. Docker Engine and Docker Compose plugin are installed remotely
5. the compose file path in `docs/operations/production-config.md` still matches the server layout

If `https://api.rebase.network` fails but local health is good, inspect:

- `./ops/manage.sh logs cloudflared 200`
- the tunnel token in `infra/production/server.env`
- Cloudflare Zero Trust hostname mapping for `api.rebase.network`

If R2 upload flows fail, check these in order:

1. confirm the API is running in `r2-s3` mode rather than `wrangler-cli`
2. verify `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and `R2_PUBLIC_BASE_URL` in `infra/production/server.env`
3. verify the R2 key is bucket-scoped to `rebase-media` with `Object Read & Write`
4. restart the API after any env change with `./ops/manage.sh deploy api --no-sync`

Known backend rollout failures:

- `spawn wrangler ENOENT`: the service is in Wrangler fallback mode but the container cannot find the `wrangler` executable
- `401` from `HeadBucket` or `PutObject`: the configured R2 S3 credentials are invalid, mismatched to the account, or missing bucket write scope
- Docker build failure on `COPY geekdaily.csv`: `geekdaily.csv` is ignored by git and must not be required by the production API image build
