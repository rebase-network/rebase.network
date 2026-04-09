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
- Use `docs/v1-scope.md` for product scope and non-goals.
- Use `docs/architecture.md` for target architecture, deployment, caching, and runtime decisions.
- Use `docs/content-model.md` for public content domains, URL rules, RSS rules, and editorial assumptions.
- Use `docs/admin-architecture.md` for the custom admin, API, auth, and media architecture.
- Use `docs/admin-information-architecture.md` for operator workflows and admin module structure.
- Use `docs/admin-data-model.md` for backend tables, workflow states, and validation-critical constraints.
- Use `docs/implementation-plan.md` for delivery phases and milestone expectations.
- Use `docs/acceptance-criteria.md` and `docs/quality-assurance.md` for review and validation standards.
- Use `docs/deployment.md` for rollout steps, build settings, and remote operations.
- Use `docs/production-config.md` for the current production inventory, domains, Workers, server paths, and config ownership.
- Use `docs/launch-checklist.md` for launch routes, health checks, domain preparation, and observability notes.
- Use `docs/local-development.md` for current local setup, service commands, and archive import notes.
