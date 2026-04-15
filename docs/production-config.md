# Production Configuration Index

This file is the production settings index.

Use `docs/deployment.md` for procedures and `docs/launch-checklist.md` for verification. Use this file to find the current production configuration and where each setting lives.

This file is not a secret store.

## Production Topology

| Surface | Runtime | Current target | Standard path |
| --- | --- | --- | --- |
| Public site | Cloudflare Worker | `rebase-web` | GitHub-connected Cloudflare deploy from `main` |
| Community alias | Cloudflare Worker | `rebase-web` | same Worker as the public site |
| Admin site | Cloudflare Worker | `rebase-admin` | GitHub-connected Cloudflare deploy from `main` |
| Public API | Docker Compose + Cloudflare Tunnel | `api.rebase.network` -> `api:8788` | `./ops/manage.sh deploy api` |
| Database | Docker Compose | PostgreSQL 16 | managed with the backend stack |
| Tunnel connector | Docker Compose | `cloudflared` | managed with the backend stack |
| Media | Cloudflare R2 | bucket `rebase-media` | Cloudflare-managed bucket and custom domain |

## Cloudflare Index

### Workers

| Worker | Domains | Branch | Root | Install | Build | Deploy | Config source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `rebase-web` | `rebase.network`, `rebase.community` | `main` | `/` | `pnpm install --frozen-lockfile` | `pnpm build:web:prod` | `pnpm exec wrangler deploy --config apps/web/dist/server/wrangler.production.json` | `apps/web/wrangler.template.jsonc` |
| `rebase-admin` | `admin.rebase.network` | `main` | `/` | `pnpm install --frozen-lockfile` | `pnpm build:admin:prod` | `pnpm exec wrangler deploy --config apps/admin/wrangler.production.jsonc` | `apps/admin/wrangler.production.jsonc` |

### Cloudflare-managed values

| Target | Setting | Location |
| --- | --- | --- |
| `rebase-web` | `SESSION_KV_NAMESPACE_ID` | Cloudflare dashboard |
| `rebase-web` | `SESSION_KV_NAMESPACE_PREVIEW_ID` | Cloudflare dashboard when needed |
| `rebase-web` | custom domains for `rebase.network`, `rebase.community` | Cloudflare dashboard |
| `rebase-admin` | custom domain for `admin.rebase.network` | Cloudflare dashboard |
| Tunnel | hostname `api.rebase.network` | Cloudflare Tunnel |
| R2 | custom domain `media.rebase.network` | Cloudflare R2 settings |

## Backend Index

| Item | Current value | Source |
| --- | --- | --- |
| Server host | `rebase@rebase.network` | `ops/manage.sh` |
| Remote project dir | `/home/rebase/rebase.network` | `ops/manage.sh` |
| Remote directory type | rsynced working tree, not a git checkout | server layout + `ops/manage.sh` |
| Compose file | `infra/production/docker-compose.yml` | repo |
| Remote env file | `infra/production/server.env` | server only |
| Main helper | `ops/manage.sh` | repo |
| API service | `api` | `infra/production/docker-compose.yml` |
| PostgreSQL service | `postgres` | `infra/production/docker-compose.yml` |
| Tunnel service | `cloudflared` | `infra/production/docker-compose.yml` |
| API bind | `127.0.0.1:8788` | remote env |
| PostgreSQL bind | `127.0.0.1:55433` | remote env |

SSH hostname resolution for `rebase@rebase.network` is handled outside this public repository.

## Server Env Index

Use `infra/production/server.env.example` as the template for remote `infra/production/server.env`.

### Required backend values

| Variable | Purpose | Secret | Location |
| --- | --- | --- | --- |
| `POSTGRES_DB` | database name | no | remote env |
| `POSTGRES_USER` | database user | no | remote env |
| `POSTGRES_PASSWORD` | database password | yes | remote env |
| `BETTER_AUTH_SECRET` | auth signing secret | yes | remote env |
| `BETTER_AUTH_URL` | external auth base URL | no | remote env |
| `CORS_ALLOWED_ORIGINS` | browser origins | no | remote env |
| `DEV_ADMIN_EMAIL` | initial admin email | sensitive | remote env |
| `DEV_ADMIN_PASSWORD` | initial admin password | yes | remote env |
| `DEV_ADMIN_NAME` | initial admin name | no | remote env |
| `CLOUDFLARED_TUNNEL_TOKEN` | Tunnel token | yes | remote env |

### R2 values

| Variable | Purpose | Secret | Location |
| --- | --- | --- | --- |
| `R2_ACCOUNT_ID` | Cloudflare account id | no | remote env |
| `R2_ACCESS_KEY_ID` | S3-style access key | yes | remote env |
| `R2_SECRET_ACCESS_KEY` | S3-style secret key | yes | remote env |
| `R2_BUCKET` | bucket name | no | remote env |
| `R2_PUBLIC_BASE_URL` | public media base URL | no | remote env |
| `R2_DEV_USE_WRANGLER` | fallback upload mode, keep `false` in production | no | remote env |
| `CLOUDFLARE_API_TOKEN` | optional fallback token | yes | remote env |
| `WRANGLER_CONFIG_DIR` | optional mounted Wrangler profile path | no | remote env |

## Production Files

| File | Role |
| --- | --- |
| `docs/deployment.md` | operator handbook |
| `docs/production-config.md` | production settings index |
| `docs/launch-checklist.md` | release verification checklist |
| `infra/production/docker-compose.yml` | backend services |
| `infra/production/server.env.example` | backend env template |
| `apps/web/wrangler.template.jsonc` | public Worker config template |
| `apps/admin/wrangler.production.jsonc` | admin Worker config |
| `scripts/deploy/prepare-web-assets.mjs` | public Worker deploy config generation |
| `ops/manage.sh` | backend deploy and maintenance helper |

## Update Rule

Update this file when any of the following changes:

- Worker name, domain, branch, build command, or deploy command
- server host, remote directory, service name, or backend deploy path
- env variable name, owner, or storage location
- KV namespace, Tunnel hostname, R2 bucket, or media domain
