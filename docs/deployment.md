# Deployment Guide

## Goal

Deploy the first Rebase release with the agreed split:

- `apps/web` on a Cloudflare Worker
- `apps/admin` on a separate Cloudflare Worker
- `apps/api`, PostgreSQL, and `cloudflared` on `rebase@101.33.75.240`
- media on Cloudflare R2

This keeps the frontends at the edge while the writable backend stays on the server.

## Release Branch Rule

- continue day-to-day work on `dev`
- merge `dev` into `main` only after release validation passes
- production deployments should run from `main`

## Prerequisites

Local machine:

- `wrangler login` already completed
- Docker and Docker Compose available for local and server validation
- access to the Cloudflare account that owns `rebase.network`

Server:

- SSH access to `rebase@101.33.75.240`
- Docker Engine and Docker Compose plugin installed
- this repository checked out on the server

Cloudflare resources:

- Worker route for `rebase.network`
- Worker route for `rebase.community`
- Worker route for `admin.rebase.network`
- remotely managed Cloudflare Tunnel for `api.rebase.network`
- R2 bucket for media assets

## Cloudflare Git Builds

Cloudflare Workers Builds supports direct GitHub integration, production branch selection, non-production branch builds, monorepo root directories, custom build and deploy commands, and build watch paths.

For Rebase, the recommended Git strategy is:

- connect both Workers to the same GitHub repository
- set the production branch to `main` for both Workers
- enable non-production branch builds for both Workers
- keep ongoing work on `dev` and let Cloudflare create preview builds for `dev` pushes
- merge `dev` into `main` only when the release candidate is ready

This means we do not need to merge `dev` into `main` just to enable Git-based auto builds. We only merge when we want the current release candidate to become production.

### `rebase-web` Worker Build Settings

Use these settings in Workers > `rebase-web` > Settings > Build:

- Git repository: this repository
- production branch: `main`
- non-production branch builds: enabled
- root directory: `/`
- build command: `pnpm build:web:prod`
- deploy command: `pnpm exec wrangler deploy --config apps/web/dist/server/wrangler.production.json`
- non-production branch deploy command: `pnpm exec wrangler versions upload --config apps/web/dist/server/wrangler.production.json`

Recommended build watch paths for `rebase-web`:

- include: `apps/web/*, packages/*, scripts/deploy/*, package.json, pnpm-lock.yaml, pnpm-workspace.yaml, tsconfig.base.json`
- exclude: `docs/*, infra/*, refcode/*, apps/admin/*, apps/api/*`

Required environment variables for `rebase-web` build settings:

- `SESSION_KV_NAMESPACE_ID`: the existing KV namespace id for `rebase-web-session`
- `SESSION_KV_NAMESPACE_PREVIEW_ID`: optional; use the same value as `SESSION_KV_NAMESPACE_ID` unless you want a dedicated preview namespace

This avoids Wrangler trying to auto-provision a duplicate `SESSION` KV namespace during deploy.

### `rebase-admin` Worker Build Settings

Use these settings in Workers > `rebase-admin` > Settings > Build:

- Git repository: this repository
- production branch: `main`
- non-production branch builds: enabled
- root directory: `/`
- build command: `pnpm build:admin:prod`
- deploy command: `pnpm exec wrangler deploy --config apps/admin/wrangler.production.jsonc`
- non-production branch deploy command: `pnpm exec wrangler versions upload --config apps/admin/wrangler.production.jsonc`

Recommended build watch paths for `rebase-admin`:

- include: `apps/admin/*, packages/shared/*, scripts/deploy/*, package.json, pnpm-lock.yaml, pnpm-workspace.yaml, tsconfig.base.json`
- exclude: `docs/*, infra/*, refcode/*, apps/web/*`

### Root Directory Choice

Although Cloudflare supports setting the root directory to a project subdirectory in monorepos, Rebase should keep the root directory at `/` for both Workers because:

- the build scripts live in the workspace root `package.json`
- `pnpm-lock.yaml` and `pnpm-workspace.yaml` are at the repository root
- the public Worker build needs to merge Astro's generated config with the root-level deployment script

### Important Cloudflare Limitation

Workers Builds does not honor custom build configuration declared inside Wrangler config files. Build, deploy, preview deploy, branch control, and watch paths should therefore be configured in the Cloudflare Dashboard for each Worker.

## Worker Deployment Files

Public website:

- config: `apps/web/wrangler.template.jsonc`
- build output: `apps/web/dist`
- deploy config output: `apps/web/dist/server/wrangler.production.json`

Admin workspace:

- config: `apps/admin/wrangler.production.jsonc`
- build output: `apps/admin/dist`
- SPA fallback: `assets.not_found_handling = "single-page-application"`

