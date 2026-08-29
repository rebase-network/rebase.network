# 远端服务器升级与清理方案

本文档是远端服务器升级、服务迁移和磁盘清理的事实来源。它描述当前盘点结果和批准后的执行顺序，不代表已经执行系统升级或删除服务。

当前服务器同时承载 Rebase 和多套历史业务。升级必须先完成服务归属确认和异地备份，再进入维护窗口。

## 1. 当前基线

最近一次只读盘点：2026-08-29。

| 项目 | 当前值 |
| --- | --- |
| 主机 | `rebase@rebase.host` |
| 操作系统 | Ubuntu 20.04 LTS |
| 内核 | 5.4.0-90-generic |
| 架构 | x86_64 |
| CPU | 2 vCPU |
| 内存 | 3.8 GiB，Swap 2 GiB |
| 根磁盘 | 99 GiB，总使用约 37% |
| 连续运行时间 | 约 18 周 |
| OpenSSH | 8.2p1 |
| Docker Engine | 28.1.1 |
| Docker Compose | v2.35.1 |
| 系统 Node.js | 16.20.2 |
| Rebase Node.js | `/home/rebase/.local/node-v22.21.1-linux-x64`，22.21.1 |
| Rebase pnpm | 10.34.1 |
| Google Chrome | 152.0.7977.64 |

当前 SSH 客户端与服务器协商 `curve25519-sha256`，因此本机 OpenSSH 10 会提示未使用后量子密钥交换。这不是当前故障，但升级到较新 Ubuntu/OpenSSH 后应重新验证 `sntrup` 或 `mlkem` 协商。

## 2. 服务清单与处理结论

### 必须迁移或保留

| 服务或资源 | 使用证据 | 升级处理 |
| --- | --- | --- |
| Rebase API、PostgreSQL 16、Cloudflare Tunnel | Docker Compose 中 3 个容器运行，API 和 PostgreSQL healthy | 迁移到新主机，优先保持现有 Compose 结构 |
| Rebase X Profile、Chrome publisher | `/home/rebase/.local/share/rebase-x-profile` 约 429 MiB，Profile 检查成功 | 新主机重新人工登录，不复制 macOS Profile |
| Nginx | 监听 `80/443`，存在 `rebase.network`、`admin.rebase.network`、`dailyadmin.rebase.network`、`old.rebase.network` 配置和近期访问日志 | 逐域名确认归属后迁移；不要直接覆盖旧配置 |
| MariaDB 10.3 / MySQL 服务别名 | 服务实际由同一个 `mariadbd` 进程提供，`wordpress` 数据库约 57 MiB | 保留 WordPress 业务，迁移后升级到 MariaDB 10.11 前先做兼容性测试 |
| 宿主机 PostgreSQL 14 | 存在 `strapi`、`web3daily`、`rebase`、`relaynews` 数据库和运行中的 PostgreSQL 14 进程 | 逐库确认应用后迁移；不要与 Rebase 容器 PostgreSQL 混为一个实例 |
| InfluxDB 2.5.1、Telegraf 1.24.3 | Influx `/health` 返回 pass，服务和 Telegraf 均运行 | 先升级到最新 InfluxDB 2.x 补丁版本，迁移后再评估 InfluxDB 3 |
| Cloudflare Tunnel、腾讯云监控代理 | `cloudflared`、`barad_agent`、YunJing 进程运行 | 按云厂商要求迁移或重新注册，不要在未确认前停止 |
| Hermes agent | 两个长期运行的 Hermes gateway，目录约 2 GiB | 保留并单独确认 owner、启动方式和数据备份 |
| Certbot Snap | 存在证书 renewal timer 和 Snap 版本 | 保留；迁移证书或重新签发后再切换 |

### 需要确认后再停用或删除

