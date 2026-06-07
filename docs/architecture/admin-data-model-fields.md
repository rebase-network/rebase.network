# 管理后台数据模型字段附录

这个文件是 `docs/architecture/admin-data-model.md` 的字段附录。

它只记录完整字段清单和字段级建议，不负责解释哪些约束是当前必须成立的核心规则。核心规则见 `docs/architecture/admin-data-model.md`。

## 认证与访问控制表

### `users`

由 Better Auth 持有的身份记录。

### `sessions`

由 Better Auth 持有的 session 记录。

### `accounts`

由 Better Auth 持有的认证提供方记录。

### `staff_accounts`

定义哪些已认证用户可以进入 Rebase admin。

建议字段：

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

### `roles`

建议字段：

- `id`
- `code`
- `name`
- `description`
- `is_system`
- `created_at`
- `updated_at`

### `permissions`

建议字段：

- `id`
- `code`
- `name`
- `resource`
- `action`
- `created_at`
- `updated_at`

### `staff_role_bindings`

`staff_accounts` 与 `roles` 之间的多对多关系。

### `role_permission_bindings`

`roles` 与 `permissions` 之间的多对多关系。

### `audit_logs`

建议字段：

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

## 站点与单例表

### `site_settings`

建议字段：

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

建议字段：

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

建议字段：

- `id`
- `title`
- `summary`
- `sections_json`
- `seo_title`
- `seo_description`
- `updated_by_staff_id`
- `created_at`
- `updated_at`

## 媒体表

### `assets`

建议字段：

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

## 可发布内容表

### `articles`

建议字段：

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

### `jobs`

建议字段：

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

### `events`

建议字段：

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
- `tags_json`
- `status`
- `published_at`
- `seo_title`
- `seo_description`
- `updated_by_staff_id`
- `created_at`
- `updated_at`

### `contributor_roles`

建议字段：

- `id`
- `slug`
- `name`
- `description`
- `sort_order`
- `status`
- `created_at`
- `updated_at`

### `contributors`

建议字段：

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

### `contributor_role_bindings`

`contributors` 与 `contributor_roles` 之间的多对多关系。

### `geekdaily_episodes`

建议字段：

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

### `geekdaily_episode_items`

建议字段：

- `id`
- `episode_id`
- `sort_order`
- `title`
- `author_name`
- `source_url`
- `summary`
- `created_at`
- `updated_at`
