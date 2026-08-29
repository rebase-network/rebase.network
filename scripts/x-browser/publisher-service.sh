#!/usr/bin/env bash

set -euo pipefail

STATE_DIR="${X_LOGIN_STATE_DIR:-$HOME/.local/state/rebase-x-browser}"
SOCKET_PATH="${X_PUBLISHER_SOCKET_PATH:-$STATE_DIR/publisher.sock}"
PROFILE_DIR="${X_PROFILE_DIR:-$HOME/.local/share/rebase-x-profile}"
NODE_BIN_DIR="${X_NODE_BIN_DIR:-$HOME/.local/node-v22.21.1-linux-x64/bin}"
CHROME_PATH="${CHROME_PATH:-/usr/bin/google-chrome-stable}"
REPO_DIR="${X_REPO_DIR:-$HOME/rebase.network}"
PID_FILE="$STATE_DIR/publisher.pid"
LOG_FILE="$STATE_DIR/publisher.log"

publisher_pid() { [[ -f "$PID_FILE" ]] && cat "$PID_FILE"; }
publisher_running() { local pid; pid="$(publisher_pid || true)"; [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null && ps -p "$pid" -o command= | grep -Fq 'publisher-server.mjs'; }

start() {
  if publisher_running; then echo "X publisher already running: $(publisher_pid)"; return 1; fi
  mkdir -p "$STATE_DIR"; chmod 700 "$STATE_DIR"
  [[ -d "$PROFILE_DIR" ]] || { echo "missing X Profile: $PROFILE_DIR" >&2; return 1; }
  [[ -f "$REPO_DIR/scripts/x-browser/publisher-server.mjs" ]] || { echo "missing repository: $REPO_DIR" >&2; return 1; }
  export PATH="$NODE_BIN_DIR:$PATH"
  X_PROFILE_DIR="$PROFILE_DIR" X_PUBLISHER_SOCKET_PATH="$SOCKET_PATH" CHROME_PATH="$CHROME_PATH" \
    nohup node "$REPO_DIR/scripts/x-browser/publisher-server.mjs" >"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
  for _ in $(seq 1 40); do
    if [[ -S "$SOCKET_PATH" ]] && publisher_running; then chmod 600 "$SOCKET_PATH"; echo "X publisher started: $SOCKET_PATH"; return 0; fi
    sleep 0.25
  done
  echo 'X publisher failed to start; see publisher.log' >&2
  return 1
}

stop() {
  local pid; pid="$(publisher_pid || true)"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then kill -TERM "$pid"; fi
  rm -f "$PID_FILE"
  echo 'X publisher stopped'
}

status() {
  if publisher_running; then echo "publisher=running pid=$(publisher_pid) socket=$SOCKET_PATH"; else echo 'publisher=stopped'; fi
}

case "${1:-status}" in
  start) start ;;
  stop) stop ;;
  status) status ;;
  *) echo "Usage: $0 <start|stop|status>" >&2; exit 1 ;;
esac
