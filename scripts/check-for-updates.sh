#!/bin/sh
set -eu

mode="${1:---check}"
app_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$app_dir"

if [ "$(git branch --show-current)" != "main" ]; then
  echo "Update skipped: the deployed checkout must be on main."
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Update skipped: the deployed checkout has local changes."
  exit 1
fi

git fetch --quiet origin main
local_revision=$(git rev-parse HEAD)
remote_revision=$(git rev-parse origin/main)

if [ "$local_revision" = "$remote_revision" ]; then
  echo "Panic! At the Deadline is already current."
  exit 0
fi

echo "Update available: $(git rev-parse --short "$local_revision") -> $(git rev-parse --short "$remote_revision")"

if [ "$mode" != "--apply" ]; then
  echo "Run this script with --apply to install it."
  exit 0
fi

git merge --ff-only origin/main
NEXT_DEPLOYMENT_ID=$(git rev-parse --short=12 HEAD)
export NEXT_DEPLOYMENT_ID
docker compose up --build -d --remove-orphans
echo "Update installed. The display will notice the new version and reload itself."
