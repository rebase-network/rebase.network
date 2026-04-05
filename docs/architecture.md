# Architecture

## Overview

The new Rebase website is designed as a content-first platform.

It separates:

- the public website
- the content management backend
- the media storage layer
- the primary relational database

This keeps V1 simple while avoiding the scaling limits of a pure full-site static rebuild workflow.

## Technology Stack

- frontend framework: Astro
- runtime and deployment: Cloudflare Workers
- CMS: Directus
- primary database: PostgreSQL
- media storage: Cloudflare R2

## Why This Architecture

### Astro

- good fit for content-heavy websites
- strong component model
- flexible rendering strategies
- works well with Cloudflare deployment targets

### Cloudflare Workers

- suitable for the public website runtime
- avoids relying on full-site rebuilds for every content update
- supports edge caching and custom cache control
- aligns well with the existing Cloudflare ecosystem used for domain and media setup

### Directus

- provides admin login and content editing out of the box
- offers REST and GraphQL APIs for content delivery
- allows flexible collection modeling for Rebase-specific content types

### PostgreSQL

- strong fit for Directus
- safer long-term default than D1 for a CMS-centered content platform
- supports future reporting, filtering, and relational modeling needs

### R2

- keeps content media separate from code
- fits the Cloudflare-based deployment model
- avoids storing operational content media in git history

## System Diagram

```text
reader browser
    |
    v
cloudflare -> astro app on workers
                 |
                 +--> directus api
                 |        |
                 |        v
                 |     postgresql
                 |
                 +--> media urls on r2

admin browser
    |
    v
 directus admin
    |
    v
postgresql + r2
```

## Runtime Model

### Public Read Flow

1. A reader requests a public page.
2. The Astro app runs on Cloudflare Workers.
3. The page fetches content from Directus.
4. Directus reads structured content from PostgreSQL and media metadata from its file layer.
5. Media assets are served from R2-backed URLs.
6. Cloudflare cache is applied to improve repeat access performance.

### Admin Content Flow

1. An admin logs into Directus.
2. The admin creates or updates content.
3. Directus persists structured data to PostgreSQL.
4. Uploaded media is stored in R2.
5. Public pages read the latest published content through Directus APIs.

## Rendering Strategy

V1 should use a mixed rendering strategy.

### Good Candidates for Static or Stable Rendering

- about page
- contributors page
- fixed site configuration sections

### Good Candidates for Dynamic or Cached Rendering

- home page
- GeekDaily list page
- GeekDaily detail page
- jobs page
- article list and detail pages
- event list and detail pages

This strategy avoids unnecessary full-site rebuilds when content changes frequently.

## Domain Strategy

Public domains:

- `rebase.network`
- `rebase.community`

Operational domains:

- recommended CMS domain: `admin.rebase.network`
- recommended media domain: `media.rebase.network`

The final redirect policy between `rebase.network` and `rebase.community` can be decided later.

That decision does not block development.

## API Boundary

### Content Read API

V1 should read content directly from Directus APIs.

There is no need to introduce a custom read BFF before the real complexity appears.

### Public Write API

V1 does not include event registration forms.

As a result, V1 does not require a public write API for forms or submissions.

This intentionally keeps the first release simpler.

## Media Strategy

### Store in the Repository

- logo
- favicon
- fixed decorative assets
- default placeholders

### Store in R2

- article cover images
- event posters
- GeekDaily media
- contributor avatars
- job-related media

## Caching Strategy

V1 should use practical cache control instead of complex invalidation from day one.

Suggested approach:

- cache public GET responses at the edge
- keep TTLs conservative for dynamic list pages
- allow faster refresh for pages with frequent content updates
- add targeted purge rules later if needed

## Search Strategy

V1 includes GeekDaily search only.

Recommended scope:

- search against episode-level metadata
- include title, summary, tags, date, and episode number
- keep the first version lightweight and practical

V1 does not require a heavyweight dedicated search engine.

## Security Baseline

- readers never need authentication
- admin access is handled by Directus
- CMS credentials never reach the public client
- media write access stays behind the CMS
- public site only consumes published content

## V1 Non-Goals

- custom member system
- complex event operations
- advanced workflow automation
- full-site search across all collections
- multi-language content system
