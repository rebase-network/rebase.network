# X 浏览器 Profile 维护工具

这个独立工具用于检查 X Profile，并在维护时执行受控的测试发布。它参考 `/Users/r001/work/x-login`，使用 `@agent-infra/browser` 通过 Chrome DevTools Protocol 启动专用 Chrome `user-data-dir`。在 macOS 上，脚本会保留系统 Keychain 的 Cookie 加密方式，以便读取普通 Chrome 创建的登录会话。

## 首次登录

确保本机已安装 Google Chrome。首次登录必须使用普通 Chrome，不能在自动化 Chrome 或带调试端口的 Chrome 中完成：

```bash
chrome_app="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
profile_dir="$PWD/.local/x-rebase-profile"

open -na "$chrome_app" --args \
  "--user-data-dir=$profile_dir" \
  "https://x.com/i/flow/login"
```

在窗口中人工登录 RebaseCommunity 账号，确认进入 `https://x.com/home`，然后正常关闭整个 Chrome 窗口。脚本不会接收或保存密码。实际发布前还会从 X 的账号切换器或 Profile 链接确认当前账号是 `@RebaseCommunity`。

先执行只读检查：

```bash
ditto "$profile_dir" "${profile_dir}.backup-$(date +%Y%m%d-%H%M%S)"

pnpm x:profile-check -- \
  --profile .local/x-rebase-profile \
  --handle RebaseCommunity
```

## 发布测试

先准备一条短文本，建议只包含日报标题、摘要和 Rebase 链接：

```bash
pnpm x:publish -- \
  --profile .local/x-rebase-profile \
  --handle RebaseCommunity \
  --text "极客日报：今日区块链动态 https://rebase.network"
```

`x:profile-check` 始终只读，不会点击发布按钮；只有 `x:publish` 会发布推文。

## 远端检查

```bash
ssh rebase@rebase.host
export PATH=/home/rebase/.local/node-v22.21.1-linux-x64/bin:$PATH
export CHROME_PATH=/usr/bin/google-chrome-stable
export X_PROFILE_DIR=/home/rebase/.local/share/rebase-x-profile
export X_HANDLE=RebaseCommunity
cd /home/rebase/rebase.network
pnpm x:profile-check
```

## 已知限制

- 这是 X 网页自动化，不是官方 API；X 修改页面结构、触发风控或撤销会话后都可能失效。
- Profile 只能由一个 Chrome 实例使用，运行前请关闭同一个 Profile 的其他窗口。
- macOS Profile 不应复制到 Linux 服务器；系统密钥环和设备环境不同。服务器验证应在服务器上新建 Profile 并人工登录。
- Linux 首次登录和后续自动化必须使用相同的 Chrome 用户及密码存储方式；当前脚本使用 Puppeteer 默认的 basic password store。
- 发布响应不明确时脚本会停止并要求人工确认，不会自动重试，以避免重复发帖。
- 当前工具只处理纯文本发帖，不处理图片或线程。
