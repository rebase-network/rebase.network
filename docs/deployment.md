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
- R2 credentials and public base URL
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
