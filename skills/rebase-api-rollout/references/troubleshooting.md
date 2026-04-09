# API Troubleshooting

## `ops/manage.sh check` Fails

Inspect these in order:

1. SSH access to `rebase@101.33.75.240`
2. remote repo dir exists: `/home/rebase/rebase.network`
3. remote `infra/production/server.env` exists
4. Docker Engine and Docker Compose plugin are installed remotely
5. compose file path still matches `infra/production/docker-compose.yml`

## API Health Or Ready Fails

Run:

```bash
./ops/manage.sh ps
./ops/manage.sh logs api 200
./ops/manage.sh logs cloudflared 200
```

Then check:

- API container started
- env values such as `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are present
- DB is reachable from API
- migrations or schema expectations are not blocking startup

## Tunnel Or Public API Hostname Fails

Remember the production routing model:

- browser -> Cloudflare -> `api.rebase.network` -> `cloudflared` -> `api:8788`

If `https://api.rebase.network` fails but local health is good, inspect:

- `cloudflared` container logs
- tunnel token in `infra/production/server.env`
- Cloudflare Zero Trust hostname mapping

## Database Checks

Use:

```bash
./ops/manage.sh db query "select now();"
./ops/manage.sh db query "select count(*) from geekdaily_episodes;"
./ops/manage.sh db backup
```

Do not expose Postgres publicly just to debug.

## Release Policy Reminder

The normal release policy is still:

- work on `dev`
- validate locally
- push `origin/dev`
- create PR to `main`
- merge through GitHub
- deploy release-ready backend code from reviewed state

Do not bypass this just because the server is self-managed.