| 项目 | 当前证据 | 处理要求 |
| --- | --- | --- |
| PM2 | PM2 daemon 在运行，但当前进程列表为空，saved list 与当前状态不一致 | 先确认是否有旧 `web3daily` 或其他应用需要恢复；确认无 owner 后才停用并清理 |
| 系统 Node.js 16 | 系统包存在；Rebase 使用独立 Node 22 | 确认其他旧项目不依赖后再卸载；不能仅凭 Rebase 不使用就删除 |
| `/home/rebase/app`、`rebase`、`web3daily`、`www`、`db` | 目录存在，部分目录有 Nginx 或数据库对应配置 | 根据域名、进程、数据库和 owner 做逐项归档；先只读或改名隔离，不直接删除 |
| Nginx `.bak` 配置 | 存在 `dailyadmin.conf.bak-20260408`、`wpold.bak` | 新旧配置切换完成并保留异地副本后再清理 |
| rsync systemd daemon | `rsync.service` inactive，但 `ops/manage.sh` 使用 rsync 客户端 | 保留 rsync 客户端；只有确认没有 daemon 使用者后才考虑移除服务配置 |

### 不应当作为历史垃圾处理

- `/home/rebase/.hermes`、`.vscode-server`、`.cargo`、`.rustup` 可能仍被远程开发或 Hermes 使用。
- `/var/lib/mysql`、`/var/lib/postgresql`、`/var/lib/influxdb` 中的数据必须按数据库备份流程处理。
- Docker 当前 Rebase 数据卷仍在使用，不能执行 `docker volume prune`。
- X Profile 等同于账号会话凭据，不得下载到本地、提交 Git 或通过 `ops/.env` 同步。

## 3. 磁盘回收优先级

当前 `docker system df` 显示：

| 项目 | 可回收空间 | 安全级别 |
| --- | ---: | --- |
| Docker 未使用镜像 | 约 5.0 GiB | 低风险，确认无回滚镜像后执行 |
| Docker build cache | 约 4.4 GiB | 低风险，之后首次构建会变慢 |
| X Profile 历史备份 | 约 1.6 GiB | 中风险，只保留最近两份并确认异地备份 |
| `.rustup` | 约 1.2 GiB | 需确认是否有 Rust 构建 |
| `.vscode-server` | 约 1.0 GiB | 需确认远程开发会话 |
| `.cargo` | 约 942 MiB | 需确认 Rust 构建 |
| `.npm` 缓存 | 约 476 MiB | 低风险，可重建 |

推荐清理顺序：

1. 先清理 Docker build cache 和确认不用的旧镜像。
2. 再清理过期 X Profile 备份，只保留当前 Profile 和最近两份备份。
3. 再根据 owner 确认清理 npm、Cargo、Rustup、VS Code Server 缓存。
4. 最后处理旧项目目录、旧数据库和旧 Nginx 配置；这些不是缓存，必须单独迁移或归档。

候选命令如下，必须在维护窗口、备份完成并确认镜像列表后执行：

```bash
docker system df
docker builder prune --filter until=168h
docker image prune -a --filter until=168h
```

不要使用以下命令，除非已经完成全量迁移并明确批准：

```bash
docker system prune -a
docker volume prune
rm -rf /home/rebase/<project>
```

## 4. 推荐方案：新机迁移

由于当前主机承载多套业务，推荐新建一台 Ubuntu 24.04 LTS 主机迁移，而不是直接原地升级。旧机在切换后保留 7-14 天作为回滚环境。

新机建议至少提供 4 vCPU、8 GiB 内存和 120 GiB SSD；如果继续承载 WordPress、旧业务数据库和监控数据，优先使用独立数据盘或更大的系统盘。

### 目标软件矩阵

| 组件 | 目标 |
| --- | --- |
| Ubuntu | 24.04 LTS，完成安全更新 |
| OpenSSH | Ubuntu 24.04 对应稳定版本，验证后量子 KEX |
| Docker | Docker CE 当前稳定版本 |
| Compose | Docker Compose plugin 当前稳定版本 |
| Node.js | 统一使用 Node 22 LTS |
| pnpm | 统一使用仓库要求的 10.34.1 |
| PostgreSQL | Rebase 保持 PostgreSQL 16；其他业务先按库验证再升级 |
| MariaDB | WordPress 验证后升级到 10.11 LTS |
| PHP | WordPress 验证后升级到 PHP 8.2 或 8.3 |
| Nginx | Ubuntu 24.04 稳定版本，保留现有域名配置并重新验证证书 |
| InfluxDB | 先升级到最新 2.x 补丁版本 |
| Chrome | Google Chrome Stable |
| X publisher | Node 22 + Chrome + Xvfb，Profile 在宿主机独立目录 |

