# X 浏览器 Profile 原型

这是一个仅用于本地验证的独立工具，不属于 API 或生产部署链路。它参考 `/Users/r001/work/x-login`，使用 `@agent-infra/browser` 通过 Chrome DevTools Protocol 启动一个新的专用 Chrome `user-data-dir`，不使用现有的 `chrome-profile-A/B`，也不会把 Profile 上传到服务器。

## 首次登录

确保本机已安装 Google Chrome，然后运行：

```bash
pnpm x:prototype -- --profile .local/x-rebase-profile
```

脚本会打开 `x.com/home`。在窗口中人工登录 RebaseCommunity 账号并完成验证，检测到首页后会关闭浏览器并保留专用 Profile。脚本不会接收或保存密码。实际发布前还会从 X 的账号切换器或 Profile 链接确认当前账号是 `@RebaseCommunity`。

## 发布测试

先准备一条短文本，建议只包含日报标题、摘要和 Rebase 链接：

```bash
pnpm x:prototype -- \
  --profile .local/x-rebase-profile \
  --handle RebaseCommunity \
  --publish \
  --text "极客日报：今日区块链动态 https://rebase.network"
```

不传 `--publish` 时始终是检查模式，不会点击发布按钮。

## 已知限制

- 这是 X 网页自动化，不是官方 API；X 修改页面结构、触发风控或撤销会话后都可能失效。
- Profile 只能由一个 Chrome 实例使用，运行前请关闭同一个 Profile 的其他窗口。
- macOS Profile 不应复制到 Linux 服务器；系统密钥环和设备环境不同。服务器验证应在服务器上新建 Profile 并人工登录。
- 发布响应不明确时脚本会停止并要求人工确认，不会自动重试，以避免重复发帖。
- 当前原型只验证纯文本发帖，不处理图片、线程、定时和后台队列。
