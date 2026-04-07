# Admin Data Model

## Goal

Define the backend tables and constraints for the Rebase custom admin and API stack.

This model focuses on stable V1 content operations, not speculative future complexity.

## Modeling Principles

- primary keys use UUID
- public URLs use stable slugs, not internal ids
- workflow state is explicit on publishable entities
- uploaded binaries live in R2, not PostgreSQL
- validation belongs in both the application and the database
- GeekDaily episode items deserve first-class relational records

## Core Status Enums

Recommended content status:

- `draft`
- `published`
- `archived`

Optional later extension:

- `scheduled`
- `in_review`

Recommended staff account status:

- `invited`
- `active`
- `suspended`
- `disabled`

Recommended asset status:

- `uploaded`
- `active`
- `archived`
- `deleted`

## Auth and Access Tables

### `users`

Identity records owned by Better Auth.

### `sessions`

Session records owned by Better Auth.

### `accounts`

Authentication provider records owned by Better Auth.

### `staff_accounts`

Defines which authenticated users may enter the Rebase admin.

Suggested fields:

- `id`
- `user_id`
- `status`
- `display_name`
- `notes`
- `last_login_at`
- `invited_by_staff_id`
- `invited_at`
- `activated_at`
- `created_at`
- `updated_at`

Constraint notes:

- unique on `user_id`

### `roles`

Suggested fields:

- `id`
- `code`
- `name`
- `description`
- `is_system`
- `created_at`
- `updated_at`

### `permissions`

Suggested fields:

- `id`
- `code`
- `name`
- `resource`
- `action`
- `created_at`
- `updated_at`

### `staff_role_bindings`

Many-to-many between staff accounts and roles.

### `role_permission_bindings`

Many-to-many between roles and permissions.

### `audit_logs`

Suggested fields:

- `id`
- `actor_user_id`
- `actor_staff_account_id`
- `action`
- `target_type`
- `target_id`
- `summary`
- `payload_json`
- `request_id`
- `request_ip`
- `user_agent`
- `created_at`

## Site and Singleton Tables

### `site_settings`

Global site configuration.

Suggested fields:

- `id`
- `site_name`
- `tagline`
- `description`
- `primary_domain`
- `secondary_domain`
- `media_domain`
- `social_links_json`
- `footer_groups_json`
- `copyright_text`
- `updated_by_staff_id`
- `created_at`
- `updated_at`

### `home_page`

Home-page-specific structure.

Suggested fields:

- `id`
- `hero_title`
- `hero_summary`
- `hero_primary_cta_label`
- `hero_primary_cta_url`
- `hero_secondary_cta_label`
- `hero_secondary_cta_url`
- `home_signals_json`
- `home_stats_json`
- `updated_by_staff_id`
- `created_at`
- `updated_at`

### `about_page`

Suggested fields:

- `id`
- `title`
- `summary`
- `sections_json`
- `seo_title`
- `seo_description`
- `updated_by_staff_id`
- `created_at`
- `updated_at`

## Media Table

### `assets`

Stores media metadata only.

Suggested fields:

- `id`
- `storage_provider`
- `bucket`
- `object_key`
- `visibility`
- `asset_type`
- `mime_type`
- `byte_size`
- `width`
- `height`
- `checksum`
- `original_filename`
- `alt_text`
- `uploaded_by_staff_id`
- `status`
- `created_at`
- `updated_at`

Constraint notes:

- unique on `object_key`

## Publishable Content Tables

### `articles`

Suggested fields:

- `id`
- `slug`
- `title`
- `summary`
- `body_markdown`
- `reading_time`
- `cover_asset_id`
- `cover_accent`
- `authors_json`
- `tags_json`
- `status`
- `published_at`
- `seo_title`
- `seo_description`
- `updated_by_staff_id`
- `created_at`
- `updated_at`

Constraint notes:

- unique on `slug`

### `jobs`

Suggested fields:

- `id`
- `slug`
- `company_name`
- `role_title`
- `salary`
- `supports_remote`
- `work_mode`
- `location`
- `summary`
- `description_markdown`
- `responsibilities_json`
- `apply_url`
- `apply_note`
- `contact_label`
- `contact_value`
- `expires_at`
- `tags_json`
- `status`
- `published_at`
- `seo_title`
- `seo_description`
- `updated_by_staff_id`
- `created_at`
- `updated_at`

Constraint notes:

- unique on `slug`
- application logic should require either `apply_url` or `contact_value`

### `events`

Suggested fields:

- `id`
- `slug`
- `title`
- `summary`
- `body_markdown`
- `start_at`
- `end_at`
- `city`
- `location`
- `venue`
- `cover_asset_id`
- `registration_mode`
- `registration_url`
- `registration_note`
- `tags_json`
- `status`
- `published_at`
- `seo_title`
- `seo_description`
- `updated_by_staff_id`
- `created_at`
- `updated_at`

Constraint notes:

- unique on `slug`
- application logic should require `registration_url` when `registration_mode = external`
- database check should enforce `end_at >= start_at`

### `contributor_roles`

Suggested fields:

- `id`
- `slug`
- `name`
- `description`
- `sort_order`
- `status`
- `created_at`
- `updated_at`

Constraint notes:

- unique on `slug`

### `contributors`

Suggested fields:

- `id`
- `slug`
- `name`
- `headline`
- `bio`
- `avatar_asset_id`
- `avatar_seed`
- `twitter_url`
- `wechat`
- `telegram`
- `sort_order`
- `status`
- `created_at`
- `updated_at`

Constraint notes:

- unique on `slug`

### `contributor_role_bindings`

Many-to-many between contributors and contributor roles.

Constraint notes:

- unique on contributor plus role pair

### `geekdaily_episodes`

Suggested fields:

- `id`
- `slug`
- `episode_number`
- `title`
- `summary`
- `body_markdown`
- `published_at`
- `tags_json`
- `status`
- `updated_by_staff_id`
- `created_at`
- `updated_at`

Constraint notes:

- unique on `slug`
- unique on `episode_number`

### `geekdaily_episode_items`

Suggested fields:

- `id`
- `episode_id`
- `sort_order`
- `title`
- `author_name`
- `source_url`
- `summary`
- `created_at`
- `updated_at`

Constraint notes:

- unique on `episode_id` plus `sort_order`
- foreign key to `geekdaily_episodes`

## Suggested Indexes

At minimum, index:

- `articles(status, published_at)`
- `jobs(status, published_at)`
- `jobs(expires_at)`
- `events(status, start_at)`
- `contributors(status, sort_order)`
- `contributor_roles(status, sort_order)`
- `geekdaily_episodes(status, published_at)`
- `geekdaily_episodes(episode_number)`
- `audit_logs(created_at)`
- `audit_logs(actor_staff_account_id)`

## API-Critical Business Rules

The data model should support these rules directly or indirectly:

- only `published` content reaches the public API
- archived content remains visible in the admin only
- a GeekDaily episode cannot publish without at least one item
- a contributor should not publish without at least one role binding
- homepage and footer references should only point at published content
- media references should use active assets only

## Future Tables That Can Wait

These tables are intentionally deferred until justified:

- `content_revisions`
- `scheduled_jobs`
- `notifications`
- `search_documents`
- `webhooks`

V1 should keep the model understandable for operators and maintainers.