### 阶段 A：准备与清点

- 指定每个旧域名、数据库、目录和进程的负责人。
- 列出 Nginx 上所有域名及其真实上游，特别是仍返回 502 的 `3333`、`5050`、`5500` 上游。
- 确认 MariaDB 的 WordPress 是否仍提供访问。
- 确认宿主机 PostgreSQL 各数据库对应的应用和恢复顺序。
- 确认 InfluxDB、Telegraf、Hermes 和云监控的迁移方式。
- 确认 Cloudflare Tunnel hostname、DNS、证书和防火墙策略。

### 阶段 B：异地备份

备份必须保存到服务器之外，并做恢复抽样。当前服务器本地的 `backups/` 目录不能视为唯一备份。

Rebase PostgreSQL：

```bash
./ops/manage.sh db backup
./ops/manage.sh db list-backups
./ops/manage.sh db download <remote-backup> ./backups/
```

宿主机数据库和配置：

```bash
sudo mariadb-dump --all-databases --single-transaction --routines --events --triggers > /secure-backup/mariadb-all.sql
sudo -u postgres pg_dumpall --clean --if-exists > /secure-backup/postgresql-all.sql
sudo tar -C / -czf /secure-backup/server-config.tar.gz \
  etc/nginx etc/letsencrypt etc/ssh etc/mysql etc/postgresql etc/influxdb etc/telegraf
```

InfluxDB 使用当前安装的 CLI 和管理员 token 执行官方 backup 流程，token 不写入命令历史：

```bash
influx backup /secure-backup/influxdb-$(date +%Y%m%d)
```

还需单独备份：

- `/home/rebase/.local/share/rebase-x-profile`
- 最近两份 X Profile 备份
- `/home/rebase/.hermes`
- 旧业务项目和上传目录
- Docker Compose 文件与 `infra/production/server.env`

备份完成后至少验证：备份文件可读、压缩包可解压、PostgreSQL 和 MariaDB 能列出预期数据库、X Profile 目录包含 `Default/Cookies` 和 `Local State`。

### 阶段 C：新机安装和恢复

1. 安装 Ubuntu 24.04 LTS 并完成安全更新。
2. 配置 SSH 密钥登录、防火墙和最小开放端口：`22`、`80`、`443`。
3. 安装 Docker、Compose、Node 22、pnpm 10、Nginx、数据库和监控组件。
4. 恢复数据库到临时端口，先验证数据和应用，不立即切换公网域名。
5. 使用仓库部署流程恢复 Rebase：

```bash
./ops/manage.sh sync
./ops/manage.sh sync-env ops/.env
./ops/manage.sh deploy stack
./ops/manage.sh ready
```

6. 在新服务器创建 X Profile，通过 `./ops/manage.sh x login-start` 使用 VNC 人工登录；不要复制 macOS Profile。
7. 启动 X publisher 后执行 `./ops/manage.sh x check`，确认账号和 Unix socket 正常。
8. 用临时 hostname、临时 Tunnel 或 hosts 文件完成全量验收。

### 阶段 D：切换与观察

- T-7 天：新机完成恢复和演练，确认备份与回滚。
- T-3 天：降低 DNS/Tunnel TTL，冻结高风险 schema 变更。
- T-0：停止写入或进入维护页，做最终数据库备份，切换 Tunnel/DNS/Nginx。
- T+30 分钟：验证公共网站、Admin、API、数据库、R2、外部发布和监控。
- T+1 天：观察 Nginx、API、数据库、Tunnel、InfluxDB 和 X publisher 日志。
- T+7 至 14 天：确认没有回滚需求后，再清理旧主机和旧缓存。

## 5. 原地升级备选方案

