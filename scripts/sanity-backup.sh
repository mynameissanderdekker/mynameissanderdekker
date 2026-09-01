#!/usr/bin/env bash
# ============================================================
# Sanity Dataset Backup Script
# Backs up both MNSDK and Torch Gallery datasets nightly.
# Run manually: bash ~/websites/mynameissanderdekker/scripts/sanity-backup.sh
# ============================================================

set -euo pipefail

BACKUP_DIR="$HOME/sanity-backups"
DATE=$(date +%Y-%m-%d)
KEEP_DAYS=30

mkdir -p "$BACKUP_DIR/mnsdk"
mkdir -p "$BACKUP_DIR/torch"

# ── Helper: parse value from .env.local ──────────────────────
env_val() {
  local file="$1" key="$2"
  grep -E "^${key}=" "$file" 2>/dev/null | head -1 | sed 's/^[^=]*=//; s/^"//; s/"$//'
}

# ── 1. MNSDK backup ──────────────────────────────────────────
MNSDK_ENV="$HOME/websites/mynameissanderdekker/.env.local"
MNSDK_PROJECT="u11u127q"
MNSDK_DATASET="production"
MNSDK_TOKEN=$(env_val "$MNSDK_ENV" "SANITY_WRITE_TOKEN")

if [ -z "$MNSDK_TOKEN" ]; then
  echo "❌ MNSDK token not found in $MNSDK_ENV" >&2
else
  MNSDK_OUT="$BACKUP_DIR/mnsdk/${DATE}.tar.gz"
  echo "📦 Backing up MNSDK ($MNSDK_PROJECT/$MNSDK_DATASET) → $MNSDK_OUT"
  cd "$HOME/websites/mynameissanderdekker"
  npx sanity dataset export "$MNSDK_DATASET" "$MNSDK_OUT" \
    --project-id "$MNSDK_PROJECT" \
    --token "$MNSDK_TOKEN" \
    --no-drafts --overwrite 2>&1 | tail -5
  echo "✅ MNSDK backup done: $MNSDK_OUT"
fi

# ── 2. Torch backup ──────────────────────────────────────────
TORCH_ENV="$HOME/websites/torch-gallery/.env.local"
TORCH_PROJECT="53tz2hh0"
TORCH_DATASET="production"
TORCH_TOKEN=$(env_val "$TORCH_ENV" "SANITY_API_WRITE_TOKEN")

if [ -z "$TORCH_TOKEN" ]; then
  echo "❌ Torch token not found in $TORCH_ENV" >&2
else
  TORCH_OUT="$BACKUP_DIR/torch/${DATE}.tar.gz"
  echo "📦 Backing up Torch ($TORCH_PROJECT/$TORCH_DATASET) → $TORCH_OUT"
  cd "$HOME/websites/torch-gallery"
  SANITY_AUTH_TOKEN="$TORCH_TOKEN" npx sanity dataset export "$TORCH_DATASET" "$TORCH_OUT" \
    --project-id "$TORCH_PROJECT" \
    --no-drafts 2>&1 | tail -5
  echo "✅ Torch backup done: $TORCH_OUT"
fi

# ── 3. Cleanup old backups (keep last KEEP_DAYS days) ────────
echo "🧹 Cleaning up backups older than $KEEP_DAYS days..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +${KEEP_DAYS} -delete
echo "✅ Cleanup done."
echo ""
echo "Current backups:"
ls -lh "$BACKUP_DIR/mnsdk/" "$BACKUP_DIR/torch/" 2>/dev/null || true
