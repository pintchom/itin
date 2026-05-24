#!/usr/bin/env bash
# API smoke tests — output stays in the terminal (no REST Client UI).
# Usage: ./scripts/api-http.sh [health|config|dev-login|me|all]

set -euo pipefail
API_BASE="${API_BASE:-http://localhost:3001}"
COOKIE_JAR="${COOKIE_JAR:-$(dirname "$0")/../.vscode/.rest-cookies.txt}"
CMD="${1:-all}"

pretty() {
  if command -v jq >/dev/null 2>&1; then jq .; else cat; fi
}

health() {
  echo "=== GET /health ==="
  curl -sS "$API_BASE/health" | pretty
}

config() {
  echo "=== GET /api/auth/config ==="
  curl -sS "$API_BASE/api/auth/config" | pretty
}

dev_login() {
  echo "=== POST /api/dev-login ==="
  curl -sS -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
    -X POST "$API_BASE/api/dev-login" \
    -H 'Content-Type: application/json' \
    -d '{"firstName":"Test","lastName":"User"}' | pretty
}

me() {
  echo "=== GET /api/me ==="
  curl -sS -b "$COOKIE_JAR" "$API_BASE/api/me" | pretty
}

case "$CMD" in
  health) health ;;
  config) config ;;
  dev-login) dev_login ;;
  me) me ;;
  all)
    health
    echo
    config
    echo
    dev_login
    echo
    me
    ;;
  *)
    echo "Usage: $0 [health|config|dev-login|me|all]" >&2
    exit 1
    ;;
esac
