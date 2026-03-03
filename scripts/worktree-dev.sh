#!/usr/bin/env bash
# Usage: scripts/worktree-dev.sh <branch>
# Creates (or reuses) a git worktree for <branch>, installs deps if needed,
# and starts the Vite dev server. Vite auto-picks a free port starting at 5173.
set -euo pipefail

BRANCH=${1:?Usage: $0 <branch-name>}
REPO_ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
SLUG=$(echo "$BRANCH" | tr '[:upper:]' '[:lower:]' | sed 's|[^a-z0-9]|-|g' | sed 's|-\+|-|g')
WORKTREE_DIR="$REPO_ROOT/.worktrees/$SLUG"
APP_DIR="$WORKTREE_DIR/app"
ENV_SRC="$REPO_ROOT/app/.env"

# Create worktree if it doesn't exist
if [ ! -d "$WORKTREE_DIR" ]; then
  echo "Creating worktree for '$BRANCH' at $WORKTREE_DIR"
  git -C "$REPO_ROOT" worktree add "$WORKTREE_DIR" "$BRANCH"
else
  echo "Reusing existing worktree at $WORKTREE_DIR"
fi

# Sync .env from main app dir
if [ -f "$ENV_SRC" ]; then
  cp "$ENV_SRC" "$APP_DIR/.env"
fi

# Install dependencies if node_modules is missing
if [ ! -d "$APP_DIR/node_modules" ]; then
  echo "Installing dependencies..."
  npm install --prefix "$APP_DIR"
fi

echo ""
echo "Branch : $BRANCH"
echo "Worktree: $WORKTREE_DIR"
echo ""

# Start dev server — Vite will print the exact port
exec npm run dev --prefix "$APP_DIR" -- --host
