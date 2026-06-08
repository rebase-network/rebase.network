# 开发与发布 Runbook

这份 runbook 用来帮助开发者和社区协作者最快进入 `rebase.network` 的开发、验证、发布和运维流程。

这个文件主要按场景说明“该怎么做”。
[COMMAND-CARD.md](./COMMAND-CARD.md) 提供可直接复制的命令速查。
更完整的细节说明放在 `docs/operations/*`。

## 仓库组成

- `apps/web`：面向读者的 Astro 公共网站
- `apps/admin`：Vue 管理工作台
- `apps/api`：公共与内部 API
- `packages/shared`：共享类型与校验逻辑
- `packages/db`：数据库 schema、migrations 和 seed 数据

## 1. 首次本地启动

1. 安装所需工具链。
2. 创建本地 `.env`。
3. 安装依赖。
4. 初始化本地栈。
5. 启动开发服务。

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.34.1 --activate
cp .env.example .env
pnpm install
pnpm local:bootstrap
pnpm dev:stack
```

本地访问地址：

- Public site: `http://127.0.0.1:4321`
- Admin: `http://127.0.0.1:5174`
- API: `http://127.0.0.1:8788`
- PostgreSQL: `127.0.0.1:55433`

如果沿用 `.env.example` 里的默认值，本地 admin 登录信息为：

- 邮箱：`admin@rebase.local`
- 密码：`RebaseAdmin123456!`

## 2. 日常开发

运行完整技术栈：

```bash
pnpm dev:stack
```

只运行公共网站和 API：

```bash
pnpm dev:public
```

只运行管理工作台和 API：

```bash
pnpm dev:ops
```

分别运行单个服务：

```bash
pnpm dev:web
pnpm dev:admin
pnpm dev:api
```

## 3. 常见改动流程

### 前端页面或内容页改动

1. 启动 `pnpm dev:public` 或 `pnpm dev:stack`。
2. 完成改动。
3. 在浏览器里检查受影响路由。
4. 运行：

```bash
pnpm lint
pnpm typecheck
```

5. 如果受影响路由在 smoke 覆盖范围内，再运行：

```bash
pnpm test:smoke
```

### 管理工作台改动

1. 启动 `pnpm dev:ops` 或 `pnpm dev:stack`。
2. 完成改动。
3. 在浏览器里检查受影响的列表页或编辑页。
4. 运行：

```bash
pnpm typecheck:admin
```

5. 如果改动会影响生产构建产物，再运行：

```bash
pnpm build:admin
```

### API、数据库或共享契约改动

1. 启动本地栈。
2. 完成改动。
3. 运行：

```bash
pnpm typecheck:api
pnpm build:api
```

4. 如果 schema 或 seed 行为发生变化，再运行：

```bash
pnpm db:migrate
pnpm db:seed
```

5. 如果改动还影响公共页面或管理流程，也要在浏览器里补测这些路径。

## 4. Push 前检查

按改动范围选择最小必要验证集：

- 公共网站改动：`pnpm lint` 和 `pnpm typecheck`
- 管理工作台改动：`pnpm typecheck:admin`
- API / shared / db 改动：`pnpm typecheck:api` 和 `pnpm build:api`
- 路由级回归风险：`pnpm test:smoke`

如果改动会影响生产构建产物，还要补跑对应构建：

- `pnpm build:web:prod`
- `pnpm build:admin`
- `pnpm build:api`

## 5. 前端发布流程

默认生产前端发布路径：

1. 在 `dev` 上完成开发和验证。
2. Push `dev`。
3. 发起并合并 `dev` 到 `main` 的 Pull Request。
4. 等待 Cloudflare 部署 `rebase-web` 和 / 或 `rebase-admin`。
5. 执行发布后检查。

相关 dry-run 命令：

```bash
pnpm deploy:web:dry-run
pnpm deploy:admin:dry-run
```

不要把本地 `wrangler deploy` 当成默认生产发布路径。

## 6. 后端发布流程

默认生产后端发布路径：

1. 将后端改动合并到 `main`。
2. 把部署机更新到目标 `main` commit。
3. 确认工作树干净。
4. 优先使用：

```bash
./ops/manage.sh rollout api
```

5. 执行发布后检查。

如果涉及 Compose 级改动，使用：

```bash
./ops/manage.sh deploy stack
```

## 7. 生产运维

检查远端主机和运行中的服务：

```bash
./ops/manage.sh check
./ops/manage.sh ps
```

检查 API 健康状态：

```bash
./ops/manage.sh health
./ops/manage.sh ready
```

查看日志：

```bash
./ops/manage.sh logs api 200
./ops/manage.sh db logs 200
```

在高风险操作前先做数据库备份：

```bash
./ops/manage.sh db backup
./ops/manage.sh db list-backups
```

导出数据用于排查或审查：

```bash
./ops/manage.sh db export articles
./ops/manage.sh db export-query "select count(*) from geekdaily_episodes;"
```

## 8. 常见本地恢复操作

只重启 PostgreSQL：

```bash
pnpm db:down
pnpm db:up
pnpm db:logs
```

修改 `.env` 后刷新本地 admin 凭据：

```bash
pnpm admin:bootstrap
```

重新注入本地内容 seed 数据：

```bash
pnpm db:seed
```

如果包管理器解析出了问题，重新启用 Corepack 并激活固定版本的 pnpm：

```bash
corepack enable
corepack prepare pnpm@10.34.1 --activate
```

## 9. 详细参考

- 本地开发：[`docs/operations/local-development.md`](./operations/local-development.md)
- 质量保障：[`docs/operations/quality-assurance.md`](./operations/quality-assurance.md)
- 部署手册：[`docs/operations/deployment.md`](./operations/deployment.md)
- 生产配置：[`docs/operations/production-config.md`](./operations/production-config.md)
- 上线检查清单：[`docs/operations/launch-checklist.md`](./operations/launch-checklist.md)
