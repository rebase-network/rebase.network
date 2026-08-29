#!/usr/bin/env bash

set -euo pipefail

STATE_DIR="${X_LOGIN_STATE_DIR:-$HOME/.local/state/rebase-x-browser}"
PROFILE_DIR="${X_PROFILE_DIR:-$HOME/.local/share/rebase-x-profile}"
DISPLAY_NUMBER="${X_LOGIN_DISPLAY:-97}"
DISPLAY_VALUE=":${DISPLAY_NUMBER}"
VNC_PORT="${X_LOGIN_VNC_PORT:-5907}"
CHROME_BIN="${CHROME_PATH:-/usr/bin/google-chrome-stable}"
LOGIN_URL="https://x.com/i/flow/login"

pid_file() {
  printf '%s/%s.pid' "$STATE_DIR" "$1"
}

read_pid() {
  local file
  file="$(pid_file "$1")"
  if [[ -f "$file" ]]; then cat "$file"; fi
}

process_matches() {
  local name="$1"
  local pid="$2"
  local command
  command="$(ps -p "$pid" -o command= 2>/dev/null || true)"
  case "$name" in
    xvfb) [[ "$command" == *"Xvfb $DISPLAY_VALUE "* ]] ;;
    x11vnc) [[ "$command" == *"x11vnc "* && "$command" == *"-rfbport $VNC_PORT"* ]] ;;
    chrome) [[ "$command" == *"--user-data-dir=$PROFILE_DIR"* && "$command" != *"--type="* ]] ;;
    *) return 1 ;;
  esac
}

find_chrome_pid() {
  ps ax -o pid=,command= | awk -v marker="--user-data-dir=$PROFILE_DIR" 'index($0, marker) && $0 !~ /--type=/ && $0 !~ /awk -v marker/ { print $1; exit }'
}

is_running() {
  local name="$1"
  local pid
  pid="$(read_pid "$name")"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null && process_matches "$name" "$pid"; then return 0; fi
  if [[ "$name" == chrome ]]; then
    pid="$(find_chrome_pid)"
    if [[ -n "$pid" ]]; then echo "$pid" >"$(pid_file chrome)"; return 0; fi
  fi
  return 1
}

stop_process() {
  local name="$1"
  local pid
  pid="$(read_pid "$name")"
  if [[ -z "$pid" ]] || ! is_running "$name"; then
    [[ ! -f "$(pid_file "$name")" ]] || unlink "$(pid_file "$name")"
    return 0
  fi
  kill -TERM "$pid"
  for _ in $(seq 1 40); do
    if ! kill -0 "$pid" 2>/dev/null; then
      unlink "$(pid_file "$name")"
      return 0
    fi
    sleep 0.25
  done
  return 1
}

wait_for_display() {
  for _ in $(seq 1 40); do
    DISPLAY="$DISPLAY_VALUE" xdpyinfo >/dev/null 2>&1 && return 0
    sleep 0.25
  done
  return 1
}

wait_for_vnc() {
  for _ in $(seq 1 40); do
    ss -ltn | grep -q "127.0.0.1:${VNC_PORT} " && return 0
    sleep 0.25
  done
  return 1
}

wait_for_chrome() {
  for _ in $(seq 1 40); do
    if is_running chrome; then return 0; fi
    sleep 0.25
  done
  return 1
}

backup_profile() {
  if is_running chrome; then
    echo 'Chrome is still using the X Profile' >&2
    return 1
  fi
  [[ -d "$PROFILE_DIR" ]] || { echo "X Profile does not exist: $PROFILE_DIR" >&2; return 1; }
  local backup_dir="${PROFILE_DIR}.backup-$(date +%Y%m%d-%H%M%S)"
  cp -a "$PROFILE_DIR" "$backup_dir"
  chmod -R go-rwx "$backup_dir"
  printf 'PROFILE_BACKUP=%s\n' "$backup_dir"
}

