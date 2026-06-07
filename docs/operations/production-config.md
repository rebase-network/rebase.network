# 生产配置索引

这个文件记录当前在线生产值。

它只回答“当前是什么”：

- 当前运行时和域名映射是什么
- 当前 Cloudflare 与后端目标值是什么
- 当前生产环境必须有哪些 env 变量

它不是部署步骤，也不是发布验证清单。

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

## Cloudflare 当前值

### Workers

| Worker | 域名 | 分支 | 根目录 | Install | Build | Deploy |
| --- | --- | --- | --- | --- | --- | --- |
| `rebase-web` | `rebase.network`, `rebase.community` | `main` | `/` | `pnpm install --frozen-lockfile` | `pnpm build:web:prod` | `pnpm exec wrangler deploy --config apps/web/dist/server/wrangler.production.json` |
| `rebase-admin` | `admin.rebase.network` | `main` | `/` | `pnpm install --frozen-lockfile` | `pnpm build:admin:prod` | `pnpm exec wrangler deploy --config apps/admin/wrangler.production.jsonc` |

### Cloudflare 控制台托管值

| 目标 | 配置项 | 位置 |
| --- | --- | --- |
| `rebase-web` | `SESSION_KV_NAMESPACE_ID` | Cloudflare 控制台 |
| `rebase-web` | `SESSION_KV_NAMESPACE_PREVIEW_ID` | Cloudflare 控制台 |
| `rebase-web` | `rebase.network`、`rebase.community` 自定义域名 | Cloudflare 控制台 |
| `rebase-admin` | `admin.rebase.network` 自定义域名 | Cloudflare 控制台 |
| Tunnel | `api.rebase.network` hostname 映射 | Cloudflare Tunnel |
| R2 | `media.rebase.network` 自定义域名 | Cloudflare R2 设置 |

## 后端当前值

| 项目 | 当前值 |
| --- | --- |
| Server host | `rebase@rebase.host` |
| 远端项目目录 | `/home/rebase/rebase.network` |
| Compose 文件 | `infra/production/docker-compose.yml` |
| 远端 env 文件 | `infra/production/server.env` |
| 主辅助脚本 | `ops/manage.sh` |
| API 服务名 | `api` |
| PostgreSQL 服务名 | `postgres` |
| Tunnel 服务名 | `cloudflared` |
| API 绑定 | `127.0.0.1:8788` |
| PostgreSQL 绑定 | `127.0.0.1:55433` |
| 备份目录 | `/home/rebase/rebase.network/backups` |
| 导出目录 | `/home/rebase/rebase.network/exports` |

## 必填后端 env

使用 `infra/production/server.env.example` 作为远端 `infra/production/server.env` 模板。

| 变量 | 用途 | Secret |
| --- | --- | --- |
| `APP_VERSION` | API 暴露的版本号 | 否 |
| `POSTGRES_DB` | 数据库名 | 否 |
| `POSTGRES_USER` | 数据库用户 | 否 |
| `POSTGRES_PASSWORD` | 数据库密码 | 是 |
| `BETTER_AUTH_SECRET` | 认证签名 secret | 是 |
| `BETTER_AUTH_URL` | 外部 auth 基础 URL | 否 |
| `CORS_ALLOWED_ORIGINS` | 浏览器来源列表 | 否 |
| `DEV_ADMIN_EMAIL` | 初始 admin email | 敏感 |
| `DEV_ADMIN_PASSWORD` | 初始 admin password | 是 |
| `DEV_ADMIN_NAME` | 初始 admin name | 否 |
| `CLOUDFLARED_TUNNEL_TOKEN` | Tunnel token | 是 |

## 必填 R2 env

| 变量 | 用途 | Secret |
| --- | --- | --- |
| `R2_ACCOUNT_ID` | Cloudflare account id | 否 |
| `R2_ACCESS_KEY_ID` | S3 风格 access key | 是 |
| `R2_SECRET_ACCESS_KEY` | S3 风格 secret key | 是 |
| `R2_BUCKET` | 存储桶名称 | 否 |
| `R2_PUBLIC_BASE_URL` | 公共媒体基础 URL | 否 |
| `R2_DEV_USE_WRANGLER` | 回退上传模式，生产环境保持 `false` | 否 |
| `CLOUDFLARE_API_TOKEN` | 可选回退 token | 是 |
| `WRANGLER_CONFIG_DIR` | 可选 Wrangler profile 路径 | 否 |

## 更新规则

当以下内容变化时，更新这个文件：

- 运行时映射
- 域名绑定
- 分支、构建或 deploy 命令
- 服务名、目录或绑定端口
- env 变量名
