# 生产配置索引

当前生产设置索引。

操作流程见 `docs/operations/deployment.md`，发布验证见 `docs/operations/launch-checklist.md`。这个文件记录当前在线生产值及其归属范围，它不是 secrets 存储位置。

## 运行时映射

| 界面 | 运行时 | 当前目标 |
| --- | --- | --- |
| 公共网站 | Cloudflare Worker | `rebase-web` |
| 社区别名 | Cloudflare Worker | `rebase-web` |
| Admin 网站 | Cloudflare Worker | `rebase-admin` |
| 公共 API | Docker Compose + Cloudflare Tunnel | `api.rebase.network` -> `api:8788` |
| 数据库 | Docker Compose | PostgreSQL 16 |
| Tunnel 连接器 | Docker Compose | `cloudflared` |
| 媒体 | Cloudflare R2 | 存储桶 `rebase-media` |

## Cloudflare 索引

### Workers

| Worker | 域名 | 分支 | 根目录 | Install | Build | Deploy | 配置来源 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `rebase-web` | `rebase.network`, `rebase.community` | `main` | `/` | `pnpm install --frozen-lockfile` | `pnpm build:web:prod` | `pnpm exec wrangler deploy --config apps/web/dist/server/wrangler.production.json` | `apps/web/wrangler.template.jsonc` |
| `rebase-admin` | `admin.rebase.network` | `main` | `/` | `pnpm install --frozen-lockfile` | `pnpm build:admin:prod` | `pnpm exec wrangler deploy --config apps/admin/wrangler.production.jsonc` | `apps/admin/wrangler.production.jsonc` |

### Cloudflare 托管值

| 目标 | 配置项 | 位置 |
| --- | --- | --- |
| `rebase-web` | `SESSION_KV_NAMESPACE_ID` | Cloudflare 控制台 |
| `rebase-web` | `SESSION_KV_NAMESPACE_PREVIEW_ID` | 在需要时配置于 Cloudflare 控制台 |
| `rebase-web` | `rebase.network`、`rebase.community` 的自定义域名 | Cloudflare 控制台 |
| `rebase-admin` | `admin.rebase.network` 的自定义域名 | Cloudflare 控制台 |
| Tunnel | hostname `api.rebase.network` | Cloudflare Tunnel |
| R2 | 自定义域名 `media.rebase.network` | Cloudflare R2 设置 |

## 后端索引

| 项目 | 当前值 | 来源 |
| --- | --- | --- |
| Server host | `rebase@rebase.host` | `ops/manage.sh` |
| 远端项目目录 | `/home/rebase/rebase.network` | `ops/manage.sh` |
| 远端目录类型 | rsync 同步的工作树，而不是 git checkout | 服务器布局 + `ops/manage.sh` |
| Compose 文件 | `infra/production/docker-compose.yml` | 仓库 |
| 远端 env 文件 | `infra/production/server.env` | 仅服务器 |
| 主辅助脚本 | `ops/manage.sh` | 仓库 |
| API 服务 | `api` | `infra/production/docker-compose.yml` |
| PostgreSQL 服务 | `postgres` | `infra/production/docker-compose.yml` |
| Tunnel 服务 | `cloudflared` | `infra/production/docker-compose.yml` |
| API 绑定 | `127.0.0.1:8788` | 远端 env |
| PostgreSQL 绑定 | `127.0.0.1:55433` | 远端 env |
| Backup 目录 | `/home/rebase/rebase.network/backups` | `ops/manage.sh` 默认值 |
| Export 目录 | `/home/rebase/rebase.network/exports` | `ops/manage.sh` 约定 |

`rebase@rebase.host` 的 SSH hostname 解析由这个公开仓库之外的环境负责。

## 服务器 Env 索引

使用 `infra/production/server.env.example` 作为远端 `infra/production/server.env` 的模板。

### 必填后端值

| 变量 | 用途 | Secret | 位置 |
| --- | --- | --- | --- |
| `APP_VERSION` | 由 API 暴露的发布版本 | 否 | 远端 env |
| `POSTGRES_DB` | 数据库名 | 否 | 远端 env |
| `POSTGRES_USER` | 数据库用户 | 否 | 远端 env |
| `POSTGRES_PASSWORD` | 数据库密码 | 是 | 远端 env |
| `BETTER_AUTH_SECRET` | auth 签名 secret | 是 | 远端 env |
| `BETTER_AUTH_URL` | 外部 auth 基础 URL | 否 | 远端 env |
| `CORS_ALLOWED_ORIGINS` | 浏览器来源列表 | 否 | 远端 env |
| `DEV_ADMIN_EMAIL` | 初始 admin email | 敏感 | 远端 env |
| `DEV_ADMIN_PASSWORD` | 初始 admin password | 是 | 远端 env |
| `DEV_ADMIN_NAME` | 初始 admin name | 否 | 远端 env |
| `CLOUDFLARED_TUNNEL_TOKEN` | Tunnel token | 是 | 远端 env |

### R2 配置值

| 变量 | 用途 | Secret | 位置 |
| --- | --- | --- | --- |
| `R2_ACCOUNT_ID` | Cloudflare account id | 否 | 远端 env |
| `R2_ACCESS_KEY_ID` | S3 风格 access key | 是 | 远端 env |
| `R2_SECRET_ACCESS_KEY` | S3 风格 secret key | 是 | 远端 env |
| `R2_BUCKET` | 存储桶名称 | 否 | 远端 env |
| `R2_PUBLIC_BASE_URL` | 公共媒体基础 URL | 否 | 远端 env |
| `R2_DEV_USE_WRANGLER` | 回退上传模式，生产环境保持 `false` | 否 | 远端 env |
| `CLOUDFLARE_API_TOKEN` | 可选回退 token | 是 | 远端 env |
| `WRANGLER_CONFIG_DIR` | 可选挂载的 Wrangler profile 路径 | 否 | 远端 env |

## 配置来源

| 文件 | 角色 |
| --- | --- |
| `docs/operations/deployment.md` | 运维手册 |
| `docs/operations/production-config.md` | 生产配置索引 |
| `docs/operations/launch-checklist.md` | 发布验证清单 |
| `infra/production/docker-compose.yml` | 后端服务 |
| `infra/production/server.env.example` | 后端 env 模板 |
| `apps/web/wrangler.template.jsonc` | 公共 Worker 配置模板 |
| `apps/admin/wrangler.production.jsonc` | admin Worker 配置 |
| `scripts/deploy/prepare-web-assets.mjs` | 公共 Worker deploy 配置生成脚本 |
| `ops/manage.sh` | 后端部署与维护辅助脚本 |

## 更新规则

当生产路由、主机别名、服务名、env 变量名或控制台托管绑定发生变化时，更新这个文件。
