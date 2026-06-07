# 架构

## 概览

Rebase 网站围绕一套定制化的社区发布技术栈设计。

它将以下部分拆分开来：

- 公共网站
- Rebase 管理工作台
- Rebase admin 与公共 API 层
- 媒体存储层
- 主关系型数据库

这样既能保持公共体验轻量，也能给工作人员提供一个专门构建的内部工具，而不是通用的 headless CMS。

Rebase 的目标架构，是本文档中描述的这套定制 admin 与 API 技术栈。

## 技术栈

- 公共前端：Astro
- 公共运行时与部署：Cloudflare Workers
- admin 前端：Vue
- admin 与公共 API：Hono
- 认证：Better Auth
- 主数据库：PostgreSQL
- schema 与 migrations：Drizzle
- 媒体存储：Cloudflare R2

## 产品与编辑默认设定

- 视觉方向：社区媒体
- 编辑格式：结构化字段 + Markdown 正文
- V1 中 GeekDaily 搜索实现：由 Rebase 自有搜索索引载荷驱动的前端搜索
- 如果未来需要，后续搜索扩展可以使用第三方服务或 plugin

## 为什么采用这套架构

### Astro

- 适合内容密集型的公共体验
- 组件模型强
- 渲染策略灵活
- 与 Cloudflare 部署目标配合良好

### 定制 Admin 前端

- 让 Rebase 能围绕发布 GeekDaily 或 jobs 等工作人员任务塑造 UI
- 避免强迫运营人员以原始 collections 和 schema tables 的方式思考
- 可以复用 TGO admin 实现中经过验证的交互模式

### Hono API 层

- 让所有写访问都经过显式、已认证的 API
- 集中处理校验、工作流状态流转、权限与审计日志
- 为公共网站提供稳定的只读 API，而不是把它耦合到仅限 admin 的结构

### Better Auth

- 干净地处理身份和 sessions
- 让认证关注点与业务权限分离
- 与已经在 TGO 中验证过的定制 admin 模式保持一致

### PostgreSQL + Drizzle

- 非常适合结构化的编辑与运营数据
- 支持面向发布工作流的显式约束和索引
- 让 schema 与 migrations 保持在版本控制中

### R2

- 让工作人员管理的媒体脱离代码库
- 适配基于 Cloudflare 的交付模型
- 避免把运营内容媒体存入 git 历史

## 系统图

```text
读者浏览器
    |
    v
Cloudflare edge
    |
    v
公共 worker (`apps/web`)
    |
    v
`api.rebase.network`
    |
    v
Cloudflare Tunnel (`cloudflared`)
    |
    v
API 服务 (`apps/api`)
    |
    +--> PostgreSQL
    +--> R2

工作人员浏览器
    |
    v
Cloudflare edge
    |
    v
admin worker (`apps/admin`)
    |
    v
`api.rebase.network`
    |
    v
Cloudflare Tunnel (`cloudflared`)
    |
    v
API 服务 (`apps/api`)
    |
    +--> Better Auth
    +--> PostgreSQL
    +--> R2
```

## 运行时模型

### 公共只读流

1. 读者在 `rebase.network` 或 `rebase.community` 请求公共页面。
2. Astro app 运行在公共 Cloudflare Worker 上。
3. worker 从 `api.rebase.network` 拉取已发布内容。
4. Cloudflare 通过 `cloudflared` 将该 hostname 路由到私有后端主机上的 API 服务。
5. API 从 PostgreSQL 读取结构化内容，并从 assets table 读取媒体 metadata。
6. 媒体资源通过基于 R2 的 URL 提供服务。
7. Cloudflare cache 被应用，用于提升重复访问性能。

### 工作人员内容流

1. 工作人员打开 `admin.rebase.network`。
2. admin UI 由专用 Cloudflare Worker 为 `apps/admin` 提供服务。
3. admin app 调用 `api.rebase.network` 上的已认证路由。
4. Cloudflare 通过 `cloudflared` 将 API 流量路由到私有后端主机上的 API 服务。
5. API 校验请求、检查权限并应用业务规则。
6. 结构化数据写入 PostgreSQL。
7. 上传媒体存入 R2，并由 metadata 记录引用。
8. 敏感操作写入审计日志。
9. 公共网站通过公共 API 读取最新已发布内容。

## 部署目标

V1 的稳定生产目标：

- `apps/web` 部署在 Cloudflare Worker 上，绑定 `rebase.network` 和 `rebase.community`
- `apps/admin` 部署在独立 Cloudflare Worker 上，绑定 `admin.rebase.network`
- `apps/api` 运行在私有后端主机上的 Docker Compose 中
- PostgreSQL 运行在同一 Docker Compose 栈和同一私有后端主机中
- `cloudflared` 运行在同一 Docker Compose 栈中，通过 Cloudflare Tunnel 暴露 `api.rebase.network`
- 公共媒体通过 `media.rebase.network` 从 Cloudflare R2 提供服务

生产设置索引和运维手册见 `docs/operations/production-config.md` 与 `docs/operations/deployment.md`。

