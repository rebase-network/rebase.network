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

### 6. 公共页面文案与日期展示进一步统一

已完成：

- 首页、列表页、详情页、导航、页脚与卡片组件中的主要公共文案已统一为中文表达。
- `SectionHeader` 默认跳转文案、404 页标题、RSS 入口、筛选器、分页器和详情侧栏标签已与当前中文站点语境对齐。
- 前台日期展示已统一固定到 `Asia/Shanghai`，减少不同构建环境导致的日期边界漂移。
- GeekDaily 归档页中的前端日期格式化也已和全站 helper 保持同一时区语义。
- 对应 smoke test 文案选择器已同步更新。

涉及文件：

- `apps/web/src/lib/dates.ts`
- `apps/web/src/components/SectionHeader.astro`
- `apps/web/src/components/ArticleCard.astro`
- `apps/web/src/components/EventCard.astro`
- `apps/web/src/components/JobCard.astro`
- `apps/web/src/components/ContributorCard.astro`
- `apps/web/src/components/GeekDailyCard.astro`
- `apps/web/src/components/SiteHeader.astro`
- `apps/web/src/components/SiteFooter.astro`
- `apps/web/src/layouts/BaseLayout.astro`
- `apps/web/src/pages/404.astro`
- `apps/web/src/pages/about.astro`
- `apps/web/src/pages/index.astro`
- `apps/web/src/pages/articles/index.astro`
- `apps/web/src/pages/articles/[slug].astro`
- `apps/web/src/pages/events/index.astro`
- `apps/web/src/pages/events/[slug].astro`
- `apps/web/src/pages/who-is-hiring/index.astro`
- `apps/web/src/pages/who-is-hiring/[slug].astro`
- `apps/web/src/pages/contributors.astro`
- `apps/web/src/pages/geekdaily/index.astro`
- `apps/web/src/pages/geekdaily/[slug].astro`
- `tests/smoke/geekdaily.spec.ts`

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

## 自动化验证结果

### 已通过

- `corepack pnpm --filter @rebase/web check`
- `corepack pnpm --filter @rebase/web build`
- `corepack pnpm test:smoke`

### 结果说明

- 本轮前台修改完成后，前台类型检查、静态构建和 smoke tests 均已通过。
- 在独立 worktree 中执行 smoke tests 时，需要补齐本地 `.env` 和未纳入 Git 的 `geekdaily.csv`；如果直接新建 worktree 而不带上该 CSV，seed 会出现 `geekdailyEpisodes: 0`，这属于本地验证环境差异，不是本轮前台改动引入的页面回归。
- 前一轮报告中提到的活动路由失败、GeekDaily 总量硬编码问题，当前已消除。
- `/healthz` smoke test 当前也已通过，说明测试基线与当前实现处于一致状态。

## 第二轮视觉与交互细调

在第二轮复查里，我把前一轮新增发现的几个前台细节问题也一并收敛了，范围仍然只落在 `apps/web`。

### 7. 移动端 sticky header 压缩为更紧凑的两行结构

已完成：

- 移动端 header 保留 sticky，但不再把品牌说明和完整导航堆成过高的首屏占位。
- 小屏下隐藏 tagline，并把导航改成单行横向滚动，避免导航换行把正文整体向下推太多。
- 这一调整不改变桌面端结构，也不影响现有路由与链接。

涉及文件：

- `apps/web/src/components/SiteHeader.astro`

验证结果：

- 用 Playwright 快速测了桌面和 Pixel 7 视口。
- 移动端首页与 GeekDaily 页的 `main` 顶部位置从约 `287.7px` 降到约 `143.8px`，首屏正文占比明显恢复。
- 当前没有发现新的横向溢出问题。

### 8. GeekDaily 搜索筛选补齐可访问状态反馈

已完成：

- 标签筛选与年份筛选按钮补上了 `aria-pressed`。
- 结果状态区域补上 `role="status"` 与 `aria-live="polite"`，让筛选结果变化更容易被读屏感知。
- 结果列表补上 `aria-busy`，在异步加载检索索引时会明确标记为忙碌状态。
- 同时补了检索索引加载失败时的前台降级提示，避免 silent failure。

涉及文件：

- `apps/web/src/pages/geekdaily/index.astro`

验证结果：

- Playwright 快速检查确认 GeekDaily 页的结果状态区已带 `aria-live="polite"`。
- 年份筛选按钮默认带 `aria-pressed="false"`，结果列表默认带 `aria-busy="false"`。
- 既有 smoke tests 继续通过。

