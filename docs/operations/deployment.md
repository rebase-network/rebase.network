# 部署手册

这是生产环境运维手册。设置项见 `docs/operations/production-config.md`，发布验证见 `docs/operations/launch-checklist.md`。

## 核心规则

- 日常工作保持在 `dev`
- release candidate 通过 Pull Request 从 `dev` 进入 `main`
- 当前端生产发布时，由 Cloudflare 在检测到 `main` 更新后自动发布
- 后端生产发布是手动的，且必须从目标 `main` commit 部署
- 本地 `wrangler deploy` 不是常规生产路径
- SSH 示例使用 `rebase@rebase.host`；运维机器必须通过本地 hosts 或内网 DNS 把 `rebase.host` 解析到后端服务器

## 场景 1：初始部署

### 1. 配置 Cloudflare 前端项目

使用 `docs/operations/production-config.md` 中的当前值配置前端 Workers。

首次上线至少确认：

- `rebase-web` 和 `rebase-admin` 已连接到 GitHub 仓库
- 生产分支为 `main`
- 已挂载自定义域名
- 所需的 Cloudflare 托管配置值已存在

### 2. 准备后端服务器

将仓库同步到服务器：

```bash
./ops/manage.sh sync
```

在服务器上创建生产环境文件：

```bash
ssh rebase@rebase.host
cd /home/rebase/rebase.network
cp infra/production/server.env.example infra/production/server.env
```

填入 `docs/operations/production-config.md` 中列出的后端和 R2 必填值。

生产环境的 R2 模式应使用兼容 S3 的凭据，并将 `R2_DEV_USE_WRANGLER=false`。

### 3. 部署后端栈

```bash
./ops/manage.sh deploy stack
```

仅针对首次生产数据库：

```bash
./ops/manage.sh seed
./ops/manage.sh bootstrap-admin
```

### 4. 验证首次上线

执行 `docs/operations/launch-checklist.md` 中的 `Initial Launch Only`、`Route Checks` 和相关 `Functional Checks` 分区。

## 场景 2：发布

选择与当前改动集匹配的最小发布路径。

### 仅前端发布

1. 在 `dev` 上验证变更
2. push `dev`
3. 发起并合并 `dev` -> `main` 的 Pull Request
4. 等待 Cloudflare 部署 `rebase-web` 和 / 或 `rebase-admin`
5. 执行 `docs/operations/launch-checklist.md` 中相关检查

### 仅后端发布

1. 将后端改动合并到 `main`
2. 把部署机更新到对应的 `main` commit
3. 确认工作树干净
4. 对于 API 或 schema 变更，优先使用 `./ops/manage.sh rollout api`；只有在你明确不需要 backup + migrate 流程时才使用 `./ops/manage.sh deploy api`
5. 执行 `docs/operations/launch-checklist.md` 中相关检查

后端部署前推荐先做本地检查：

```bash
git checkout main
git pull --ff-only
git status --short
git rev-parse --short HEAD
```

### 全栈发布

1. 在 `dev` 上验证
2. push `dev` 并发起 `dev` -> `main` 的 Pull Request
3. 合并到 `main`
4. 等待 Cloudflare 前端部署完成
5. 把部署机更新到对应的 `main` commit
6. 对包含 API 或 schema 的后端改动，优先使用 `./ops/manage.sh rollout api`；如果 Compose 级服务也发生变化，则使用 `./ops/manage.sh deploy stack`
7. 执行 `docs/operations/launch-checklist.md` 中相关检查

## 场景 3：维护

### 常用命令

```bash
./ops/manage.sh check
./ops/manage.sh health
./ops/manage.sh rollout api
./ops/manage.sh deploy api
./ops/manage.sh deploy stack
./ops/manage.sh ps
./ops/manage.sh logs api 200
./ops/manage.sh ready
./ops/manage.sh db query "select count(*) from geekdaily_episodes;"
./ops/manage.sh db backup
./ops/manage.sh db list-backups
./ops/manage.sh db export articles
```

### 命令说明

| 命令 | 用途 |
| --- | --- |
| `./ops/manage.sh check` | 校验主机、compose 文件、env 文件和运行中服务 |
| `./ops/manage.sh health` | 从服务器侧验证 API 存活 |
| `./ops/manage.sh rollout api` | 创建数据库 backup、部署 API、运行数据库 migrations 并验证 readiness |
| `./ops/manage.sh deploy api` | 部署 API 及共享包变更 |
| `./ops/manage.sh deploy stack` | 部署 Compose 级或全栈变更 |
| `./ops/manage.sh logs api 200` | 查看 API 日志 |
| `./ops/manage.sh ready` | 从服务器侧验证 API readiness |
| `./ops/manage.sh db backup` | 创建远端 PostgreSQL backup |
| `./ops/manage.sh db download <remote-path> [local-path]` | 把远端 backup 或 export 下载到本地机器 |
| `./ops/manage.sh db list-backups` | 列出远端 PostgreSQL backup 文件 |
| `./ops/manage.sh db list-exports` | 列出远端 CSV export 文件 |
| `./ops/manage.sh db export <table> [remote-path]` | 将 PostgreSQL table 导出到远端 CSV 文件 |
| `./ops/manage.sh db export-query "<select ...>" [remote-path]` | 导出查询结果到远端 CSV 文件 |

### 推荐的 backup 与 export 流程

常规操作请按以下顺序执行：

