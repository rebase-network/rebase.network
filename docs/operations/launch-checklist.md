# 上线检查清单

这个文件只定义发布验证项。

它不解释部署步骤，也不记录当前配置值。对应内容分别见：

- `docs/operations/deployment.md`
- `docs/operations/production-config.md`

## 仅首次上线

首次生产上线前确认：

- `rebase.network` 与 `admin.rebase.network` 已由 Cloudflare Workers 发布
- `api.rebase.network` 已通过 Cloudflare Tunnel 路由到后端栈
- `media.rebase.network` 已绑定到 R2 存储桶
- 第一个 admin 账号可以登录

## 每次生产发布前

确认：

- 对应发布场景已经按 `docs/operations/deployment.md` 执行
- 发布从目标 `main` commit 进行
- 前端、后端和生产配置值都是本次预期状态

## 路由检查

验证这些公共路由：

- `https://rebase.network/`
- `https://rebase.network/about`
- `https://rebase.network/who-is-hiring`
- `https://rebase.network/geekdaily`
- `https://rebase.network/articles`
- `https://rebase.network/events`
- `https://rebase.network/contributors`
- `https://rebase.network/rss.xml`
- `https://rebase.network/geekdaily/rss.xml`
- `https://rebase.network/articles/rss.xml`
- `https://rebase.network/events/rss.xml`
- `https://rebase.network/who-is-hiring/rss.xml`
- `https://rebase.network/robots.txt`
- `https://rebase.network/sitemap.xml`
- `https://rebase.network/healthz`

验证这些 admin 与 API 路由：

- `https://admin.rebase.network`
- admin 登录
- admin 仪表盘
- `https://api.rebase.network/health`
- `https://api.rebase.network/ready`
- `https://api.rebase.network/version`

如果 `rebase.community` 仍在当前路由策略内，也要验证该域名。

## 功能检查

当相关区域发生变化时，至少验证一个真实流程：

- 内容编辑往返
- 媒体上传往返
- 受影响公共详情页或列表页刷新

## 域名与 SEO 检查

确认：

- canonical URLs 指向 `https://rebase.network`
- Open Graph 与 Twitter metadata 存在
- 兜底社交图片可访问
- `robots.txt` 公告了 sitemap
- `sitemap.xml` 包含关键公共路由和内容页
- 至少一个真实上传资源可从 `https://media.rebase.network` 访问

## 发布后监控

发布后确认：

- `/healthz` 保持健康
- `/ready` 保持健康
- `cloudflared` 仍保持连接
- PostgreSQL 仍只在服务器内部可见
- 外部监控正在探测公共网站与 API
- 重复故障会通知团队，而不是被静默忽略
