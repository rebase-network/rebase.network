# Deployment Manual

This is the production operator handbook.

Use `docs/production-config.md` for settings lookup and `docs/launch-checklist.md` for release verification.

## Deployment Model

| Surface | Runtime | Standard path |
| --- | --- | --- |
| Public site | Cloudflare Worker `rebase-web` | GitHub-connected Cloudflare auto-deploy from `main` |
| Admin site | Cloudflare Worker `rebase-admin` | GitHub-connected Cloudflare auto-deploy from `main` |
| API | Docker Compose on `rebase@rebase.network` | `./ops/manage.sh deploy api` |
| Full backend stack | Docker Compose on `rebase@rebase.network` | `./ops/manage.sh deploy stack` |
| Media | Cloudflare R2 `rebase-media` | Cloudflare-managed bucket and domain settings |

Release rules:

- daily work stays on `dev`
- release candidates move from `dev` to `main` through a pull request
- frontend production publishes after Cloudflare detects updates on `main`
- backend production is manual and must be deployed from the intended `main` commit
- local `wrangler deploy` is not the normal production path
- SSH examples use `rebase@rebase.network`; operator machines must resolve `rebase.network` to the backend server through local hosts or internal DNS

## Scenario 1: Initial Deployment

### 1. Configure Cloudflare frontend projects

Keep these settings aligned:

| Worker | Domains | Branch | Root | Install | Build | Deploy |
| --- | --- | --- | --- | --- | --- | --- |
| `rebase-web` | `rebase.network`, `rebase.community` | `main` | `/` | `pnpm install --frozen-lockfile` | `pnpm build:web:prod` | `pnpm exec wrangler deploy --config apps/web/dist/server/wrangler.production.json` |
| `rebase-admin` | `admin.rebase.network` | `main` | `/` | `pnpm install --frozen-lockfile` | `pnpm build:admin:prod` | `pnpm exec wrangler deploy --config apps/admin/wrangler.production.jsonc` |

Required Cloudflare values:

- `rebase-web`: `SESSION_KV_NAMESPACE_ID`
- `rebase-web`: `SESSION_KV_NAMESPACE_PREVIEW_ID` when preview deploys need an explicit value
- `rebase-admin`: no extra dashboard build variables are currently required

### 2. Prepare the backend server

Sync the repo to the server:

```bash
./ops/manage.sh sync
```

Create the production env file on the server:

```bash
ssh rebase@rebase.network
cd /home/rebase/rebase.network
cp infra/production/server.env.example infra/production/server.env
```

Fill in at least:

- `POSTGRES_PASSWORD`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `CORS_ALLOWED_ORIGINS`
- `APP_VERSION`
- `CLOUDFLARED_TUNNEL_TOKEN`
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_BASE_URL`
- `DEV_ADMIN_EMAIL`
- `DEV_ADMIN_PASSWORD`
- `DEV_ADMIN_NAME`

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

Verify:

- `https://rebase.network/healthz`
- `https://admin.rebase.network`
- `https://api.rebase.network/health`
- `https://api.rebase.network/ready`
- `https://api.rebase.network/version`
- one admin login
- one content edit round trip
- one media upload round trip

Also verify `https://rebase.community` when that domain is part of the active public routing policy.

## Scenario 2: Upgrade Release

Choose the smallest release path that matches the change set.

### Frontend-only release

1. validate the change on `dev`
2. push `dev`
3. open and merge the `dev` -> `main` pull request
4. wait for Cloudflare to deploy `rebase-web` and/or `rebase-admin`
5. verify the affected public and admin routes

### Backend-only release

1. merge the backend change to `main`
2. update the deploy machine to the matching `main` commit
3. confirm the working tree is clean
4. run `./ops/manage.sh deploy api` or `./ops/manage.sh deploy stack`
5. verify API health and affected workflows

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
7. verify frontend, admin, API, and one real edit or upload flow

## Scenario 3: Maintenance Operations

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
3. check Cloudflare values and KV bindings
4. only use manual `wrangler deploy` as an explicit emergency action, and record it in the release notes

Backend failure:

1. run `./ops/manage.sh logs api 200`
2. run `./ops/manage.sh ready`
3. confirm the deploy machine is on the intended `main` commit
4. redeploy from the correct commit if the synced code was wrong
