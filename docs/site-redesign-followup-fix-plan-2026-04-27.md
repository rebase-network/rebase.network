# Rebase.network 整改结果复核后的修复方案

日期：2026-04-27

依据：

- 第一轮整改实施结果
- 只读审阅 agent 复核结论
- `docs/site-redesign-execution-plan-2026-04-27.md`
- `docs/site-redesign-test-plan-2026-04-27.md`

目标：针对第一轮整改后仍未满足验收的项目，整理第二轮修复方案。本文只定义修复策略和验收标准，不直接修改代码。

## 总体结论

第一轮整改方向正确，已经完成活动 CTA、招聘占位公司名、卡片轻量化、栏目标题收敛、浅色详情侧栏、贡献者入口等主要工作。

但当前仍不建议通过最终验收，主要阻塞是：

1. GeekDaily 本地数据链路为空，导致列表、详情、RSS、测试都无法稳定验证。
2. Smoke 测试仍依赖不稳定或不匹配当前路由的数据假设。
3. GeekDaily `q` 参数仍不是服务端首屏结果。
4. 详情页元信息重复仍然存在。
5. 活动状态判断仍主要依赖后端 `status`，缺少前端时间兜底。
6. 贡献者和招聘局部视觉仍偏重。

第二轮应先解决测试和数据阻塞，再继续做体验细节收敛。

## 优先级总览

| 编号 | 问题 | 优先级 | 类型 | 建议处理批次 |
| --- | --- | --- | --- | --- |
| F-01 | GeekDaily 本地 seed/测试数据为空 | P0 | 数据/测试阻塞 | Batch A |
| F-02 | Smoke 测试路径和数据假设不稳定 | P0 | 自动化测试 | Batch A |
| F-03 | GeekDaily `q` 参数不支持 SSR 首屏 | P1 | 功能/可访问性 | Batch B |
| F-04 | 活动状态缺少时间兜底派生 | P1 | 功能/信任 | Batch B |
| F-05 | 详情页元信息仍重复 | P2 | 信息架构 | Batch C |
| F-06 | 招聘联系方式无明确“联系招聘方”操作 | P2 | UX 文案/动作 | Batch C |
| F-07 | 贡献者/招聘局部视觉仍偏重 | P2 | 视觉风格 | Batch C |

## Batch A：测试环境与自动化稳定性

### F-01 GeekDaily 本地 seed/测试数据为空

现状：

- `pnpm local:bootstrap` 成功后输出 `geekdailyEpisodes: 0`。
- `/geekdaily` 显示 `共 0 期`。
- `/geekdaily/geekdaily-1915` 返回 404。
- `/geekdaily/rss.xml` 没有 `<item>`。

影响：

- 无法验证 GeekDaily 列表、分页、搜索、详情、RSS。
- Smoke 测试无法稳定运行。
- 与 V1 “GeekDaily 历史可浏览、可搜索、可订阅”的核心目标冲突。

推荐方案：

1. 为本地 seed 增加最小 GeekDaily fixture。
   - 不依赖外部 `geekdaily.csv` 时，也至少插入 3-5 期稳定测试数据。
   - 固定包含 `geekdaily-1915`，以兼容现有 smoke 测试。
   - 每期至少包含标题、摘要、日期、编辑、标签、推荐条目和来源链接。
2. 如果不希望污染生产 seed 逻辑，可将 fixture 作为本地/测试 fallback。
   - 例如在 `packages/db/src/seed.ts` 中检测 archive 缺失时插入 baseline episodes。
   - 或为 smoke 测试单独准备 seed helper。
3. 在 `pnpm local:bootstrap` 输出中明确区分：
   - `geekdailyEpisodesFromArchive`
   - `geekdailyEpisodesFromFixture`

涉及文件：

- `packages/db/src/seed.ts`
- `scripts/seed/baseline-data.mjs`
- `packages/db/src/schema/*`
- `apps/api/src/routes/public.ts` 如需确认公开读取逻辑
- `tests/smoke/geekdaily.spec.ts`

验收标准：

- `pnpm local:bootstrap` 后 `geekdailyEpisodes >= 3`。
- `http://127.0.0.1:4321/geekdaily` 默认展示至少 3 期。
- `http://127.0.0.1:4321/geekdaily/geekdaily-1915` 返回 200。
- `http://127.0.0.1:4321/geekdaily/rss.xml` 包含 `<item>`。
- `/api/public/v1/geekdaily/archive?page=1&pageSize=10` 返回非空 `data` 和正确 `meta`。

建议提交：

- `fix(seed): include baseline geekdaily fixtures`

### F-02 Smoke 测试路径和数据假设不稳定

现状：

- `tests/smoke/routes.spec.ts` 中存在不匹配当前 URL 规则的路径，例如文章详情应带 public number。
- GeekDaily 测试假设 `geekdaily-1915` 存在，但本地 seed 可能为空。
- 测试断言部分依赖具体文案，后续内容调整容易误伤。