## Server Deployment Files

- compose stack: `infra/production/docker-compose.yml`
- server environment template: `infra/production/server.env.example`
- API image build: `apps/api/Dockerfile`

## Environment Files

Server-side deployment expects a real env file copied from:

- `infra/production/server.env.example`

Recommended server setup:

```bash
cp infra/production/server.env.example infra/production/server.env
```

Then fill in:

- PostgreSQL password
- Better Auth secret
- R2 credentials and public base URL, or a Wrangler profile mount for CLI-backed uploads
- `CLOUDFLARED_TUNNEL_TOKEN`
- initial admin email and password

## Deploy Order

Recommended first production rollout order:

1. prepare the server env file
2. bring up PostgreSQL, API, and `cloudflared`
3. verify `https://api.rebase.network/health` and `https://api.rebase.network/ready`
4. seed baseline content only if this is the first deployment
5. bootstrap the first admin account
6. deploy `apps/web`
7. deploy `apps/admin`
8. verify public routes and admin login

## Cloudflare Tunnel Setup

Use a remotely managed tunnel.

Recommended dashboard flow:

1. create a tunnel in Cloudflare Zero Trust
2. choose Docker as the connector environment
3. create the public hostname `api.rebase.network`
4. point that hostname to `http://api:8788` inside the tunnel configuration
5. copy the tunnel token into `infra/production/server.env`

The compose stack runs:

```bash
cloudflared tunnel --no-autoupdate run --token <token>
```

## Local Worker Deploy Commands

Public website:

```bash
pnpm deploy:web:dry-run
pnpm deploy:web
```

Admin workspace:

```bash
pnpm deploy:admin:dry-run
pnpm deploy:admin
```

These commands build with production URLs:

- public site API base: `https://api.rebase.network`
- public site canonical base: `https://rebase.network`
- admin API base: `https://api.rebase.network`

The public web build merges Astro's generated Worker config with `apps/web/wrangler.template.jsonc` and writes `apps/web/dist/server/wrangler.production.json` for deployment.

## Server Rollout Commands

Validate the compose file locally:

```bash
pnpm deploy:server:config
```

Bring up the production stack on the server:

```bash
docker compose --env-file infra/production/server.env -f infra/production/docker-compose.yml up -d --build
```

Inspect service status:

```bash
docker compose --env-file infra/production/server.env -f infra/production/docker-compose.yml ps
docker compose --env-file infra/production/server.env -f infra/production/docker-compose.yml logs --tail=120 api
```

## First-Time Content Bootstrap

Run these commands only for the first deployment of a fresh database.

Seed baseline content and the GeekDaily archive:

```bash
docker compose --env-file infra/production/server.env -f infra/production/docker-compose.yml exec api pnpm --filter @rebase/db seed
```

Bootstrap the first admin account:

```bash
docker compose --env-file infra/production/server.env -f infra/production/docker-compose.yml exec api pnpm --filter @rebase/api bootstrap-admin
```

Warning:

- `pnpm --filter @rebase/db seed` resets baseline content tables and should not be rerun on a live production database without intent

## Production R2 Options

Rebase currently supports two production paths for media uploads:

1. preferred long-term: set `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`
2. fallback used for the first rollout: mount a logged-in Wrangler profile and set `R2_DEV_USE_WRANGLER=true`

The fallback path is useful when the bucket already exists but dedicated S3 credentials have not been issued yet. In that mode:

- keep `R2_ACCOUNT_ID`, `R2_BUCKET`, and `R2_PUBLIC_BASE_URL` set
- leave `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` empty
- copy the local Wrangler profile to the server, for example:

```bash
mkdir -p /home/rebase/.config/.wrangler/config
scp ~/Library/Preferences/.wrangler/config/default.toml rebase@101.33.75.240:/home/rebase/.config/.wrangler/config/default.toml
```

- keep `WRANGLER_CONFIG_DIR=/home/rebase/.config/.wrangler`

Wrangler can then refresh the OAuth session as needed while the API shells out for uploads.

## Verification Checklist

After deployment, verify:

- `https://rebase.network/healthz`
- `https://rebase.community/healthz`
- `https://api.rebase.network/health`
- `https://api.rebase.network/ready`
- `https://admin.rebase.network`
- homepage, GeekDaily list, article list, events list, and hiring list
- admin login and one content edit round trip

## Operational Notes

- PostgreSQL binds to `127.0.0.1` on the server and is not exposed publicly
- the API also binds to `127.0.0.1` on the server, with public access only through Cloudflare Tunnel
- media stays outside git and should use R2-backed public URLs
- tunnel token rotation can happen later without changing the deployment model
