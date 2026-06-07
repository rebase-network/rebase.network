# Documentation Audit 2026-06-08

## Goal

Identify which documents are still part of the active repository baseline, which ones are historical, and which ones are mostly duplicate noise in the current `docs/` root.

## Status

Cleanup completed on 2026-06-08:

- dated redesign files were moved into `docs/archive/2026-04-site-redesign/`
- `docs/implementation-plan.md` was rewritten into a current roadmap

## Active Baseline Documents

These documents still match the current repository structure and should remain part of the primary documentation set:

- `README.md`
- `DESIGN.md`
- `docs/local-development.md`
- `docs/v1-scope.md`
- `docs/content-model.md`
- `docs/architecture.md`
- `docs/admin-architecture.md`
- `docs/admin-information-architecture.md`
- `docs/admin-data-model.md`
- `docs/acceptance-criteria.md`
- `docs/quality-assurance.md`
- `docs/deployment.md`
- `docs/production-config.md`
- `docs/launch-checklist.md`
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

### 1. `docs/implementation-plan.md`

This file used to be a future-tense phased delivery plan.

It was rewritten on 2026-06-08 into the current roadmap so the path can remain part of the main docs index without pointing at stale planning language.

Result:

- keep `docs/implementation-plan.md` in the live doc set as the active roadmap file

### 2. Dated site-redesign process documents

These files described a one-time redesign and follow-up effort from `2026-04-27` and `2026-04-28`.

They were archived under `docs/archive/2026-04-site-redesign/`:

- `docs/archive/2026-04-site-redesign/site-ux-review-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-ux-improvement-plan-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-visual-style-review-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-visual-style-improvement-plan-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-redesign-execution-plan-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-redesign-test-plan-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-redesign-followup-fix-plan-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-redesign-followup-implementation-plan-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-redesign-followup-implementation-results-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-community-visual-art-review-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-community-visual-remediation-plan-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-community-visual-implementation-plan-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-community-visual-test-plan-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-community-visual-implementation-results-2026-04-27.md`

Reasons:

- they are not part of the main documentation index in `README.md`
- most of them only reference each other, so they behave like a closed historical cluster rather than active baseline docs
- their planning and validation intent is already covered by persistent docs such as `apps/web/design_principles.md`, `apps/web/DESIGN.md`, `docs/quality-assurance.md`, and `docs/launch-checklist.md`
- several issues they discuss are already codified in automated tests under `tests/smoke/`

Result:

- keep them archived for history, not in the live root doc set

## Low-Value Or Duplicate Documents

### 1. Dated test-plan documents

These two files remain the strongest permanent delete candidates inside the archive:

- `docs/archive/2026-04-site-redesign/site-redesign-test-plan-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-community-visual-test-plan-2026-04-27.md`

Reasons:

- they duplicate the long-lived testing guidance in `docs/quality-assurance.md`
- they overlap with executable coverage already present in:
  - `tests/smoke/routes.spec.ts`
  - `tests/smoke/geekdaily.spec.ts`
  - `tests/smoke/feeds.spec.ts`
  - `tests/smoke/ops.spec.ts`
  - `tests/smoke/runtime-content.spec.ts`
- they are tied to a single redesign batch rather than the current ongoing QA process

Recommended action:

- delete them later if the team decides the archive should keep only review and result artifacts

### 2. Dated implementation-results documents

- `docs/archive/2026-04-site-redesign/site-redesign-followup-implementation-results-2026-04-27.md`
- `docs/archive/2026-04-site-redesign/site-community-visual-implementation-results-2026-04-27.md`

Reasons:

- they are historical delivery notes, not stable operating docs
- most of their useful value now overlaps with git history, commits, tests, and the implemented code itself

Recommended action:

- keep them archived unless the team later wants a slimmer archive

### 3. Unreferenced proposal assets in the redesign archive

- `docs/archive/2026-04-site-redesign/hero-community-proposal-2026-04-27.svg`
- `docs/archive/2026-04-site-redesign/detail-page-community-proposal-2026-04-28.svg`

Reasons:

- they are not part of the main doc map
- they are not referenced by the markdown docs that define the active product baseline
- they look like design exploration artifacts, not long-lived documentation

Result:

- they were moved into the redesign archive with the related process documents

## Cleanup Rule

Before deleting any redesign document, check whether it contains a lasting rule that never got copied into:

- `apps/web/design_principles.md`
- `apps/web/DESIGN.md`
- `docs/quality-assurance.md`

If a rule is still valuable, migrate that rule first, then archive or delete the dated process file.

## Remaining Follow-Up

- decide later whether the archive should keep every test-plan and implementation-results file, or only review and proposal artifacts
- continue moving durable UI or QA rules into the app design docs and baseline QA docs instead of starting new dated shadow docs
