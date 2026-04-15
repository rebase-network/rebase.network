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
