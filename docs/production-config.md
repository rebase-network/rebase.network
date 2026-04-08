# Production Configuration Registry

This document is the human-readable registry for the Rebase production environment.

Use it to answer:

- what is running in production
- where each production setting lives
- which values are committed in the repo
- which values only exist in Cloudflare or on the server

This file is not a secret store. Secret values should stay in Cloudflare dashboard secrets or in the remote server env file.

## Source of Truth Split

Production configuration is intentionally split across three places:

1. repository-tracked config for topology, scripts, defaults, and non-secret runtime settings
2. Cloudflare dashboard for Workers Builds wiring, custom domains, KV bindings, secrets, and tunnel hostnames
3. remote server files for API, PostgreSQL, and `cloudflared` runtime secrets

If a production setting changes, update this file together with the real config location.

## Production Topology

| Surface | Runtime | Current target | Deploy path | Source of truth |
| --- | --- | --- | --- | --- |
| Public site | Cloudflare Worker | `rebase-web` | Cloudflare Workers Builds from `main` | `apps/web/wrangler.template.jsonc`, `docs/deployment.md`, Cloudflare dashboard |
| Community alias | Cloudflare Worker | `rebase-web` | same as public site | same as above |
| Admin site | Cloudflare Worker | `rebase-admin` | Cloudflare Workers Builds from `main` | `apps/admin/wrangler.production.jsonc`, `docs/deployment.md`, Cloudflare dashboard |
| Public API | Docker Compose on server + Cloudflare Tunnel | `api.rebase.network` -> `api:8788` | `./ops/manage.sh deploy api` | `infra/production/docker-compose.yml`, remote `infra/production/server.env`, Cloudflare Zero Trust |
| Database | Docker Compose on server | PostgreSQL 16 | managed together with API stack | `infra/production/docker-compose.yml`, remote `infra/production/server.env` |
| Tunnel connector | Docker Compose on server | `cloudflared` | managed together with API stack | `infra/production/docker-compose.yml`, remote `infra/production/server.env`, Cloudflare Zero Trust |
| Media assets | Cloudflare R2 | bucket `rebase-media` | bucket-level operations in Cloudflare | remote `infra/production/server.env`, Cloudflare R2 settings |

## Domain and Hostname Inventory

| Domain | Purpose | Current routing | Source of truth |
| --- | --- | --- | --- |
| `https://rebase.network` | main public site | custom domain on `rebase-web` | Cloudflare dashboard + `apps/web/wrangler.template.jsonc` |
| `https://rebase.community` | secondary public entry | custom domain on `rebase-web` | Cloudflare dashboard + `apps/web/wrangler.template.jsonc` |
| `https://admin.rebase.network` | operator admin | custom domain on `rebase-admin` | Cloudflare dashboard + `apps/admin/wrangler.production.jsonc` |
| `https://api.rebase.network` | API origin | Cloudflare Tunnel to `http://api:8788` | Cloudflare Zero Trust + `infra/production/docker-compose.yml` |
| `https://media.rebase.network` | public media domain | target custom domain for R2 bucket | Cloudflare R2 custom domain settings |

## Cloudflare Workers Inventory

### `rebase-web`

- Worker name: `rebase-web`
- Canonical public site URL: `https://rebase.network`
- Alternate public site URL: `https://rebase.community`
- Production branch: `main`
- Non-production branch builds: enabled
- Root directory: `/`
- Build command: `pnpm build:web:prod`
- Deploy command: `pnpm exec wrangler deploy --config apps/web/dist/server/wrangler.production.json`
- Non-production deploy command: `pnpm exec wrangler versions upload --config apps/web/dist/server/wrangler.production.json`
- Committed config source: `apps/web/wrangler.template.jsonc`
- Generated deploy config: `apps/web/dist/server/wrangler.production.json`

Runtime vars and bindings:

- `SITE_URL=https://rebase.network`
- `API_BASE_URL=https://api.rebase.network`
- `SESSION` KV binding backed by namespace title `rebase-web-session`
- `SESSION_KV_NAMESPACE_ID` is configured in Cloudflare Workers Builds environment settings
- `SESSION_KV_NAMESPACE_PREVIEW_ID` should normally match the production namespace id unless a dedicated preview namespace is introduced

### `rebase-admin`

