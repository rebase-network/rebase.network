#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REMOTE_HOST="${REBASE_REMOTE_HOST:-rebase@rebase.host}"
REMOTE_DIR="${REBASE_REMOTE_DIR:-/home/rebase/rebase.network}"
COMPOSE_FILE="${REBASE_COMPOSE_FILE:-infra/production/docker-compose.yml}"
ENV_FILE="${REBASE_SERVER_ENV:-infra/production/server.env}"
LOCAL_ENV_SYNC_FILE="${REBASE_LOCAL_ENV_FILE:-ops/.env}"
LOCAL_ENV_DOWNLOAD_FILE="${REBASE_LOCAL_ENV_DOWNLOAD_FILE:-ops/.env.download}"
API_PORT="${REBASE_API_PORT:-8788}"
DEFAULT_LOG_TAIL="${REBASE_LOG_TAIL:-120}"
X_PROFILE_DIR="${REBASE_X_PROFILE_DIR:-/home/rebase/.local/share/rebase-x-profile}"
X_HANDLE="${REBASE_X_HANDLE:-RebaseCommunity}"
X_NODE_BIN_DIR="${REBASE_X_NODE_BIN_DIR:-/home/rebase/.local/node-v22.21.1-linux-x64/bin}"
X_CHROME_PATH="${REBASE_X_CHROME_PATH:-/usr/bin/google-chrome-stable}"
X_VNC_PORT="${REBASE_X_VNC_PORT:-5907}"
X_PUBLISHER_SOCKET_PATH="${REBASE_X_PUBLISHER_SOCKET_PATH:-/home/rebase/.local/state/rebase-x-browser/publisher.sock}"
X_TUNNEL_SOCKET="${REBASE_X_TUNNEL_SOCKET:-/tmp/rebase-x-vnc-${UID}.sock}"

SSH_OPTS=(
  -o
  StrictHostKeyChecking=accept-new
)

log() {
  printf '[manage] %s\n' "$*"
}

die() {
  printf '[manage] error: %s\n' "$*" >&2
  exit 1
}

quote() {
  printf '%q' "$1"
}

shell_join() {
  local parts=()
  local arg

  for arg in "$@"; do
    parts+=("$(quote "$arg")")
  done

  printf '%s' "${parts[*]}"
}

require_local() {
  command -v "$1" >/dev/null 2>&1 || die "missing local command: $1"
}

is_service() {
  case "${1:-}" in
    api | postgres | cloudflared)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

expand_target() {
  local target="${1:-}"

  case "$target" in
    api | postgres | cloudflared)
      printf '%s\n' "$target"
      ;;
    stack | all)
      printf '%s\n' "postgres api cloudflared"
      ;;
    *)
      die "unknown target: ${target:-<empty>}"
      ;;
  esac
}

remote_exec() {
  ssh "${SSH_OPTS[@]}" "$REMOTE_HOST" "$1"
}

remote_exec_tty() {
  ssh "${SSH_OPTS[@]}" -t "$REMOTE_HOST" "$1"
}

remote_repo_exec() {
  local command="$1"

  remote_exec "set -euo pipefail; cd $(quote "$REMOTE_DIR"); $command"
}

remote_repo_exec_tty() {
  local command="$1"

  remote_exec_tty "set -euo pipefail; cd $(quote "$REMOTE_DIR"); $command"
}

compose_exec() {
  local command="$1"

  remote_repo_exec "docker compose --env-file $(quote "$ENV_FILE") -f $(quote "$COMPOSE_FILE") $command"
}

compose_exec_tty() {
  local command="$1"

  remote_repo_exec_tty "docker compose --env-file $(quote "$ENV_FILE") -f $(quote "$COMPOSE_FILE") $command"
}

compose_exec_postgres_shell() {
  local interactive="${1:-false}"
  local script="$2"

  if [[ "$interactive" == true ]]; then
    compose_exec_tty "exec postgres sh -lc $(quote "$script")"
    return
  fi

  compose_exec "exec -T postgres sh -lc $(quote "$script")"
}

