# Rebase 社区网站

这个 monorepo 为 `rebase.network` 提供支持，包含对外的社区网站、内部管理工作台，以及同时服务两者的后端服务。

## 项目概览

这个仓库将产品的四个部分集中在同一个地方：

- 面向读者的公共网站，位于 `apps/web`
- 面向编辑和运营人员的定制化管理工作台，位于 `apps/admin`
- 位于 `apps/api` 的 API 与认证服务
- 位于 `packages/*` 的共享数据库、校验与 UI 包

## V1 重点

Rebase V1 明确采用内容优先策略。

- 读者无需登录
- 工作人员通过专门构建的管理工作台处理工作
- GeekDaily 搜索属于范围内功能
- GeekDaily 详情页使用 `/geekdaily/geekdaily-{episode-number}`
- 迁移期间，GeekDaily 标题默认使用 `极客日报#{episode-number}`
- 招聘详情页与招聘 RSS 属于范围内功能
- V1 中每个 RSS feed 仅发布最新 3 条内容
- 活动报名不在范围内

## 技术快照

当前技术栈如下：

- 公共网站使用 Astro
- 管理工作台使用 Vue
- API 运行时使用 Hono
- 认证使用 Better Auth
- 数据与迁移使用 PostgreSQL 和 Drizzle
- 运行时与媒体存储使用 Cloudflare Workers 和 R2

## 快速开始

完整的本地搭建指南见 `docs/operations/local-development.md`。最快启动本地环境的方式如下：

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.6.5 --activate
cp .env.example .env
pnpm install
pnpm local:bootstrap
pnpm dev:stack
```

这些命令会：

- 启动本地 PostgreSQL
- 应用 Drizzle migrations
- 注入基础内容和归档数据
- 初始化本地管理账号
- 同时运行公共网站、管理工作台和 API

本地服务地址：

- 公共网站：`http://127.0.0.1:4321`
- 管理工作台：`http://127.0.0.1:5174`
- API：`http://127.0.0.1:8788`
- PostgreSQL：`127.0.0.1:55433`

如果你需要默认的本地管理账号凭据，或想覆盖默认值，请查看 `docs/operations/local-development.md`。

## 常用命令

- `pnpm local:bootstrap`：从数据库启动到管理账号初始化，准备完整本地环境
- `pnpm dev:stack`：同时运行 API、admin 和 web
- `pnpm dev:public`：运行 API 和公共网站
- `pnpm dev:ops`：运行 API 和管理工作台
- `pnpm dev:web`：仅运行 Astro 公共网站
- `pnpm dev:admin`：仅运行 Vue 管理工作台
- `pnpm dev:api`：仅运行 Hono API
- `pnpm db:migrate`：应用 Drizzle migrations
- `pnpm db:seed`：重新注入基础内容，并在可用时导入 `geekdaily.csv`
- `pnpm admin:bootstrap`：重新创建或刷新本地管理账号
- `pnpm test:smoke`：运行 Playwright smoke checks

## 仓库结构

- `apps/web`：公共网站
- `apps/admin`：内部管理工作台
- `apps/api`：API、认证与管理账号初始化脚本
- `packages/db`：schema、migrations 与 seed 数据
- `packages/shared`：共享校验与契约
- `packages/types`：共享类型
- `infra/postgres`：本地 PostgreSQL 容器配置
- `infra/production`：生产部署配置
- `scripts/local`：本地开发脚本
- `tests/smoke`：Playwright smoke 覆盖

## 文档索引

建议从这里开始：

- `README.md`：仓库概览与贡献者快速开始
- `DESIGN.md`：仓库级设计文档索引
- `docs/README.md`：仓库级文档地图
- `docs/operations/local-development.md`：本地搭建、命令与归档导入说明
- `docs/product/current-boundaries.md`：当前仍然生效的产品边界

产品与交付：

- `docs/product/current-boundaries.md`：当前产品边界与明确非目标
- `docs/product/content-model.md`：公共内容域、字段规则与 URL 约定
- `docs/product/acceptance-criteria.md`：当前验收基线
- `docs/operations/quality-assurance.md`：开发期验证方式与检查基线
- `docs/archive/README.md`：历史文档归档说明

架构与管理系统：

- `docs/architecture/architecture.md`：系统架构、部署、缓存与运行时决策
- `docs/architecture/admin-architecture.md`：定制 admin、API、认证与媒体架构
- `docs/architecture/admin-information-architecture.md`：运营人员工作流与管理模块结构
- `docs/architecture/admin-data-model.md`：后端表、工作流状态与关键校验约束
