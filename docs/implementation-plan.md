# Implementation Plan

## Goal

Turn the agreed V1 scope into a working first release in controlled phases.

Each completed batch of work should be committed promptly following the repository commit convention.

## Proposed Repository Structure

```text
apps/
  web/
packages/
  ui/
  types/
docs/
```

V1 does not require a custom admin application in this repository.

The CMS can be managed as a separately deployed Directus service while schema and integration notes remain documented here.

## Phase 1: Foundation

Deliverables:

- workspace initialization
- Astro app bootstrap in `apps/web`
- shared package scaffolding
- baseline code quality setup
- Cloudflare Workers deployment baseline

Definition of done:

- the repo can install dependencies cleanly
- the web app can run locally
- the web app can build and deploy to Workers

## Phase 2: Information Architecture and Design System

Deliverables:

- route skeleton for all V1 public pages
- navigation and footer structure
- base layout
- responsive design tokens
- reusable content modules

Definition of done:

- all agreed V1 routes exist
- desktop and mobile navigation work
- the visual system is coherent and reusable

## Phase 3: Content Integration

Deliverables:

- Directus content contract definition
- frontend data fetching layer
- integration for home, about, jobs, articles, events, contributors
- R2-backed media handling

Definition of done:

- pages can render CMS-backed content
- content updates flow through the system correctly

## Phase 4: GeekDaily Model and Search

Deliverables:

- episode-based GeekDaily data model
- list and detail page implementation
- CSV-informed migration strategy
- V1 GeekDaily search

Definition of done:

- GeekDaily list and detail pages work with episode-level URLs
- search can find practical results quickly

## Phase 5: Hardening and Launch Preparation

Deliverables:

- SEO baseline
- metadata and social cards
- cache strategy review
- domain configuration checklist
- analytics and observability basics

Definition of done:

- core SEO is in place
- launch-critical routes are validated
- deployment and domain steps are documented

## Open Decisions to Resolve Before Launch

- whether `rebase.community` should redirect to `rebase.network`
- Directus deployment target
- PostgreSQL hosting provider
- exact Cloudflare cache policy by route
- final analytics stack

## Working Rules During Implementation

- keep V1 scope tight
- avoid adding registration, user systems, or custom admin features
- prefer stable and maintainable choices over clever complexity
- commit after each coherent batch of completed work
