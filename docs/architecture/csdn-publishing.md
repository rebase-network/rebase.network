# CSDN 自动发布方案

状态：设计稿，尚未实现。实现前需先完成本文“前置验证”一节。

## 结论

CSDN 采用“登录照 X、发文走接口”的方案：

- **登录**：和 X 一样，工作人员通过 VNC 在服务器上的专用 Chrome Profile 中人工扫码登录一次，登录状态保存在 Profile 里。
- **发文**：不模拟操作编辑器页面。由宿主机上的会话服务从 Profile 中读出 CSDN cookie，API 在服务端计算 `x-ca-*` 签名后直接调用 CSDN 网页编辑器使用的 `saveArticle` 接口。
- **接入**：作为 `apps/api/src/lib/external-publishing.ts` 中的一个新 channel（`csdnChannel`），复用现有的排队、防重复、外部 ID 回写、成功与失败审计。

## 为什么不用其他方案

| 方案 | 不采用的原因 |
|---|---|
| 像 InfoQ 一样服务端账号密码登录 | 社区现有工具都依赖人工提供 cookie 或扫码，CSDN 登录大概率有人机验证；绕过验证码违反条款且不稳定 |
| 完全照搬 X，模拟操作编辑器 | 长文逐字输入慢，且 Markdown 编辑器的自动补全、自动缩进会改乱内容；发布弹窗控件多，改版即失效 |
| 工作人员手动粘贴 cookie 到后台 | 可行的备选。缺点是 cookie 过期后需要人工重新复制，体验不如 VNC 扫码；见“与 X 浏览器方案的关系” |

CSDN 没有官方发文 API。`saveArticle` 是从网页编辑器中观察到的内部接口，可能随时变化，也可能违反 CSDN 服务条款。应使用社区专用账号，并控制发布频率。

## 运行时结构

```text
admin 保存 / 发布内容
    |
    v
apps/api  external-publishing.ts
    |  csdnChannel.publish()
    |
    |-- 1. GET /cookies  ──Unix socket──>  宿主机 CSDN 会话服务
    |                                         |
    |                                         v
    |                                  无界面 Chrome + CSDN Profile
    |                                  读取 .csdn.net cookie 后立即关闭
    |
    |-- 2. 计算 x-ca-signature
    |
    `-- 3. POST https://bizapi.csdn.net/blog-console-api/v3/mdeditor/saveArticle
            返回文章 ID，回写 csdn_article_id
```

API 容器内没有 Chrome，所以 cookie 只能由宿主机进程读取。这与 X publisher 的边界一致：Profile、Chrome 和会话服务属于宿主机维护资源，不进入 API 镜像或 `ops/.env`。

与 X 不同的是，宿主机服务只负责**提供 cookie**，签名和调用接口都在 API 内完成。这样发文逻辑可以用 TypeScript 写单元测试，失败信息也直接进入 API 日志和审计表。

## 组件

### 1. 宿主机 CSDN 会话服务

位置：`scripts/csdn-browser/`，结构参照 `scripts/x-browser/`。

- `session-server.mjs`：监听 Unix socket，提供：
  - `GET /ready`：存活检查。
  - `GET /cookies`：用无界面 Chrome 打开 CSDN Profile，通过 CDP 读取 `.csdn.net` 域下的 cookie，确认已登录后返回 cookie 字符串和当前账号名，随后关闭浏览器。
- 读取 cookie 使用浏览器自身的 CDP 接口，不直接解密 Profile 中的 SQLite cookie 库，避免依赖 Linux Chrome 的密钥存储细节。
- 请求串行处理。Chrome Profile 被登录会话占用时（`login-start` 期间），直接返回明确错误，不等待。
- 日志沿用 X publisher 的格式：每行一条带时间戳的 JSON，追加写入，超过大小后轮转。**日志中不得写入 cookie 值**，只记录 cookie 名称列表和账号名。
- `session-service.sh`：`start | stop | status`，参照 `publisher-service.sh`。

默认路径：

| 项 | 路径 |
|---|---|
| Profile | `/home/rebase/.local/share/rebase-csdn-profile` |
| 状态目录 | `/home/rebase/.local/state/rebase-csdn-browser` |
| Socket（宿主机） | `/home/rebase/.local/state/rebase-csdn-browser/session.sock` |
| Socket（API 容器内） | `/var/run/rebase-csdn-browser/session.sock` |

CSDN 必须使用独立 Profile，不能与 X 共用：同一个 Chrome 用户目录不能同时被两个浏览器进程打开。

### 2. 远程登录

复用 `scripts/x-browser/remote-login-session.sh` 的 Xvfb + x11vnc + Chrome 流程，需要先把以下写死的值改为可配置：

- `LOGIN_URL`：CSDN 使用 `https://passport.csdn.net/login`
- 状态目录、Profile 目录
- 显示编号与 VNC 端口：CSDN 使用 `:98` 与 `5908`，避免与 X（`:97`、`5907`）同时登录时冲突

