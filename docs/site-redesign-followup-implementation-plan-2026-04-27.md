# Rebase.network 二次整改修改计划

日期：2026-04-27

依据：

- `docs/site-redesign-followup-fix-plan-2026-04-27.md`
- `docs/site-redesign-execution-plan-2026-04-27.md`
- `docs/site-redesign-test-plan-2026-04-27.md`
- `apps/web/design_principles.md`
- `apps/web/DESIGN.md`

目标：把二次修复方案拆解为可执行的代码修改计划。本文只定义开发顺序、改动边界、提交拆分和验收要求，不直接替代具体实现。

## 总体策略

第二轮整改不再扩大视觉重构范围，优先解决会阻塞验收的真实问题。

执行顺序：

1. 先修测试数据和 smoke 测试，让自动化验收重新可信。
2. 再修 GeekDaily 搜索首屏和活动状态兜底，避免核心功能在低 JS 或脏数据下失真。
3. 最后收敛详情页重复信息、招聘联系动作和剩余重视觉元素。

不建议在本轮新增复杂系统：

- 不新增第三方搜索服务。
- 不引入截图级视觉回归平台。
- 不重构活动、招聘、贡献者的数据模型。
- 不重做整站主题，只处理和本轮验收相关的视觉问题。

## 修改批次

| 批次 | 目标 | 包含问题 | 完成后信号 |
| --- | --- | --- | --- |
| Batch A | 建立稳定本地数据和自动化测试基线 | F-01、F-02 | `pnpm test:smoke` 不再因 seed 缺失或路由假设失败 |
| Batch B | 修核心功能兜底 | F-03、F-04 | GeekDaily 搜索可 SSR 首屏，历史活动不误导报名 |
| Batch C | 收敛信息架构和社区视觉 | F-05、F-06、F-07 | 详情页更轻，招聘动作更清晰，contributors/jobs 不再偏重 |
| Batch D | 最终验证与记录 | 全部 | typecheck、lint、build、smoke 通过或记录明确环境阻塞 |

## Batch A：测试数据和自动化基线

### A1. 补充 GeekDaily 本地 fixture

对应问题：F-01

改动目标：

- `pnpm local:bootstrap` 后本地 GeekDaily 不为空。
- 即使没有外部 archive 文件，也有稳定的 baseline episodes 供开发和 smoke 测试使用。
- 保留 `geekdaily-1915`，兼容已有测试和人工验收路径。

建议改动：

1. 检查现有 seed 流程是否已经读取 GeekDaily archive。
2. 当 archive 缺失或解析结果为 0 时，插入 3-5 条 baseline episodes。
3. baseline 数据应覆盖：
   - `geekdaily-1915`
   - 至少 1 条不同年份数据
   - 至少 1 条带 tag 的数据
   - 至少 1 条包含推荐条目和来源链接的数据
4. seed 输出中区分 archive 和 fixture 来源，便于排查。

主要文件：

- `packages/db/src/seed.ts`
- `scripts/seed/baseline-data.mjs`
- `packages/db/src/schema/*`
- `apps/api/src/routes/public.ts`，仅在需要确认读取字段时修改

验收标准：

- `pnpm local:bootstrap` 输出 `geekdailyEpisodes >= 3`。
- `/api/public/v1/geekdaily/archive?page=1&pageSize=10` 返回非空 `data` 和正确 `meta`。
- `http://127.0.0.1:4321/geekdaily` 显示至少 3 期。
- `http://127.0.0.1:4321/geekdaily/geekdaily-1915` 返回 200。
- `http://127.0.0.1:4321/geekdaily/rss.xml` 包含至少一个 `<item>`。

建议提交：

```bash
git commit -m "fix(seed): include baseline geekdaily fixtures"
```

### A2. 稳定 smoke 测试路径和数据假设

对应问题：F-02

改动目标：

- smoke 测试不依赖线上数据。
- smoke 测试路径和当前真实 URL 规则一致。
- 文案调整不会导致无关失败。

建议改动：

1. 用当前真实 URL 规则更新测试路径。
   - articles：`/articles/{publicNumber}-{slug}`
   - events：`/events/{publicNumber}-{slug}`
   - who-is-hiring：`/who-is-hiring/{publicNumber}-{slug}`
   - GeekDaily：`/geekdaily/geekdaily-{episodeNumber}`
2. 增加数据前置断言。
   - articles > 0
   - events > 0
   - jobs > 0
   - geekdaily > 0
3. 对核心文案使用短语义断言，不使用整段长文案断言。
4. GeekDaily 测试覆盖列表、详情、搜索、分页、RSS。
5. 如果 seed 数据缺失，测试应明确指向 seed 问题，而不是只报页面 404。

主要文件：

- `tests/smoke/routes.spec.ts`
- `tests/smoke/geekdaily.spec.ts`
- `tests/smoke/feeds.spec.ts`
- `tests/smoke/ops.spec.ts`
- `apps/web/src/lib/paths.ts`，仅用于对齐规则，不应随意修改路径定义

验收标准：

- `pnpm test:smoke` 可在本地 bootstrap 数据上稳定运行。
- 测试失败信息能区分数据缺失、路由错误和页面渲染错误。
- 轻微文案调整不会破坏无关测试。

