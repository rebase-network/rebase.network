# Rebase.network 本地测试流程与覆盖清单

日期：2026-04-27

目标：为本轮 UI/UX 与视觉整改建立本地自动化测试流程，确保关键页面、核心交互、RSS/sitemap 和视觉结构不会在整改中回退。

## 测试环境

推荐完整本地栈：

```bash
pnpm install
pnpm local:bootstrap
pnpm dev:public
```

本地服务：

- Public site: `http://127.0.0.1:4321`
- API: `http://127.0.0.1:8788`

自动化 smoke 测试使用：

```bash
pnpm test:smoke
```

仓库中的 Playwright 配置会为 smoke 测试启动 API 和 Web 服务。

## 开发前检查

```bash
git status --short --branch
pnpm install --frozen-lockfile
```

确认：

- 当前分支干净或只包含本轮变更。
- 依赖安装完成。
- 没有未说明的用户改动被覆盖。

## 基础质量检查

每轮开发完成后运行：

```bash
pnpm typecheck
pnpm lint
pnpm build
```

通过标准：

- TypeScript/Astro check 无错误。
- ESLint 无错误。
- Astro build 完成。

## Smoke 测试覆盖页面

必须覆盖：

- `/`
- `/about`
- `/geekdaily`
- `/geekdaily/geekdaily-1935` 或本地种子中存在的最新 GeekDaily 详情页
- `/articles`
- 文章详情页
- `/events`
- 活动详情页
- `/who-is-hiring`
- 招聘详情页
- `/contributors`
- `/rss.xml`
- `/sitemap.xml`
- `/robots.txt`

## 自动化断言清单

### 全站基础

- 页面返回 200。
- 页面存在主导航。
- 页面存在 footer。
- 首屏不出现空白页面。
- 主标题存在且可见。

### 视觉风格

- 列表页 H1 使用短栏目名。
- 普通卡片 hover 不依赖大幅位移才能表达可点击。
- 详情页侧栏为浅色辅助区，不使用深色 dashboard 风格。
- 首页动态区使用浅色社区公告板风格。

### 活动

- 历史活动卡片不显示“立即报名”。
- 即将举办且有报名链接的活动可以显示“立即报名”。
- 活动详情页过去活动不显示报名型主 CTA。
- 活动列表可看到历史活动入口或分组。

### GeekDaily

- 默认展示最近 10 期。
- 分页存在真实链接，例如 `?page=2`。
- 搜索输入可聚焦。
- 筛选按钮可通过键盘访问。
- 空结果有清晰提示。

### 招聘

- 职位卡片不直接展示公司名 `/`。
- 详情页不出现“报名表单”这类活动语境文案。
- 投递 CTA 与数据状态一致。

### 文章

- 文章列表最新文章展示摘要或统一进入文章列表。
- 文章详情视觉上只有一个页面主标题。
- 文章正文可读，侧栏不抢正文。

### 贡献者

- 首屏能看到“如何加入”或参与入口。
- 缺头像 contributor 使用统一 fallback。
- 贡献者卡片移动端不溢出。

### RSS / SEO

- `/rss.xml` 返回 200。
- `/geekdaily/rss.xml` 返回 200。
- `/articles/rss.xml` 返回 200。
- `/events/rss.xml` 返回 200。
- `/who-is-hiring/rss.xml` 返回 200。
- `/sitemap.xml` 返回 200 且包含主要静态路由。
- `/robots.txt` 包含 sitemap URL。

## 响应式检查

Playwright 至少覆盖：

- Desktop: `1440 x 1000`
- Mobile: `390 x 844`

检查：

- Header 导航不遮挡内容。
- Hero 标题不溢出。
- 卡片文字不溢出。
- CTA 不重叠。
- 详情页侧栏在移动端变为正文后的辅助区。

## 手工验收建议

自动化测试完成后，人工最终验收重点看：

- 站点是否更像社区，而不是严肃产品官网。
- 首页是否能让人快速感觉到社区正在更新。
- 文章、活动、招聘、GeekDaily 是否都像同一个产品。
- 贡献者页是否更有人味。
- 视觉是否仍然足够可信，不变成过度轻浮。

## 本轮完成标准

本轮开发完成必须满足：

- 文档已更新。
- 代码已按执行计划整改。
- `pnpm typecheck` 通过。
- `pnpm lint` 通过。
- `pnpm build` 通过。
- `pnpm test:smoke` 通过，或记录无法运行的明确环境原因。
