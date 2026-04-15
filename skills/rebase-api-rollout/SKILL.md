---
name: rebase-api-rollout
description: Deploy and operate the Rebase backend server stack on the private backend host via `ops/manage.sh`. Use when releasing or debugging `apps/api`, PostgreSQL, `cloudflared`, server env files, Docker Compose rollout, readiness checks, admin bootstrap, database backups, or the end-to-end server side of the Rebase production release.
---

# Rebase API Rollout

## Overview

Use this skill for the server-managed half of the Rebase production stack. It centers on `ops/manage.sh`, the Docker Compose topology in `infra/production/docker-compose.yml`, and the production config registry in `docs/production-config.md`.

## Standard Rollout

1. Keep the code on `dev` until it is validated.
2. Validate release readiness locally when needed:
   - `pnpm deploy:server:config`
   - any targeted API checks for the touched area
3. Use `./ops/manage.sh check` before a remote rollout.
4. Use `./ops/manage.sh deploy api` for API-only changes.
5. Use `./ops/manage.sh deploy stack` when API, Postgres, or `cloudflared` changes require the full stack.
6. Verify with:
   - `./ops/manage.sh ps`
   - `./ops/manage.sh health`
   - `./ops/manage.sh ready`
   - `./ops/manage.sh logs api 200`
7. Run targeted DB or bootstrap commands only when the task requires them.

## Current Production Index

Use `docs/production-config.md` for the exact host alias, remote project dir, compose file, env file, service names, and public API hostname.

Use `references/runbook.md` for the command set and `references/troubleshooting.md` for the known failure modes.

## When To Read References

- Read `references/runbook.md` before performing a routine rollout, restart, log inspection, DB query, backup, or bootstrap action.
- Read `references/troubleshooting.md` when health checks fail, compose services do not come up, the tunnel is broken, the env file is missing, or the DB needs verification.

## Guardrails

- Prefer `ops/manage.sh` over ad-hoc SSH commands.
- Keep PostgreSQL private to the server and compose network; do not expose it publicly.
- Update `docs/deployment.md` and `docs/production-config.md` when server topology or ownership changes.
- If the task also includes public/admin Workers, pair this skill with `rebase-cloudflare-release`.
