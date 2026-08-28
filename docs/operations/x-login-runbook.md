# X 远端登录 Runbook

X 发布使用服务器本机的专用 Chrome Profile：

```text
/home/rebase/.local/share/rebase-x-profile
```

macOS Profile 不可上传到 Linux 使用。首次登录或会话失效后，必须在远端普通 Chrome 中人工登录。

## 检查 Profile

```bash
./ops/manage.sh x check
```

成功输出应包含：

```text
X Profile 正常，当前账号：@rebasecommunity
```

## 人工登录

启动临时 Xvfb、x11vnc、普通 Chrome 和 SSH 隧道：

```bash
./ops/manage.sh x login-start
```

命令会输出一次性 `VNC_PASSWORD`，并在 macOS 打开：

```text
vnc://127.0.0.1:5907
```

Screen Sharing 中使用输出的密码登录 VNC，然后：

1. 在 Chrome 中登录 `@RebaseCommunity`。
2. 确认进入 `https://x.com/home`，页面标题为 `Home / X`。
3. 回到终端执行：

```bash
./ops/manage.sh x login-stop
```

`login-stop` 会正常关闭 Chrome、创建时间戳 Profile 备份、停止 VNC/Xvfb并关闭本地 SSH 隧道。

最后再次检查：

```bash
./ops/manage.sh x check
```

## 状态与备份

```bash
./ops/manage.sh x status
./ops/manage.sh x backup
```

Profile 备份与源目录同级，格式为：

```text
/home/rebase/.local/share/rebase-x-profile.backup-YYYYMMDD-HHMMSS
```

只有 Chrome 已停止时才允许备份。Profile 与备份权限必须保持为仅 `rebase` 用户可读写。

## 安全边界

- x11vnc 只监听远端 `127.0.0.1`，不能开放安全组或公网端口。
- 本地通过 SSH 转发访问 VNC；登录结束后必须运行 `login-stop`。
- VNC 密码每次启动随机生成，不写入仓库或 env。
- Profile 等同于 X 账号会话凭据，不得提交、下载或通过 `ops/.env` 同步。
- 发布结果不明确时不得立即重试，应先检查账号主页，防止重复推文。

## 启动 X 发布服务

API 容器通过 Unix socket 调用宿主机 publisher。首次启用时，在确认 Profile 已登录后执行：

```bash
./ops/manage.sh x publisher-start
```

然后在 `ops/.env` 中设置：

```dotenv
X_PUBLISHER_ENABLED=true
X_PUBLISHER_SOCKET_PATH=/var/run/rebase-x-browser/publisher.sock
```

修改 `ops/.env` 后重新部署 API：

```bash
./ops/manage.sh sync-env ops/.env
./ops/manage.sh rollout api
```

检查 publisher：

```bash
./ops/manage.sh x publisher-status
```

停止服务：

```bash
./ops/manage.sh x publisher-stop
```