只有在无法提供新主机、且已经完成全量异地备份和恢复演练时，才考虑原地升级。原地升级需要更长维护窗口，风险高于新机迁移。

顺序必须是：

1. 停止并备份所有应用写入。
2. 备份 SSH、Nginx、证书、数据库、InfluxDB、Hermes 和 X Profile。
3. 记录 Docker Compose、systemd、cron、PM2 和 Cloudflare Tunnel 配置。
4. 先把 Ubuntu 20.04 更新到最新可用补丁并重启验证。
5. 使用 Ubuntu 官方升级路径逐个 LTS 版本升级，不能直接跳过验证。
6. 每次重启后确认 SSH、网络、磁盘挂载、Docker、Nginx、数据库和 Tunnel。
7. 最后升级 PHP、MariaDB、宿主机 PostgreSQL、InfluxDB 和 Node；每项完成后独立验收。

原地升级期间必须保留一个已登录 SSH 会话、一个备用 SSH 会话和云厂商控制台/串行控制台入口。不要在没有带外控制台的情况下修改 SSH 或网络配置。

## 6. 安全与网络验收

升级完成后必须确认：

- SSH 仅使用密钥认证，root 不允许远程登录。
- `22/80/443` 之外的监听端口均有明确 owner；InfluxDB `8086` 若非必须公网访问，应限制为 `127.0.0.1` 或监控网段。
- VNC 只监听 `127.0.0.1`，只能通过 SSH 隧道访问，登录结束后停止。
- PostgreSQL、MariaDB 和 Rebase API 只对必要的本机或内网地址开放。
- Docker socket 不对公网暴露。
- Profile、env、数据库备份和证书私钥权限为最小权限。
- `sshd -t`、`nginx -t`、Docker Compose config、数据库恢复抽样均通过。
- SSH 连接协商到 `sntrup` 或 `mlkem`，或记录兼容性原因并安排后续升级。

检查命令：

```bash
sudo sshd -t
sudo nginx -t
ss -ltnp
docker compose --env-file infra/production/server.env -f infra/production/docker-compose.yml config
./ops/manage.sh check
./ops/manage.sh ready
./ops/manage.sh x check
```

## 7. 回滚条件

满足以下任一条件，立即停止切换并回滚到旧主机：

- Rebase API、数据库或 Tunnel 在验收窗口内持续不健康。
- 公共网站、Admin、WordPress 或旧业务域名出现无法接受的 5xx。
- 数据库恢复校验失败或出现数据不一致。
- Nginx、证书、监控或 SSH 无法恢复。
- X Profile 会话无法恢复且没有人工登录条件。

回滚动作：恢复 DNS/Tunnel/Nginx 指向旧主机，停止新机写入，保存新机日志和数据库状态，使用切换前的备份核对数据。旧主机至少保留 7-14 天，不得在观察期内销毁。

## 8. 清理批准单

每项清理都应记录 owner、备份位置、验证结果、执行人和时间。没有 owner 或恢复验证的项目保持原样。

| 清理对象 | 前置条件 | 批准状态 |
| --- | --- | --- |
| Docker build cache | `docker system df` 已确认，保留当前镜像 | 待维护窗口 |
| 未使用 Docker 镜像 | 已确认不需要回滚 | 待维护窗口 |
| 旧 X Profile 备份 | 当前 Profile 和最近两份已有异地备份 | 待确认 |
| npm/Cargo/Rustup/VS Code Server 缓存 | owner 确认不再远程开发或构建 | 待确认 |
| PM2 daemon 和旧项目目录 | 域名、进程、数据库 owner 均确认 | 待确认 |
| MariaDB/WordPress 数据 | 业务下线或已迁移并恢复验证 | 禁止直接删除 |
| 宿主机 PostgreSQL 数据库 | 对应应用下线或已迁移并恢复验证 | 禁止直接删除 |
| InfluxDB 数据 | 监控迁移并完成历史数据保留决定 | 禁止直接删除 |

当前计划只批准“盘点、备份、迁移和验证”，不批准直接删除未知服务或数据库数据。
