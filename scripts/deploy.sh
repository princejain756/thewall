#!/usr/bin/env bash
set -euo pipefail

ROOT="/root/websites/thewall"
cd "$ROOT"

echo "==> Loading environment..."
set -a
source "$ROOT/.env"
set +a

echo "==> Installing dependencies..."
npm ci --legacy-peer-deps 2>/dev/null || npm install --legacy-peer-deps

echo "==> Running database migrations & seed..."
node scripts/seed-db.mjs

echo "==> Seeding Razorpay demo account & policies..."
node scripts/seed-razorpay.mjs

echo "==> Building application..."
npm run build

echo "==> Fixing image permissions..."
chmod -R a+rX "$ROOT/public/images" 2>/dev/null || true

echo "==> Restarting PM2 process..."
pm2 delete thewall 2>/dev/null || true
pm2 start ecosystem.config.cjs --env production
pm2 save

echo "==> Reloading nginx..."
nginx -t && systemctl reload nginx

echo "✅ Deployed: https://2thewall.in"
pm2 status thewall