1. 在有风险的 schema 或数据操作前，运行 `./ops/manage.sh db backup`
2. 用 `./ops/manage.sh db list-backups` 确认新 backup 已生成
3. 如果 backup 需要脱离服务器长期保存，用 `./ops/manage.sh db download <remote-path> [local-path]` 拉到本地
4. 表级导出使用 `./ops/manage.sh db export <table>`，一次性报表或审查使用 `./ops/manage.sh db export-query "<select ...>"`
5. 任意 export 之后，使用 `./ops/manage.sh db list-exports` 检查；如果需要本地副本，再执行 `./ops/manage.sh db download <remote-path> [local-path]`

把服务器端的 backups 和 exports 视为只读运维产物。不要通过临时 restore 步骤覆盖生产数据。

### 推荐的 API rollout

对大多数涉及运行时代码或 Drizzle migrations 的后端发布，使用：

```bash
./ops/manage.sh rollout api
```

它会执行默认的生产安全流程：

1. 创建远端 PostgreSQL backup
2. 部署 API 容器
3. 在 API 容器内运行数据库 migrations
4. 验证 `/ready`

### 常见 `export-query` 示例

```bash
./ops/manage.sh db export-query \
  "select id, display_name, status, created_at from staff_accounts order by created_at desc" \
  exports/staff_accounts.csv

./ops/manage.sh db export-query \
  "select slug, title, status, published_at from articles order by published_at desc nulls last" \
  exports/articles-latest.csv

./ops/manage.sh db export-query \
  "select episode_number, slug, status, published_at from geekdaily_episodes order by episode_number desc limit 100" \
  exports/geekdaily-latest.csv
```

### 本地验证命令

前端发布检查：

```bash
pnpm install --frozen-lockfile
pnpm --filter @rebase/web check
pnpm build:web:prod
pnpm build:admin:prod
```

部署路径检查：

```bash
pnpm deploy:web:dry-run
pnpm deploy:admin:dry-run
pnpm deploy:server:config
```

### 故障处理

前端故障：

1. 查看 Cloudflare 构建日志
2. 用 `pnpm build:web:prod`、`pnpm build:admin:prod` 或对应的 `*:dry-run` 命令在本地复现
3. 检查 `docs/operations/production-config.md` 中的 Cloudflare 配置
4. 只有在明确的紧急情况下才手动使用 `wrangler deploy`，并把它记录进 release notes

常见 Cloudflare 特定故障：

- `ERR_PNPM_OUTDATED_LOCKFILE`：运行 `pnpm install`，提交更新后的 `pnpm-lock.yaml`，然后在 push 前本地重新执行 `pnpm install --frozen-lockfile`
- 兼容性日期不匹配：让 `apps/web/astro.config.mjs` 与 `apps/web/wrangler.template.jsonc` 保持一致，避免 Cloudflare adapter 漂移到隐式未来日期
- 重复的 KV 预配：在 Workers Builds 中设置 `SESSION_KV_NAMESPACE_ID` 与 `SESSION_KV_NAMESPACE_PREVIEW_ID`，让部署绑定现有 namespace，而不是尝试创建新 namespace
- 生产域名返回 `hello world`：确认正确的 Worker 已绑定到该域名、构建来自 `main`，并且 deploy 命令仍指向生成后的配置
- 本地 Miniflare / runtime 问题与 Cloudflare 构建问题不一定属于同一类，不要默认其中一个就能解释另一个

后端故障：

1. 运行 `./ops/manage.sh logs api 200`
2. 运行 `./ops/manage.sh ready`
3. 确认部署机位于目标 `main` commit
4. 如果同步过去的代码不对，从正确 commit 重新部署

如果 `./ops/manage.sh check` 失败，按以下顺序检查：

1. `docs/operations/production-config.md` 中当前服务器主机的 SSH 访问是否正常
2. `docs/operations/production-config.md` 中记录的远端项目目录是否存在
3. 远端 `infra/production/server.env` 是否存在
4. 远端是否安装 Docker Engine 和 Docker Compose plugin
5. `docs/operations/production-config.md` 中记录的 compose 文件路径是否仍与服务器布局一致

如果 `https://api.rebase.network` 失败，但本地 health 正常，请检查：

- `./ops/manage.sh logs cloudflared 200`
- `infra/production/server.env` 中的 tunnel token
- Cloudflare Zero Trust 中 `api.rebase.network` 的 hostname 映射

如果 R2 上传流程失败，请按以下顺序检查：

1. 确认 API 运行在 `r2-s3` 模式，而不是 `wrangler-cli`
2. 验证 `R2_ACCOUNT_ID`、`R2_ACCESS_KEY_ID`、`R2_SECRET_ACCESS_KEY`、`R2_BUCKET` 和 `R2_PUBLIC_BASE_URL` 在 `infra/production/server.env` 中配置正确
3. 验证 R2 key 的存储桶范围是 `rebase-media`，并具有 `Object Read & Write`
4. 在任何 env 变更之后，使用 `./ops/manage.sh deploy api --no-sync` 重启 API

已知后端 rollout 故障：

- `spawn wrangler ENOENT`：服务处于 Wrangler fallback 模式，但容器内找不到 `wrangler` 可执行文件
- 来自 `HeadBucket` 或 `PutObject` 的 `401`：配置的 R2 S3 凭据无效、与账号不匹配，或缺少存储桶写权限
- Docker 构建在 `COPY geekdaily.csv` 失败：`geekdaily.csv` 被 git 忽略，不应成为生产 API image 构建的必需输入
