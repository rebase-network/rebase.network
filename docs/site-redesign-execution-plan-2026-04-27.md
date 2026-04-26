# Rebase.network UI/UX 与视觉整改整合执行计划

日期：2026-04-27

依据：

- `docs/site-ux-review-2026-04-27.md`
- `docs/site-ux-improvement-plan-2026-04-27.md`
- `docs/site-visual-style-review-2026-04-27.md`
- `docs/site-visual-style-improvement-plan-2026-04-27.md`

目标：合并 UI/UX 修复和视觉风格整改，形成一次可执行的开发计划。最终效果由后续人工验收，本轮开发以自动化测试和本地构建通过作为完成标准。

## 执行策略

本轮不做推倒重来，而是以现有 Astro 页面和组件为基础，完成一轮“社区化、轻量化、可用性修复”。

优先级：

1. 修复会误导用户或影响基础浏览的问题。
2. 收敛过严肃、过产品化的视觉元素。
3. 优化详情页阅读效率和列表页内容密度。
4. 增加自动化测试覆盖，确保后续可持续迭代。

## 开发批次

### Phase 1：基础信任与交互修复

包含：

- 活动历史卡片不再显示“立即报名”。
- 活动详情页过去活动不显示报名型主 CTA。
- 招聘公司名占位值清洗。
- 招聘投递文案从“报名”改为“投递/联系”。
- GeekDaily 未上线“推荐内容”入口移除按钮样式。
- Footer 社交链接保留可访问名称。

关键文件：

- `EventCard.astro`
- `events/[slug].astro`
- `JobCard.astro`
- `who-is-hiring/[slug].astro`
- `geekdaily/index.astro`
- `SiteFooter.astro`

### Phase 2：视觉系统轻量化

包含：

- 降低全局 card 阴影、blur 和 hover 位移。
- Header 和 SectionHeader 轻量化。
- 卡片元信息去 uppercase 化。
- 列表页 hero 水印弱化或移除。
- 首页动态区从重面板转为浅色社区公告板。

关键文件：

- `global.css`
- `SiteHeader.astro`
- `SectionHeader.astro`
- `ArticleCard.astro`
- `EventCard.astro`
- `GeekDailyCard.astro`
- `JobCard.astro`
- `index.astro`

### Phase 3：栏目页和详情页结构优化

包含：

- 文章、活动、贡献者、招聘页面 H1 收敛为短栏目名。
- 文章 spotlight 增加摘要。
- 文章正文 H1 自动降级或隐藏重复 H1。
- 详情页侧栏改为浅色辅助区。
- 详情页减少首屏重复元信息。

关键文件：

- `articles/index.astro`
- `events/index.astro`
- `contributors.astro`
- `who-is-hiring/index.astro`
- `articles/[slug].astro`
- `events/[slug].astro`
- `who-is-hiring/[slug].astro`
- `MarkdownContent.astro` 如需要处理 heading。

### Phase 4：归档与社区感优化

包含：

- GeekDaily 分页改为真实链接并保留 JS 增强。
- 活动历史按年份分组或先限制首屏历史数量。
- 贡献者页首屏拆分参与路径。
- 贡献者缺头像 fallback 更克制。
- 同一贡献者在展示层尽量去重或降低重复感。

关键文件：

- `geekdaily/index.astro`
- `events/index.astro`
- `contributors.astro`
- `ContributorCard.astro`
- `lib/content.ts`

### Phase 5：测试与验收保障

包含：

- 新增或更新 Playwright smoke 测试。
- 验证关键页面可打开。
- 验证活动历史 CTA、招聘占位公司名、GeekDaily 分页链接、RSS/sitemap 状态。
- 运行 lint、typecheck、build、smoke。

关键文件：

- `tests/smoke/*`
- `playwright.config.js` 如需要最小修复。

## 验收标准

功能：

- 历史活动不显示报名型 CTA。
- GeekDaily 分页可以通过 URL 浏览。
- 招聘占位公司名不直接显示 `/`。
- RSS/sitemap 路由构建通过，自动化测试可访问。
- 文章详情正文不出现重复 H1 视觉问题。

视觉：

- 首页不再像严肃产品官网，动态区更像社区公告板。
- 栏目页 H1 简短，列表内容更早出现。
- 普通卡片不再大面积强阴影上浮。
- 详情页侧栏不再是深色 dashboard 面板。
- 中文元信息更自然。

测试：

- `pnpm typecheck` 通过。
- `pnpm lint` 通过。
- `pnpm build` 通过。
- `pnpm test:smoke` 或本轮新增 smoke 测试通过。

## 风险与处理

- 样式分散：优先改全局 token，再局部覆盖高影响页面。
- GeekDaily 有 SSR markup 和 JS 字符串模板两套结构：改分页时必须同步两边。
- 内容由 API 返回，缺字段和长文本需要 fallback。
- 视觉验收有主观性，本轮以“降低严肃感和产品感”为明确方向，不追求最终稿一次定版。

## 本轮开发范围

本轮会实现 Phase 1 到 Phase 5 中可在当前仓库内完成的整改。依赖后台内容运营的数据清洗项，会在前端做安全 fallback，同时保留文档中的内容侧建议。
