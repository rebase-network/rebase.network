# Rebase 社区网站

这个 monorepo 为 `rebase.network` 提供支持，包含：

- `apps/web`：面向读者的公共网站
- `apps/admin`：面向工作人员的管理工作台
- `apps/api`：公共与内部 API、认证和管理账号初始化
- `packages/*`：共享数据库、校验与类型能力

## 当前形态

Rebase 当前是一个内容驱动的社区网站，加上一套内部管理工作台。

关键事实：

- 读者无需登录
- 公共网站只读取已发布内容
- 所有写入都通过管理工作台和内部 API 完成
- GeekDaily 搜索、招聘详情页和 RSS 输出属于当前范围

## 快速开始

完整本地说明见 `docs/operations/local-development.md`。最快启动本地环境：

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

默认本地服务：

- 公共网站：`http://127.0.0.1:4321`
- 管理工作台：`http://127.0.0.1:5174`
- API：`http://127.0.0.1:8788`
- PostgreSQL：`127.0.0.1:55433`

## 常用入口

- `pnpm local:bootstrap`：初始化本地数据库、基础内容和管理账号
- `pnpm dev:stack`：同时运行公共网站、管理工作台和 API
- `pnpm test:smoke`：运行 smoke 检查

## 文档入口

- `docs/RUNBOOK.md`：开发、验证、发布和排障入口
- `docs/COMMAND-CARD.md`：常用命令速查
- `docs/README.md`：完整文档地图
- `docs/product/current-boundaries.md`：当前产品边界
- `docs/product/content-model.md`：公共内容域、URL 和 RSS 规则
- `docs/architecture/architecture.md`：系统级架构与部署事实
- `docs/operations/local-development.md`：本地开发
- `docs/operations/deployment.md`：部署手册
- `DESIGN.md`：设计文档入口
- `docs/archive/README.md`：历史文档归档说明
