# AGENTS.md

Repository workflow conventions for coding agents working in this repo.

## Commit format

- Follow Conventional Commits 1.0.0.
- Use the default format: `type(scope): description`.
- Keep commit messages concise and focused on the main change.
- Write commit messages in English.
- Use lowercase by default; avoid uppercase unless necessary.

Examples:

- `feat(web): add homepage skeleton`
- `fix(events): correct signup form schema`
- `chore(repo): initialize workspace`

## Commit cadence

- Commit promptly after completing a coherent batch of work.
- Avoid mixing unrelated changes in the same commit.
- Keep each commit scoped to a single clear goal so it is easy to review or revert.

## Branch and release flow

- Keep day-to-day work on `dev`.
- After a coherent batch is committed locally, push it to `origin/dev`.
- Open a pull request from `dev` to `main` for review and release tracking.
- Merge the pull request into `main` only after the release candidate is ready.
- If pull request merge permission is unavailable, stop at the PR step and hand the PR back to a maintainer.
- Do not merge `dev` into `main` locally as a substitute for the GitHub pull request flow.
- Do not push release changes directly to `origin/main`.

## Documentation Map

- Start with `README.md` for the current project baseline and document index.
- Use `docs/README.md` for the repository-level documentation layout.
- Use `DESIGN.md` as the repository design-document index.
- Use `apps/web/design_principles.md` for public-site design intent, interaction rules, and content hierarchy guidance.
- Use `apps/web/DESIGN.md` for public-site hard visual specification.
- Use `apps/admin/design_principles.md` for admin UX intent, density rules, and operator workflow guidance.
- Use `apps/admin/DESIGN.md` for admin hard visual specification.
- Use `docs/product/v1-scope.md` for product scope and non-goals.
- Use `docs/architecture/architecture.md` for target architecture, deployment, caching, and runtime decisions.
- Use `docs/product/content-model.md` for public content domains, URL rules, RSS rules, and editorial assumptions.
- Use `docs/architecture/admin-architecture.md` for the custom admin, API, auth, and media architecture.
- Use `docs/architecture/admin-information-architecture.md` for operator workflows and admin module structure.
- Use `docs/architecture/admin-data-model.md` for backend tables, workflow states, and validation-critical constraints.
- Use `docs/product/implementation-plan.md` for the current roadmap and active workstreams.
- Use `docs/product/acceptance-criteria.md` and `docs/operations/quality-assurance.md` for acceptance criteria and development validation standards.
- Use `docs/operations/deployment.md` for the operator handbook.
- Use `docs/operations/production-config.md` for the production settings index.
- Use `docs/operations/launch-checklist.md` for the release verification checklist.
- Use `docs/operations/local-development.md` for local setup, daily commands, and archive import notes.
