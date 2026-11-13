#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"

export PATH="/Users/samson/.cache/codex-runtimes/node-v24.22.2-darwin-arm64/bin:/opt/homebrew/bin:/usr/local/bin:/usr/local/mysql/bin:$PATH"

echo "=== Starting Multi-Vendor Shopping System ==="

start_jar() {
  local svc="$1"
  local port="$2"
  local jar_file="$ROOT_DIR/$svc/target/$svc-1.0.0.jar"

  if [ ! -f "$jar_file" ]; then
    echo "Building $svc..."
    (cd "$ROOT_DIR/$svc" && ./mvnw package -DskipTests -q)
  fi

  if lsof -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✓ $svc is already running on port $port"
  else
    echo "Starting $svc on port $port..."
    nohup java -jar "$jar_file" > "$LOG_DIR/$svc.log" 2>&1 &
    echo $! > "$LOG_DIR/$svc.pid"
  fi
}

start_jar "eureka-server" 8761
sleep 4
start_jar "user-service" 8081
start_jar "vendor-service" 8082
start_jar "product-service" 8083
start_jar "order-service" 8084
start_jar "api-gateway" 8080

if lsof -iTCP:5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo "✓ React frontend is already running on port 5173"
else
  echo "Starting React frontend on http://localhost:5173 ..."
  (cd "$ROOT_DIR/frontend" && nohup npm run dev -- --host 0.0.0.0 < /dev/null > "$LOG_DIR/frontend.log" 2>&1 & echo $! > "$LOG_DIR/frontend.pid")
fi

echo ""
echo "All services launched! Logs are in $LOG_DIR"
echo "  • React Storefront : http://localhost:5173"
echo "  • API Gateway      : http://localhost:8080"
echo "  • Eureka Dashboard : http://localhost:8761"