### 9. 第二轮顺手收敛的低风险细节

已完成：

- 修正 GeekDaily 控件未定义的 `var(--ink)`，改回站点已有颜色 token，避免按钮颜色退回默认继承。
- Contributors 页面分组 eyebrow 不再直接暴露内部 `slug`，改为使用可直接面向读者展示的角色名称。
- 全站交互元素补了一层统一的 `:focus-visible` 样式，让键盘导航时的焦点反馈更稳定。

涉及文件：

- `apps/web/src/pages/geekdaily/index.astro`
- `apps/web/src/pages/contributors.astro`
- `apps/web/src/styles/global.css`

## 第三轮视觉层打磨

这轮继续只做前台视觉层 refinement，不改路由、数据结构和页面文案语义，重点是让公共页面的层次、动效和归档阅读体验更完整。

### 10. Section CTA 与全站卡片的视觉反馈进一步统一

已完成：

- `SectionHeader` 的右侧跳转入口从普通文本链接提升为轻按钮式 CTA，补上边框、背景和 hover / focus 态。
- 公共卡片组件补上统一的悬停抬升、阴影加强和标题着色反馈。
- 有封面的卡片在 hover / focus 时会轻微放大封面图，减少页面“静态列表”感。

涉及文件：

- `apps/web/src/components/SectionHeader.astro`
- `apps/web/src/components/ArticleCard.astro`
- `apps/web/src/components/EventCard.astro`
- `apps/web/src/components/JobCard.astro`
- `apps/web/src/components/GeekDailyCard.astro`
- `apps/web/src/components/ContributorCard.astro`
- `apps/web/src/styles/global.css`

### 11. 首页实时线与 RSS 区块强化视觉节奏

已完成：

- 首页 live wire 条目补上 hover / focus 反馈，和右侧信号面板的其余卡片保持一致。
- RSS 订阅区块补了更明确的背景层次和链接按钮反馈，降低页面底部“纯链接堆叠”的感觉。
- feed links 在桌面端改成双列排布，页面结尾的结构更紧凑。

涉及文件：

- `apps/web/src/pages/index.astro`

### 12. GeekDaily 归档页提升扫描效率

已完成：

- 归档统计卡、搜索面板、筛选面板补了更明确的分区背景。
- 结果头部里的 RSS 入口改成更稳定的 pill CTA 样式。
- episode 卡片新增左侧强调条和更清晰的 hover 层次。
- 归档列表中的长正文改为多行截断，避免列表页被整段正文撑得过长。
- 条目预览列表在桌面端改成双列，移动端自动退回单列，提高长列表的浏览密度。

涉及文件：

- `apps/web/src/pages/geekdaily/index.astro`

## 第四轮首页品牌表达强化

这轮继续只收敛首页，不碰数据接口和后台依赖，目标是把首页从“信息聚合页”再往前推一步，强化成更像社区媒体头版的阅读入口。

### 13. 首页 masthead 与 live desk 的品牌辨识度进一步拉开

已完成：

- 首页 hero 顶部补了 `Rebase Front Page` edition chip、品牌说明和头版式 highlights 区，让首屏更像一张可持续更新的社区 front page。
- masthead 背景从轻卡片改成更明显的暖色 / teal editorial 渐层，并加入大号 `REBASE` watermark，提升首页第一眼的品牌记忆点。
- 右侧 live desk 改成深色 signal desk 语气，和左侧 masthead 拉出更明确的功能分工：左边讲“这是一个什么站”，右边讲“现在在发生什么”。
- hero highlights 直接复用 live wire 的前三条内容，避免新视觉层引入额外维护成本，同时把“实时更新”这一站点特点提前到首屏。
- 桌面和移动端都补了对应的 responsive 调整，保证新增头版卡片区不会把首页首屏挤坏。

涉及文件：

- `apps/web/src/pages/index.astro`

## 第五轮详情页导览与操作信息补强

这轮继续只做前台页面层，重点不再是首页，而是把文章、活动、招聘、GeekDaily 这几类详情页从“只有正文和一个侧栏”提升成更清晰的阅读 / 操作入口。

### 14. 四类详情页补齐 hero meta、操作入口和侧栏分区

已完成：

