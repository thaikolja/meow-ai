#!/usr/bin/env bash
#
# Meow-deploy: redeploys the production container from the latest main branch.
# Pulls the latest code, stops the running container, rebuilds the image,
# and starts the container fresh.
#
# This script is run on the production server by GitLab CI after a push to main.
# It can also be run manually for emergency redeploys.
#
# Requirements:
#   - Running from the project root (cd /var/www/vhosts/yanawa.io/meow.yanawa.io)
#   - Docker + docker compose available on PATH
#   - The .env file is present and contains NUXT_APP_PASSWORD,
#     NUXT_OPENROUTER_API_KEY, and NUXT_DEEPSEEK_API_KEY
#   - Optional NUXT_SESSION_SECRET (falls back to NUXT_APP_PASSWORD)
#
# Exit codes:
#   0 - success
#   1 - general failure
#   2 - missing dependency
#   3 - git pull failed
#   4 - docker compose down failed
#   5 - docker compose build failed
#   6 - docker compose up failed

set -euo pipefail

# Colors for the cat-themed output
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly YELLOW='\033[0;33m'
readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly NC='\033[0m' # No Color

readonly COMPOSE_FILE="./scripts/docker-compose.yml"
readonly CONTAINER_NAME="meow-ai"
readonly IMAGE_NAME="meow-ai:latest"
readonly DEPLOY_PATH="${DEPLOY_PATH:-/var/www/vhosts/yanawa.io/meow.yanawa.io}"

# Volume name is derived from the docker compose project name
# which defaults to the directory basename with non-alphanumeric chars replaced.
# /var/www/vhosts/yanawa.io/meow.yanawa.io -> meow_yanawa_io_meow-data
readonly VOLUME_NAME="meow_yanawa_io_meow-data"

log() { printf "${CYAN}[meow-deploy]${NC} %s\n" "$*"; }
purr() { printf "${PURPLE}[meow-deploy]${NC} 🐾 %s\n" "$*"; }
warn() { printf "${YELLOW}[meow-deploy]${NC} ⚠️  %s\n" "$*" >&2; }
fail() { printf "${RED}[meow-deploy]${NC} ❌ %s\n" "$*" >&2; }
ok() { printf "${GREEN}[meow-deploy]${NC} ✅ %s\n" "$*"; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Required command not found: $1"
    exit 2
  fi
}

# Fail when a required .env key is missing or empty. Never print the value.
require_env() {
  local key="$1"
  local line value

  if [ ! -f .env ]; then
    fail ".env is missing in ${DEPLOY_PATH}"
    exit 1
  fi

  line="$(grep -E "^${key}=" .env | head -n 1 || true)"
  value="${line#${key}=}"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  if [ -z "$value" ]; then
    fail ".env must set ${key}"
    exit 1
  fi
}

# Resolve the volume name from the directory by asking docker compose
resolve_volume() {
  docker compose -f "$COMPOSE_FILE" config --volumes 2>/dev/null |
    head -n 1 ||
    echo "$VOLUME_NAME"
}

main() {
  log "Paws and check the prerequisites..."
  require_cmd git
  require_cmd docker

  if [ ! -d "$DEPLOY_PATH" ]; then
    fail "Deploy directory not found: ${DEPLOY_PATH}"
    exit 1
  fi
  cd "$DEPLOY_PATH"

  if ! docker compose version >/dev/null 2>&1; then
    fail "docker compose plugin is required"
    exit 2
  fi

  if [ ! -f "$COMPOSE_FILE" ]; then
    fail "docker-compose.yml not found. Run from the project root."
    exit 1
  fi

  purr "Stalking the latest code from origin/main..."
  git fetch origin main
  if ! git pull --rebase --autostash origin main; then
    fail "git pull failed - check SSH keys and remote access"
    exit 3
  fi
  ok "Code is up to date (HEAD: $(git rev-parse --short HEAD))"

  require_env NUXT_APP_PASSWORD
  require_env NUXT_OPENROUTER_API_KEY
  require_env NUXT_DEEPSEEK_API_KEY
  if [ ! -f .data/models.json ]; then
    fail ".data/models.json is missing. The catalog bind-mount needs this file."
    exit 1
  fi

  purr "Putting the old container to sleep..."
  if ! docker compose -f "$COMPOSE_FILE" down; then
    fail "docker compose down failed"
    exit 4
  fi
  ok "Container stopped"

  # Remove the old image so the rebuild actually runs fresh layers
  purr "Scratching the old image from the registry..."
  if docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
    docker rmi -f "$IMAGE_NAME" >/dev/null 2>&1 || warn "Could not remove old image (continuing)"
  fi

  # Clear the build cache so we don't get bitten by stale layers
  purr "Brushing out the build cache..."
  docker builder prune -a -f >/dev/null 2>&1 || warn "Could not prune build cache (continuing)"

  purr "Knitting a fresh image from scratch..."
  if ! docker compose -f "$COMPOSE_FILE" build --progress=plain; then
    fail "docker compose build failed - check Dockerfile and build output above"
    exit 5
  fi
  ok "Image built"

  purr "Waking up the new container..."
  if ! docker compose -f "$COMPOSE_FILE" up -d; then
    fail "docker compose up failed"
    exit 6
  fi

  # Wait a moment for the health check to kick in
  sleep 5

  # Verify the container is actually up
  if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    ok "${CONTAINER_NAME} is purring on port 3000 🐾"
  else
    fail "${CONTAINER_NAME} failed to start. Check: docker logs ${CONTAINER_NAME}"
    exit 6
  fi

  # Tail the recent logs so CI shows whether it booted cleanly
  log "Recent whisker-twitches (logs):"
  docker logs --tail 20 "$CONTAINER_NAME" 2>&1 || true

  ok "Deployment complete. The cat-cave is ready at https://meow.yanawa.io 🐾"
}

main "$@"