- Worker name: `rebase-admin`
- Production domain: `https://admin.rebase.network`
- Production branch: `main`
- Non-production branch builds: enabled
- Root directory: `/`
- Build command: `pnpm build:admin:prod`
- Deploy command: `pnpm exec wrangler deploy --config apps/admin/wrangler.production.jsonc`
- Non-production deploy command: `pnpm exec wrangler versions upload --config apps/admin/wrangler.production.jsonc`
- Committed config source: `apps/admin/wrangler.production.jsonc`

Build-time targets:

- `VITE_API_BASE_URL=https://api.rebase.network`
- `VITE_PUBLIC_SITE_BASE_URL=https://rebase.network`

## Server Inventory

| Item | Current value | Source of truth |
| --- | --- | --- |
| Server host | `rebase@101.33.75.240` | `docs/deployment.md`, `ops/manage.sh` |
| Remote project directory | `/home/rebase/rebase.network` | `ops/manage.sh` |
| Compose file | `infra/production/docker-compose.yml` | repo |
| Remote env file | `infra/production/server.env` | remote server only |
| API service name | `api` | `infra/production/docker-compose.yml` |
| PostgreSQL service name | `postgres` | `infra/production/docker-compose.yml` |
| Tunnel service name | `cloudflared` | `infra/production/docker-compose.yml` |
| API port inside compose | `8788` | `infra/production/docker-compose.yml` |
| API host bind | `127.0.0.1:8788` | remote `infra/production/server.env` |
| PostgreSQL host bind | `127.0.0.1:55433` | remote `infra/production/server.env` |
| Wrangler profile mount | `/home/rebase/.config/.wrangler` | remote `infra/production/server.env`, compose mount |

## Remote Server Environment Registry

The actual values live only in remote `infra/production/server.env`.

Use `infra/production/server.env.example` as the committed template.

### Required production values

| Variable | Purpose | Secret | Location |
| --- | --- | --- | --- |
| `POSTGRES_DB` | database name | no | remote env |
| `POSTGRES_USER` | database user | no | remote env |
| `POSTGRES_PASSWORD` | database password | yes | remote env |
| `BETTER_AUTH_SECRET` | Better Auth signing secret | yes | remote env |
| `BETTER_AUTH_URL` | external auth base URL | no | remote env |
| `CORS_ALLOWED_ORIGINS` | allowed browser origins | no | remote env |
| `DEV_ADMIN_EMAIL` | initial operator account email | sensitive | remote env |
| `DEV_ADMIN_PASSWORD` | initial operator account password | yes | remote env |
| `DEV_ADMIN_NAME` | initial operator display name | no | remote env |
| `CLOUDFLARED_TUNNEL_TOKEN` | Cloudflare Tunnel connector token | yes | remote env |

### R2-related values

| Variable | Purpose | Secret | Location |
| --- | --- | --- | --- |
| `R2_ACCOUNT_ID` | Cloudflare account target for R2 | no | remote env |
| `R2_ACCESS_KEY_ID` | direct S3-style access key | yes | remote env |
| `R2_SECRET_ACCESS_KEY` | direct S3-style secret key | yes | remote env |
| `R2_BUCKET` | media bucket name, currently `rebase-media` | no | remote env |
| `R2_PUBLIC_BASE_URL` | public media base URL | no | remote env |
| `R2_DEV_USE_WRANGLER` | fallback Wrangler-based upload mode | no | remote env |
| `CLOUDFLARE_API_TOKEN` | fallback CLI-based upload token | yes | remote env |
| `WRANGLER_CONFIG_DIR` | mounted Wrangler profile path | no | remote env |

## Operations Entry Points

### Git and release policy

- day-to-day work continues on `dev`
- production Workers Builds track `main`
- API server deployment should use release-ready code, not unreviewed local changes

### Primary commands

Use `ops/manage.sh` for routine server operations:

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

## Repo Files That Define Production

| File | Role |
| --- | --- |
| `docs/production-config.md` | production inventory and configuration registry |
| `docs/deployment.md` | rollout steps, build settings, and runbooks |
| `docs/architecture.md` | production topology and runtime boundaries |
| `infra/production/docker-compose.yml` | server-side production services |
| `infra/production/server.env.example` | server-side env template |
| `apps/web/wrangler.template.jsonc` | public Worker production template |
| `apps/admin/wrangler.production.jsonc` | admin Worker production config |
| `ops/manage.sh` | remote server management entry point |

## Update Checklist

When any production setting changes, update this registry if the change affects:

- a domain, route, or worker name
- a deployment branch or build command
- a server host, directory, or service name
- an env variable name, owner, or storage location
- an R2 bucket, KV namespace, or Tunnel hostname

If the real value is a secret, update only the location and ownership here, not the secret itself.