`ops/manage.sh` 新增一组子命令，与 `x` 对称：

```bash
./ops/manage.sh csdn check            # 通过会话服务确认登录状态和账号
./ops/manage.sh csdn login-start      # 启动远程登录并打开 VNC
./ops/manage.sh csdn login-stop       # 关闭 Chrome、备份 Profile、关闭隧道
./ops/manage.sh csdn session-start
./ops/manage.sh csdn session-stop
./ops/manage.sh csdn session-status
./ops/manage.sh csdn backup
```

### 3. API channel：`apps/api/src/lib/csdn.ts`

导出 `csdnChannel: ExternalChannel`：

- `name: 'CSDN'`，`auditKey: 'csdn'`，`idField: 'csdnArticleId'`
- `isConfigured`：`CSDN_PUBLISHER_ENABLED=true` 且 socket 路径与签名配置齐全
- `publish(input)`：
  1. 通过 socket 获取 cookie；失败时报 `CSDN 登录状态无效，请执行 ./ops/manage.sh csdn login-start 重新登录`。
  2. 构造请求体（见“内容映射”）。
  3. 计算签名并调用 `saveArticle`，超时 30 秒。
  4. 解析返回的文章 ID 和地址；业务码非成功时，把 CSDN 返回的 `code`、`msg` 放进错误详情。

纯函数单独导出以便测试：`buildCsdnArticle(input)`、`signCsdnRequest(...)`、`parseCsdnResponse(...)`，在 `csdn.test.ts` 中覆盖。

### 4. 签名

按社区资料，每个发往 `bizapi.csdn.net` 的请求需要：

| 请求头 | 说明 |
|---|---|
| `x-ca-key` | 固定值，来自 CSDN 前端代码 |
| `x-ca-nonce` | 每次请求新生成的 UUID |
| `x-ca-signature-headers` | `x-ca-key,x-ca-nonce` |
| `x-ca-signature` | `base64(HMAC-SHA256(appSecret, stringToSign))` |

`stringToSign` 由请求方法、`Accept`、`Content-Type`、`x-ca-key`、`x-ca-nonce` 和带查询串的路径按换行拼接。具体字段顺序和空行以前置验证中抓到的真实请求为准。

`x-ca-key` 和 `appSecret` 放在环境变量里，CSDN 更换时只需改配置、重新部署，不改代码。

### 5. 数据模型

`articles`、`events`、`geekdaily_episodes` 三张表新增可空列 `csdn_article_id`（与 `infoq_article_uuid`、`learnblockchain_article_id`、`x_post_id` 并列），同步修改：

- `packages/db/src/schema/index.ts` 与一次新 migration
- `packages/shared/src/content.ts` 中三个 admin record 类型
- 三个内容模块里把行映射为 record 的函数
- `external-publishing.ts` 中的 `ExternalIdField` 与 `externalChannels`

### 6. 管理端

- 新增手动发布路由：`POST /articles/:id/csdn-publish`、`/events/:id/csdn-publish`、`/geekdaily/:id/csdn-publish`，权限与现有外部发布路由一致。
- 编辑页展示 CSDN 发布状态和文章链接；是否同时加“手动发布到 CSDN”按钮，与 X、登链的按钮一起决定。

## 内容映射

| CSDN 字段 | 取值 |
|---|---|
| 标题 | `contentSources` 已有规则：文章原标题、`活动｜…`、`极客日报｜…` |
| 正文 | Markdown 正文，末尾追加 `原文链接：<Rebase 链接>`，与 InfoQ、登链一致 |
| 摘要 | 内容摘要，超出 CSDN 上限时截断 |
| 标签 | 内容标签取前若干个；为空时使用默认标签（CSDN 要求至少一个） |
| 状态 | 正式发布 `1`。**禁止使用 `0`**，社区记录显示 `0` 可能被直接公开 |
| 文章类型 | 原创（文章、活动、极客日报统一） |
| 可见性 | 公开 |
| 封面、分类 | 默认不设置，前置验证确认是否必填 |

## 频率、重复与失败处理

- **频率**：CSDN 两次写操作之间至少间隔约 11 秒。channel 本身已串行排队，额外在 `csdn.ts` 中保证与上一次请求的最小间隔。
- **没有防重复机制**：`saveArticle` 没有幂等键。请求已发出但超时、连接中断或返回 5xx 时，文章可能已经创建。这种情况：
  - 不自动重试；
  - 报错“CSDN 发布结果不确定，请先到 CSDN 创作中心确认后再决定是否重试”；
  - 由现有失败审计记录为 `*.csdn_publish_failed`。
