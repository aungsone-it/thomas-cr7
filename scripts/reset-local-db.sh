#!/usr/bin/env bash
# Remove local SQLite DB + uploads so you start fresh with real SET data (no mock numbers).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB="${DB_PATH:-$ROOT/server/data/lottery.db}"
UPLOADS="${UPLOAD_DIR:-$ROOT/server/data/uploads}"

rm -f "$DB" "${DB}-wal" "${DB}-shm"
echo "Removed $DB"

if [[ -d "$UPLOADS" ]]; then
  rm -rf "$UPLOADS"
  echo "Removed uploads in $UPLOADS"
fi

echo "Done. Restart with: npm run dev:all"
