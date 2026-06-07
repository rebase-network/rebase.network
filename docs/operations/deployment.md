# 部署手册

这个文件定义生产运维步骤。

它只回答“怎么做”：

- 当前发布遵循什么流程
- 初始化、发布和维护时执行什么命令
- 出问题时按什么顺序排查

当前配置值见 `docs/operations/production-config.md`，发布后检查清单见 `docs/operations/launch-checklist.md`。

## 核心规则

- 日常工作保持在 `dev`
- release candidate 通过 Pull Request 从 `dev` 进入 `main`
- 前端生产发布由 Cloudflare 在检测到 `main` 更新后执行
- 后端生产发布是手动的，且必须从目标 `main` commit 部署
- 本地 `wrangler deploy` 不是常规生产路径
- SSH 示例使用 `rebase@rebase.host`

## 场景 1：初始部署

### 1. 配置前端项目

按 `docs/operations/production-config.md` 中记录的当前值配置前端 Workers 和域名绑定。

### 2. 准备后端服务器

同步仓库到服务器：

```bash
./ops/manage.sh sync
```

在服务器上创建生产环境文件：

```bash
ssh rebase@rebase.host
cd /home/rebase/rebase.network
cp infra/production/server.env.example infra/production/server.env
```

然后按 `docs/operations/production-config.md` 填入后端和 R2 必填值。

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

执行 `docs/operations/launch-checklist.md` 中的首次上线项、路由检查项和相关功能检查项。

## 场景 2：常规发布

选择与改动集匹配的最小发布路径。

### 仅前端发布

1. 在 `dev` 上完成验证
2. push `dev`
3. 发起并合并 `dev` -> `main` 的 Pull Request
4. 等待 Cloudflare 部署 `rebase-web` 和 / 或 `rebase-admin`
5. 执行 `docs/operations/launch-checklist.md` 中相关检查

### 仅后端发布

1. 将后端改动合并到 `main`
2. 把部署机更新到对应的 `main` commit
3. 确认工作树干净
4. 对 API 或 schema 改动，优先使用 `./ops/manage.sh rollout api`
5. 执行 `docs/operations/launch-checklist.md` 中相关检查

部署前推荐快速确认：

```bash
git checkout main
git pull --ff-only
git status --short
git rev-parse --short HEAD
```

### 全栈发布

1. 在 `dev` 上完成验证
2. push `dev` 并发起 `dev` -> `main` 的 Pull Request
3. 合并到 `main`
4. 等待 Cloudflare 前端部署完成
5. 把部署机更新到对应的 `main` commit
6. 对 API 或 schema 改动优先使用 `./ops/manage.sh rollout api`
7. 如果 Compose 级服务也发生变化，则使用 `./ops/manage.sh deploy stack`
8. 执行 `docs/operations/launch-checklist.md` 中相关检查

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
| `./ops/manage.sh rollout api` | 备份数据库、部署 API、运行 migrations 并验证 `/ready` |
| `./ops/manage.sh deploy api` | 部署 API 及共享包变更 |
| `./ops/manage.sh deploy stack` | 部署 Compose 级或全栈变更 |
| `./ops/manage.sh logs api 200` | 查看 API 日志 |
| `./ops/manage.sh ready` | 从服务器侧验证 API 就绪状态 |
| `./ops/manage.sh db backup` | 创建远端 PostgreSQL 备份 |
| `./ops/manage.sh db download <remote-path> [local-path]` | 下载远端备份或导出文件 |
| `./ops/manage.sh db list-backups` | 列出远端 PostgreSQL 备份文件 |
| `./ops/manage.sh db list-exports` | 列出远端 CSV 导出文件 |
| `./ops/manage.sh db export <table> [remote-path]` | 将 PostgreSQL 表导出到远端 CSV 文件 |
| `./ops/manage.sh db export-query "<select ...>" [remote-path]` | 导出查询结果到远端 CSV 文件 |

### 备份与导出流程

常规顺序：

1. 在高风险 schema 或数据操作前执行 `./ops/manage.sh db backup`
2. 用 `./ops/manage.sh db list-backups` 确认备份已生成
3. 需要本地副本时，执行 `./ops/manage.sh db download <remote-path> [local-path]`
4. 表级导出用 `./ops/manage.sh db export <table>`
5. 一次性报表或审查用 `./ops/manage.sh db export-query "<select ...>"`

## 部署路径检查命令

当改动影响部署配置、Cloudflare 配置或生产容器配置时，执行：

```bash
pnpm deploy:web:dry-run
pnpm deploy:admin:dry-run
pnpm deploy:server:config
```

## 故障处理

### 前端故障

1. 查看 Cloudflare 构建日志
2. 用对应的构建或 `*:dry-run` 命令在本地复现
3. 检查 `docs/operations/production-config.md` 中记录的配置值
4. 只有在明确紧急情况下才手动使用 `wrangler deploy`

常见故障：

- `ERR_PNPM_OUTDATED_LOCKFILE`
- 兼容性日期不匹配
- 重复的 KV 预配
- 生产域名返回 `hello world`

### 后端故障

1. 运行 `./ops/manage.sh logs api 200`
2. 运行 `./ops/manage.sh ready`
3. 确认部署机位于目标 `main` commit
4. 如同步代码错误，从正确 commit 重新部署

### 配置或网络问题

优先按以下顺序排查：

1. 服务器 SSH 是否可达
2. 远端项目目录是否存在
3. 远端 `infra/production/server.env` 是否存在
4. Docker Engine 与 Docker Compose plugin 是否存在
5. compose 文件路径是否仍与服务器布局一致

如果 `https://api.rebase.network` 失败但本地 health 正常，检查：

- `./ops/manage.sh logs cloudflared 200`
- tunnel token
- Cloudflare Zero Trust 中 `api.rebase.network` 的 hostname 映射

如果 R2 上传失败，检查：

1. API 是否运行在 `r2-s3` 模式
2. R2 凭据和公开域名是否与 `docs/operations/production-config.md` 一致
3. R2 key 是否具备 `Object Read & Write`
4. 修改 env 后是否已重新部署 API
