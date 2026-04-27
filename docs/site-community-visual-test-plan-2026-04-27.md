# Rebase.network 社区化视觉整改本地测试流程

日期：2026-04-27

目标：为本轮社区化视觉整改建立本地验证流程，覆盖 seed、页面渲染、移动端导航、RSS/sitemap 和 smoke 测试。

## 环境启动

```bash
pnpm local:bootstrap
pnpm dev:public
```

本地服务：

- Web: `http://127.0.0.1:4321`
- API: `http://127.0.0.1:8788`

## 基础验证

```bash
pnpm --filter @rebase/db typecheck
pnpm typecheck
pnpm lint
pnpm build
pnpm build:api
```

通过标准：

- DB seed 类型检查通过。
- Astro check 无错误。
- ESLint 无错误。
- Web/API build 通过。

## Seed 验证

```bash
pnpm local:bootstrap
```

检查输出：

- `contributors >= 24`
- `geekdailyEpisodes >= 12`
- `geekdailySeedSource` 存在

数据库抽查：

```bash
docker exec rebase-postgres psql -U rebase -d rebase -t -A -c "select cr.slug, count(*) from contributor_role_bindings b join contributor_roles cr on cr.id = b.contributor_role_id where cr.slug = 'geekdaily-advisors' group by cr.slug;"
```

通过标准：

- `geekdaily-advisors` 绑定人数不少于 12。

## 页面覆盖

必须打开：

- `/`
- `/about`
- `/geekdaily`
- `/geekdaily?q=1915`
- `/geekdaily/geekdaily-1915`
- `/articles`
- 文章详情页
- `/events`
- 活动详情页
- `/who-is-hiring`
- 招聘详情页
- `/contributors`

## 视觉检查清单

首页：

- 统计区不再像 dashboard。
- 最近动态、日报、文章、招聘、活动模块层级清晰。
- 移动端导航不挤压，能横向浏览更多入口。

GeekDaily：

- 搜索框下方无明显空白。
- 筛选按钮可用。
- `/geekdaily?q=1915` 首屏就是搜索结果。

招聘：

- 岗位事实信息不再像三列表格。
- 薪资、模式、地点仍能快速扫读。
- contact-only 和外部投递文案清晰。

贡献者：

- 页面不出现 `test geekdaily advisor`。
- 页面不出现 `test volunteer`。
- 智囊团成员数量足够验证多行布局。
- 头像 fallback 阴影不过重。

详情页：

- 文章、活动标题不过度巨大。
- 短正文页面没有明显被侧栏拉高的空白。
- 侧栏仍轻量、可读。

移动端：

- 390px 宽度下 header 不遮挡内容。
- nav item 不挤压换行。
- 主要卡片文本不溢出。
- CTA 不重叠。

## 自动化 smoke

```bash
pnpm test:smoke
```

通过标准：

- 所有 Playwright smoke 测试通过。
- 当前期望为 `50 passed` 或更多。

## 截图辅助检查

建议使用 Playwright 临时截图抽查：

- Desktop: `1440 x 1000`
- Mobile: `390 x 844`

重点截图：

- 首页 desktop/mobile
- GeekDaily desktop/mobile
- 招聘 desktop/mobile
- 贡献者 desktop/mobile
- 文章详情 desktop
- 活动详情 desktop

## 完成标准

本轮完成必须满足：

- 视觉审阅、整改方案、执行计划、测试流程、执行结果均有 markdown 记录。
- 代码按执行计划完成。
- `pnpm --filter @rebase/db typecheck` 通过。
- `pnpm typecheck` 通过。
- `pnpm lint` 通过。
- `pnpm build` 通过。
- `pnpm build:api` 通过。
- `pnpm local:bootstrap` 通过。
- `pnpm test:smoke` 通过。
