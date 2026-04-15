#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REMOTE_HOST="${REBASE_REMOTE_HOST:-rebase@rebase.host}"
REMOTE_DIR="${REBASE_REMOTE_DIR:-/home/rebase/rebase.network}"
COMPOSE_FILE="${REBASE_COMPOSE_FILE:-infra/production/docker-compose.yml}"
ENV_FILE="${REBASE_SERVER_ENV:-infra/production/server.env}"
API_PORT="${REBASE_API_PORT:-8788}"
DEFAULT_LOG_TAIL="${REBASE_LOG_TAIL:-120}"

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

db_backup_remote() {
  local backup_path="$1"
  local backup_target="$backup_path"
  local resolved_target="$backup_path"

  [[ "$backup_path" = /* ]] || resolved_target="${REMOTE_DIR}/${backup_path}"

  remote_repo_exec "mkdir -p $(quote "$(dirname "$backup_target")") && docker compose --env-file $(quote "$ENV_FILE") -f $(quote "$COMPOSE_FILE") exec -T postgres sh -lc $(quote 'export PGPASSWORD=\"$POSTGRES_PASSWORD\"; exec pg_dump -U \"$POSTGRES_USER\" -d \"$POSTGRES_DB\"') | gzip -c > $(quote "$backup_target") && ls -lh $(quote "$backup_target")"
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
    --exclude '.git/' \
    --exclude '.env' \
    --exclude 'infra/production/server.env' \
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

usage() {
  cat <<EOF
Usage:
  ./ops/manage.sh help
  ./ops/manage.sh check
  ./ops/manage.sh sync
  ./ops/manage.sh deploy [api|stack] [--no-sync]
  ./ops/manage.sh up [api|postgres|cloudflared|stack]
  ./ops/manage.sh restart <api|postgres|cloudflared|stack>
  ./ops/manage.sh stop <api|postgres|cloudflared|stack>
  ./ops/manage.sh ps
  ./ops/manage.sh logs [api|postgres|cloudflared] [tail]
  ./ops/manage.sh health
  ./ops/manage.sh ready
  ./ops/manage.sh exec <service> -- <command...>
  ./ops/manage.sh db <shell|query|logs|restart|backup|download|list-backups|list-exports|export|export-query|migrate>
  ./ops/manage.sh bootstrap-admin
  ./ops/manage.sh seed
  ./ops/manage.sh ssh

Environment overrides:
  REBASE_REMOTE_HOST   default: ${REMOTE_HOST}
  REBASE_REMOTE_DIR    default: ${REMOTE_DIR}
  REBASE_COMPOSE_FILE  default: ${COMPOSE_FILE}
  REBASE_SERVER_ENV    default: ${ENV_FILE}
  REBASE_API_PORT      default: ${API_PORT}
  REBASE_LOG_TAIL      default: ${DEFAULT_LOG_TAIL}

Examples:
  ./ops/manage.sh deploy api
  ./ops/manage.sh deploy stack --no-sync
  ./ops/manage.sh logs api 200
  ./ops/manage.sh db query "select count(*) from geekdaily_episodes;"
  ./ops/manage.sh db backup
  ./ops/manage.sh db list-backups
  ./ops/manage.sh db download backups/rebase-20260415-120000.sql.gz ./rebase.sql.gz
  ./ops/manage.sh db export-query "select id, email from staff_accounts" exports/staff_accounts.csv
  ./ops/manage.sh exec api -- pnpm --filter @rebase/api bootstrap-admin
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

    services="$(expand_target "$target")"
    if [[ "$no_sync" != true ]]; then
      sync_repo
    fi
    assert_remote_layout
    log "deploying $target on $REMOTE_HOST"
    compose_exec "up -d --build $services"
    compose_exec "ps"
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
    remote_exec "curl -fsS http://127.0.0.1:${API_PORT}/ready"
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
        assert_remote_layout
        compose_exec "exec -T api pnpm --filter @rebase/db migrate"
        ;;

      *)
        die "unknown db subcommand: $subcommand"
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