### 为什么 API 要用 Cloudflare Tunnel

- 在 V1 中让 API 源站不直接暴露在公网
- 避免为了终止 HTTPS 额外引入 Caddy 或 Nginx
- 让 Cloudflare 处理外部 TLS edge，同时由 tunnel 保护 edge 到源站的流量
- 让 PostgreSQL 保持在服务器和 Docker 网络私有范围内

## 渲染策略

V1 应采用混合渲染策略。

### 适合静态或稳定渲染的页面

- About 页面
- contributors 页面
- 固定站点配置区块

### 适合动态或缓存渲染的页面

- 首页
- GeekDaily 列表页
- GeekDaily 详情页
- jobs 页面
- 文章列表与详情页
- 活动列表与详情页

这种策略可以避免在内容频繁变更时触发不必要的全站重建。

## 域名策略

公共域名：

- `rebase.network`
- `rebase.community`

运营域名：

- `admin.rebase.network`：admin worker
- `api.rebase.network`：通过 tunnel 暴露的 API hostname
- `media.rebase.network`：R2 公共存储桶

推荐行为：

- 如果可行，两个公共域名都应直接访问网站

回退行为：

- 如果双域名直出变得不切实际，`rebase.community` 可以使用 `301` 跳转到 `rebase.network`

## 发布策略

- 日常开发持续在 `dev`
- 只有当 release candidate 准备好时，才把 `dev` 合并到 `main`
- 生产部署应从 `main` 运行，而不是直接从 `dev`
- 发布流程和运维规则记录在 `docs/operations/deployment.md`

## API 边界

### 公共只读 API

V1 应从 Rebase 自有的公共 API 路由中读取已发布内容。

公共网站不应依赖通用 CMS 的内容交付 API。

### Admin 写 API

所有 admin 写操作都应通过已认证的 admin 路由完成。

浏览器不应存在直连数据库的写入路径。

### 公共写 API

V1 仍然不包含活动报名表单。

因此，V1 不需要面向表单或提交的公共写 API。

## 媒体策略

### 存放在仓库中

- logo
- favicon
- 固定装饰资源
- 默认占位图
- 兜底社交卡片资源

### 存放在 R2

- 文章封面图
- 活动海报
- contributor 头像
- 与 job 相关的媒体
- 如果未来需要，GeekDaily 媒体附件

## 缓存策略

V1 应优先使用务实的 cache control，而不是一开始就构建复杂失效机制。

建议做法：

- V1 依赖 Cloudflare edge caching
- 对公共 GET 响应在 edge 缓存
- 对动态列表页保持保守 TTL
- 对内容更新频繁的页面允许更快刷新
- 如有需要，后续再增加定向 purge 规则

## 搜索策略

V1 仅包含 GeekDaily 搜索。

推荐范围：

- 对期目级 metadata 建立搜索
- 包含标题、摘要、tags、日期、期号和推荐条目标题
- 第一版保持轻量和务实

V1 不需要重量级独立搜索引擎。

V1 应在前端实现 GeekDaily 搜索，同时由 API 或构建层提供 Rebase 自有的搜索索引载荷。

## Feed 策略

V1 包含用于公共内容分发的 RSS 输出。

推荐的 feeds：

- `/rss.xml`
- `/geekdaily/rss.xml`
- `/articles/rss.xml`
- `/events/rss.xml`
- `/who-is-hiring/rss.xml`

feed 生成应发生在公共网站层，并消费来自 Rebase 公共 API 的已发布内容。

GeekDaily feed 条目应映射到期目页面，而不是期目内部的单条链接。

招聘 feed 条目应映射到公开招聘详情页，而不是外部申请链接。

V1 feed 默认值：

- 每个 feed 返回最新 3 条已发布内容
- article、event 和 hiring 的 feed 描述使用 summary
- GeekDaily 的 feed 描述使用期目正文，或使用类似正文的生成摘要

## 运维基线

V1 应为后端服务提供一套简单的健康检查策略。

推荐基线：

- 公共网站健康端点：`/healthz`
- API 存活端点：如 `/health`
- API 就绪端点：如 `/ready`
- 通过 API readiness 或部署工具检查数据库可达性
- 后续可以在其他仓库用 GitHub Actions 实现外部定期检查和通知

## SEO 基线

V1 应交付一套轻量但完整的 SEO 基线。

推荐基线：

- 公共页面 canonical URLs
- 默认 Open Graph 和 Twitter metadata
- 共享社交卡片兜底资源
- `/robots.txt`
- `/sitemap.xml`

## 安全基线

- 读者永远不需要认证
- admin 访问由 Better Auth 与应用层工作人员权限共同处理
- admin 凭据永远不会到达公共客户端
- 媒体写入访问必须位于已认证的 admin API 之后
- 公共网站只消费已发布内容

## V1 非目标

- 复杂活动运营
- 公共成员系统
- 高级工作流自动化
- 全站统一搜索
- 多语言内容系统
- 邮件订阅基础设施
