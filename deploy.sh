#!/usr/bin/env bash
# Manual entry point. GitLab CI runs scripts/deploy.sh directly.
exec "$(cd "$(dirname "$0")" && pwd)/scripts/deploy.sh" "$@"
