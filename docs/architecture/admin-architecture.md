# 管理后台架构

## 目标

构建一个面向 Rebase 的管理工作台和 API，帮助社区工作人员可靠地维护内容。

这个管理后台不是通用的 CMS 外壳。

它是一个面向任务的内部产品，用于发布、策展和运营维护。

## 产品原则

- 优化工作人员工作流，而不是 table CRUD
- 公共网站对读者保持只读
- 所有写入都放在已认证的 admin API 之后
- 内容在发布前必须完成校验
- 优先使用显式工作流状态，而不是隐式约定
- 媒体、内容、认证和审计关注点保持分离
- 在适合的地方复用来自 TGO 定制 admin 的成熟技术模式

## 目标技术栈

- 公共网站：`apps/web` 中的 Astro
- admin 前端：`apps/admin` 中的 Vue
- admin 与公共 API：`apps/api` 中的 Hono
- 认证：Better Auth
- 数据库：PostgreSQL
- schema 与 migrations：`packages/db` 中的 Drizzle
- 共享 DTOs、enums 与校验辅助：`packages/shared`
- 媒体存储：Cloudflare R2

## 仓库结构

```text
apps/
  web/
  admin/
  api/
packages/
  db/
  shared/
  ui/
docs/
infra/
```

## 系统图

```text
读者浏览器
    |
    v
Cloudflare edge
    |
    v
公共 worker (`apps/web`)
    |
    v
`api.rebase.network`
    |
    v
Cloudflare Tunnel (`cloudflared`)
    |
    v
API 服务 (`apps/api`)
    |
    +--> PostgreSQL
    +--> R2

工作人员浏览器
    |
    v
Cloudflare edge
    |
    v
admin worker (`apps/admin`)
    |
    v
`api.rebase.network`
    |
    v
Cloudflare Tunnel (`cloudflared`)
    |
    v
API 服务 (`apps/api`)
    |
    +--> Better Auth
    +--> PostgreSQL
    +--> R2
```

## 运行时职责

### `apps/web`

- 渲染公开的 Rebase 网站
- 只消费已发布内容
- 永远不持有 admin 凭据
- 生成 feeds、sitemap、robots 和面向公众的 metadata
- 通过公共 API 获取数据，而不是直接读取数据库

### `apps/admin`

- 提供面向运营人员的工作台
- 按照 Rebase 的真实任务对内容分组，例如 GeekDaily、jobs、events 和 contributors
- 提供列表、编辑、预览、发布、归档以及具备审计意识的工作流
- 根据工作人员权限渲染导航

### `apps/api`

- 为所有写操作暴露已认证的 admin 路由
- 为网站暴露公共只读路由
- 集中处理校验、工作流状态流转、权限检查和审计日志
- 提供 health 与 readiness 端点用于部署检查

### `packages/db`

- 负责 PostgreSQL schema 定义
- 负责 migrations 与 seed 脚本
- 表达能够兜底应用层校验的数据库级约束

### `packages/shared`

- 存放共享 enums、DTOs、校验辅助、Markdown 辅助，以及 admin / public 契约
- 保持 admin 与 API 在字段结构和状态值上的一致

## 认证与访问模型

Better Auth 应负责：

- 用户身份
- session 签发与校验
- 密码重置及未来登录方式扩展

由应用自有表负责：

- 哪些用户属于工作人员
- 工作人员账号拥有哪些角色
- 某个角色授予哪些权限
- 哪些动作必须被审计

读者永远不需要认证。

只有工作人员使用 admin。

## 校验模型

每条写入路径都应由四层保护：

1. admin UI 中的表单校验
2. `apps/api` 中的 API 输入校验
3. 领域服务中的业务规则校验
4. `packages/db` 中的 PostgreSQL 约束

示例：

- GeekDaily 的 `episode_number` 必须唯一
- job 必须有 `apply_url` 或备用联系方式
- 采用外部报名的 event 必须包含 `registration_url`
- contributor 必须至少属于一个已发布角色

## 工作流状态

推荐的默认内容状态：

- `draft`
- `published`
- `archived`

后续可选扩展：

- `scheduled`
- `in_review`

首个可工作的版本应优先保证清晰的草稿、发布和归档行为，而不是复杂审批流。

## 媒体模型

工作人员管理的媒体使用 R2。

推荐的媒体流转方式：

1. admin 向 API 请求 upload intent
2. API 向 R2 签发已签名上传流程
3. admin 以 `alt text` 和资源用途等 metadata 完成上传收尾
4. 内容编辑者从媒体库中选择已有 assets

数据库应存储媒体 metadata，而不是二进制文件内容。

## 公共只读 API

公共网站应消费明确的已发布内容路由，例如：

- `/api/public/v1/site-config`
- `/api/public/v1/home`
- `/api/public/v1/about`
- `/api/public/v1/articles`
- `/api/public/v1/articles/:publicNumber`
- `/api/public/v1/jobs`
- `/api/public/v1/jobs/:publicNumber`
- `/api/public/v1/events`
- `/api/public/v1/events/:publicNumber`
- `/api/public/v1/contributors`
- `/api/public/v1/geekdaily`
- `/api/public/v1/geekdaily/:slug`
- `/api/public/v1/geekdaily/search`

这样可以让公共网站与仅限 admin 的模型和权限解耦。

## 审计与可观测性

敏感的 admin 操作应写入审计记录。

至少要审计：

- create
- update
- publish
- archive
- role changes
- staff changes
- media finalize 与 archive actions

推荐的运行时探针：

- 公共网站：`/healthz`
- API 存活检查：`/health`
- API 就绪检查：`/ready`
- 版本探针：`/version`

## 部署模型

稳定生产形态建议如下：

- `apps/web` 部署在 Cloudflare Worker 上，对应 `rebase.network` 与 `rebase.community`
- `apps/admin` 部署在独立的 Cloudflare Worker 上，对应 `admin.rebase.network`
- `apps/api` 运行在私有后端主机中的 Docker Compose
- PostgreSQL 运行在同一台私有后端主机中的 Docker Compose 栈里
- `cloudflared` 运行在私有后端主机上，通过 Cloudflare Tunnel 发布 `api.rebase.network`
- `media.rebase.network` 对应 R2 媒体

这样可以把公共前端和 admin 前端放在 edge，同时让可写后端留在服务器内部，而不向公网暴露 PostgreSQL。

生产设置索引见 `docs/operations/production-config.md`，运维手册见 `docs/operations/deployment.md`。

## 首个 admin 版本的非目标

- 复杂的多步骤审批引擎
- 协同实时编辑
- 内嵌可视化页面搭建器
- 成员自助资料编辑
- 生产环境中的通用 low-code schema 编辑
