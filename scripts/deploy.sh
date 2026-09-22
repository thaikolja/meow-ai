#!/usr/bin/env bash
#
# Meow-deploy: redeploys the production container.
# GitLab CI copies this script to /tmp and runs it as root, so it must
# enter the project directory itself before looking for docker-compose.yml.
#
# Exit codes:
#   0 - success
#   1 - general failure
#   2 - missing dependency
#   3 - git update failed
#   4 - docker compose down failed
#   5 - docker compose build failed
#   6 - docker compose up failed

set -euo pipefail

readonly CYAN='\033[0;36m'
readonly PURPLE='\033[0;35m'
readonly YELLOW='\033[0;33m'
readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly NC='\033[0m'

readonly COMPOSE_FILE="docker-compose.yml"
readonly CONTAINER_NAME="meow-ai"
readonly IMAGE_NAME="meow-ai:latest"
readonly DEPLOY_PATH="${DEPLOY_PATH:-/var/www/vhosts/yanawa.io/meow.yanawa.io}"
readonly DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

log()  { printf "${CYAN}[meow-deploy]${NC} %s\n" "$*"; }
purr() { printf "${PURPLE}[meow-deploy]${NC} 🐾 %s\n" "$*"; }
warn() { printf "${YELLOW}[meow-deploy]${NC} ⚠️  %s\n" "$*" >&2; }
fail() { printf "${RED}[meow-deploy]${NC} ❌ %s\n" "$*" >&2; }
ok()   { printf "${GREEN}[meow-deploy]${NC} ✅ %s\n" "$*"; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Required command not found: $1"
    exit 2
  fi
}

main() {
  if [ ! -d "$DEPLOY_PATH" ]; then
    fail "Deploy directory not found: ${DEPLOY_PATH}"
    exit 1
  fi
  cd "$DEPLOY_PATH"

  log "Paws and check the prerequisites..."
  require_cmd git
  require_cmd docker

  if ! docker compose version >/dev/null 2>&1; then
    fail "docker compose plugin is required"
    exit 2
  fi

  if [ ! -f "$COMPOSE_FILE" ]; then
    fail "docker-compose.yml not found in ${DEPLOY_PATH}"
    exit 1
  fi

  purr "Updating ${DEPLOY_PATH} to origin/${DEPLOY_BRANCH}..."
  git fetch origin "$DEPLOY_BRANCH"
  if ! git reset --hard "origin/${DEPLOY_BRANCH}"; then
    fail "git reset failed for origin/${DEPLOY_BRANCH}"
    exit 3
  fi
  ok "Code is at $(git rev-parse --short HEAD)"

  purr "Putting the old container to sleep..."
  if ! docker compose -f "$COMPOSE_FILE" down; then
    fail "docker compose down failed"
    exit 4
  fi
  ok "Container stopped"

  purr "Scratching the old image..."
  if docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
    docker rmi -f "$IMAGE_NAME" >/dev/null 2>&1 || warn "Could not remove old image (continuing)"
  fi

  purr "Brushing out the build cache..."
  docker builder prune -a -f >/dev/null 2>&1 || warn "Could not prune build cache (continuing)"

  purr "Knitting a fresh image..."
  if ! docker compose -f "$COMPOSE_FILE" build --progress=plain; then
    fail "docker compose build failed"
    exit 5
  fi
  ok "Image built"

  purr "Waking up the new container..."
  if ! docker compose -f "$COMPOSE_FILE" up -d; then
    fail "docker compose up failed"
    exit 6
  fi

  sleep 5

  if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    ok "${CONTAINER_NAME} is purring on port 3000"
  else
    fail "${CONTAINER_NAME} failed to start. Check: docker logs ${CONTAINER_NAME}"
    exit 6
  fi

  log "Recent logs:"
  docker logs --tail 20 "$CONTAINER_NAME" 2>&1 || true
  ok "Deployment complete. https://meow.yanawa.io"
}

main "$@"
