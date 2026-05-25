#!/usr/bin/env bash
set -euo pipefail
DEPLOY_ROOT="${BOHAO_DEPLOY_ROOT:-/Users/maohong/IdeaProjects/boot-admin}"
exec "${DEPLOY_ROOT}/scripts/deploy-frontend.sh" scada "$@"
