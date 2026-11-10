#!/usr/bin/env bash
# Meow 1.6.0. Manual entry point. GitLab CI runs scripts/deploy.sh directly.
exec "$(cd "$(dirname "$0")" && pwd)/scripts/deploy.sh" "$@"
