# Documentation Audit 2026-06-08

## Goal

Identify which documents are still part of the active repository baseline, which ones are historical, and which ones are mostly duplicate noise in the current `docs/` root.

## Status

Cleanup completed on 2026-06-08:

- dated redesign files were first archived and then removed from the repository
- `docs/product/implementation-plan.md` was rewritten into a current roadmap

## Active Baseline Documents

These documents still match the current repository structure and should remain part of the primary documentation set:

- `README.md`
- `DESIGN.md`
- `docs/operations/local-development.md`
- `docs/product/v1-scope.md`
- `docs/product/content-model.md`
- `docs/architecture/architecture.md`
- `docs/architecture/admin-architecture.md`
- `docs/architecture/admin-information-architecture.md`
- `docs/architecture/admin-data-model.md`
- `docs/product/acceptance-criteria.md`
- `docs/operations/quality-assurance.md`
- `docs/operations/deployment.md`
- `docs/operations/production-config.md`
- `docs/operations/launch-checklist.md`
- `apps/web/design_principles.md`
- `apps/web/DESIGN.md`
- `apps/admin/design_principles.md`
- `apps/admin/DESIGN.md`

Why these stay:

- they are the files indexed by `README.md` and `AGENTS.md`
- they describe the current repo layout (`apps/web`, `apps/admin`, `apps/api`, `packages/*`)
- their commands and paths match the current scripts in `package.json`
- their QA and release guidance still map to `tests/smoke/*`, `playwright.config.js`, `ops/manage.sh`, and `infra/production/*`

## Cleanup Actions

### 1. `docs/product/implementation-plan.md`

This file used to be a future-tense phased delivery plan.

It was rewritten on 2026-06-08 into the current roadmap so the path can remain part of the main docs index without pointing at stale planning language.

Result:

- keep `docs/product/implementation-plan.md` in the live doc set as the active roadmap file

### 2. Dated site-redesign process documents

These files described a one-time redesign and follow-up effort from `2026-04-27` and `2026-04-28`.

They are no longer kept in the repository.

Reasons:

- they are not part of the main documentation index in `README.md`
- most of them only reference each other, so they behave like a closed historical cluster rather than active baseline docs
- their planning and validation intent is already covered by persistent docs such as `apps/web/design_principles.md`, `apps/web/DESIGN.md`, `docs/operations/quality-assurance.md`, and `docs/operations/launch-checklist.md`
- several issues they discuss are already codified in automated tests under `tests/smoke/`

Result:

- remove them from the live repo because they are not part of the active documentation baseline

## Low-Value Or Duplicate Documents

### 1. Dated test-plan documents

These two files were the strongest delete candidates and have now been removed:

- `site-redesign-test-plan-2026-04-27.md`
- `site-community-visual-test-plan-2026-04-27.md`

Reasons:

- they duplicate the long-lived testing guidance in `docs/operations/quality-assurance.md`
- they overlap with executable coverage already present in:
  - `tests/smoke/routes.spec.ts`
  - `tests/smoke/geekdaily.spec.ts`
  - `tests/smoke/feeds.spec.ts`
  - `tests/smoke/ops.spec.ts`
  - `tests/smoke/runtime-content.spec.ts`
- they are tied to a single redesign batch rather than the current ongoing QA process

Result:

- deleted

### 2. Dated implementation-results documents

- `site-redesign-followup-implementation-results-2026-04-27.md`
- `site-community-visual-implementation-results-2026-04-27.md`

Reasons:

- they are historical delivery notes, not stable operating docs
- most of their useful value now overlaps with git history, commits, tests, and the implemented code itself

Result:

- deleted with the rest of the redesign archive set

### 3. Unreferenced proposal assets

- `hero-community-proposal-2026-04-27.svg`
- `detail-page-community-proposal-2026-04-28.svg`

Reasons:

- they are not part of the main doc map
- they are not referenced by the markdown docs that define the active product baseline
- they look like design exploration artifacts, not long-lived documentation

Result:

- deleted with the related redesign process documents

## Cleanup Rule

Before deleting any redesign document, check whether it contains a lasting rule that never got copied into:

- `apps/web/design_principles.md`
- `apps/web/DESIGN.md`
- `docs/operations/quality-assurance.md`

If a rule is still valuable, migrate that rule first, then archive or delete the dated process file.

## Remaining Follow-Up

- continue moving durable UI or QA rules into the app design docs and baseline QA docs instead of starting new dated shadow docs
