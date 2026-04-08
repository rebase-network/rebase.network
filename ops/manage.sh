#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

REMOTE_HOST="${REBASE_REMOTE_HOST:-rebase@101.33.75.240}"
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

remote_repo_exec() {
  local command="$1"

  remote_exec "set -euo pipefail; cd $(quote "$REMOTE_DIR"); $command"
}

compose_exec() {
  local command="$1"

  remote_repo_exec "docker compose --env-file $(quote "$ENV_FILE") -f $(quote "$COMPOSE_FILE") $command"
}

ensure_remote_dir() {
  remote_exec "mkdir -p $(quote "$REMOTE_DIR")"
}

assert_remote_layout() {
  remote_repo_exec "[ -f $(quote "$COMPOSE_FILE") ] || { echo missing $(quote "$COMPOSE_FILE") >&2; exit 1; }; [ -f $(quote "$ENV_FILE") ] || { echo missing $(quote "$ENV_FILE") >&2; exit 1; }"
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
