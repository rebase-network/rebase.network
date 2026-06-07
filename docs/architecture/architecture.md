# 架构

这个文件是系统级事实来源。

它回答的是：

- 系统由哪些运行时部分组成
- 这些部分如何通信
- 当前部署拓扑是什么
- 哪些跨模块约束今天仍然成立

它不负责详细说明 admin 模块设计、后端表结构或公共内容字段全集。那些内容分别见相关子文档。

## 系统边界

当前系统由五个核心部分组成：

- 面向读者的公共网站
- 面向工作人员的管理工作台
- 同时服务两者的 API 层
- PostgreSQL 主数据库
- Cloudflare R2 媒体存储

核心边界：

- 公共网站只读
- 所有内容写入都经过内部 API
- PostgreSQL 不直接暴露在公网
- 媒体二进制文件不进入代码仓库，也不进入 PostgreSQL

## 当前技术栈

- 公共前端：Astro
- 公共运行时：Cloudflare Workers
- 管理工作台：Vue
- API：Hono
- 认证：Better Auth
- 数据库：PostgreSQL
- schema 与 migrations：Drizzle
- 媒体存储：Cloudflare R2

## 运行时拓扑

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

## 两条核心数据流

### 公共只读流

1. 读者访问 `rebase.network` 或 `rebase.community`
2. `apps/web` 在 Cloudflare Worker 上渲染页面
3. 公共页面从 `api.rebase.network` 拉取已发布内容
4. API 从 PostgreSQL 读取结构化数据，并从 R2 读取媒体引用

### 工作人员写入流

1. 工作人员访问 `admin.rebase.network`
2. `apps/admin` 通过已认证 API 完成内容维护
3. API 执行权限检查、状态流转、业务校验和审计
4. 数据写入 PostgreSQL，媒体写入 R2
5. 已发布内容随后经公共 API 出现在公共网站

## 当前部署拓扑

当前稳定生产形态：

- `apps/web` 部署在 Cloudflare Worker，绑定 `rebase.network` 与 `rebase.community`
- `apps/admin` 部署在独立 Cloudflare Worker，绑定 `admin.rebase.network`
- `apps/api` 运行在私有后端主机上的 Docker Compose 中
- PostgreSQL 运行在同一私有后端主机的 Docker Compose 栈中
- `cloudflared` 运行在同一私有后端主机中，对外暴露 `api.rebase.network`
- `media.rebase.network` 指向 R2 公共媒体域名

这套拓扑的核心意图是：

- 把读多写少的前端放在 edge
- 把写路径和数据库留在私有服务器内
- 让 API 通过 Cloudflare Tunnel 暴露，而不是直接公开源站

## 渲染与内容刷新策略

当前策略是混合渲染，而不是全站静态构建。

更适合稳定渲染的内容：

- About 页面
- 固定站点配置区块
- 相对稳定的 contributors 列表

更适合动态或缓存渲染的内容：

- 首页
- GeekDaily 列表与详情
- 招聘列表与详情
- 文章列表与详情
- 活动列表与详情

目标是避免在高频内容更新时依赖全站重建。

## API 边界

### 公共 API

- 公共网站只从 Rebase 自有公共 API 读取内容
- 公共 API 只返回应公开的已发布内容
- 公共网站不应直接依赖仅限 admin 的内部结构

### 管理 API

- 所有写入都必须经过已认证 admin 路由
- 浏览器端不应存在直连数据库的写路径
- 权限、校验、审计和状态流转都集中在 API 层

### 公共写入

当前系统没有公开写入入口：

- 无站内活动报名
- 无站内职位申请
- 无公开表单提交型工作流

## 跨模块基线

### 媒体

- 固定品牌资源和静态装饰资源可以留在仓库
- 内容型媒体资源应存放在 R2
- 数据库只保存媒体 metadata，不保存二进制内容

### 缓存

- 公共 GET 响应依赖 Cloudflare edge caching
- 动态列表页使用保守 TTL
- 不依赖复杂失效机制作为首要前提

### 健康检查

当前应保留以下探针：

- 公共网站：`/healthz`
- API 存活：`/health`
- API 就绪：`/ready`
- 版本探针：`/version`

### 安全

- 读者不需要认证
- 工作人员权限由 Better Auth 与应用层角色权限共同约束
- admin 凭据不能到达公共客户端
- PostgreSQL 保持服务器内网可见

## 相关文档

- `docs/architecture/admin-architecture.md`：管理后台写路径与内部约束
- `docs/architecture/admin-information-architecture.md`：管理后台模块与运营工作流
- `docs/architecture/admin-data-model.md`：完整后端表结构与约束
- `docs/product/content-model.md`：公共内容域、URL 与 RSS 规则
- `docs/operations/deployment.md`：部署手册
- `docs/operations/production-config.md`：生产配置索引
