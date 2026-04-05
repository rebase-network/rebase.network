# Rebase Community Website

This repository contains the new Rebase community website.

The first version focuses on:

- public community content pages
- an admin-managed CMS workflow
- a scalable GeekDaily information architecture
- a maintainable frontend deployed on Cloudflare Workers

## Project Status

The legacy implementation has been removed from the working tree.

Git history is preserved, and the repo is now being rebuilt from scratch with a new architecture.

## V1 Baseline

- frontend: Astro
- runtime and deployment: Cloudflare Workers
- CMS: Directus
- primary database: PostgreSQL
- media storage: Cloudflare R2

## Key Decisions

- V1 is a content platform, not a complex business platform
- readers do not need to log in
- admins log in through the CMS backend
- event registration is out of scope for V1
- GeekDaily search is in scope for V1
- RSS feeds are in scope for V1
- hiring detail pages and hiring RSS are in scope for V1
- GeekDaily detail URLs use `/geekdaily/episode-{episode-number}`

## Documentation

- `docs/v1-scope.md`: V1 goals, scope, and non-goals
- `docs/architecture.md`: architecture, runtime model, deployment, and integration decisions
- `docs/content-model.md`: CMS collections, field design, and URL conventions
- `docs/implementation-plan.md`: development phases and milestone plan

## Repository Conventions

Agent workflow conventions are documented in `AGENTS.md`.
