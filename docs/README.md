# Repository Docs

This directory holds repository-level documentation.

Not every markdown file in the repo belongs here. Some documents intentionally stay next to the code or workflow they govern:

- `README.md`, `DESIGN.md`, and `AGENTS.md` stay at the repository root because they are top-level entry documents
- `apps/web/*` and `apps/admin/*` design docs stay beside the surfaces they specify
- `skills/*` documentation stays with each skill because it is workflow-local, not product-local

## Layout

### `docs/product/`

Product scope, content rules, acceptance, and roadmap:

- `v1-scope.md`
- `content-model.md`
- `implementation-plan.md`
- `acceptance-criteria.md`

### `docs/architecture/`

System, admin, and data-model design:

- `architecture.md`
- `admin-architecture.md`
- `admin-information-architecture.md`
- `admin-data-model.md`

### `docs/operations/`

Development, QA, deployment, and release operations:

- `local-development.md`
- `quality-assurance.md`
- `deployment.md`
- `production-config.md`
- `launch-checklist.md`

## Update Rule

Repository-wide product, architecture, and operations docs should live under `docs/`.

Only keep documents outside `docs/` when they are intentionally local to a specific app, skill, or repository entrypoint.
