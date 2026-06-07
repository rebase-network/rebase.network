# 管理后台数据模型

这个文件是后端数据模型的核心约束文档。

它只回答三类问题：

- 哪些建模前提长期成立
- 哪些状态、关系和约束不能被破坏
- 哪些规则直接影响 API、发布和运营流程

完整字段清单见 `docs/architecture/admin-data-model-fields.md`。

## 目标

为 Rebase 定制 admin 和 API 技术栈定义后端核心约束。

当前重点不是穷举所有可能字段，而是保持数据模型对实现、运营和发布都足够稳定、清晰。

## 建模前提

- 主键使用 UUID
- 公共 URL 使用稳定 slug，而不是内部 id
- 可发布实体必须显式持有工作流状态
- 媒体二进制文件存放在 R2，而不是 PostgreSQL
- 校验同时存在于应用层和数据库层
- GeekDaily 期目及其条目保持一等公民关系模型

## 核心状态

### 内容状态

- `draft`
- `published`
- `archived`

可选扩展：

- `scheduled`
- `in_review`

### 工作人员账号状态

- `invited`
- `active`
- `suspended`
- `disabled`

### 资源状态

- `uploaded`
- `active`
- `archived`
- `deleted`

## 模型分层

### 认证与访问控制

核心表：

- `users`
- `sessions`
- `accounts`
- `staff_accounts`
- `roles`
- `permissions`
- `staff_role_bindings`
- `role_permission_bindings`
- `audit_logs`

核心约束：

- 只有被 `staff_accounts` 接纳的用户可以进入 admin
- `staff_accounts.user_id` 必须唯一
- 角色与权限通过显式绑定表建模，不依赖隐式约定
- 敏感操作应有可追溯的 `audit_logs`

### 站点与单例

核心表：

- `site_settings`
- `home_page`
- `about_page`

核心约束：

- 它们是单例内容，而不是普通集合
- 对首页和页脚可见内容的引用只能指向已发布内容

### 媒体

核心表：

- `assets`

核心约束：

- 数据库只保存媒体元数据
- `object_key` 必须唯一
- 公共引用只应使用 active 资源

### 可发布内容

核心表：

- `articles`
- `jobs`
- `events`
- `contributors`
- `contributor_roles`
- `contributor_role_bindings`
- `geekdaily_episodes`
- `geekdaily_episode_items`

## 核心完整性约束

### 唯一性

- `articles.slug` 唯一
- `jobs.slug` 唯一
- `events.slug` 唯一
- `contributors.slug` 唯一
- `contributor_roles.slug` 唯一
- `geekdaily_episodes.slug` 唯一
- `geekdaily_episodes.episode_number` 唯一
- `geekdaily_episode_items (episode_id, sort_order)` 唯一
- `contributor_role_bindings` 中贡献者与角色的组合唯一

### 关系约束

- `geekdaily_episode_items` 外键指向 `geekdaily_episodes`
- 贡献者与角色通过绑定表关联，而不是靠自由文本
- 工作人员、角色与权限都通过显式关系表关联

### 发布时间与列表约束

- 只有 `published` 内容进入公共 API
- `archived` 内容只在 admin 中可见
- 发布顺序依赖 `published_at`、`sort_order` 或日期字段，不能依赖隐式插入顺序

### 业务约束

- 岗位发布前必须至少存在 `apply_url` 或 `contact_value`
- 当 `registration_mode = external` 时，活动必须存在 `registration_url`
- `events.end_at` 不能早于 `events.start_at`
- GeekDaily 期目在没有至少一个条目时不能发布
- contributor 在没有至少一个角色绑定时不应发布

## 最低索引基线

至少应建立这些索引：

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

## 当前明确延后的表

以下表只有在被现实需求证明之前才引入：

- `content_revisions`
- `scheduled_jobs`
- `notifications`
- `search_documents`
- `webhooks`

## 相关文档

- `docs/architecture/admin-data-model-fields.md`：完整字段附录
- `docs/product/content-model.md`：公共内容域、URL 与 RSS 规则
- `docs/architecture/admin-architecture.md`：写路径、权限与校验分层
