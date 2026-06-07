# 质量保障

这个文件定义开发期验证方式。

它只回答“开发阶段怎么检查”，不负责记录生产部署步骤、线上配置值或发布后清单。对应内容分别见：

- `docs/operations/deployment.md`
- `docs/operations/production-config.md`
- `docs/operations/launch-checklist.md`

## 使用原则

- 只执行与本次改动相关的最小验证集
- 优先验证真实用户路径，而不是只看静态页面
- 浏览器检查、自动化检查和文档同步缺一不可

## 按改动类型选择检查项

### 公共页面或样式改动

至少执行：

- 相关浏览器检查
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:smoke`，如果受影响路由在 smoke 覆盖范围内

如果改动影响生产构建产物，再执行：

- `pnpm build:web:prod`

### 管理工作台改动

至少执行：

- 相关浏览器检查
- `pnpm typecheck:admin`

如果改动影响生产构建产物，再执行：

- `pnpm build:admin`
- 或 `pnpm build:admin:prod`

### API、数据库或共享契约改动

至少执行：

- `pnpm typecheck:api`
- `pnpm build:api`

如果改动影响 schema、seed 或本地数据路径，再按需执行：

- `pnpm db:migrate`
- `pnpm db:seed`

如果改动还会影响公共页面或管理工作流，要补做对应浏览器检查。

### 部署或生产配置改动

- 运行 `docs/operations/deployment.md` 中对应的 dry-run 或配置检查命令
- 同步更新 `docs/operations/production-config.md`
- 确保发布后检查项仍与 `docs/operations/launch-checklist.md` 一致

## 浏览器检查基线

当以下界面被改动时，至少在浏览器里检查一次真实内容：

- `/`
- `/about`
- `/who-is-hiring`
- `/geekdaily`
- `/articles`
- `/events`
- `/contributors`
- 任一受影响的详情页
- 任一受影响的管理工作台列表页或编辑页

浏览器检查至少关注：

- 主内容是否正确
- 路由与链接是否正确
- 空状态、长标题、缺图是否可接受
- 桌面端和移动端是否都可用

## 本地 Smoke 基线

当前应优先覆盖的本地公共路由：

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

如果样例内容存在，还应覆盖至少一个：

- GeekDaily 详情页
- 文章详情页
- 活动详情页
- 招聘详情页

## 管理工作流检查基线

当改动影响管理工作台时，按需检查：

- 登录是否正常
- 受影响模块列表是否可加载
- 编辑器是否能保存
- 发布或归档动作是否可完成
- 权限改动是否影响导航和操作可见性

## 文档同步要求

如果实现变化成为新的默认事实，本次改动必须同时更新对应文档。

常见目标包括：

- `docs/product/content-model.md`
- `docs/product/current-boundaries.md`
- `docs/architecture/*.md`
- `docs/operations/*.md`
- `apps/web/*.md`
- `apps/admin/*.md`
