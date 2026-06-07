# 管理后台数据模型

## 目标

为 Rebase 定制 admin 和 API 技术栈定义后端 tables 与约束。

这个模型聚焦稳定的 V1 内容运营，而不是推测性的未来复杂度。

## 建模原则

- 主键使用 UUID
- 公共 URL 使用稳定的 slug，而不是内部 id
- 可发布实体的工作流状态必须显式存在
- 上传的二进制文件存放在 R2，而不是 PostgreSQL
- 校验同时属于应用层和数据库层
- GeekDaily 期目条目应拥有一等公民式的关系记录

## 核心状态 Enums

推荐的内容状态：

- `draft`
- `published`
- `archived`

后续可选扩展：

- `scheduled`
- `in_review`

推荐的工作人员账号状态：

- `invited`
- `active`
- `suspended`
- `disabled`

推荐的资源状态：

- `uploaded`
- `active`
- `archived`
- `deleted`

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

约束说明：

- `user_id` 唯一

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

全局站点配置。

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

首页专属结构。

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

仅存储媒体 metadata。

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

约束说明：

- `object_key` 唯一

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

约束说明：

- `slug` 唯一

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

约束说明：

- `slug` 唯一
- 应用逻辑必须要求至少存在 `apply_url` 或 `contact_value`
- 职责范围与岗位说明保存在 `description_markdown`

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

约束说明：

- `slug` 唯一
- 当 `registration_mode = external` 时，应用逻辑应要求 `registration_url`
- 数据库检查应强制 `end_at >= start_at`

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

约束说明：

- `slug` 唯一

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

约束说明：

- `slug` 唯一

### `contributor_role_bindings`

`contributors` 与 `contributor_roles` 之间的多对多关系。

约束说明：

- `contributor` 与 `role` 的组合唯一

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

约束说明：

- `slug` 唯一
- `episode_number` 唯一

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

约束说明：

- `episode_id` 与 `sort_order` 的组合唯一
- 外键指向 `geekdaily_episodes`

## 建议索引

至少应建立以下索引：

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

## API 关键业务规则

数据模型应直接或间接支持以下规则：

- 只有 `published` 内容会进入公共 API
- 已归档内容只在 admin 中可见
- 一个 GeekDaily 期目在没有至少一个条目时不能发布
- contributor 在没有至少一个角色绑定时不应发布
- 首页与页脚的引用只能指向已发布内容
- 媒体引用只能使用 active assets

## 可以延后的未来表

以下 tables 明确延后，只有在有充分理由时再加入：

- `content_revisions`
- `scheduled_jobs`
- `notifications`
- `search_documents`
- `webhooks`

V1 应保持模型对运营人员和维护者都易于理解。