建议提交：

```bash
git commit -m "test(smoke): stabilize public route coverage"
```

## Batch B：核心功能兜底

### B1. GeekDaily 搜索支持 SSR 首屏

对应问题：F-03

改动目标：

- `/geekdaily?q=1915` 在服务端首屏就是搜索结果。
- 禁用 JS 或只读取 HTML 时，页面语义仍然正确。
- 客户端搜索继续作为增强能力存在。

建议改动：

1. 在 `apps/web/src/pages/geekdaily/index.astro` 读取 `q`、`tag`、`year`、`page` 参数。
2. `q` 存在时，服务端调用搜索或 archive 查询逻辑并渲染初始结果。
3. 初始状态展示搜索条件和数量，例如 `找到 N 期`、`搜索“xxx”`。
4. 保持客户端脚本接管后续搜索、筛选和分页。
5. SSR 失败时展示明确错误状态，不静默回落成默认列表。

主要文件：

- `apps/web/src/pages/geekdaily/index.astro`
- `apps/web/src/lib/content.ts`
- `apps/web/src/pages/api/geekdaily-search.json.ts`
- `apps/api/src/routes/public.ts`

验收标准：

- `/geekdaily?q=1915` 首屏 HTML 含有对应结果或明确空状态。
- `/geekdaily?q=1915&page=1` URL 可复制、刷新后仍保持结果。
- `q + tag + year + page` 组合不会破坏分页 meta。
- 客户端搜索和 SSR 搜索空状态文案一致。

建议提交：

```bash
git commit -m "fix(geekdaily): render query results on first request"
```

### B2. 活动状态按时间兜底派生

对应问题：F-04

改动目标：

- 前端不再完全信任后端 `status`。
- 历史活动即使数据状态仍是 `upcoming`，也不会显示报名型 CTA。
- 活动卡片、活动详情和首页活动入口使用同一套状态规则。

建议改动：

1. 新增或补充活动状态 helper。
2. 输入字段：
   - `status`
   - `startAt`
   - `endAt`
   - `registrationUrl`
3. 输出字段：
   - `isPast`
   - `isUpcoming`
   - `canRegister`
   - `statusLabel`
   - `actionLabel`
4. 判断规则：
   - `endAt < now` 时强制历史状态。
   - 无 `endAt` 时用 `startAt < now` 作为兜底。
   - `canRegister = !isPast && Boolean(registrationUrl)`。
   - 历史活动使用 `查看回顾`、`查看活动记录` 或中性链接文案。

主要文件：

- `apps/web/src/lib/events.ts` 或新增 `apps/web/src/lib/eventStatus.ts`
- `apps/web/src/components/EventCard.astro`
- `apps/web/src/pages/events/[slug].astro`
- `apps/web/src/pages/events/index.astro`
- `apps/web/src/pages/index.astro`

验收标准：

- 本地构造一个过去时间但 status 为 `upcoming` 的活动，页面仍显示历史状态。
- 过去活动不显示 `立即报名`。
- 未来活动且有 `registrationUrl` 时显示报名入口。
- 未来活动但无 `registrationUrl` 时显示查看详情或关注后续。

建议提交：

```bash
git commit -m "fix(events): derive public status from event dates"
```

## Batch C：信息架构和视觉收敛

### C1. 减少详情页元信息重复

对应问题：F-05

改动目标：

- 详情页首屏减少重复 meta。
- 主正文更早出现。
- 侧栏只保留操作、订阅、相关内容等辅助任务。

建议改动：

1. 文章详情：
   - hero 保留发布时间、作者、阅读时长。
   - 删除正文前重复 lead meta。
   - 侧栏只放 tags、订阅、返回列表、延伸阅读。
2. 活动详情：
   - hero 保留时间、地点、状态和主操作。
   - 删除正文前重复时间/地点/status lead。
   - 侧栏保留报名或历史链接、RSS、相关活动。
3. 招聘详情：
   - 正文前保留岗位核心信息。
   - 侧栏只放投递/联系和相关岗位。

主要文件：

- `apps/web/src/pages/articles/[slug].astro`
- `apps/web/src/pages/events/[slug].astro`
- `apps/web/src/pages/who-is-hiring/[slug].astro`
- `apps/web/src/styles/global.css`

验收标准：

- 同一元信息不在 hero、正文 lead、侧栏三处重复。
- 移动端正文开始位置比整改前更靠前。
- 侧栏仍能完成订阅、返回、联系或查看相关内容等任务。

建议提交：

```bash
git commit -m "refactor(web): reduce detail metadata repetition"
```

### C2. 招聘联系动作更明确

对应问题：F-06

改动目标：

- 没有 `applyUrl` 但有联系方式时，用户知道下一步要怎么联系。
- 不再把所有招聘动作都叫“立即投递”或套用活动语境。

建议改动：

1. 根据联系方式类型生成动作文案。
   - 邮箱：`发送邮件`
   - Telegram：`打开 Telegram`
   - URL：`查看原始招聘信息`
   - 纯文本：`联系招聘方`