- 文章、活动、招聘、GeekDaily 详情页的 hero 区统一补上更清晰的 meta pills，让发布时间、地点、模式、期数、阅读时长这些关键信息更早进入首屏。
- 活动和招聘详情页把最主要的外部动作前移到 hero 区，报名 / 投递不再只藏在右侧说明里。
- 统一把 detail sidebar 改成深色信息面板，并拆成信息、操作、相关推荐三个 section，减少“长列表 + 默认 bullet”带来的扫描负担。
- 文章 / 活动 / 招聘 / GeekDaily 的 tags 和关键信息改成更结构化的 chips 与 facts list，侧栏更像导览卡，而不是补充备注。
- GeekDaily 详情页里的逐条推荐卡片补上 hover / focus 反馈，详情页内部的信息层次和可点性更明确。

涉及文件：

- `apps/web/src/pages/articles/[slug].astro`
- `apps/web/src/pages/events/[slug].astro`
- `apps/web/src/pages/who-is-hiring/[slug].astro`
- `apps/web/src/pages/geekdaily/[slug].astro`
- `apps/web/src/styles/global.css`

## 第六轮 About / Contributors 品牌层细化

这轮继续停留在公共前台页面，只收敛 `about` 和 `contributors` 两页，目标是把它们从“信息说明页”往前推成更有品牌辨识度的结构页面。

### 15. About 页把“站点为什么存在”讲得更像一份社区 brief

已完成：

- About hero 补了 edition chip、品牌说明和三张结构信号卡，让关于页一打开就先交代 Rebase 这套公共结构的核心数字和主张。
- 原本平铺的三段内容改成带序号的 story cards，并把第一张拉成 lead card，阅读节奏更接近 editorial brief 而不是普通 FAQ。
- 在关于页底部新增 public surfaces 区，把 Articles、GeekDaily、Events、Who-Is-Hiring、Contributors 作为同一结构里的不同入口重新讲了一遍。

涉及文件：

- `apps/web/src/pages/about.astro`

### 16. Contributors 页从名单展示升级成可导航的人物索引

已完成：

- Contributors hero 补了 `People Index` edition chip、角色跳转入口和更明确的说明文案，让这页更像“人物索引”而不是简单卡片列表。
- 每个角色组都改成独立的品牌化 block，增加成员数、组别说明和角色说明文案，降低首次进入时的理解成本。
- 第一位贡献者卡片升级成 featured 变体，其余成员保留在右侧网格，让“代表人物 + 其余成员”的层次更清楚。
- `ContributorCard` 的联系方式改成更明确的 pills 样式，并补上 featured 标记，整页人物卡片的可读性和信息密度更稳定。

涉及文件：

- `apps/web/src/pages/contributors.astro`
- `apps/web/src/components/ContributorCard.astro`

## 第七轮栏目首页统一性补强

这轮继续只收敛 `apps/web` 的公共前台页面，目标是把 `articles`、`events`、`who-is-hiring` 三个栏目首页拉回到和首页 / About / Contributors 更一致的 editorial 语言里。

### 17. 三类公共列表页统一成更明确的栏目首页结构

已完成：

- 三个栏目首页都补上了统一的 hero 顶部结构：edition chip、品牌说明、三张信号卡和锚点跳转，让它们更像“栏目首页”而不是普通列表页。
- `articles`、`events`、`who-is-hiring` 都新增了三张 brief cards，把栏目定位、阅读方式和归档价值提前讲清楚，减少首屏之后才理解页面用途的问题。
- 三个页面的主推荐区统一改成“主卡 + desk note”的节奏，右侧说明卡会明确解释这一栏为什么要有 lead item，以及读者该如何使用这个栏目。
- `events` 的当前活动列表不再重复显示已经作为主推的活动；主推之外的近期活动和历史归档也补了空状态卡，结构更一致。
- `articles` 和 `who-is-hiring` 的归档区同样补了统一的空状态兜底，保证这些栏目在条目较少时仍然保持完整页面节奏。

涉及文件：

- `apps/web/src/pages/articles/index.astro`
- `apps/web/src/pages/events/index.astro`
- `apps/web/src/pages/who-is-hiring/index.astro`

## 结论

`apps/web` 当前已经具备完整可运行的公共站点形态，而且这轮前台修正后，活动详情 URL 规范、Markdown 链接安全、招聘详情降级处理、GeekDaily 搜索文案和语言标记这些明显问题都已经收敛。

如果继续往下推进，下一批最值得做的事情是：

1. 把 SEO 字段从后台内容链路接到前台页面。
2. 决定 GeekDaily 是否真的要支持按日期搜索；如果要，就补索引与测试。
3. 把当前 worktree 的本地验证前置条件写得更明确，尤其是 `.env` 和 `geekdaily.csv` 这两个本地依赖，减少新 worktree 下的误判成本。