ready_check_remote() {
  remote_exec "curl -fsS http://127.0.0.1:${API_PORT}/ready"
}

ensure_remote_dir() {
  remote_exec "mkdir -p $(quote "$REMOTE_DIR")"
}

assert_remote_layout() {
  remote_repo_exec "[ -f $(quote "$COMPOSE_FILE") ] || { echo missing $(quote "$COMPOSE_FILE") >&2; exit 1; }; [ -f $(quote "$ENV_FILE") ] || { echo missing $(quote "$ENV_FILE") >&2; exit 1; }"
}

resolve_remote_abs_path() {
  local target="$1"

  if [[ "$target" = /* ]]; then
    printf '%s\n' "$target"
    return
  fi

  printf '%s/%s\n' "$REMOTE_DIR" "$target"
}

resolve_local_abs_path() {
  local target="$1"

  if [[ "$target" = /* ]]; then
    printf '%s\n' "$target"
    return
  fi

  printf '%s/%s\n' "$ROOT_DIR" "$target"
}

backup_env_remote() {
  local backup_path="${1:-backups/env/$(basename "$ENV_FILE").$(date +%Y%m%d-%H%M%S).bak}"
  local resolved_env
  local resolved_backup

  resolved_env="$(resolve_remote_abs_path "$ENV_FILE")"
  resolved_backup="$(resolve_remote_abs_path "$backup_path")"

  remote_exec "mkdir -p $(quote "$(dirname "$resolved_backup")") && cp $(quote "$resolved_env") $(quote "$resolved_backup") && ls -lh $(quote "$resolved_backup")"
  log "env backup written to ${resolved_backup}"
}

download_env_local() {
  local local_path="${1:-$LOCAL_ENV_DOWNLOAD_FILE}"
  local resolved_local
  local resolved_remote

  require_local rsync
  assert_remote_layout

  resolved_local="$(resolve_local_abs_path "$local_path")"
  resolved_remote="$(resolve_remote_abs_path "$ENV_FILE")"

  remote_exec "[ -f $(quote "$resolved_remote") ] || { echo missing $(quote "$resolved_remote") >&2; exit 1; }"
  mkdir -p "$(dirname "$resolved_local")"

  log "downloading ${resolved_remote} to ${resolved_local}"
  rsync -az --human-readable "${REMOTE_HOST}:${resolved_remote}" "$resolved_local"
}

sync_env_remote() {
  local local_path="${1:-$LOCAL_ENV_SYNC_FILE}"
  local backup_path="${2:-backups/env/$(basename "$ENV_FILE").$(date +%Y%m%d-%H%M%S).bak}"
  local resolved_local
  local resolved_remote
  local remote_temp

  require_local rsync
  remote_repo_exec "[ -f $(quote "$COMPOSE_FILE") ] || { echo missing $(quote "$COMPOSE_FILE") >&2; exit 1; }"

  resolved_local="$(resolve_local_abs_path "$local_path")"
  [[ -f "$resolved_local" ]] || die "missing local env file: ${resolved_local}"

  resolved_remote="$(resolve_remote_abs_path "$ENV_FILE")"
  remote_temp="${resolved_remote}.tmp.$(date +%s)"

  if remote_exec "[ -f $(quote "$resolved_remote") ]"; then
    log "backing up remote env before sync"
    backup_env_remote "$backup_path"
  else
    log "remote env does not exist yet; creating it from local config"
  fi

  log "uploading ${resolved_local} to temporary remote path"
  rsync -az --human-readable "$resolved_local" "${REMOTE_HOST}:${remote_temp}"

  remote_exec "mkdir -p $(quote "$(dirname "$resolved_remote")") && mv $(quote "$remote_temp") $(quote "$resolved_remote") && ls -lh $(quote "$resolved_remote")"
  log "remote env synced to ${resolved_remote}"
}

db_backup_remote() {
  local backup_path="$1"
  local backup_target="$backup_path"
  local resolved_target="$backup_path"
  local dump_script

  [[ "$backup_path" = /* ]] || resolved_target="${REMOTE_DIR}/${backup_path}"
  dump_script='export PGPASSWORD="$POSTGRES_PASSWORD"; exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

  remote_repo_exec "mkdir -p $(quote "$(dirname "$backup_target")") && docker compose --env-file $(quote "$ENV_FILE") -f $(quote "$COMPOSE_FILE") exec -T postgres sh -lc $(quote "$dump_script") | gzip -c > $(quote "$backup_target") && ls -lh $(quote "$backup_target")"
  log "database backup written to ${resolved_target}"
}

db_download_remote() {
  local remote_path="$1"
  local local_path="${2:-}"
  local resolved_remote

  require_local rsync

  resolved_remote="$(resolve_remote_abs_path "$remote_path")"
  remote_exec "[ -f $(quote "$resolved_remote") ] || { echo missing $(quote "$resolved_remote") >&2; exit 1; }"

  if [[ -z "$local_path" ]]; then
    local_path="$(basename "$resolved_remote")"
  fi

  mkdir -p "$(dirname "$local_path")"
  log "downloading ${resolved_remote} to ${local_path}"
  rsync -az --human-readable "${REMOTE_HOST}:${resolved_remote}" "$local_path"
}

db_list_remote() {
  local target_dir="$1"
  local resolved_dir

  resolved_dir="$(resolve_remote_abs_path "$target_dir")"
  remote_exec "if [ -d $(quote "$resolved_dir") ]; then cd $(quote "$resolved_dir") && ls -lh; else echo '[manage] no files under $(quote "$resolved_dir")'; fi"
}

db_export_table_remote() {
  local table_name="$1"
  local export_path="$2"
  local export_target="$export_path"
  local resolved_target="$export_path"
  local copy_sql

  [[ "$table_name" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || die "db export requires a simple table name"
  [[ "$export_path" = /* ]] || resolved_target="${REMOTE_DIR}/${export_path}"

  copy_sql="COPY ${table_name} TO STDOUT WITH CSV HEADER"
  remote_repo_exec "mkdir -p $(quote "$(dirname "$export_target")") && docker compose --env-file $(quote "$ENV_FILE") -f $(quote "$COMPOSE_FILE") exec -T postgres sh -lc $(quote "export PGPASSWORD=\"\$POSTGRES_PASSWORD\"; exec psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -v ON_ERROR_STOP=1 -P pager=off -c $(quote "$copy_sql")") > $(quote "$export_target") && ls -lh $(quote "$export_target")"
  log "table export written to ${resolved_target}"
}

db_export_query_remote() {
  local query_sql="$1"
  local export_path="$2"
  local export_target="$export_path"
  local resolved_target="$export_path"
  local copy_sql

  query_sql="${query_sql%;}"
  [[ -n "$query_sql" ]] || die "db export-query requires a non-empty SELECT"
  [[ "$export_path" = /* ]] || resolved_target="${REMOTE_DIR}/${export_path}"

  copy_sql="COPY (${query_sql}) TO STDOUT WITH CSV HEADER"
  remote_repo_exec "mkdir -p $(quote "$(dirname "$export_target")") && docker compose --env-file $(quote "$ENV_FILE") -f $(quote "$COMPOSE_FILE") exec -T postgres sh -lc $(quote "export PGPASSWORD=\"\$POSTGRES_PASSWORD\"; exec psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -v ON_ERROR_STOP=1 -P pager=off -c $(quote "$copy_sql")") > $(quote "$export_target") && ls -lh $(quote "$export_target")"
  log "query export written to ${resolved_target}"
}

sync_repo() {
  require_local rsync
  ensure_remote_dir

  log "syncing repository to ${REMOTE_HOST}:${REMOTE_DIR}"

  rsync \
    -az \
    --delete \
    --human-readable \
    --filter='P .git/' \
    --filter='P .env' \
    --filter='P infra/production/server.env' \
    --filter='P ops/.env' \
    --exclude '.git/' \
    --exclude '.env' \
    --exclude 'infra/production/server.env' \
    --exclude 'ops/.env' \
    --exclude '.DS_Store' \
    --exclude 'node_modules/' \
    --exclude 'apps/web/dist/' \
    --exclude 'apps/admin/dist/' \
    --exclude 'apps/api/dist/' \
    --exclude 'packages/db/dist/' \
    --exclude 'packages/shared/dist/' \
    --exclude 'test-results/' \
    --exclude 'playwright-report/' \
    "$ROOT_DIR/" \
    "${REMOTE_HOST}:${REMOTE_DIR}/"
}

deploy_target() {
  local target="${1:-api}"
  local no_sync="${2:-false}"
  local services

  services="$(expand_target "$target")"
  if [[ "$no_sync" != true ]]; then
    sync_repo
  fi
  assert_remote_layout
  log "deploying $target on $REMOTE_HOST"
  compose_exec "up -d --build $services"
  compose_exec "ps"
}

db_migrate_remote() {
  assert_remote_layout
  log "running database migrations on $REMOTE_HOST"
  compose_exec "exec -T api pnpm --filter @rebase/db migrate"
}

rollout_target() {
  local target="${1:-api}"
  local no_sync="${2:-false}"
  local backup_path

  case "$target" in
    api | stack | all)
      ;;
    *)
      die "rollout only supports api or stack targets"
      ;;
  esac

  assert_remote_layout
  backup_path="backups/rebase-${target}-$(date +%Y%m%d-%H%M%S).sql.gz"
  log "creating pre-rollout database backup"
  db_backup_remote "$backup_path"
  deploy_target "$target" "$no_sync"
  db_migrate_remote
  log "verifying API readiness"
  ready_check_remote
  compose_exec "ps"
  log "rollout complete; backup stored at $(resolve_remote_abs_path "$backup_path")"
}

x_remote_script() {
  local action="$1"
  remote_repo_exec "X_PROFILE_DIR=$(quote "$X_PROFILE_DIR") CHROME_PATH=$(quote "$X_CHROME_PATH") X_LOGIN_VNC_PORT=$(quote "$X_VNC_PORT") bash scripts/x-browser/remote-login-session.sh $(quote "$action")"
}

x_profile_check() {
  remote_repo_exec "export PATH=$(quote "$X_NODE_BIN_DIR"):\$PATH; CHROME_PATH=$(quote "$X_CHROME_PATH") X_PROFILE_DIR=$(quote "$X_PROFILE_DIR") X_HANDLE=$(quote "$X_HANDLE") pnpm x:profile-check"
}

x_remote_publisher() {
  local action="$1"
  remote_repo_exec "X_PROFILE_DIR=$(quote "$X_PROFILE_DIR") X_NODE_BIN_DIR=$(quote "$X_NODE_BIN_DIR") X_REPO_DIR=$(quote "$REMOTE_DIR") X_PUBLISHER_SOCKET_PATH=$(quote "$X_PUBLISHER_SOCKET_PATH") CHROME_PATH=$(quote "$X_CHROME_PATH") bash scripts/x-browser/publisher-service.sh $(quote "$action")"
}

x_tunnel_start() {
  require_local ssh
  if [[ -S "$X_TUNNEL_SOCKET" ]] && ssh -S "$X_TUNNEL_SOCKET" -O check "$REMOTE_HOST" >/dev/null 2>&1; then
    printf '[manage] error: X VNC tunnel is already running: %s\n' "$X_TUNNEL_SOCKET" >&2
    return 1
  fi
  [[ ! -e "$X_TUNNEL_SOCKET" ]] || unlink "$X_TUNNEL_SOCKET"
  ssh "${SSH_OPTS[@]}" -M -S "$X_TUNNEL_SOCKET" -fN -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -L "127.0.0.1:${X_VNC_PORT}:127.0.0.1:${X_VNC_PORT}" "$REMOTE_HOST"
  log "X VNC tunnel ready at vnc://127.0.0.1:${X_VNC_PORT}"
  if command -v open >/dev/null 2>&1; then open "vnc://127.0.0.1:${X_VNC_PORT}"; fi
}

x_tunnel_stop() {
  if [[ -S "$X_TUNNEL_SOCKET" ]]; then
    ssh -S "$X_TUNNEL_SOCKET" -O exit "$REMOTE_HOST" >/dev/null 2>&1 || true
    [[ ! -e "$X_TUNNEL_SOCKET" ]] || unlink "$X_TUNNEL_SOCKET"
  fi
}

usage() {
  cat <<EOF
Usage:
  ./ops/manage.sh help
  ./ops/manage.sh check
  ./ops/manage.sh sync
  ./ops/manage.sh download-env [local-path]
  ./ops/manage.sh sync-env [local-path]
  ./ops/manage.sh deploy [api|stack] [--no-sync]
  ./ops/manage.sh rollout [api|stack] [--no-sync]
  ./ops/manage.sh up [api|postgres|cloudflared|stack]
  ./ops/manage.sh restart <api|postgres|cloudflared|stack>
  ./ops/manage.sh stop <api|postgres|cloudflared|stack>
  ./ops/manage.sh ps
  ./ops/manage.sh logs [api|postgres|cloudflared] [tail]
  ./ops/manage.sh health
  ./ops/manage.sh ready
  ./ops/manage.sh exec <service> -- <command...>
  ./ops/manage.sh db <shell|query|logs|restart|backup|download|list-backups|list-exports|export|export-query|migrate>
  ./ops/manage.sh x <check|status|login-start|login-stop|backup>
  ./ops/manage.sh bootstrap-admin
  ./ops/manage.sh seed
  ./ops/manage.sh ssh

Environment overrides:
  REBASE_REMOTE_HOST   default: ${REMOTE_HOST}
  REBASE_REMOTE_DIR    default: ${REMOTE_DIR}
  REBASE_COMPOSE_FILE  default: ${COMPOSE_FILE}
  REBASE_SERVER_ENV    default: ${ENV_FILE}
  REBASE_LOCAL_ENV_FILE default: ${LOCAL_ENV_SYNC_FILE}
  REBASE_LOCAL_ENV_DOWNLOAD_FILE default: ${LOCAL_ENV_DOWNLOAD_FILE}
  REBASE_API_PORT      default: ${API_PORT}
  REBASE_LOG_TAIL      default: ${DEFAULT_LOG_TAIL}
  REBASE_X_PROFILE_DIR default: ${X_PROFILE_DIR}
  REBASE_X_HANDLE      default: ${X_HANDLE}
  REBASE_X_NODE_BIN_DIR default: ${X_NODE_BIN_DIR}
  REBASE_X_CHROME_PATH default: ${X_CHROME_PATH}
  REBASE_X_VNC_PORT    default: ${X_VNC_PORT}
  REBASE_X_PUBLISHER_SOCKET_PATH default: ${X_PUBLISHER_SOCKET_PATH}

Examples:
  ./ops/manage.sh deploy api
  ./ops/manage.sh rollout api
  ./ops/manage.sh download-env
  ./ops/manage.sh sync-env
  ./ops/manage.sh sync-env ops/.env.download
  ./ops/manage.sh deploy stack --no-sync
  ./ops/manage.sh logs api 200
  ./ops/manage.sh db query "select count(*) from geekdaily_episodes;"
  ./ops/manage.sh db backup
  ./ops/manage.sh db list-backups
  ./ops/manage.sh db download backups/rebase-20260415-120000.sql.gz ./rebase.sql.gz
  ./ops/manage.sh db export-query "select id, email from staff_accounts" exports/staff_accounts.csv
  ./ops/manage.sh exec api -- pnpm --filter @rebase/api bootstrap-admin
  ./ops/manage.sh x check
  ./ops/manage.sh x login-start
  ./ops/manage.sh x login-stop
  ./ops/manage.sh x publisher-start
EOF
}

command="${1:-help}"
if [[ $# -gt 0 ]]; then
  shift
fi

case "$command" in
  help | --help | -h)
    usage
    ;;

  check)
    log "checking remote deployment prerequisites"
    remote_exec "set -euo pipefail; printf 'host: %s\n' \$(hostname); printf 'user: %s\n' \$(whoami); command -v docker >/dev/null; docker compose version >/dev/null; command -v rsync >/dev/null; [ -d $(quote "$REMOTE_DIR") ] || { echo missing $(quote "$REMOTE_DIR") >&2; exit 1; }"
    assert_remote_layout
    compose_exec "ps"
    ;;

  sync)
    sync_repo
    ;;

  download-env)
    local_path="${1:-$LOCAL_ENV_DOWNLOAD_FILE}"
    [[ $# -le 1 ]] || die "download-env accepts at most one local path argument"
    download_env_local "$local_path"
    ;;

  sync-env)
    local_path="${1:-$LOCAL_ENV_SYNC_FILE}"
    [[ $# -le 1 ]] || die "sync-env accepts at most one local path argument"
    sync_env_remote "$local_path"
    ;;

  deploy)
    target="${1:-api}"
    [[ $# -gt 0 ]] && shift
    no_sync=false

    while [[ $# -gt 0 ]]; do
      case "$1" in
        --no-sync)
          no_sync=true
          ;;
        *)
          die "unknown option for deploy: $1"
          ;;
      esac
      shift
    done

    deploy_target "$target" "$no_sync"
    ;;

  rollout)
    target="${1:-api}"
    [[ $# -gt 0 ]] && shift
    no_sync=false

    while [[ $# -gt 0 ]]; do
      case "$1" in
        --no-sync)
          no_sync=true
          ;;
        *)
          die "unknown option for rollout: $1"
          ;;
      esac
      shift
    done

    rollout_target "$target" "$no_sync"
    ;;

  up)
    target="${1:-stack}"
    services="$(expand_target "$target")"
    assert_remote_layout
    compose_exec "up -d $services"
    ;;

  restart)
    target="${1:-api}"
    services="$(expand_target "$target")"
    assert_remote_layout
    compose_exec "restart $services"
    ;;

  stop)
    target="${1:-api}"
    services="$(expand_target "$target")"
    assert_remote_layout
    compose_exec "stop $services"
    ;;

  ps | status)
    assert_remote_layout
    compose_exec "ps"
    ;;

  logs)
    service="${1:-api}"
    tail_lines="${2:-$DEFAULT_LOG_TAIL}"
    is_service "$service" || die "unknown service for logs: $service"
    [[ "$tail_lines" =~ ^[0-9]+$ ]] || die "tail must be a positive integer"
    assert_remote_layout
    compose_exec "logs --tail $tail_lines $service"
    ;;

  health)
    remote_exec "curl -fsS http://127.0.0.1:${API_PORT}/health"
    ;;

  ready)
    ready_check_remote
    ;;

  exec)
    service="${1:-}"
    [[ -n "$service" ]] || die "exec requires a service name"
    is_service "$service" || die "unknown service for exec: $service"
    shift
    [[ "${1:-}" == "--" ]] || die "exec requires -- before the command"
    shift
    [[ $# -gt 0 ]] || die "exec requires a command"
    assert_remote_layout
    compose_exec "exec -T $service $(shell_join "$@")"
    ;;

  db)
    subcommand="${1:-help}"
    if [[ $# -gt 0 ]]; then
      shift
    fi

    case "$subcommand" in
      help)
        cat <<EOF
Database commands:
  ./ops/manage.sh db shell
  ./ops/manage.sh db query "<sql>"
  ./ops/manage.sh db logs [tail]
  ./ops/manage.sh db restart
  ./ops/manage.sh db backup [remote-path]
  ./ops/manage.sh db download <remote-path> [local-path]
  ./ops/manage.sh db list-backups
  ./ops/manage.sh db list-exports
  ./ops/manage.sh db export <table> [remote-path]
  ./ops/manage.sh db export-query "<select ...>" [remote-path]
  ./ops/manage.sh db migrate
EOF
        ;;

      shell | psql)
        assert_remote_layout
        compose_exec_postgres_shell true 'export PGPASSWORD="$POSTGRES_PASSWORD"; exec psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
        ;;

      query)
        assert_remote_layout
        sql="${1:-}"
        [[ -n "$sql" ]] || die "db query requires an SQL string"
        compose_exec_postgres_shell false "export PGPASSWORD=\"\$POSTGRES_PASSWORD\"; exec psql -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -v ON_ERROR_STOP=1 -P pager=off -c $(quote "$sql")"
        ;;

      logs)
        assert_remote_layout
        tail_lines="${1:-$DEFAULT_LOG_TAIL}"
        [[ "$tail_lines" =~ ^[0-9]+$ ]] || die "tail must be a positive integer"
        compose_exec "logs --tail $tail_lines postgres"
        ;;

      restart)
        assert_remote_layout
        compose_exec "restart postgres"
        ;;

      backup | dump)
        assert_remote_layout
        backup_path="${1:-backups/rebase-$(date +%Y%m%d-%H%M%S).sql.gz}"
        db_backup_remote "$backup_path"
        ;;

      download | fetch)
        remote_path="${1:-}"
        local_path="${2:-}"
        [[ -n "$remote_path" ]] || die "db download requires a remote path"
        db_download_remote "$remote_path" "$local_path"
        ;;

      list-backups)
        assert_remote_layout
        db_list_remote "backups"
        ;;

      list-exports)
        assert_remote_layout
        db_list_remote "exports"
        ;;

      export)
        assert_remote_layout
        table_name="${1:-}"
        export_path="${2:-exports/${1:-table}-$(date +%Y%m%d-%H%M%S).csv}"
        [[ -n "$table_name" ]] || die "db export requires a table name"
        db_export_table_remote "$table_name" "$export_path"
        ;;

      export-query)
        assert_remote_layout
        query_sql="${1:-}"
        export_path="${2:-exports/query-$(date +%Y%m%d-%H%M%S).csv}"
        [[ -n "$query_sql" ]] || die "db export-query requires an SQL query"
        db_export_query_remote "$query_sql" "$export_path"
        ;;

      migrate)
        db_migrate_remote
        ;;

      *)
        die "unknown db subcommand: $subcommand"
        ;;
    esac
    ;;

  x)
    subcommand="${1:-status}"
    [[ $# -gt 0 ]] && shift
    [[ $# -eq 0 ]] || die "x $subcommand does not accept additional arguments"
    case "$subcommand" in
      check)
        x_profile_check
        ;;
      status)
        x_remote_script status
        if [[ -S "$X_TUNNEL_SOCKET" ]] && ssh -S "$X_TUNNEL_SOCKET" -O check "$REMOTE_HOST" >/dev/null 2>&1; then
          echo "tunnel=running socket=$X_TUNNEL_SOCKET"
        else
          echo 'tunnel=stopped'
        fi
        ;;
      login-start)
        x_remote_script start
        if ! x_tunnel_start; then
          x_remote_script stop-no-backup || true
          exit 1
        fi
        ;;
      login-stop)
        if ! x_remote_script stop; then
          x_tunnel_stop
          exit 1
        fi
        x_tunnel_stop
        ;;
      publisher-start)
        x_remote_publisher start
        ;;
      publisher-stop)
        x_remote_publisher stop
        ;;
      publisher-status)
        x_remote_publisher status
        ;;
      backup)
        x_remote_script backup
        ;;
      help)
        echo 'X commands: check, status, login-start, login-stop, backup'
        ;;
      *)
        die "unknown x command: $subcommand"
        ;;
    esac
    ;;

  bootstrap-admin)
    assert_remote_layout
    compose_exec "exec -T api pnpm --filter @rebase/api bootstrap-admin"
    ;;

  seed)
    assert_remote_layout
    compose_exec "exec -T api pnpm --filter @rebase/db seed"
    ;;

  ssh)
    exec ssh "${SSH_OPTS[@]}" -t "$REMOTE_HOST" "cd $(quote "$REMOTE_DIR"); exec \${SHELL:-bash} -l"
    ;;

  *)
    die "unknown command: $command"
    ;;
esac
