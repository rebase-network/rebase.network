# 内容模型

这个文件是公共内容形态的事实来源。

它回答的是：

- 公共网站有哪些内容域
- 这些内容域如何映射到公共 URL
- 哪些公共约束会影响页面、RSS 和搜索

它不负责记录完整后端字段全集。后端核心约束见 `docs/architecture/admin-data-model.md`，完整字段附录见 `docs/architecture/admin-data-model-fields.md`。

## 内容编辑格式

当前内容编辑默认采用两类结构：

- 结构化字段：用于标题、摘要、状态、时间、排序、关系和页面装配
- Markdown：用于长正文内容

Markdown 主要用于：

- `about_page` 正文分区
- `articles.body`
- `events.body`
- `jobs.description`
- `geekdaily_episodes.body`

## 公共 URL 规则

### 全局规则

- 公共 URL 使用小写
- 单词之间使用 `-`
- 公共 URL 避免中文字符
- 除站点根路径外，canonical URLs 不使用尾随斜杠
- 已发布 URL 保持稳定

### 当前公共路由

- 首页：`/`
- About：`/about`
- 招聘列表：`/who-is-hiring`
- 招聘详情：`/who-is-hiring/{public-number}-{slug}`
- GeekDaily 列表：`/geekdaily`
- GeekDaily 详情：`/geekdaily/geekdaily-{episode-number}`
- 文章列表：`/articles`
- 文章详情：`/articles/{public-number}-{slug}`
- 活动列表：`/events`
- 活动详情：`/events/{public-number}-{slug}`
- 贡献者列表：`/contributors`

### 当前发现类输出

- 全站 RSS：`/rss.xml`
- GeekDaily RSS：`/geekdaily/rss.xml`
- 文章 RSS：`/articles/rss.xml`
- 活动 RSS：`/events/rss.xml`
- 招聘 RSS：`/who-is-hiring/rss.xml`
- `robots.txt`
- `sitemap.xml`

## 公共内容域

### `site_settings`

站点级全局配置。

公共职责：

- 定义站点名、描述、主域名和媒体域名
- 提供社交链接与页脚分组

### `home_page`

首页单例内容。

公共职责：

- 定义首页首屏区
- 定义首页信号区和统计区
- 定义首页的主要入口引导

### `about_page`

About 单例内容。

公共职责：

- 提供页面标题、摘要和正文分区
- 支持长文阅读与基础 SEO 信息

### `jobs`

公开招聘条目。

公共约束：

- 公共路径使用 `/who-is-hiring/{public-number}-{slug}`
- `slug` 在发布后保持稳定
- 发布前必须至少存在 `apply_url` 或可替代联系方式
- 职责与岗位范围写入正文描述，而不是分散成噪音字段

### `articles`

公开文章条目。

公共约束：

- 公共路径使用 `/articles/{public-number}-{slug}`
- `slug` 在发布后保持稳定
- 文章应具备标题、摘要、正文、作者与可选封面

### `events`

公开活动条目。

公共约束：

- 公共路径使用 `/events/{public-number}-{slug}`
- `slug` 在发布后保持稳定
- 外部报名活动必须有 `registration_url`
- 当前系统只支持外部报名链接，不支持站内报名表单

### `contributor_roles`

贡献者分组角色。

公共职责：

- 定义贡献者在公共页面上的分组方式与排序方式

### `contributors`

公开贡献者资料。

公共约束：

- 贡献者按角色分组显示
- 同一角色下的贡献者以平级方式展示
- 当前只要求公开列表，不要求独立详情页

### `geekdaily_episodes`

GeekDaily 的公开期目记录。

公共约束：

- 公共路径使用 `/geekdaily/geekdaily-{episode-number}`
- `episode_number` 必须稳定且唯一
- 搜索面向期目，而不是面向单条条目页面

### `geekdaily_episode_items`

期目中的有序推荐条目。

公共职责：

- 为期目提供排序后的外部来源、标题和摘要
- 不单独生成公开详情页

## 当前查询参数

### GeekDaily

- `/geekdaily?q=agent`
- `/geekdaily?tag=ai`
- `/geekdaily?year=2026`
- `/geekdaily?page=2`

### `Who-Is-Hiring`

- `/who-is-hiring?q=frontend`
- `/who-is-hiring?location=shanghai`
- `/who-is-hiring?mode=remote`

## RSS 规则

- 所有 RSS 只包含已发布内容
- 全站 RSS 聚合核心内容类型中的最新公共内容
- GeekDaily RSS 以期目为单位，而不是以条目为单位
- 招聘 RSS 指向公开招聘详情页，而不是外部申请链接
- feed 描述遵循当前 summary / body 约定

## 搜索边界

当前明确在范围内的站内搜索只有 GeekDaily 搜索。

搜索应主要覆盖：

- 期号
- 标题
- 摘要
- 标签
- 日期
- 期目条目标题

## 相关文档

- `docs/product/current-boundaries.md`：当前仍然生效的产品边界
- `docs/architecture/admin-data-model.md`：后端核心约束
- `docs/architecture/admin-data-model-fields.md`：完整字段附录
- `docs/architecture/architecture.md`：系统级运行时与部署事实
