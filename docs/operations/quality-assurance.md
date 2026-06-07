# 质量保障

这个文档用于开发期验证。生产发布验证请使用 `docs/operations/launch-checklist.md`。

目标是结合：

- 浏览器评审
- 自动化检查
- 真实样例内容

## 验证层

### 1. 浏览器评审

浏览器评审是页面呈现验收的必需项。

它应覆盖：

- 桌面端视口
- 移动端视口
- 主要用户流程
- 真实内容，而不仅是空占位

浏览器评审应重点检查：

- 布局
- 可读性
- 间距
- 导航
- 链接行为
- 内容层级
- 空状态
- 溢出处理

### 2. 自动化检查

自动化检查用于快速防回归。

它们应覆盖：

- 代码质量
- 路由可用性
- 关键页面结构
- feed 输出
- 主要 UI 回归
- 在适用时覆盖 admin 与公共 API 的基础行为

### 3. 样例内容验证

整个开发过程中都应使用样例内容来确认真实世界行为。

推荐的基线样例集：

- 3 期 GeekDaily
- 2 篇文章
- 2 个活动
- 3 条 job
- 至少跨 2 个角色的 4 位 contributors
- 一套完整的页脚配置

如果存在归档版 `geekdaily.csv`，可以把它作为期目级结构的参考来源。

### 4. 生产发布

域名、健康检查、SEO 和发布后检查请使用 `docs/operations/launch-checklist.md`。

## 浏览器评审清单

每个主要页面都应在浏览器中检查以下内容：

- 主标题可见
- 导航清晰
- 页脚可用
- 内容数据正确
- 桌面端布局稳定
- 移动端布局稳定
- 长标题行为可接受
- 空状态行为可接受

这些页面应始终人工评审：

- `/`
- `/about`
- `/who-is-hiring`
- 一个示例招聘详情页
- `/geekdaily`
- 一个示例 GeekDaily 详情页
- `/articles`
- 一个示例文章详情页
- `/events`
- 一个示例活动详情页
- `/contributors`
- 定制 admin 实现完成后，关键 admin 列表页和编辑页

## 自动化检查计划

### Build 级检查

这些检查应在每一批有意义的功能改动上执行：

- lint
- typecheck
- build

目的：

- 捕获语法与类型问题
- 确认路由生成或运行时接线正常
- 捕获 feed 生成失败

### 本地路由 Smoke Tests

使用浏览器自动化在开发环境和 CI 中验证关键路由能正确加载。生产路由验证保留在 `docs/operations/launch-checklist.md`。

推荐的初始路由集：

- `/`
- `/about`
- `/who-is-hiring`
- `/geekdaily`
- `/articles`
- `/events`
- `/contributors`
- `/rss.xml`
- `/geekdaily/rss.xml`
- `/articles/rss.xml`
- `/events/rss.xml`
- `/who-is-hiring/rss.xml`
- `/robots.txt`
- `/sitemap.xml`
- `/healthz`

如果存在样例内容，还应测试：

- 一个 GeekDaily 详情路由
- 一个文章详情路由
- 一个活动详情路由
- 一个招聘详情路由

推荐检查项：

- 响应成功
- 预期的标题或页面地标存在
- 关键页面区域被渲染
- feed 响应包含 XML 内容
- 健康检查与 SEO 支撑路由返回预期格式

### 结构断言

对于主要页面，验证：

- 存在主标题
- 存在导航
- 存在页脚
- 存在预期的 CTA 或内容区块

示例：

- GeekDaily 列表页应包含搜索输入框或搜索触发器
- 招聘详情页应包含申请链接
- 活动详情页应包含报名说明或外部报名链接

### Feed 检查

每个 feed 都应检查：

- 响应成功
- 输出 XML
- channel metadata 非空
- 在存在样例数据时至少有一个 item
- item links 符合公共路由约定

需要验证的路由约定：

- GeekDaily items 链接到 `/geekdaily/geekdaily-{episode-number}`
- 招聘 items 链接到 `/who-is-hiring/{public-number}-{slug}`
- 文章 items 链接到 `/articles/{public-number}-{slug}`
- 活动 items 链接到 `/events/{public-number}-{slug}`

### 搜索检查

GeekDaily 搜索检查应验证：

- 搜索 UI 可用
- 按期号搜索可用
- 按关键词搜索能返回符合预期的实用匹配
- 空搜索结果能渲染清晰状态
- 搜索结果链接到有效期目页面

### Admin 工作流检查

定制 admin 落地后，补充以下检查：

- admin 登录
- 仪表盘可访问
- 内容列表可加载
- 内容编辑器的校验状态
- 关键模块中 publish 与 archive 动作的成功路径
- 基于权限的导航可见性

### 视觉回归检查

在最早阶段，视觉回归是可选项；但主 UI 稳定后，建议引入。

先从以下页面截图开始：

- 首页
- GeekDaily 列表页
- GeekDaily 详情页
- 招聘列表页
- 招聘详情页
- admin 仪表盘
- 一个 admin 编辑页

至少捕获：

- 一个桌面端视口
- 公共页面的一个移动端视口

目标是捕获重大的布局回归，而不是做像素级设计警察。

### 建议工具

推荐的第一阶段工具：

- formatter 与 lint 配置
- 类型检查
- 用于浏览器自动化的 Playwright

Playwright 很适合，因为它可以：

- 加载页面
- 检查元素
- 点击链接
- 输入搜索内容
- 截图
- 验证 feed 响应
- 在项目后期覆盖 admin 页面

## 测试完成定义

一批功能在满足以下条件前，不应视为完成：

- 相关人工浏览器评审已完成
- 相关自动化检查已通过
- 适用时已经使用真实样例内容测试
- 如有刻意延后项，其已知限制已被记录

## 后续扩展

在初始构建稳定后，QA 可以继续扩展为：

- 更丰富的视觉回归覆盖
- 可访问性检查
- 性能预算检查
- admin 与公共 API 响应的 schema 校验
- 面向未来 URL 迁移的 redirect 校验
