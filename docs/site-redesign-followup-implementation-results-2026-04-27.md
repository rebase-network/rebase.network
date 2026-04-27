# Rebase.network 二次整改执行结果

日期：2026-04-27

依据：

- `docs/site-redesign-followup-fix-plan-2026-04-27.md`
- `docs/site-redesign-followup-implementation-plan-2026-04-27.md`

## 完成范围

本轮已完成二次整改计划中的 F-01 到 F-07。

### F-01 GeekDaily 本地 seed/测试数据为空

已完成：

- 在没有 `geekdaily.csv` 或 CSV 解析为空时，自动插入 baseline GeekDaily fixture。
- fixture 包含 12 期 GeekDaily，保留 `geekdaily-1915`。
- fixture 覆盖搜索、分页、年份、标签、详情和 RSS 测试所需数据。
- seed 输出增加 `geekdailySeedSource` 和 `geekdailyEpisodeItems`。

验证结果：

- `pnpm local:bootstrap` 后输出 `geekdailyEpisodes: 12`。
- `geekdailySeedSource: "fixture"`。
- `/geekdaily`、`/geekdaily/geekdaily-1915`、`/geekdaily/rss.xml` 已被 smoke 覆盖。

### F-02 Smoke 测试路径和数据假设不稳定

已完成：

- 将文章、活动、招聘详情测试从旧 slug-only 路径改为真实 public number 路径。
- RSS 和 sitemap 测试改为验证当前 URL 规则，不绑定会被排序影响的旧条目。
- runtime content 测试插入文章后读取 `public_number`，再访问真实文章路径。
- 增加 GeekDaily SSR 搜索首屏 HTML 断言。

### F-03 GeekDaily `q` 参数支持 SSR 首屏

已完成：

- `/geekdaily?q=...` 服务端首屏会根据 `q`、`tag`、`year`、`page` 渲染结果。
- 首屏状态显示搜索条件和结果数量。
- 客户端搜索仍保留为增强交互。

验证结果：

- smoke 已验证 `/geekdaily?q=1915` 首次 HTML 包含 `找到 1 期`、`搜索“1915”` 和 `/geekdaily/geekdaily-1915`。

### F-04 活动状态按时间兜底派生

已完成：

- 新增 `resolvePublicEventStatus`。
- `EventCard`、活动详情页、活动列表 spotlight 使用同一套状态规则。
- 过去活动即使带报名链接，也不会显示报名型 CTA。

### F-05 详情页元信息去重

已完成：

- 文章详情删除正文前重复 meta lead。
- 文章侧栏从重复发布时间/作者/阅读时长，改为文章标签、订阅、返回列表和延伸阅读。
- 活动详情删除正文前重复 meta lead。
- 活动侧栏删除重复的时间/地点/状态信息，保留参与方式、订阅、返回列表和相关活动。

### F-06 招聘联系方式操作更明确

已完成：

- 招聘详情主投递按钮改为 `外部投递链接` 或 `查看原投递链接`。
- contact-only 场景根据联系方式生成明确动作：
  - 邮箱：`发送邮件`
  - Telegram：`打开 Telegram`
  - URL：`查看原始招聘信息`
  - 纯文本：`联系招聘方`
- 保留静态联系方式，方便复制。

### F-07 贡献者/招聘局部视觉仍偏重

已完成：

- 移除 contributors hero 的 `PEOPLE` 水印。
- 移除 jobs hero 的 `HIRING` 水印。
- contributors hero 和 group block 改为更轻的 `var(--shadow-soft)`。
- jobs hero 改为更轻的 `var(--shadow-soft)`。

## 验证命令

已通过：

```bash
pnpm typecheck
pnpm --filter @rebase/db typecheck
pnpm lint
pnpm build
pnpm build:api
pnpm local:bootstrap
pnpm test:smoke
```

最终 smoke 结果：

```text
50 passed
```

备注：

- `pnpm test:smoke` 过程中 Node 输出了 `NO_COLOR` 与 `FORCE_COLOR` 的 warning，不影响测试结果。
- 本轮未引入第三方搜索服务，GeekDaily SSR 搜索复用当前公开搜索索引。

## 交付状态

第二轮整改可进入人工视觉验收。
