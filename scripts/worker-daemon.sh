#!/usr/bin/env bash
#
# Worker daemon — runs local-scanner.ts with auto-restart, logging, and PID management.
#
# Usage:
#   ./scripts/worker-daemon.sh start   — start the worker (daemonized)
#   ./scripts/worker-daemon.sh stop    — gracefully stop the worker
#   ./scripts/worker-daemon.sh status  — check if worker is running
#   ./scripts/worker-daemon.sh logs    — tail the worker log
#   ./scripts/worker-daemon.sh run     — run in foreground (for development)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

LOG_DIR="${HOME}/.openclaw/workspace/logs"
LOG_FILE="${LOG_DIR}/worker.log"
PID_FILE="${LOG_DIR}/worker.pid"
MAX_RESTARTS=50
RESTART_DELAY=5
BACKOFF_MAX=60

mkdir -p "$LOG_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

is_running() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid=$(cat "$PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
    # Stale PID file
    rm -f "$PID_FILE"
  fi
  return 1
}

run_worker() {
  local restart_count=0
  local delay=$RESTART_DELAY

  trap 'log "Received shutdown signal"; exit 0' SIGTERM SIGINT

  while [ $restart_count -lt $MAX_RESTARTS ]; do
    log "Starting worker (attempt $((restart_count + 1))/$MAX_RESTARTS)..."

    cd "$PROJECT_DIR"
    node --env-file=.env.local --import tsx scripts/local-scanner.ts >> "$LOG_FILE" 2>&1 &
    local worker_pid=$!

    # Wait for the worker process to exit
    wait $worker_pid
    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
      log "Worker exited cleanly (code 0). Restarting in ${delay}s..."
    else
      log "Worker crashed with exit code $exit_code. Restarting in ${delay}s..."
    fi

    restart_count=$((restart_count + 1))
    sleep "$delay"

    # Exponential backoff capped at BACKOFF_MAX
    delay=$((delay * 2))
    if [ $delay -gt $BACKOFF_MAX ]; then
      delay=$BACKOFF_MAX
    fi

    # Reset backoff after 5 minutes of successful running
    # (handled implicitly — if worker runs long enough, restart_count still increments)
  done

  log "Exceeded max restarts ($MAX_RESTARTS). Giving up."
  rm -f "$PID_FILE"
  exit 1
}

cmd_start() {
  if is_running; then
    echo "Worker is already running (PID $(cat "$PID_FILE"))"
    exit 0
  fi

  log "Starting worker daemon..."
  run_worker &
  local daemon_pid=$!
  echo "$daemon_pid" > "$PID_FILE"
  echo "Worker daemon started (PID $daemon_pid). Logs: $LOG_FILE"
}

cmd_stop() {
  if ! is_running; then
    echo "Worker is not running."
    exit 0
  fi

  local pid
  pid=$(cat "$PID_FILE")
  log "Stopping worker daemon (PID $pid)..."
  kill "$pid" 2>/dev/null || true

  # Wait up to 10s for graceful shutdown
  for i in $(seq 1 10); do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 1
  done

  # Force kill if still running
  if kill -0 "$pid" 2>/dev/null; then
    log "Force killing worker (PID $pid)..."
    kill -9 "$pid" 2>/dev/null || true
  fi

  rm -f "$PID_FILE"
  echo "Worker stopped."
}

cmd_status() {
  if is_running; then
    echo "Worker is running (PID $(cat "$PID_FILE"))"
  else
    echo "Worker is not running."
  fi
}

cmd_logs() {
  if [ -f "$LOG_FILE" ]; then
    tail -f "$LOG_FILE"
  else
    echo "No log file found at $LOG_FILE"
  fi
}

cmd_run() {
  log "Running worker in foreground..."
  echo "$BASHPID" > "$PID_FILE"
  trap 'log "Shutting down..."; rm -f "$PID_FILE"; exit 0' SIGTERM SIGINT
  run_worker
}

case "${1:-}" in
  start)  cmd_start ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  logs)   cmd_logs ;;
  run)    cmd_run ;;
  *)
    echo "Usage: $0 {start|stop|status|logs|run}"
    exit 1
    ;;
esac
