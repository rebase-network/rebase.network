# Content Model

## Goals

The Rebase content model should support:

- structured community content
- simple operator workflows
- scalable GeekDaily organization
- stable public URLs
- a custom admin experience that edits meaningful editorial objects rather than raw tables

## Editorial Format

Use:

- structured fields for metadata and structured page sections
- Markdown for long-form content fields

Recommended Markdown-backed fields include:

- `about_page` sections when needed
- `articles.body`
- `events.body`
- `jobs.description`
- `geekdaily_episodes.body`

Detailed backend schema notes live in `docs/admin-data-model.md`.

This document focuses on public content domains and URL behavior.

## URL Conventions

### Global Rules

- use lowercase URLs
- use `-` between words
- avoid Chinese characters in public URLs
- avoid trailing slash in canonical URLs
- keep published URLs stable

### Public Routes

- home: `/`
- about: `/about`
- who-is-hiring: `/who-is-hiring`
- hiring detail: `/who-is-hiring/{slug}`
- GeekDaily list: `/geekdaily`
- GeekDaily detail: `/geekdaily/geekdaily-{episode-number}`
- site RSS: `/rss.xml`
- hiring RSS: `/who-is-hiring/rss.xml`
- GeekDaily RSS: `/geekdaily/rss.xml`
- articles list: `/articles`
- article detail: `/articles/{slug}`
- articles RSS: `/articles/rss.xml`
- events list: `/events`
- event detail: `/events/{yyyy-mm-dd}-{slug}`
- events RSS: `/events/rss.xml`
- contributors: `/contributors`

### Query Parameters

GeekDaily examples:

- `/geekdaily?q=agent`
- `/geekdaily?tag=ai`
- `/geekdaily?year=2026`
- `/geekdaily?page=2`

Who-Is-Hiring examples:

- `/who-is-hiring?q=frontend`
- `/who-is-hiring?location=shanghai`
- `/who-is-hiring?mode=remote`

## Public Content Domains

### `site_settings`

Singleton for global site configuration.

Suggested fields:

- `site_name`
- `tagline`
- `description`
- `primary_domain`
- `secondary_domain`
- `media_domain`
- `social_links`
- `footer_groups`
- `copyright_text`

### `home_page`

Singleton for home-page editorial structure.

Suggested fields:

- `hero_title`
- `hero_summary`
- `hero_primary_cta_label`
- `hero_primary_cta_url`
- `hero_secondary_cta_label`
- `hero_secondary_cta_url`
- `home_signals`
- `home_stats`

### `about_page`

Singleton for About content.

Suggested fields:

- `title`
- `summary`
- `sections`
- `seo_title`
- `seo_description`

### `jobs`

Community hiring entries shown on the Who-Is-Hiring page.

Suggested fields:

- `company_name`
- `role_title`
- `slug`
- `salary`
- `supports_remote`
- `location`
- `work_mode`
- `summary`
- `description`
- `responsibilities`
- `apply_url`
- `apply_note`
- `contact_label`
- `contact_value`
- `logo_asset_id`
- `status`
- `published_at`
- `expires_at`
- `seo_title`
- `seo_description`

Notes:

- public path should use `/who-is-hiring/{slug}`
- `slug` should be stable after publication
- `description` should support Markdown
- at least one of `apply_url` or contact info should exist before publication

### `articles`

Public articles published by the community.

Suggested fields:

- `title`
- `slug`
- `summary`
- `body`
- `cover_image`
- `authors`
- `tags`
- `status`
- `published_at`
- `seo_title`
- `seo_description`

Slug rules:

- semantic
- lowercase
- stable after publication

### `events`

Community events for public listing and detail pages.

Suggested fields:

- `title`
- `slug`
- `start_at`
- `end_at`
- `city`
- `location`
- `venue`
- `summary`
- `body`
- `cover_image`
- `registration_mode`
- `registration_url`
- `registration_note`
- `status`
- `published_at`
- `seo_title`
- `seo_description`

URL rule:

- public path uses `/events/{yyyy-mm-dd}-{slug}`
- `slug` should remain stable once published

### `contributor_roles`

Roles used to group contributors.

Suggested fields:

- `name`
- `slug`
- `description`
- `sort_order`

Examples:

- volunteers
- geekdaily-advisors

### `contributors`

Community contributors displayed by role.

Suggested fields:

- `name`
- `slug`
- `avatar`
- `headline`
- `bio`
- `roles`
- `twitter_url`
- `wechat`
- `telegram`
- `sort_order`
- `status`

V1 only requires the public list page, not individual contributor detail pages.

### `geekdaily_episodes`

The core GeekDaily episode record.

Suggested fields:

- `episode_number`
- `slug`
- `title`
- `summary`
- `body`
- `published_at`
- `tags`
- `status`

Public route:

- `/geekdaily/geekdaily-{episode-number}`

### `geekdaily_episode_items`

Ordered recommendation items inside an episode.

Suggested fields:

- `episode_id`
- `sort_order`
- `title`
- `author_name`
- `source_url`
- `summary`

## RSS Rules

- all feeds should only include published content
- site-wide feed should aggregate the latest 3 public items across core content types
- GeekDaily feed items should use episode pages
- hiring feed items should use public hiring detail pages
- feed descriptions should follow the previously agreed summary/body rules