影响：

- 自动化测试不能作为可信验收信号。
- 视觉或文案小改可能导致不必要失败。

推荐方案：

1. 统一使用当前真实 URL 规则。
   - 文章：`/articles/{publicNumber}-{slug}`。
   - 活动：`/events/{publicNumber}-{slug}`。
   - 招聘：`/who-is-hiring/{publicNumber}-{slug}`。
   - GeekDaily：`/geekdaily/geekdaily-{episodeNumber}`。
2. Smoke 测试数据应来自稳定 seed fixture。
3. 对文案断言采用“核心语义”而不是长句全文。
4. 增加一组数据可用性前置断言：
   - articles > 0
   - jobs > 0
   - events > 0
   - geekdaily > 0
5. 如果 GeekDaily archive 没有导入，应测试明确失败并提示 seed 问题，而不是页面 404 后误判组件问题。

涉及文件：

- `tests/smoke/routes.spec.ts`
- `tests/smoke/geekdaily.spec.ts`
- `tests/smoke/feeds.spec.ts`
- `tests/smoke/ops.spec.ts`

验收标准：

- `pnpm test:smoke` 不依赖线上数据。
- 测试路径与 `apps/web/src/lib/paths.ts` 一致。
- GeekDaily smoke 可稳定验证列表、详情、搜索、分页、RSS。
- 文案轻微调整不导致无关失败。

建议提交：

- `test(smoke): stabilize public route coverage`

## Batch B：核心功能兜底

### F-03 GeekDaily `q` 参数支持 SSR 首屏

现状：

- `/geekdaily?q=1915` 依赖客户端 JS hydrate 后加载搜索数据。
- 无 JS 时首屏仍是默认 archive 或空 archive。

影响：

- URL 虽然可复制，但服务端首屏不是真实搜索结果。
- SEO、辅助技术、低 JS 环境下发现能力不足。

推荐方案：

1. 在 Astro 页面读取 `q` 参数。
2. 如果 `q` 存在，服务端调用公开 API 搜索端点，返回首屏搜索结果。
3. 初始页面状态显示：
   - `找到 N 期`
   - `当前条件：搜索“xxx”`
4. 客户端脚本继续接管后续交互，但不改变首屏语义。
5. 若搜索 API 响应失败，显示明确错误状态，而不是回落到默认列表。

涉及文件：

- `apps/web/src/pages/geekdaily/index.astro`
- `apps/web/src/lib/content.ts`
- `apps/web/src/pages/api/geekdaily-search.json.ts`
- `apps/api/src/routes/public.ts`

验收标准：

- 禁用 JS 或只看 HTML 时，`/geekdaily?q=1915` 包含搜索结果或明确空状态。
- `q + tag + year + page` 可组合。
- 客户端搜索仍可用。
- 空结果 SSR 和客户端空结果文案一致。

建议提交：

- `fix(geekdaily): render query results on first request`

### F-04 活动状态按时间兜底派生

现状：

- 前端主要信任 `event.status === 'upcoming'`。
- 如果后端 status 数据滞后，历史活动仍可能显示报名型 CTA。

影响：

- “往期活动 + 立即报名”的问题可能回归。
- 活动页可信度依赖数据人工维护准确性。

推荐方案：

1. 增加前端状态 helper。
   - 输入：`event.status`、`event.startAt`、`event.endAt`、`event.registrationUrl`。
   - 输出：`isPast`、`isUpcoming`、`canRegister`、`statusLabel`、`actionLabel`。
2. 判断规则：
   - `endAt < now` 时强制 `isPast = true`。
   - `canRegister = !isPast && Boolean(registrationUrl)`。
   - 历史活动链接文案为“查看回顾”或“历史活动链接”。
3. `EventCard`、`events/[slug].astro`、首页活动卡片如复用，应使用同一 helper。

涉及文件：

- `apps/web/src/lib/events.ts` 或新增 `apps/web/src/lib/eventStatus.ts`
- `apps/web/src/components/EventCard.astro`
- `apps/web/src/pages/events/[slug].astro`
- `apps/web/src/pages/events/index.astro`
- `apps/web/src/pages/index.astro`

验收标准：

- 修改本地种子中一个活动为过去时间但 status 仍为 upcoming 时，前端仍显示历史状态。
- 过去活动不显示“立即报名”。
- 未开始且有 registrationUrl 的活动显示“立即报名”。
- 无 registrationUrl 的未来活动显示“查看详情”。

建议提交：

- `fix(events): derive public status from event dates`

## Batch C：体验和视觉收敛

### F-05 详情页元信息去重

现状：

- 文章详情页发布时间、作者、阅读时长在 hero、正文 lead、侧栏重复。
- 活动详情页时间、地点、状态在 hero、正文 lead、侧栏重复。

影响：

- 正文被推远。
- 页面像资料面板堆叠，不像轻量阅读页。

