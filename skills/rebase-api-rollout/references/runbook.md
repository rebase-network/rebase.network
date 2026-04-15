# API Rollout Runbook

## Primary Commands

```bash
./ops/manage.sh check
./ops/manage.sh sync
./ops/manage.sh deploy api
./ops/manage.sh deploy stack
./ops/manage.sh ps
./ops/manage.sh logs api 200
./ops/manage.sh health
./ops/manage.sh ready
./ops/manage.sh db query "select count(*) from geekdaily_episodes;"
./ops/manage.sh db backup
./ops/manage.sh db list-backups
./ops/manage.sh db export articles
./ops/manage.sh bootstrap-admin
```

## Choose The Right Deploy Target

- `deploy api`: API code or API container changes only
- `deploy stack`: API + Postgres + `cloudflared`, or infra/env changes that affect multiple services

## First Release Or Recovery Tasks

Use only when the task explicitly requires them:

- bootstrap first admin account
- seed baseline content
- DB backup before risky migrations or cleanup

## Recommended Backup And Export Flow

1. run `./ops/manage.sh db backup`
2. confirm the file with `./ops/manage.sh db list-backups`
3. pull it locally with `./ops/manage.sh db download <remote-path> [local-path]` when off-server retention is needed
4. use `./ops/manage.sh db export <table>` or `./ops/manage.sh db export-query "<select ...>"` for review and reporting
5. verify export output with `./ops/manage.sh db list-exports`

## Common Export Examples

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

## What `check` Should Confirm

`./ops/manage.sh check` should validate:

- SSH access works
- Docker and Compose exist remotely
- remote repo dir exists
- compose file exists
- remote env file exists
- compose `ps` can run

## Health Endpoints

- `health`: quick API liveness
- `ready`: API + dependency readiness

Both should succeed before treating the rollout as healthy.

## Important Repo Files

- `ops/manage.sh`
- `infra/production/docker-compose.yml`
- `infra/production/server.env.example`
- `docs/deployment.md`
- `docs/production-config.md`