2. 保留静态联系方式，避免用户无法复制。
3. 过期岗位弱化主操作，并提示先确认岗位状态。
4. 卡片页如果只展示联系摘要，避免使用“报名”或类似活动文案。

主要文件：

- `apps/web/src/pages/who-is-hiring/[slug].astro`
- `apps/web/src/components/JobCard.astro`，仅在列表卡片需要同步文案时修改

验收标准：

- contact-only 岗位详情页存在明确行动说明。
- 页面不出现 `报名表单` 等活动语境文案。
- 过期岗位不会被强 CTA 误导。

建议提交：

```bash
git commit -m "fix(hiring): clarify contact-only application flow"
```

### C3. 贡献者和招聘残留重视觉收敛

对应问题：F-07

改动目标：

- contributors 和 jobs 页面更像社区信息页，不像营销型页面。
- 移除或弱化仍然偏重的英文水印和强阴影。
- 保持页面层级清晰，不把所有视觉层级抹平。

建议改动：

1. 移除 contributors hero 的 `PEOPLE` 水印。
2. 移除或极弱化 jobs hero 的 `HIRING` 水印。
3. 贡献者 group block 降低阴影或改成轻边框。
4. 招聘风险提示改成轻提示模块，避免在 hero 中承担过多解释。
5. 检查 `global.css` 中与 contributors/jobs 相关的阴影、hover 和大字装饰。

主要文件：

- `apps/web/src/pages/contributors.astro`
- `apps/web/src/pages/who-is-hiring/index.astro`
- `apps/web/src/styles/global.css`

验收标准：

- contributors 首屏无明显 `PEOPLE` 英文水印。
- jobs 首屏无明显 `HIRING` 英文水印，或其存在感很弱。
- 页面视觉仍符合 `apps/web/DESIGN.md` 中的 warm、editorial、community-media 方向。

建议提交：

```bash
git commit -m "refactor(web): soften remaining archive visuals"
```

## Batch D：最终验证

### D1. 基础质量检查

每个代码批次完成后至少运行：

```bash
pnpm typecheck
pnpm lint
pnpm build
```

通过标准：

- TypeScript/Astro 无错误。
- lint 无错误。
- Web 和 API 构建不回退。

### D2. 本地完整 smoke

最终运行：

```bash
pnpm local:bootstrap
pnpm test:smoke
```

必须覆盖：

- `/`
- `/about`
- `/articles`
- 文章详情页
- `/events`
- 活动详情页
- `/who-is-hiring`
- 招聘详情页
- `/contributors`
- `/geekdaily`
- `/geekdaily?q=1915`
- `/geekdaily/geekdaily-1915`
- `/rss.xml`
- `/articles/rss.xml`
- `/events/rss.xml`
- `/who-is-hiring/rss.xml`
- `/geekdaily/rss.xml`
- `/sitemap.xml`
- `/robots.txt`

### D3. 人工验收前自查

交付前快速确认：

- GeekDaily 本地列表、搜索、详情、RSS 都有真实内容。
- 过去活动没有报名型 CTA。
- 详情页正文位置更靠前，元信息没有明显堆叠。
- 招聘详情对 contact-only 场景有明确下一步。
- contributors/jobs 首屏不再显得严肃、厚重或营销化。

## 建议提交顺序

建议按以下顺序拆分 commit，便于回滚和 review：

1. `fix(seed): include baseline geekdaily fixtures`
2. `test(smoke): stabilize public route coverage`
3. `fix(geekdaily): render query results on first request`
4. `fix(events): derive public status from event dates`
5. `refactor(web): reduce detail metadata repetition`
6. `fix(hiring): clarify contact-only application flow`
7. `refactor(web): soften remaining archive visuals`
8. `test(web): verify followup redesign fixes`

如果某两个小改动强相关，可以合并，但不要把 seed、功能修复、视觉收敛混在同一个 commit 中。

## 风险与处理

| 风险 | 影响 | 处理方式 |
| --- | --- | --- |
| GeekDaily schema 与 fixture 字段不一致 | seed 失败或页面空数据 | 先从 schema 和 API 返回结构反推最小字段 |
| smoke 测试仍依赖具体文案 | 后续内容调整误伤测试 | 改成结构、状态和核心短语断言 |
| SSR 搜索与客户端搜索结果不一致 | 刷新前后页面跳变 | 共用 content helper 或统一 API 参数 |
| 活动时间解析时区不一致 | 历史/未来状态误判 | 使用 ISO 时间并在 helper 单测或 smoke 场景中覆盖边界 |
| 视觉继续局部加重 | 社区感改版不彻底 | 只保留必要层级，减少水印、强阴影和厚重 hero |

## 本轮完成定义

第二轮整改完成时应满足：

- 所有 F-01 到 F-07 均已实现或记录明确不能实现的原因。
- 对应 markdown 文档已补充最终验证结果。
- `pnpm typecheck` 通过。
- `pnpm lint` 通过。
- `pnpm build` 通过。
- `pnpm test:smoke` 通过，或记录明确环境阻塞且非代码原因。
- 代码已按 coherent batch 提交并推送到 `origin/dev`。
