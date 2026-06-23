#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Building frontend (VITE_API_URL=/api)"
VITE_API_URL=/api npm run build

echo "==> Building server"
npm run build --prefix server

echo "==> Production build complete"
echo ""
echo "Run locally:"
echo "  cp .env.production.example .env   # set ADMIN_TOKEN"
echo "  NODE_ENV=production SERVE_STATIC=true STATIC_DIR=./dist DB_PATH=./server/data/lottery.db node server/dist/index.js"
echo ""
echo "Or with Docker:"
echo "  cp .env.production.example .env"
echo "  docker compose up -d --build"
