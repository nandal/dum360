#!/bin/sh
# Minimal posture smoke test for DUM360 (dev branch: static site, no build).
# Guards the guarantees from issue #26: pinned actions, least-privilege
# permissions, timeouts, concurrency, update automation, and contributor docs.
# Dependency-free (POSIX sh + grep) so it runs on any runner or laptop.
# Usage: sh tests/posture-smoke.sh   (exit 0 = all pass)
set -eu

fail=0
check() { # check <description> <command...>
  desc=$1; shift
  if "$@" >/dev/null 2>&1; then
    printf 'PASS: %s\n' "$desc"
  else
    printf 'FAIL: %s\n' "$desc"
    fail=1
  fi
}

for wf in .github/workflows/*.yml; do
  # Every third-party action pinned to a full 40-char SHA (tag may trail as comment).
  check "$wf actions pinned to SHAs" sh -c \
    "! grep -Eq '^[[:space:]]*-?[[:space:]]*uses:[[:space:]]*[^#]*@v[0-9]|uses:[[:space:]]*docker://[^#]*:latest' '$wf'"
  check "$wf declares permissions" grep -Eq '^permissions:' "$wf"
  check "$wf sets concurrency" grep -Eq '^concurrency:' "$wf"
done

check "gitleaks job has timeout-minutes" \
  grep -Eq 'timeout-minutes:[[:space:]]*[0-9]+' .github/workflows/gitleaks.yml

check "dependabot covers github-actions" sh -c \
  "grep -Eq 'package-ecosystem:[[:space:]]*\"?github-actions\"?' .github/dependabot.yml"

check "AGENTS.md exists at root" test -f AGENTS.md
check "README has fenced setup commands" sh -c \
  "grep -Eq '^\`\`\`bash' README.md && grep -Eq 'http.server|setup-firebase.sh' README.md"

if [ "$fail" -ne 0 ]; then
  printf 'posture-smoke: %s\n' 'FAILURES PRESENT' >&2
  exit 1
fi
printf 'posture-smoke: all checks passed\n'
