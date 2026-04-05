# Content Model

## Goals

The data model should support:

- structured community content
- simple operator workflows
- scalable GeekDaily organization
- stable public URLs

## Editorial Format

Use:

- structured fields for metadata and structured page sections
- Markdown for long-form content fields

Recommended Markdown-backed fields include:

- `about_page.content`
- `articles.content`
- `events.content`
- `jobs.description`
- `geekdaily_episodes.body`

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
- GeekDaily detail: `/geekdaily/episode-{episode-number}`
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

## CMS Collections

### `site_settings`

Singleton for global site configuration.

Suggested fields:

- `site_name`
- `site_description`
- `primary_domain`
- `secondary_domain`
- `seo_title`
- `seo_description`
- `social_links`
- `copyright_text`

### `home_page`

Singleton for home page editorial content.

Suggested fields:

- `hero_title`
- `hero_description`
- `hero_cta_label`
- `hero_cta_url`
- `featured_about_excerpt`
- `featured_sections_enabled`

### `about_page`

Singleton for About content.

Suggested fields:

- `title`
- `summary`
- `content`
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
- `logo`
- `status`
- `published_at`
- `expires_at`
- `sort_date`
- `seo_title`
- `seo_description`

Notes:

- `status` should support at least draft, published, archived
- public path should use `/who-is-hiring/{slug}`
- `slug` should be stable after publication
- `description` should support Markdown

### `articles`

Public articles published by the community.

Suggested fields:

- `title`
- `slug`
- `summary`
- `content`
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
- `event_date`
- `end_date`
- `timezone`
- `location`
- `venue_name`
- `summary`
- `content`
- `cover_image`
- `registration_mode`
- `registration_url`
- `registration_note`
- `status`
- `published_at`
- `is_past_event`

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
- `social_links`
- `sort_order`
- `status`

V1 only requires the public list page, not individual contributor detail pages.

### `footer_link_groups`

Groups of footer links.

Suggested fields:

- `name`
- `slug`
- `sort_order`

Suggested groups:

- social
- supported-projects
- media-resources
- friendly-links

### `footer_links`

Items within each footer group.

Suggested fields:

- `group`
- `label`
- `url`
- `description`
- `sort_order`
- `status`

## GeekDaily Data Model

The provided `geekdaily.csv` shows that one episode contains multiple content items.

That means the public GeekDaily detail page should be modeled by episode, not by row.

### Source Observation

Current CSV structure:

- `episode`
- `time`
- `title`
- `author`
- `url`
- `introduce`

Current reference snapshot from `geekdaily.csv`:

- total rows: 5458
- unique episodes: 1809
- latest observed episode: 1915

This should be treated as reference data for V1 planning and migration.

### `geekdaily_episodes`

Episode-level public pages.

Suggested fields:

- `episode_number`
- `slug`
- `published_at`
- `title`
- `summary`
- `body`
- `tags`
- `hero_image`
- `status`
- `seo_title`
- `seo_description`

Slug rule:

- generated as `episode-{episode_number}`
- example: `episode-1915`

Title default during migration:

- `极客日报#{episode_number}`

Public URL:

- `/geekdaily/episode-1915`

### `geekdaily_items`

Items contained within an episode.

Suggested fields:

- `episode`
- `title`
- `author`
- `source_url`
- `summary`
- `sort_order`

CSV mapping:

- `episode` -> `geekdaily_episodes.episode_number`
- `time` -> `geekdaily_episodes.published_at`
- `title` -> `geekdaily_items.title`
- `author` -> `geekdaily_items.author`
- `url` -> `geekdaily_items.source_url`
- `introduce` -> `geekdaily_items.summary`

Migration approach:

- the historical `geekdaily.csv` file is the source input
- generate SQL from CSV after the final schema is defined
- commit the generated SQL migration files to this repository
- import all available historical episodes in one batch

## Search Model for GeekDaily

V1 search should be episode-centric.

Recommended searchable fields:

- `episode_number`
- `title`
- `summary`
- `tags`
- `published_at`
- optional derived text from item titles

V1 should not rely on a heavyweight full-text architecture.

## RSS Model

### Site Feed

`/rss.xml` should aggregate recent published items from:

- `geekdaily_episodes`
- `articles`
- `events`
- `jobs`

### GeekDaily Feed

`/geekdaily/rss.xml` should publish one feed item per episode.

V1 limit:

- latest 3 published episodes

Suggested feed fields:

- title
- link
- description
- publication date
- episode number

Description rule:

- use episode body content when available
- otherwise use a generated body-like summary derived from the episode content

### Articles Feed

`/articles/rss.xml` should publish one feed item per article.

V1 limit:

- latest 3 published articles

Description rule:

- use article summary

### Events Feed

`/events/rss.xml` should publish one feed item per event.

Event feed items should only include public published events.

V1 limit:

- latest 3 published events

Description rule:

- use event summary

### Hiring Feed

`/who-is-hiring/rss.xml` should publish one feed item per public job entry.

V1 limit:

- latest 3 published job entries

Suggested feed fields:

- title
- link
- description
- publication date
- company name
- location
- work mode

Feed links should point to public hiring detail pages, not directly to the external application URL.

Description rule:

- use job summary

## Shared Content Status Convention

Suggested status values:

- `draft`
- `published`
- `archived`

This should apply across content collections where relevant.