start_session() {
  for command in Xvfb x11vnc xdpyinfo ss openssl "$CHROME_BIN"; do
    command -v "$command" >/dev/null 2>&1 || { echo "missing command: $command" >&2; return 1; }
  done
  if is_running chrome || is_running x11vnc || is_running xvfb; then
    echo 'X login session is already running' >&2
    return 1
  fi
  [[ ! -e "/tmp/.X${DISPLAY_NUMBER}-lock" ]] || { echo "display $DISPLAY_VALUE is already in use" >&2; return 1; }
  ! ss -ltn | grep -q "127.0.0.1:${VNC_PORT} " || { echo "VNC port $VNC_PORT is already in use" >&2; return 1; }
  for _ in $(seq 1 40); do
    [[ -z "$(find_chrome_pid)" ]] && break
    sleep 0.25
  done
  [[ -z "$(find_chrome_pid)" ]] || { echo 'X Profile is still in use by Chrome' >&2; return 1; }

  mkdir -p "$STATE_DIR" "$PROFILE_DIR"
  chmod 700 "$STATE_DIR" "$PROFILE_DIR"
  local password
  password="$(openssl rand -hex 4)"
  umask 077
  x11vnc -storepasswd "$password" "$STATE_DIR/vnc.pass" >/dev/null

  trap 'stop_process chrome || true; stop_process x11vnc || true; stop_process xvfb || true' ERR
  nohup Xvfb "$DISPLAY_VALUE" -screen 0 1440x960x24 -nolisten tcp >"$STATE_DIR/xvfb.log" 2>&1 &
  echo $! >"$(pid_file xvfb)"
  wait_for_display

  nohup x11vnc -display "$DISPLAY_VALUE" -localhost -rfbauth "$STATE_DIR/vnc.pass" -forever -shared -rfbport "$VNC_PORT" >"$STATE_DIR/x11vnc.log" 2>&1 &
  echo $! >"$(pid_file x11vnc)"
  wait_for_vnc

  DISPLAY="$DISPLAY_VALUE" nohup "$CHROME_BIN" \
    --user-data-dir="$PROFILE_DIR" \
    --password-store=basic \
    --no-first-run \
    --no-default-browser-check \
    --disable-dev-shm-usage \
    --window-size=1440,960 \
    "$LOGIN_URL" >"$STATE_DIR/chrome.log" 2>&1 &
  echo $! >"$(pid_file chrome)"
  if ! wait_for_chrome; then
    echo 'Chrome failed to start; see chrome.log' >&2
    stop_process x11vnc || true
    stop_process xvfb || true
    return 1
  fi
  trap - ERR

  printf 'VNC_PASSWORD=%s\nVNC_PORT=%s\nDISPLAY=%s\nPROFILE=%s\n' "$password" "$VNC_PORT" "$DISPLAY_VALUE" "$PROFILE_DIR"
}

stop_session() {
  local should_backup="${1:-true}"
  stop_process chrome
  if [[ "$should_backup" == true ]]; then backup_profile; fi
  stop_process x11vnc
  stop_process xvfb
  echo 'X login session stopped'
}

show_status() {
  for name in xvfb x11vnc chrome; do
    if is_running "$name"; then printf '%s=running pid=%s\n' "$name" "$(read_pid "$name")"; else printf '%s=stopped\n' "$name"; fi
  done
  if ss -ltn | grep -q "127.0.0.1:${VNC_PORT} "; then printf 'vnc=127.0.0.1:%s\n' "$VNC_PORT"; else echo 'vnc=stopped'; fi
  if [[ -d "$PROFILE_DIR" ]]; then du -sh "$PROFILE_DIR" | awk '{print "profile_size=" $1}'; else echo 'profile=missing'; fi
  if is_running chrome; then DISPLAY="$DISPLAY_VALUE" xwininfo -root -tree 2>/dev/null | grep 'Google Chrome' | tail -1 || true; fi
}

case "${1:-status}" in
  start) start_session ;;
  stop) stop_session true ;;
  stop-no-backup) stop_session false ;;
  backup) backup_profile ;;
  status) show_status ;;
  *) echo "Usage: $0 <start|stop|stop-no-backup|backup|status>" >&2; exit 1 ;;
esac
