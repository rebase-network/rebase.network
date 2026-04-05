# Quality Assurance

## Purpose

This document defines how Rebase website work should be validated during development.

The goal is to combine:

- browser-based review
- automated checks
- realistic sample content
- release-oriented verification

## Validation Layers

### 1. Browser Review

Browser review is required for page presentation acceptance.

It should cover:

- desktop viewport
- mobile viewport
- primary user flows
- realistic content, not empty placeholders only

Browser review should focus on:

- layout
- readability
- spacing
- navigation
- link behavior
- content hierarchy
- empty states
- overflow handling

### 2. Automated Checks

Automated checks provide fast regression protection.

They should cover:

- code quality
- route availability
- key page structure
- feed output
- major UI regressions

### 3. Sample Content Validation

Sample content should be used throughout development to confirm real-world behavior.

Recommended baseline sample set:

- 3 GeekDaily episodes
- 2 articles
- 2 events
- 3 job entries
- 4 contributors across at least 2 roles
- a complete footer setup

The provided `geekdaily.csv` should be used as a reference source for episode-level structure.

### 4. Release Validation

Before a release, verify:

- critical route accessibility
- feed validity
- metadata completeness
- mobile behavior
- domain readiness
- media loading behavior

## Browser Review Checklist

Each major page should be reviewed in a browser for:

- visible main heading
- clear navigation
- working footer
- correct content data
- stable layout on desktop
- stable layout on mobile
- acceptable long-title behavior
- acceptable empty-state behavior

Pages that should always be reviewed manually:

- `/`
- `/about`
- `/who-is-hiring`
- a sample job detail page
- `/geekdaily`
- a sample GeekDaily detail page
- `/articles`
- a sample article detail page
- `/events`
- a sample event detail page
- `/contributors`

## Automated Checks Plan

### Build-Level Checks

These should run on every meaningful feature batch:

- lint
- typecheck
- build

Purpose:

- catch syntax and type issues
- confirm route generation or runtime wiring
- catch RSS generation failures

### Route Smoke Tests

Use browser automation to verify that critical routes load correctly.

Recommended initial route set:

- `/`
- `/about`
- `/who-is-hiring`
- `/geekdaily`
- `/articles`
- `/events`
- `/contributors`
- `/rss.xml`
- `/geekdaily/rss.xml`
- `/articles/rss.xml`
- `/events/rss.xml`
- `/who-is-hiring/rss.xml`
- `/robots.txt`
- `/sitemap.xml`
- `/healthz`

When sample content exists, also test:

- one GeekDaily detail route
- one article detail route
- one event detail route
- one hiring detail route

Recommended checks:

- response is successful
- expected heading or landmark exists
- key page regions render
- feed responses contain XML content
- health and SEO support routes return the expected format

### Structural Assertions

For major pages, verify:

- a primary heading exists
- navigation exists
- footer exists
- expected CTA or content block exists

Examples:

- the GeekDaily list page should include a search input or search trigger
- the hiring detail page should include an apply link
- the event detail page should include registration instructions or an external registration link

### Feed Checks

Each feed should be checked for:

- successful response
- XML output
- non-empty channel metadata
- at least one item when sample data exists
- item links that match public route conventions

Route conventions to verify:

- GeekDaily items link to `/geekdaily/episode-{episode-number}`
- hiring items link to `/who-is-hiring/{slug}`
- article items link to `/articles/{slug}`
- event items link to `/events/{yyyy-mm-dd}-{slug}`

### Search Checks

GeekDaily search checks should verify:

- the search UI is available
- searching by episode number works
- searching by keyword returns expected practical matches
- empty search results render a clear state
- search results link to valid episode pages

### Visual Regression Checks

Visual regression is optional for the earliest phase, but recommended once the main UI is stable.

Start with screenshots for:

- home page
- GeekDaily list page
- GeekDaily detail page
- hiring list page
- hiring detail page

Capture at least:

- one desktop viewport
- one mobile viewport

The goal is to catch major layout regressions, not pixel-perfect design policing.

### Suggested Tooling

Recommended first-pass tooling:

- formatter and lint setup
- type checking
- Playwright for browser automation

Playwright is a good fit because it can:

- load pages
- inspect elements
- click links
- enter search input
- capture screenshots
- verify feed responses

## Definition of Done for Testing

A feature batch should not be considered complete until:

- the relevant manual browser review has been done
- the relevant automated checks pass
- realistic sample content has been tested where applicable
- known limitations are documented if they are intentionally deferred

## Future Expansion

After the initial build is stable, QA can be expanded with:

- richer visual regression coverage
- accessibility checks
- performance budget checks
- schema validation for CMS responses
- redirect validation for future URL migrations
