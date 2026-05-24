#!/usr/bin/env bash
# Write curl output to .vscode/api-response.http for a stable side-panel view.
# Usage: write-api-response.sh "GET /health" curl -sS http://localhost:3001/health

set -euo pipefail
LABEL="${1:?label required (e.g. GET /health)}"
shift
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SINK="$ROOT/.vscode/api-response.http"
BODY="$("$@" 2>&1)" || true
{
  echo "# $LABEL"
  echo "# $(date -Iseconds)"
  echo
  if command -v jq >/dev/null 2>&1 && echo "$BODY" | jq -e . >/dev/null 2>&1; then
    echo "$BODY" | jq .
  else
    echo "$BODY"
  fi
} >"$SINK"
