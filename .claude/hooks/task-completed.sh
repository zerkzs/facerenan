#!/usr/bin/env bash
# =============================================================================
# task-completed.sh — TaskCompleted hook for the experimental Agent Teams
# feature. Runs when a teammate marks a task as complete.
#
# Exit code 0 = allow completion. Exit code 2 = block (require quality gate).
#
# NOT wired up in settings.json by default. To activate:
#   1. Set CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 in settings.json env
#   2. Add a TaskCompleted hook entry under "hooks" in settings.json
#
# [CUSTOMIZE] Add quality gates appropriate for your stack.
# =============================================================================
set -euo pipefail

INPUT=$(cat)
TASK_NAME=$(echo "$INPUT" | jq -r '.task_name // "unknown"')

# [CUSTOMIZE] Uncomment and adjust to require checks before completing tasks:

# --- Block completion if tests fail ---
# if ! npm test --silent 2>/dev/null; then
#   echo '{"decision":"block","reason":"Tests must pass before marking task complete."}'
#   exit 2
# fi

# --- Block completion if linter fails ---
# if ! npm run lint --silent 2>/dev/null; then
#   echo '{"decision":"block","reason":"Linter must pass before marking task complete."}'
#   exit 2
# fi

echo '{"decision":"allow"}'
exit 0
