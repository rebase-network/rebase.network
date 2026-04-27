# Rebase.network 社区化视觉整改执行结果

日期：2026-04-27

依据：

- `docs/site-community-visual-art-review-2026-04-27.md`
- `docs/site-community-visual-remediation-plan-2026-04-27.md`
- `docs/site-community-visual-implementation-plan-2026-04-27.md`
- `docs/site-community-visual-test-plan-2026-04-27.md`

目标：根据整站视觉效果和艺术风格复审结果，完成一轮低风险、可验证的社区化视觉整改，让站点更贴近“真实社区、持续更新、有人味”，减少过度正式和产品化的感受。

## 已完成文档

- `docs/site-community-visual-art-review-2026-04-27.md`
- `docs/site-community-visual-remediation-plan-2026-04-27.md`
- `docs/site-community-visual-implementation-plan-2026-04-27.md`
- `docs/site-community-visual-test-plan-2026-04-27.md`
- `docs/site-community-visual-implementation-results-2026-04-27.md`

## 已完成开发

### 贡献者数据真实化

- 将 10 个 GeekDaily 智囊团 fixture 成员从 `test geekdaily advisor xx` 改为更像真实社区成员的公开昵称、headline 和 bio。
- 将 10 个志愿者 fixture 成员从 `test volunteer xx` 改为更像真实社区成员的公开昵称、headline 和 bio。
- 保留 `slug` 和 `avatar_seed`，避免破坏测试定位和头像稳定性。

涉及文件：

- `scripts/seed/baseline-data.mjs`

### 首页统计区轻量化

- 缩小 `.meta-strip` 的间距、字号和内边距。
- 降低卡片边框、背景和阴影权重，让统计区更像社区小记而不是 dashboard。

涉及文件：

- `apps/web/src/styles/global.css`

### GeekDaily 控制区去空白

- 为 `.controls-grid` 增加 `align-items: start`，避免搜索卡片被筛选卡片拉高。

涉及文件：

- `apps/web/src/pages/geekdaily/index.astro`

### 招聘卡片社区公告板化

- 将 job facts 从三列表格改成横向可换行的信息片。
- 降低字段的表格感，同时保留薪资、模式、地点的扫读效率。

涉及文件：

- `apps/web/src/components/JobCard.astro`

### 详情页阅读节奏收敛

- 为 `.detail-shell` 增加 `align-items: start`，避免短正文卡片被侧栏拉高。
- 降低文章和活动详情 hero 标题尺寸，提高行高，让详情页更像阅读页而不是正式发布页。

涉及文件：

- `apps/web/src/styles/global.css`
- `apps/web/src/pages/articles/[slug].astro`
- `apps/web/src/pages/events/[slug].astro`

### 移动端导航可发现性

- 让移动端导航保持横向滚动。
- 增加右侧渐隐提示，降低“后续入口被截断”的误解。

涉及文件：

- `apps/web/src/components/SiteHeader.astro`

### 活动默认封面稳定性

- compact 活动卡片封面使用 eager 加载。
- 为默认封面补充柔和背景兜底，减少截图或弱网时的大块空白感。

涉及文件：

- `apps/web/src/components/EventCard.astro`

## 自动化验证

最终执行命令：

```bash
git diff --check
pnpm --filter @rebase/db typecheck
pnpm typecheck
pnpm lint
pnpm build
pnpm build:api
pnpm local:bootstrap
pnpm test:smoke
```

结果：

- `git diff --check` 通过。
- `pnpm --filter @rebase/db typecheck` 通过。
- `pnpm typecheck` 通过，Astro check 结果为 `0 errors / 0 warnings / 0 hints`。
- `pnpm lint` 通过。
- `pnpm build` 通过。
- `pnpm build:api` 通过。
- `pnpm local:bootstrap` 通过。
- `pnpm test:smoke` 通过，结果为 `50 passed`。

`pnpm local:bootstrap` 关键输出：

```json
{
  "articles": 3,
  "jobs": 13,
  "events": 13,
  "contributors": 24,
  "geekdailyEpisodes": 12,
  "geekdailySeedSource": "fixture",
  "geekdailyEpisodeItems": 13
}
```

## 截图抽查

临时截图目录：

```text
/tmp/rebase-community-visual-refresh-2026-04-27
```

已抽查：

- 首页 desktop/mobile
- GeekDaily desktop/mobile
- 招聘 desktop/mobile
- 贡献者 desktop/mobile
- 文章详情 desktop
- 活动详情 desktop
- 招聘详情 desktop

贡献者页 DOM 抽查结果：

```json
{
  "hasTestVolunteer": false,
  "hasTestAdvisor": false
}
```

说明：截图中出现的悬浮黑色工具条来自本地浏览器/测试环境叠层，不属于站点 DOM 或本次代码改动。

## 子代理说明

本轮曾尝试启动独立子代理参与审阅，但外部 relay 返回 `404 Not Found`，子代理未能产出结果。为避免阻塞，全流程改为本地继续推进，并通过 Playwright smoke 和截图抽查完成验证。

## 剩余风险

- 本轮没有新增永久视觉回归测试，视觉验证仍依赖 smoke、截图抽查和后续人工验收。
- 贡献者 fixture 已经去掉明显测试文案，但生产环境仍应以真实成员资料替换 fixture。
- `Who-Is-Hiring` 仍保留英文栏目名，这是既有信息架构的一部分；如果后续要进一步中文社区化，可以单独评估导航命名和 URL 保持策略。
