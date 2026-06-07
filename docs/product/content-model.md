# 内容模型

## 目标

Rebase 内容模型应支持：

- 结构化的社区内容
- 简洁的运营工作流
- 可扩展的 GeekDaily 组织方式
- 稳定的公共 URL
- 一套编辑有意义编辑对象而非原始 tables 的定制 admin 体验

## 编辑格式

使用：

- 结构化字段承载元数据和结构化页面分区
- Markdown 承载长文本内容字段

推荐由 Markdown 支撑的字段包括：

- 按需使用的 `about_page` 分区
- `articles.body`
- `events.body`
- `jobs.description`
- `geekdaily_episodes.body`

详细的后端 schema 说明见 `docs/architecture/admin-data-model.md`。

本文聚焦公共内容域与 URL 行为。

## URL 约定

### 全局规则

- URL 使用小写
- 单词之间使用 `-`
- 公共 URL 避免中文字符
- 除站点根路径外，canonical URLs 不使用尾随斜杠
- 已发布 URL 应保持稳定

### 公共路由

- 首页：`/`
- About：`/about`
- `who-is-hiring`：`/who-is-hiring`
- 招聘详情：`/who-is-hiring/{public-number}-{slug}`
- GeekDaily 列表：`/geekdaily`
- GeekDaily 详情：`/geekdaily/geekdaily-{episode-number}`
- 站点 RSS：`/rss.xml`
- 招聘 RSS：`/who-is-hiring/rss.xml`
- GeekDaily RSS：`/geekdaily/rss.xml`
- 文章列表：`/articles`
- 文章详情：`/articles/{public-number}-{slug}`
- 文章 RSS：`/articles/rss.xml`
- 活动列表：`/events`
- 活动详情：`/events/{public-number}-{slug}`
- 活动 RSS：`/events/rss.xml`
- 贡献者：`/contributors`

### Query Parameters

GeekDaily 示例：

- `/geekdaily?q=agent`
- `/geekdaily?tag=ai`
- `/geekdaily?year=2026`
- `/geekdaily?page=2`

`Who-Is-Hiring` 示例：

- `/who-is-hiring?q=frontend`
- `/who-is-hiring?location=shanghai`
- `/who-is-hiring?mode=remote`

## 公共内容域

### `site_settings`

全局站点配置的单例。

建议字段：

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

首页编辑结构的单例。

建议字段：

- `hero_title`
- `hero_summary`
- `hero_primary_cta_label`
- `hero_primary_cta_url`
- `hero_secondary_cta_label`
- `hero_secondary_cta_url`
- `home_signals`
- `home_stats`

### `about_page`

About 内容的单例。

建议字段：

- `title`
- `summary`
- `sections`
- `seo_title`
- `seo_description`

### `jobs`

展示在 `Who-Is-Hiring` 页面中的社区招聘条目。

建议字段：

- `company_name`
- `role_title`
- `slug`
- `salary`
- `supports_remote`
- `location`
- `work_mode`
- `summary`
- `description`
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

说明：

- 公共路径应使用 `/who-is-hiring/{public-number}-{slug}`
- `slug` 在发布后应保持稳定
- `description` 应支持 Markdown
- 职责与岗位范围应直接写在 `description` 中
- 在发布前必须至少存在 `apply_url` 或联系方式之一

### `articles`

社区发布的公共文章。

建议字段：

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

Slug 规则：

- 具备语义
- 使用小写
- 发布后保持稳定

### `events`

用于公共列表和详情页的社区活动。

建议字段：

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
- `status`
- `published_at`
- `seo_title`
- `seo_description`

URL 规则：

- 公共路径使用 `/events/{public-number}-{slug}`
- `slug` 一旦发布应保持稳定

### `contributor_roles`

用于分组 contributors 的角色。

建议字段：

- `name`
- `slug`
- `description`
- `sort_order`

示例：

- `volunteers`
- `geekdaily-advisors`

### `contributors`

按角色展示的社区贡献者。

建议字段：

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
- `activity_status`

V1 中 contributor 活跃状态通过人工维护：

- `active`：当前仍参与，并在公共列表中优先显示
- `inactive`：历史贡献者，仍公开可见，但排序位于活跃贡献者之后

公共 contributors 页面不应刻意抬高某一个代表性成员。同一角色下的 contributors 以平级方式展示，而 `inactive` contributors 可以在 UI 中带一个轻量的 `历史贡献者` 标签。

V1 只要求公共列表页，不要求单独的 contributor 详情页。

### `geekdaily_episodes`

GeekDaily 的核心期目记录。

建议字段：

- `episode_number`
- `slug`
- `title`
- `summary`
- `body`
- `published_at`
- `tags`
- `status`

公共路由：

- `/geekdaily/geekdaily-{episode-number}`

### `geekdaily_episode_items`

期目中的有序推荐条目。

建议字段：

- `episode_id`
- `sort_order`
- `title`
- `author_name`
- `source_url`
- `summary`

## RSS 规则

- 所有 feeds 只包含已发布内容
- 全站 feed 应聚合核心内容类型中最新的 3 条公共内容
- GeekDaily feed items 应使用期目页面
- 招聘 feed items 应使用公开招聘详情页
- feed descriptions 应遵循先前约定的 summary / body 规则
