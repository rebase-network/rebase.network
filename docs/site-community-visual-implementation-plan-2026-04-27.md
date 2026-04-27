# Rebase.network 社区化视觉整改执行计划

日期：2026-04-27

依据：

- `docs/site-community-visual-art-review-2026-04-27.md`
- `docs/site-community-visual-remediation-plan-2026-04-27.md`
- `docs/site-redesign-followup-implementation-plan-2026-04-27.md`

目标：把本轮社区化视觉整改方案拆成可执行开发任务，明确文件范围、提交拆分和验收标准。

## 执行顺序

1. 先处理最影响真实社区感的数据展示问题。
2. 再处理全局布局和移动端入口问题。
3. 最后处理卡片、详情页和活动封面的视觉微调。
4. 完成后跑自动化测试，并补充执行结果记录。

## Batch A：真实社区感修复

### A1. 贡献者测试成员真实化

任务：

- 修改 10 个新增智囊团成员和 10 个志愿者成员的 `name`、`headline`、`bio`。
- 不改 `slug`，保持 seed 定位稳定。
- 不改变角色绑定数量。

文件：

- `scripts/seed/baseline-data.mjs`

验收：

- `pnpm local:bootstrap` 后 contributors 数量仍为 24。
- `geekdaily-advisors` 角色绑定人数仍不少于 12。
- 贡献者页不出现 `test geekdaily advisor` 或 `test volunteer`。

建议提交：

```bash
git commit -m "test(seed): make advisor fixtures feel realistic"
```

## Batch B：全局和移动端视觉收敛

### B1. 首页统计区轻量化

任务：

- 调整 `.meta-strip` 和 `.meta-strip .card`。
- 降低数字字号、阴影和卡片感。

文件：

- `apps/web/src/styles/global.css`

验收：

- 首页统计仍可扫读。
- 视觉更像社区小记，不像 dashboard。

### B2. 移动端导航横向可发现性

任务：

- 920px 以下 nav 改为单行横向滚动。
- 增加边缘渐隐提示。
- nav item 不换行。

文件：

- `apps/web/src/components/SiteHeader.astro`

验收：

- 390px 宽度导航不挤压、不换成多行。
- 可滚动入口有视觉提示。

建议提交：

```bash
git commit -m "refactor(web): soften community navigation and stats"
```

## Batch C：栏目和卡片微调

### C1. GeekDaily 控制区去空白

任务：

- `.controls-grid` 增加 `align-items: start`。

文件：

- `apps/web/src/pages/geekdaily/index.astro`

验收：

- 搜索卡片高度贴合内容。

### C2. 招聘卡片信息片化

任务：

- 将 `.job-facts` 从三列改成 flex chips。
- 降低 `dd` 的强视觉权重。

文件：

- `apps/web/src/components/JobCard.astro`

验收：

- 招聘信息仍完整。
- 页面不再像表格型招聘平台。

### C3. 活动封面加载稳定性

任务：

- compact 活动卡片图片使用 eager 加载。

文件：

- `apps/web/src/components/EventCard.astro`

验收：

- 首页活动卡片默认封面更稳定显示。

建议提交：

```bash
git commit -m "refactor(web): make archive cards feel more communal"
```

## Batch D：详情页阅读感收敛

任务：

- `.detail-shell` 增加 `align-items: start`。
- 降低文章、活动详情 hero 标题尺寸，提升行高。

文件：

- `apps/web/src/styles/global.css`
- `apps/web/src/pages/articles/[slug].astro`
- `apps/web/src/pages/events/[slug].astro`

验收：

- 详情页短正文卡片不被侧栏拉高。
- 文章和活动详情标题更自然。

建议提交：

```bash
git commit -m "refactor(web): soften detail page reading rhythm"
```

## Batch E：测试和记录

任务：

- 运行本地 bootstrap。
- 运行 typecheck、lint、build、smoke。
- 记录整改结果。

文件：

- `docs/site-community-visual-implementation-results-2026-04-27.md`

验收命令：

```bash
pnpm --filter @rebase/db typecheck
pnpm typecheck
pnpm lint
pnpm build
pnpm build:api
pnpm local:bootstrap
pnpm test:smoke
```

建议提交：

```bash
git commit -m "docs(web): record community visual refresh results"
```
