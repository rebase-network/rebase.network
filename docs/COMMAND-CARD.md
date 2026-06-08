# COMMAND-CARD

This file is a copy-paste command card for local development, verification, and production operations.

## Setup

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.6.5 --activate
cp .env.example .env
pnpm install
pnpm local:bootstrap
```

## Start Dev

```bash
pnpm dev:stack
pnpm dev:public
pnpm dev:ops
pnpm dev:web
pnpm dev:admin
pnpm dev:api
```

## Local URLs

- Public site: `http://127.0.0.1:4321`
- Admin: `http://127.0.0.1:5174`
- API: `http://127.0.0.1:8788`
- PostgreSQL: `127.0.0.1:55433`

## Verify Changes

```bash
pnpm lint
pnpm typecheck
pnpm typecheck:admin
pnpm typecheck:api
pnpm build:admin
pnpm build:api
pnpm build:web:prod
pnpm test:smoke
```

## Local Database and Seed

```bash
pnpm db:up
pnpm db:down
pnpm db:logs
pnpm db:migrate
pnpm db:seed
pnpm admin:bootstrap
```

## Frontend Release Checks

```bash
pnpm deploy:web:dry-run
pnpm deploy:admin:dry-run
pnpm deploy:server:config
```

## Remote Operations

```bash
./ops/manage.sh help
./ops/manage.sh check
./ops/manage.sh sync
./ops/manage.sh ps
./ops/manage.sh ssh
```

## Remote Deploy

```bash
./ops/manage.sh deploy api
./ops/manage.sh rollout api
./ops/manage.sh deploy stack
./ops/manage.sh rollout stack
```

## Remote Logs and Health

```bash
./ops/manage.sh logs api 200
./ops/manage.sh logs postgres 200
./ops/manage.sh logs cloudflared 200
./ops/manage.sh health
./ops/manage.sh ready
```

## Remote Database

```bash
./ops/manage.sh db shell
./ops/manage.sh db query "select count(*) from geekdaily_episodes;"
./ops/manage.sh db backup
./ops/manage.sh db list-backups
./ops/manage.sh db list-exports
./ops/manage.sh db export articles
./ops/manage.sh db export-query "select id, email from staff_accounts" exports/staff_accounts.csv
./ops/manage.sh db download backups/rebase-20260415-120000.sql.gz ./rebase.sql.gz
./ops/manage.sh db migrate
```

## Remote Service Control

```bash
./ops/manage.sh up api
./ops/manage.sh up stack
./ops/manage.sh restart api
./ops/manage.sh restart postgres
./ops/manage.sh stop api
```

## Bootstrap and Seed on Remote

```bash
./ops/manage.sh bootstrap-admin
./ops/manage.sh seed
```

## Environment Overrides for `ops/manage.sh`

```bash
export REBASE_REMOTE_HOST="rebase@rebase.host"
export REBASE_REMOTE_DIR="/home/rebase/rebase.network"
export REBASE_COMPOSE_FILE="infra/production/docker-compose.yml"
export REBASE_SERVER_ENV="infra/production/server.env"
export REBASE_API_PORT="8788"
export REBASE_LOG_TAIL="120"
```