- **cookie 失效**：请求前由会话服务确认登录；接口返回未登录类错误时，同样给出重新登录的提示，不重试。
- **日志**：成功与失败都走 `external-publishing.ts` 已有的 JSON 日志和审计记录。错误详情中可以包含 CSDN 返回的业务码和消息，**不得包含 cookie 和签名值**。

## 配置

`ops/.env` 新增：

| 变量 | 说明 | 敏感 |
|---|---|---|
| `CSDN_PUBLISHER_ENABLED` | 是否启用 CSDN 发布，默认 `false` | 否 |
| `CSDN_SESSION_SOCKET_PATH` | API 容器内的会话服务 socket，默认 `/var/run/rebase-csdn-browser/session.sock` | 否 |
| `CSDN_CA_KEY` | 签名用 `x-ca-key` | 否 |
| `CSDN_CA_SECRET` | 签名用 appSecret | 是 |

`infra/production/docker-compose.yml` 的 `api` 服务新增 volume：

```yaml
- ${CSDN_SESSION_STATE_DIR:-/home/rebase/.local/state/rebase-csdn-browser}:/var/run/rebase-csdn-browser
```

上线后同步更新 `docs/operations/production-config.md`，并新增 `docs/operations/csdn-login-runbook.md`（参照 `x-login-runbook.md`）。

## 安全边界

- CSDN Profile 等同于账号会话凭据，权限仅限 `rebase` 用户，不提交、不下载、不通过 `ops/.env` 同步。
- cookie 只在宿主机会话服务与 API 进程内存中短暂存在，不写入数据库、日志或审计表。
- 会话服务 socket 权限 `600`，只挂载给 API 容器。
- VNC 只监听远端 `127.0.0.1`，通过 SSH 隧道访问，登录结束必须执行 `login-stop`。

## 与 X 浏览器方案的关系

本方案只在**登录**环节依赖服务器上的 Chrome。API 通过一个“获取 cookie”的接口拿登录状态，不关心 cookie 来源。

如果后续决定不再在服务器上运行 Chrome（X 浏览器自动化的遗留问题），只需把 cookie 来源换成“工作人员在后台粘贴 cookie，加密存库”（与 InfoQ 存密码的方式相同），签名、发文和 channel 部分不变。

## 前置验证

写代码前用 CSDN 测试账号完成以下验证，结果补充到本文：

1. **登录保持**：通过 VNC 在独立 Profile 中扫码登录，关闭后用无界面 Chrome 重新打开，确认登录状态还在、没有额外验证。
2. **cookie 读取**：通过 CDP 读出 `.csdn.net` cookie，确认哪些 cookie 是发文必需的。
3. **接口与签名**：在编辑器里手动保存一篇草稿，抓下 `saveArticle` 的请求和响应，确认接口路径、请求体字段、`x-ca-key`、`stringToSign` 格式。
4. **服务端调用**：用本地脚本自行签名，以草稿状态 `2` 保存一篇文章，确认能拿到文章 ID；再验证状态 `1` 的正式发布。
5. **内容兼容**：确认 CSDN 对 Markdown（列表、代码块、表格）、外链图片、标签数量和摘要长度的处理。
6. **有效期**：观察数天，记录登录状态的实际失效时间。

## 实现步骤

按以下顺序提交，每步单独一个提交：

1. 数据模型：新增 `csdn_article_id` 列、migration 和共享类型。
2. 远程登录脚本参数化，新增 CSDN 会话服务与 `manage.sh csdn` 子命令。
3. API：`csdn.ts`、单元测试、配置项，接入 `externalChannels` 与手动发布路由。
4. 部署配置与运维文档：compose volume、`production-config.md`、`csdn-login-runbook.md`。
5. 管理端展示 CSDN 发布状态。

上线顺序：先部署代码并保持 `CSDN_PUBLISHER_ENABLED=false`，完成登录和 `csdn check` 后，再打开开关并发布一篇内容验证。

## 已确认决策（2026-10-06）

- **文章类型**：统一标为“原创”，包括极客日报。
- **发布范围**：文章、活动、极客日报三类都发布到 CSDN。
- **自动发布**：与 InfoQ、登链、X 一致，内容发布后自动发到 CSDN（加入 `externalChannels`，执行顺序排在现有渠道之后）。
- **账号**：社区专用 CSDN 账号尚未创建，创建后再进行前置验证。在此之前，“前置验证”和依赖真实请求的签名细节暂缓。
