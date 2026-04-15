# API Troubleshooting

## `ops/manage.sh check` Fails

Inspect these in order:

1. SSH access to the current server host in `docs/production-config.md`
2. the remote project dir in `docs/production-config.md` exists
3. remote `infra/production/server.env` exists
4. Docker Engine and Docker Compose plugin are installed remotely
5. the compose file path in `docs/production-config.md` still matches the server layout

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

## R2 Upload Fails

Check these in order:

1. confirm the API is running in `r2-s3` mode instead of `wrangler-cli`
2. verify `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, and `R2_PUBLIC_BASE_URL` in `infra/production/server.env`
3. verify the R2 key is bucket-scoped to `rebase-media` with `Object Read & Write`
4. restart the API after any env change with `./ops/manage.sh deploy api --no-sync`

Useful checks:

```bash
./ops/manage.sh exec api -- sh -lc 'cd /app/apps/api && node --input-type=module -e "import { getAssetUploadConfig } from \"./dist/lib/asset-storage.js\"; console.log(JSON.stringify(getAssetUploadConfig(), null, 2));"'
./ops/manage.sh logs api 200
```

Known rollout failures:

- `spawn wrangler ENOENT`: the service is in Wrangler fallback mode but the container cannot find the `wrangler` executable
- `401` from `HeadBucket` or `PutObject`: the configured R2 S3 credentials are invalid, mismatched to the account, or missing bucket write scope
- Docker build failure on `COPY geekdaily.csv`: `geekdaily.csv` is ignored by git and must not be required by the production API image build

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
