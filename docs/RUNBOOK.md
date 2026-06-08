# RUNBOOK

This runbook is the fastest path for a developer or community contributor to work on `rebase.network`.

Use this file for task-oriented flows.
Use [COMMAND-CARD.md](./COMMAND-CARD.md) for copy-paste commands.
Use `docs/operations/*` for detailed reference material.

## What This Repo Contains

- `apps/web`: public Astro site
- `apps/admin`: Vue admin workspace
- `apps/api`: public and internal API
- `packages/shared`: shared types and validation
- `packages/db`: database schema, migrations, and seed data

## 1. First Local Setup

1. Install the required toolchain.
2. Create a local `.env`.
3. Install dependencies.
4. Bootstrap the local stack.
5. Start the dev servers.

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.6.5 --activate
cp .env.example .env
pnpm install
pnpm local:bootstrap
pnpm dev:stack
```

Local URLs:

- Public site: `http://127.0.0.1:4321`
- Admin: `http://127.0.0.1:5174`
- API: `http://127.0.0.1:8788`
- PostgreSQL: `127.0.0.1:55433`

If you use the default `.env.example` values, the local admin login is:

- Email: `admin@rebase.local`
- Password: `RebaseAdmin123456!`

## 2. Daily Development

Run the full stack:

```bash
pnpm dev:stack
```

Run only the public site and API:

```bash
pnpm dev:public
```

Run only the admin workspace and API:

```bash
pnpm dev:ops
```

Run one service at a time:

```bash
pnpm dev:web
pnpm dev:admin
pnpm dev:api
```

## 3. Common Change Flows

### Frontend or content page change

1. Start `pnpm dev:public` or `pnpm dev:stack`.
2. Make the change.
3. Check the affected route in a browser.
4. Run:

```bash
pnpm lint
pnpm typecheck
```

5. If the affected route is covered by smoke tests, run:

```bash
pnpm test:smoke
```

### Admin workspace change

1. Start `pnpm dev:ops` or `pnpm dev:stack`.
2. Make the change.
3. Check the affected list page or editor page in the browser.
4. Run:

```bash
pnpm typecheck:admin
```

5. If the change affects production build output, also run:

```bash
pnpm build:admin
```

### API, database, or shared contract change

1. Start the local stack.
2. Make the change.
3. Run:

```bash
pnpm typecheck:api
pnpm build:api
```

4. If schema or seed behavior changed, also run:

```bash
pnpm db:migrate
pnpm db:seed
```

5. If the change affects public pages or admin flows, test those paths in the browser too.

## 4. Before You Push

Use the smallest relevant verification set:

- Public site change: `pnpm lint` and `pnpm typecheck`
- Admin change: `pnpm typecheck:admin`
- API/shared/db change: `pnpm typecheck:api` and `pnpm build:api`
- Route-level regression risk: `pnpm test:smoke`

If the change affects production build output, also run the relevant build:

- `pnpm build:web:prod`
- `pnpm build:admin`
- `pnpm build:api`

## 5. Frontend Release Flow

Normal production frontend release path:

1. Finish and verify work on `dev`.
2. Push `dev`.
3. Open and merge a Pull Request from `dev` to `main`.
4. Wait for Cloudflare to deploy `rebase-web` and/or `rebase-admin`.
5. Run post-release checks.

Dry-run commands:

```bash
pnpm deploy:web:dry-run
pnpm deploy:admin:dry-run
```

Do not treat local `wrangler deploy` as the default production path.

## 6. Backend Release Flow

Normal production backend release path:

1. Merge the backend change to `main`.
2. Update the deployment machine to the target `main` commit.
3. Confirm the working tree is clean.
4. Prefer:

```bash
./ops/manage.sh rollout api
```

5. Run post-release checks.

For Compose-level changes, use:

```bash
./ops/manage.sh deploy stack
```

## 7. Production Operations

Check the remote host and running services:

```bash
./ops/manage.sh check
./ops/manage.sh ps
```

Check API health:

```bash
./ops/manage.sh health
./ops/manage.sh ready
```

Inspect logs:

```bash
./ops/manage.sh logs api 200
./ops/manage.sh db logs 200
```

Create a database backup before risky work:

```bash
./ops/manage.sh db backup
./ops/manage.sh db list-backups
```

Export data for review:

```bash
./ops/manage.sh db export articles
./ops/manage.sh db export-query "select count(*) from geekdaily_episodes;"
```

## 8. Common Local Recovery

Restart PostgreSQL only:

```bash
pnpm db:down
pnpm db:up
pnpm db:logs
```

Refresh local admin credentials after changing `.env`:

```bash
pnpm admin:bootstrap
```

Re-apply local content seed data:

```bash
pnpm db:seed
```

If the package manager resolution is broken, re-enable Corepack and re-activate the pinned pnpm version:

```bash
corepack enable
corepack prepare pnpm@10.6.5 --activate
```

## 9. Detailed References

- Local development: [`docs/operations/local-development.md`](./operations/local-development.md)
- Quality assurance: [`docs/operations/quality-assurance.md`](./operations/quality-assurance.md)
- Deployment: [`docs/operations/deployment.md`](./operations/deployment.md)
- Production config: [`docs/operations/production-config.md`](./operations/production-config.md)
- Launch checklist: [`docs/operations/launch-checklist.md`](./operations/launch-checklist.md)
