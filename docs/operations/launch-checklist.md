# 上线检查清单

与 `docs/operations/deployment.md` 配套使用的发布验证清单。

## 仅首次上线

在第一次生产上线前，确认：

- `rebase.network` 和 `admin.rebase.network` 已由连接 GitHub 的 Cloudflare Workers 发布
- `api.rebase.network` 已通过 Cloudflare Tunnel 路由到私有后端栈
- `media.rebase.network` 已绑定到 R2 存储桶
- `docs/operations/deployment.md` 中的初始后端部署场景已经完成
- 第一个 admin 账号可以登录

## 每次生产发布

发布前，确认：

- 运维人员遵循了 `docs/operations/deployment.md` 中对应的发布场景
- release candidate 通过常规 Pull Request 流从 `dev` 进入 `main`
- 如有前端改动，它们由连接 GitHub 的 Cloudflare 流程发布
- 如有后端改动，它们通过 `./ops/manage.sh` 从目标 `main` commit 部署
- 生产 secrets 与运行时配置仍然是预期值

## 路由检查

验证这些公共路由：

- 落地页：`https://rebase.network/`、`https://rebase.network/about`
- 内容入口：`https://rebase.network/who-is-hiring`、`https://rebase.network/geekdaily`、`https://rebase.network/articles`、`https://rebase.network/events`、`https://rebase.network/contributors`
- feeds：`https://rebase.network/rss.xml`、`https://rebase.network/geekdaily/rss.xml`、`https://rebase.network/articles/rss.xml`、`https://rebase.network/events/rss.xml`、`https://rebase.network/who-is-hiring/rss.xml`
- 发现与健康检查：`https://rebase.network/robots.txt`、`https://rebase.network/sitemap.xml`、`https://rebase.network/healthz`

验证这些 admin 与 API 路由：

- `https://admin.rebase.network`、admin 登录、admin 仪表盘
- `https://api.rebase.network/health`、`https://api.rebase.network/ready`、`https://api.rebase.network/version`

如果本次发布仍将 `rebase.community` 纳入有效公共路由策略，也要验证该域名。

## 功能检查

当相关区域发生变化时，至少验证一个真实运营流程：

- 内容编辑往返
- 媒体上传往返
- 受影响的公共详情页或列表页刷新

## 域名与 SEO 检查

验证：

- canonical URLs 指向 `https://rebase.network`
- Open Graph 和 Twitter metadata 存在
- 兜底社交图片可以正确访问
- `robots.txt` 公告了 sitemap
- `sitemap.xml` 包含关键公共路由和内容页面
- 至少一个真实上传的资源可以从 `https://media.rebase.network` 访问

## 发布后监控

发布后确认：

- `/healthz` 保持健康
- `/ready` 保持健康
- `cloudflared` 仍保持连接
- PostgreSQL 仍然只在服务器内部可见
- 外部监控正在探测公共网站与 API
- 重复故障会通知团队，而不是被静默忽略
