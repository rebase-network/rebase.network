# 本地开发

本文档只覆盖默认的本地工作流。生产运维见 `docs/operations/deployment.md`、`docs/operations/production-config.md` 和 `docs/operations/launch-checklist.md`。

## 本地技术栈

当前本地技术栈如下：

- `infra/postgres/docker-compose.yml` 中的 Docker PostgreSQL
- `apps/api` 中的 Hono API
- `apps/admin` 中的 Vue 管理工作台
- `apps/web` 中的 Astro 公共网站
- `packages/shared` 中的共享校验与契约
- `packages/db` 中的 Drizzle schema、migrations 与初始化数据

公共网站现在运行在 Astro server mode，因此已发布内容的变更会在下一次请求时出现，而不必等待完整静态重建。

对于本地 `astro dev`，仓库会有意跳过 Cloudflare adapter，转而使用 Astro 默认 dev server，以避免 Miniflare 特有的启动问题。生产 Worker 设置见 `docs/operations/production-config.md`。

## 一次性初始化

推荐的本地工具链：

- Node：通过 `nvm` 使用 `22.21.1`
- package manager：`pnpm@10.6.5`
- package manager launcher：`corepack`

仓库提示：

- `.nvmrc` 固定了推荐的本地 Node 版本
- `package.json` 通过 `packageManager` 字段固定了 `pnpm@10.6.5`

建议的首次初始化：

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.6.5 --activate
pnpm install
```

1. 将 `.env.example` 复制为 `.env`
2. 通过 `pnpm install` 安装依赖
3. 运行：

```bash
pnpm local:bootstrap
```

`pnpm local:bootstrap` 会：

- 启动 PostgreSQL
- 等待数据库容器进入健康状态
- 应用 Drizzle migrations
- 注入基础站点内容和 GeekDaily 归档
- 初始化默认本地 admin 账号

## 本地 Admin 账号

`pnpm local:bootstrap` 与 `pnpm admin:bootstrap` 会从 `.env` 读取本地 admin 身份：

- `DEV_ADMIN_EMAIL`
- `DEV_ADMIN_PASSWORD`
- `DEV_ADMIN_NAME`

如果你沿用 `.env.example` 中的值，默认本地运营账号为：

- email：`admin@rebase.local`
- password：`RebaseAdmin123456!`
- display name：`Rebase Super Admin`

如果你之后修改了这些值，请重新运行：

```bash
pnpm admin:bootstrap
```

这会刷新 admin 工作台使用的凭据登录和本地 staff profile。

## Node 与 Package Manager 约定

这个仓库预期：

- `node` 来自 `nvm`
- `pnpm` 版本与 `package.json` 中固定的版本一致
- `corepack` 是激活该 `pnpm` 版本的标准方式

快速检查：

```bash
which node
node -v
which pnpm
pnpm -v
```

健康输出应表现为：

- `node` 解析到 `~/.nvm/versions/node/...`
- `pnpm` 解析到当前激活的同一套 Node 安装，而不是 `/usr/local/bin/pnpm`

如果机器上残留了旧的全局 shim，导致 `pnpm` 不可用，可按如下方式恢复：

```bash
rm -f /usr/local/bin/pnpm /usr/local/bin/pnpx
hash -r
corepack enable
corepack prepare pnpm@10.6.5 --activate
hash -r
```

然后重新检查：

```bash
which pnpm
pnpm -v
```

如果你只需要临时绕过问题，也可以直接通过 Corepack 运行命令：

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm build:admin:prod
```

## 日常开发命令

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

运行单个服务：

- `pnpm dev:web`
- `pnpm dev:admin`
- `pnpm dev:api`

## 本地端口

- 公共网站：`http://127.0.0.1:4321`
- admin：`http://127.0.0.1:5174`
- API：`http://127.0.0.1:8788`
- PostgreSQL：`127.0.0.1:55433`

## 实用维护命令

- `pnpm db:up`：仅启动 PostgreSQL
- `pnpm db:down`：停止 PostgreSQL
- `pnpm db:logs`：查看 PostgreSQL 日志
- `pnpm db:migrate`：应用 Drizzle migrations
- `pnpm db:seed`：重新注入基础内容，并在存在 `geekdaily.csv` 时加载 GeekDaily 归档
- `pnpm admin:bootstrap`：重新创建或刷新默认本地运营账号
- `pnpm build:api`：构建 API bundle
- `pnpm build:admin`：构建管理工作台
- `pnpm typecheck:api`：对 API 做 typecheck
- `pnpm typecheck:admin`：对管理工作台做 typecheck
- `pnpm test:smoke`：运行 Playwright smoke checks

## GeekDaily 归档导入输入

`geekdaily.csv` 是一个归档备份文件，在需要时用于初始化 GeekDaily 历史。

如果你拥有归档版或更新版的 `geekdaily.csv`，可重新运行 seed 步骤，将 GeekDaily 历史重新导入本地数据库：

```bash
pnpm db:seed
```

如果该文件不存在，`pnpm db:seed` 仍会成功完成，并跳过 GeekDaily 归档导入。
