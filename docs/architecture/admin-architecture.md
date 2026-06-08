# 管理后台架构

这个文件只描述管理后台写路径的事实来源。

它回答的是：

- 管理工作台、API、共享契约和数据库在写路径中各自负责什么
- 认证、权限、校验和审计如何分层
- 哪些内部约束必须长期保持

它不重复系统级部署拓扑，也不枚举每个页面的详细字段。

## 目标

构建一套面向 Rebase 工作人员任务的内部产品，而不是通用 CMS 外壳。

核心要求：

- 工作人员以任务而不是原始表结构维护内容
- 所有写入都经过已认证 API
- 发布前校验、权限检查和审计可见性必须存在

## 写路径中的模块职责

### `apps/admin`

- 提供工作人员可见的列表、编辑、预览、发布和归档界面
- 按 GeekDaily、岗位、文章、活动、贡献者、页面设置、媒体、权限等任务组织界面
- 在表单层做第一层校验
- 根据权限控制导航与操作可见性

### `apps/api`

- 暴露所有写入路由
- 做输入校验、业务校验、工作流状态流转和权限检查
- 统一处理媒体上传收尾、审计记录和运行时探针

### `packages/shared`

- 定义 admin 与 API 共用的 DTOs、enums 与校验约束
- 保持前后端在字段结构和状态值上的一致

### `packages/db`

- 持有完整 PostgreSQL schema
- 提供 migrations 与 seed
- 用数据库约束兜底应用层规则

## 认证与权限分层

Better Auth 负责：

- 用户身份
- session 签发与校验
- 登录与未来认证扩展

应用自有表负责：

- 哪些用户属于工作人员
- 工作人员拥有哪些角色
- 角色授予哪些权限
- 哪些动作需要审计

长期约束：

- 读者不进入 admin
- 写操作只能由工作人员触发
- 权限判断不能只放在前端

## 校验分层

每条写路径都应维持四层校验：

1. 管理工作台表单校验
2. API 输入校验
3. 业务规则校验
4. PostgreSQL 约束

示例：

- `episode_number` 唯一
- 岗位发布前必须有 `apply_url` 或备用联系方式
- 外部报名活动必须有 `registration_url`
- 贡献者发布前必须至少绑定一个角色

## 工作流状态

当前默认内容状态：

- `draft`
- `published`
- `archived`

可选扩展状态：

- `scheduled`
- `in_review`

当前原则是优先保证草稿、发布、归档清晰可靠，而不是引入复杂审批引擎。

## 媒体写路径

工作人员管理的媒体使用 R2。

推荐流程：

1. 管理工作台向 API 请求上传意图
2. API 为 R2 生成已签名上传路径或上传流程
3. 上传完成后，由 API 写入媒体 metadata
4. 编辑器从媒体库中选择已有资源，而不是直接粘贴外部状态

长期约束：

- 媒体 metadata 进入数据库
- 媒体二进制不进入 PostgreSQL
- 媒体写入必须位于已认证 API 之后
- 在私有桶、签名 URL 或受控下载代理落地前，运营端默认只写入公开媒体资源
- 当前默认上传上限为 `12 MiB`，并仅接受受支持的图片、PDF 和 MP4 MIME 类型

## 审计与可观测性

敏感动作应进入审计日志，至少包括：

- create
- update
- publish
- archive
- role changes
- staff changes
- media finalize 与 archive actions

管理后台写路径依赖的探针：

- API 存活：`/health`
- API 就绪：`/ready`
- 版本探针：`/version`

## 当前明确不做的事情

- 通用 low-code schema 编辑
- 实时协同编辑
- 可视化页面搭建器
- 复杂多步骤审批引擎
- 面向成员的自助资料编辑

## 相关文档

- `docs/architecture/architecture.md`：系统级运行时与部署事实
- `docs/architecture/admin-information-architecture.md`：管理后台模块与运营工作流
- `docs/architecture/admin-data-model.md`：后端核心约束
- `docs/architecture/admin-data-model-fields.md`：完整字段附录
- `docs/product/current-boundaries.md`：当前仍然生效的产品边界