推荐方案：

1. 文章详情：
   - Hero 保留发布时间、作者、阅读时长。
   - 删除正文前 `detail-body-lead`。
   - 侧栏“文章信息”改为只放 tags、订阅、返回列表、延伸阅读。
2. 活动详情：
   - Hero 保留时间、地点、状态和主 CTA。
   - 删除正文前重复 meta lead。
   - 侧栏保留报名/历史链接、RSS、相关活动，不重复所有 hero meta。
3. 招聘详情：
   - 保留正文前岗位核心信息。
   - 侧栏只放投递/联系和相关岗位。

涉及文件：

- `apps/web/src/pages/articles/[slug].astro`
- `apps/web/src/pages/events/[slug].astro`
- `apps/web/src/pages/who-is-hiring/[slug].astro`
- `apps/web/src/styles/global.css`

验收标准：

- 文章详情首屏附近同一元信息不重复出现。
- 活动详情时间/地点/状态不在 hero、正文 lead、侧栏三处重复。
- 移动端正文开始位置更靠前。
- 侧栏仍提供必要操作。

建议提交：

- `refactor(web): reduce detail metadata repetition`

### F-06 招聘联系方式操作更明确

现状：

- 只有联系方式、没有 `applyUrl` 时，详情页展示静态联系方式。
- 用户可能不清楚下一步是复制、联系还是回 GitHub 原帖。

影响：

- 招聘详情页的行动路径不够明确。

推荐方案：

1. 根据联系方式类型生成动作文案：
   - 邮箱：`发送邮件`
   - Telegram：`打开 Telegram`
   - URL：`查看原始招聘信息`
   - 纯文本：`联系招聘方`
2. 静态联系方式保留，但主操作区要有明确说明。
3. 不把所有情况都叫“立即投递”。

涉及文件：

- `apps/web/src/pages/who-is-hiring/[slug].astro`
- `apps/web/src/components/JobCard.astro` 如需要展示来源提示

验收标准：

- 没有 `applyUrl` 但有 `contactValue` 时，侧栏显示明确行动说明。
- 不出现“报名表单”。
- 已过期岗位仍弱化操作并提示先确认。

建议提交：

- `fix(hiring): clarify contact-only application flow`

### F-07 贡献者和招聘局部视觉继续收敛

现状：

- 贡献者页仍有 `PEOPLE` 英文水印。
- 部分 hero 或 group block 阴影仍偏强。
- 招聘 hero 仍有 `HIRING` 水印和偏重卡片感。

影响：

- 与“更贴近社区，不要太严肃”的方向仍有部分偏差。

推荐方案：

1. 移除 contributors hero 的 `PEOPLE` 水印。
2. 移除或极弱化 jobs hero 的 `HIRING` 水印。
3. 将贡献者 group block 阴影降到 `var(--shadow-soft)` 或无阴影。
4. 招聘页风险提示做成轻提示，不靠大段 hero 文案承担。

涉及文件：

- `apps/web/src/pages/contributors.astro`
- `apps/web/src/styles/global.css`
- `apps/web/src/pages/who-is-hiring/index.astro`

验收标准：

- contributors 和 jobs 首屏不再有明显英文品牌水印。
- 视觉更像社区信息页，而不是产品营销页。
- 页面层级仍清晰。

建议提交：

- `refactor(web): soften remaining archive visuals`

## 第二轮推荐执行顺序

1. F-01：补 GeekDaily seed fixture。
2. F-02：修 smoke 测试路径和数据假设。
3. 运行 `pnpm test:smoke`，先建立可靠测试基线。
4. F-03：补 GeekDaily SSR 搜索首屏。
5. F-04：活动状态时间兜底。
6. F-05/F-06/F-07：详情页和残留视觉收敛。
7. 再跑完整验证：`pnpm typecheck`、`pnpm lint`、`pnpm build`、`pnpm test:smoke`。

## 验收清单

第二轮完成后，必须满足：

- `pnpm local:bootstrap` 后本地 GeekDaily 非空。
- `/geekdaily`、`/geekdaily?q=1915`、`/geekdaily/geekdaily-1915` 均可用。
- `/geekdaily/rss.xml` 包含至少一个 item。
- Smoke 测试路径与实际 URL 规则一致。
- 历史活动即使 status 错误也不会显示“立即报名”。
- 文章和活动详情页重复 meta 明显减少。
- 贡献者/招聘首屏不再保留明显重视觉水印。
- `pnpm test:smoke` 可作为最终验收信号。

## 不建议本轮做的事

- 不重做 GeekDaily 搜索架构为第三方搜索。
- 不引入复杂截图视觉回归系统，先用 Playwright DOM 断言和人工验收。
- 不把贡献者页改成完整成员系统。
- 不把活动模块扩展为站内报名系统。
- 不继续扩大视觉重构范围，避免偏离“修复验收阻塞”的目标。
