# Rebase.network 社区化视觉整改方案

日期：2026-04-27

依据：

- `docs/site-community-visual-art-review-2026-04-27.md`
- `apps/web/design_principles.md`
- `apps/web/DESIGN.md`

目标：针对当前整站视觉复审结果，提出可落地的社区化视觉整改方案，让站点更贴近“真实社区、持续更新、有人味”，同时保持可信和可读。

## 整改原则

1. 不做推倒重来，只做高影响低风险的视觉收敛。
2. 内容优先，减少装饰对首屏和列表的占用。
3. 保留温暖纸感和浅色卡片，但降低 dashboard、营销页和表格感。
4. 测试数据也要像真实社区内容，避免验收时出现明显假数据。
5. 移动端优先保证入口可见、文字可读、卡片不空。

## 整改项

### V-01 贡献者测试数据真实化

问题：贡献者测试成员直接显示 `test geekdaily advisor xx`、`test volunteer xx`。

方案：

- 将新增 10 个智囊团测试成员和 10 个志愿者测试成员改为更像真实社区成员的公开昵称。
- 保留 `slug` 和 `avatar_seed` 的稳定性，避免影响测试定位。
- headline 和 bio 保持短、具体、社区化。

涉及文件：

- `scripts/seed/baseline-data.mjs`

验收标准：

- 贡献者页不出现 `test geekdaily advisor` 或 `test volunteer` 文案。
- 极客日报智囊团仍有足够成员用于验收布局。
- 志愿者分组仍有足够成员用于验收首页与贡献者页布局。

优先级：P0

### V-02 首页统计区轻量化

问题：首页三张统计卡偏 dashboard。

方案：

- 将 `.meta-strip` 从大卡片指标改为轻量社区小记条。
- 降低数字字号和卡片阴影。
- 用更紧凑的内边距和浅色背景保留信息，但不抢内容流。

涉及文件：

- `apps/web/src/styles/global.css`

验收标准：

- 首页统计信息仍可见。
- 视觉上不再像数据 dashboard。

优先级：P1

### V-03 GeekDaily 搜索筛选区去空白

问题：搜索卡片被 grid 拉伸，与筛选卡片等高后出现大块空白。

方案：

- `.controls-grid` 设置 `align-items: start`。
- 搜索卡片只包裹输入控件，不占据筛选卡同等高度。

涉及文件：

- `apps/web/src/pages/geekdaily/index.astro`

验收标准：

- `/geekdaily` 搜索输入下方不再出现明显空白。
- 筛选区仍保持可用。

优先级：P1

### V-04 招聘卡片社区公告板化

问题：招聘卡片薪资/模式/地点三列表格过于正式。

方案：

- 将 job facts 从三列表格改为柔和信息片。
- 降低薪资数字权重。
- 让工作模式、地点、薪资更像社区公告的摘要信息，而不是招聘平台字段表。

涉及文件：

- `apps/web/src/components/JobCard.astro`

验收标准：

- 招聘列表仍能快速扫到薪资、模式、地点。
- 卡片视觉更接近社区信息板。

优先级：P1

### V-05 详情页 hero 和短内容空白收敛

问题：文章/活动详情 hero 偏正式，短正文卡片有拉伸空白。

方案：

- `.detail-shell` 设置 `align-items: start`，避免正文卡片被侧栏拉高。
- 文章、活动 detail hero 标题适当降低字号并提高行高。
- 保留 meta 和 CTA，不改变内容结构。

涉及文件：

- `apps/web/src/styles/global.css`
- `apps/web/src/pages/articles/[slug].astro`
- `apps/web/src/pages/events/[slug].astro`

验收标准：

- 短活动详情不再出现过大的正文空白。
- 长标题更像阅读页，不像会议官网。

优先级：P1

### V-06 移动端导航可发现性优化

问题：移动端导航横向内容被截断，可滚动但不明显。

方案：

- 在移动端让 nav 保持单行横向滚动。
- 增加边缘渐隐提示。
- 每个 nav item 保持 `white-space: nowrap`。

涉及文件：

- `apps/web/src/components/SiteHeader.astro`

验收标准：

- 390px 宽度下导航不换成拥挤多行。
- 用户能感知还可以横向浏览更多入口。

优先级：P1

### V-07 活动默认封面加载稳定性

问题：移动端 full-page 截图中，活动卡片默认封面容易表现为大块浅色空白。

方案：

- compact 活动卡片的默认封面改为 eager 加载。
- 默认封面保留背景色兜底。

涉及文件：

- `apps/web/src/components/EventCard.astro`

验收标准：

- 首页移动端活动卡片更稳定显示默认封面。
- 不影响非首屏大量图片的常规 lazy 策略。

优先级：P2

## 本轮不处理

- 不重做站点整体配色。
- 不替换 Rebase logo。
- 不加入大量插画或贴纸。
- 不修改数据模型和 API contract。
- 不做新栏目或内容运营后台能力。
