# 前台页面审查报告（`apps/web`）

审查日期：2026-04-07

审查范围：仅覆盖前台 `apps/web` 及其对应 smoke tests，不涉及后台 `apps/api`、`apps/admin` 和共享包实现调整。

## 审查方法

- 代码审查：逐页检查 `apps/web` 的页面、布局、组件、路由与前台数据接线。
- 构建验证：执行 `pnpm --filter @rebase/web check`，结果通过。
- 构建验证：执行 `pnpm --filter @rebase/web build`，结果通过，静态构建产出 1826 个页面。
- 烟雾测试：执行 `pnpm test:smoke`，结果 40 / 40 通过。

## 当前实现情况

目前前台主体已经具备完整站点骨架，以下公共页面和运维路由均已存在：

- 首页：`/`
- About：`/about`
- 招聘列表 / 详情：`/who-is-hiring`、`/who-is-hiring/[slug]`
- GeekDaily 列表 / 详情：`/geekdaily`、`/geekdaily/[slug]`
- 文章列表 / 详情：`/articles`、`/articles/[slug]`
- 活动列表 / 详情：`/events`、`/events/[slug]`
- Contributors：`/contributors`
- 支持路由：`/rss.xml`、`/articles/rss.xml`、`/events/rss.xml`、`/geekdaily/rss.xml`、`/who-is-hiring/rss.xml`、`/robots.txt`、`/sitemap.xml`、`/healthz`

整体来看，前台已经不是“页面占位”阶段，而是一个可运行、可静态构建、可产出 RSS 和 sitemap 的完整公共站点雏形。

## 本轮已完成的前台修正

### 1. 活动详情页改为日期前缀路由

已完成：

- 前台活动详情路径已统一为 `/events/{yyyy-mm-dd}-{slug}`。
- 活动详情页静态路由参数改为按日期前缀生成。
- 页面运行时可从日期前缀路由中解析出真实 `slug`，继续复用现有内容查询。
- 首页动态 feed 中的活动链接也已在前台侧做兼容转换，避免继续输出旧格式链接。
- 对应 smoke tests 已同步更新并通过。

涉及文件：

- `apps/web/src/lib/paths.ts`
- `apps/web/src/pages/events/[slug].astro`
- `apps/web/src/lib/content.ts`
- `tests/smoke/routes.spec.ts`
- `tests/smoke/feeds.spec.ts`

说明：

- 当前仓库里的 GeekDaily 路由约定已是 `geekdaily-{episodeNumber}`，本轮没有改动该约定，以避免和现有共享层实现冲突。
- 本轮只在前台做了活动路由兼容，未改动后台公共 API 的输出结构。

### 2. Markdown 渲染增加安全兜底

已完成：

- `renderMarkdown()` 不再通过简单字符串替换处理链接。
- 改为使用 `marked.Renderer` 对链接和图片进行集中渲染控制。
- 仅允许 `http:`、`https:`、`mailto:` 和相对路径。
- 对外部 `http/https` 链接统一补充 `target="_blank"` 与 `rel="noreferrer noopener"`。
- 非安全链接会降级为纯文本，避免将危险协议直接注入到页面中。

涉及文件：

- `apps/web/src/lib/markdown.ts`
- `apps/web/src/components/MarkdownContent.astro`

### 3. 招聘详情页补齐可选字段降级

已完成：

- 仅在 `job.contactValue` 存在时输出联系方式。
- 仅在 `job.applyUrl` 存在时输出外部投递链接。
- `applyNote` 为空时会根据数据情况自动回退为“请通过下方外部链接投递”或“请通过下方联系方式投递”。

涉及文件：

- `apps/web/src/pages/who-is-hiring/[slug].astro`

### 4. GeekDaily 搜索文案与实际能力对齐

已完成：

- 首页搜索框 placeholder 和帮助文案已去掉“支持按日期搜索”的承诺。
- smoke test 已改为根据页面初始结果数动态断言，避免未来 seed 数量变化导致误报。

涉及文件：

- `apps/web/src/pages/geekdaily/index.astro`
- `tests/smoke/geekdaily.spec.ts`

### 5. 站点语言标记改为中文

已完成：

- 根节点 `lang` 已从 `en` 调整为 `zh-CN`，与当前页面内容语言保持一致。

涉及文件：

- `apps/web/src/layouts/BaseLayout.astro`

## 仍建议后续处理的项

### P1：SEO 字段仍未从后台内容链路接到前台

现状：

- 前台页面已有 title、description、canonical、OG/Twitter 元数据能力。
- 但内容层中的 `seoTitle` / `seoDescription` 仍未通过公共 API 与类型定义传递到 `apps/web`。
- 这意味着编辑侧暂时还不能真正控制文章、活动、招聘、About 页的 SEO 文案。

建议：

1. 在公共 API payload 和 `@rebase/types` 中补充 SEO 字段。
2. 前台详情页优先使用 SEO 字段，缺失时再回退到标题与摘要。
3. 这一项需要联动 `apps/api` 与共享类型，建议和后台 agent 协同安排。

### P1：GeekDaily 若要支持“按日期搜索”，仍需补索引能力

现状：

- 本轮只是修正文案，避免前台误导用户。
- 如果产品仍希望保留“按日期搜索”，则需要在搜索索引中加入标准化日期 token。

建议：

1. 在搜索文档中加入如 `2026-04-25`、`2026/04/25`、`2026 04 25` 等日期形式。
2. 为日期搜索补一条 smoke test，防止文案和能力再次漂移。
3. 这一项同样需要联动后端搜索索引生成逻辑。

### P2：日期展示建议统一时区策略

现状：

- 前台不同位置对日期的格式化语义并不完全一致。
- 构建环境变化时，日期边界理论上仍可能出现时区偏移问题。

建议：

1. 明确前台统一展示时区，例如固定为 `Asia/Shanghai`。
2. 将 `formatDate()`、`formatEventWindow()` 及 GeekDaily 页面中的日期格式化统一到同一 helper。

## 自动化验证结果

### 已通过

- `pnpm --filter @rebase/web check`
- `pnpm --filter @rebase/web build`
- `pnpm test:smoke`

### 结果说明

- 本轮前台修改完成后，前台类型检查、静态构建和 smoke tests 均已通过。
- 前一轮报告中提到的活动路由失败、GeekDaily 总量硬编码问题，当前已消除。
- `/healthz` smoke test 当前也已通过，说明测试基线与当前实现处于一致状态。

## 结论

`apps/web` 当前已经具备完整可运行的公共站点形态，而且这轮前台修正后，活动详情 URL 规范、Markdown 链接安全、招聘详情降级处理、GeekDaily 搜索文案和语言标记这些明显问题都已经收敛。

如果继续往下推进，下一批最值得做的事情是：

1. 把 SEO 字段从后台内容链路接到前台页面。
2. 决定 GeekDaily 是否真的要支持按日期搜索；如果要，就补索引与测试。
3. 统一前台日期格式化的时区策略，减少构建环境差异带来的展示漂移。
