#!/usr/bin/env bash
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"

echo "Stopping Multi-Vendor Shopping System services..."
for port in 5173 8080 8084 8083 8082 8081 8761; do
  pids=$(lsof -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Stopping process on port $port (PID: $pids)"
    kill $pids 2>/dev/null || true
  fi
done
rm -f "$LOG_DIR"/*.pid 2>/dev/null || true
echo "All services stopped."
