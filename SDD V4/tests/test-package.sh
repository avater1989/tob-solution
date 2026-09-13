#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/workbuddy-sdd-v4-test.XXXXXX")"
trap 'rm -rf "$TMP_ROOT"' EXIT

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

assert_file() {
  [[ -s "$ROOT/$1" ]] || fail "missing or empty file: $1"
}

assert_contains() {
  grep -F -q -- "$2" "$ROOT/$1" || fail "$1 does not contain: $2"
}

required=(
  VERSION
  README.md
  WORKBUDDY_START.md
  .workbuddy/memory/MEMORY.md
  .workbuddy/skills-manifest.yaml
  .workbuddy/skills/sdd-router/SKILL.md
  .output/STATUS.yaml
  scripts/check-sdd.sh
  templates/.output/STATUS.yaml
  templates/.output/research.md
  templates/.output/PRD.md
  templates/.output/ui-design-spec.md
  templates/.output/api-contracts.md
  templates/.output/Plan.md
  templates/.output/startup.md
  templates/.output/product-user-guide.md
  templates/.output/wiki-publication.md
  .workbuddy/skills/wiki-publish/SKILL.md
  .workbuddy/skills/wiki-publish/references/zy-cli-runbook.md
  pyproject.toml
  pycore/__init__.py
)

skills=(
  sdd-router
  sdd-core
  sdd-research
  sdd-product-design
  sdd-ui-low-fi
  sdd-ui-high-fi
  sdd-api-contract
  sdd-feature-planning
  sdd-frontend
  sdd-backend
  brainstorming
  product-feature-design
  frontend-design
  writing-plans
  test-driven-development
  systematic-debugging
  verification-before-completion
  conversation-summary
  product-user-guide
  wiki-publish
)

for file in "${required[@]}"; do
  assert_file "$file"
done

grep -qx '4.1.0' "$ROOT/VERSION" || fail 'VERSION must be 4.1.0'
assert_contains .workbuddy/skills-manifest.yaml 'sdd_version: 4.1.0'
assert_contains templates/.output/STATUS.yaml 'sdd_version: 4.1.0'

memory_bytes="$(wc -c < "$ROOT/.workbuddy/memory/MEMORY.md" | tr -d ' ')"
(( memory_bytes <= 3000 )) || fail "MEMORY.md exceeds 3000 bytes: $memory_bytes"
assert_contains .workbuddy/memory/MEMORY.md 'sdd-router'
assert_contains .workbuddy/memory/MEMORY.md '唯一入口'

for skill in "${skills[@]}"; do
  assert_file ".workbuddy/skills/$skill/SKILL.md"
  assert_contains .workbuddy/skills-manifest.yaml "- name: $skill"
done

manifest_names="$(awk '$1 == "-" && $2 == "name:" {print $3}' "$ROOT/.workbuddy/skills-manifest.yaml")"
[[ -n "$manifest_names" ]] || fail 'manifest contains no skill entries'
duplicates="$(printf '%s\n' "$manifest_names" | sort | uniq -d)"
[[ -z "$duplicates" ]] || fail "manifest has duplicate skills: $duplicates"

assert_contains templates/.output/research.md '需求追溯表'
assert_contains templates/.output/research.md '问题证据图'
assert_contains templates/.output/research.md '竞品比较图'
assert_contains templates/.output/research.md '结论与决策图'
assert_contains templates/.output/api-contracts.md '接口业务说明'
assert_contains templates/.output/api-contracts.md '接口逻辑'
assert_contains templates/.output/Plan.md 'D1：完整前端 Mock'
assert_contains templates/.output/Plan.md 'D2：后端开发'
assert_contains .workbuddy/skills/sdd-router/SKILL.md 'wiki-publish'
assert_contains .workbuddy/skills/wiki-publish/SKILL.md 'explicit user authorization'
assert_contains .workbuddy/skills/wiki-publish/SKILL.md 'zy-cli page detail'
assert_contains .workbuddy/skills/wiki-publish/SKILL.md 'Never disable TLS certificate verification'
assert_contains .workbuddy/skills/wiki-publish/references/zy-cli-runbook.md 'npm package: zyplayer'
assert_contains .workbuddy/skills/wiki-publish/references/zy-cli-runbook.md 'page list --spaceId <spaceId> --parentId <parentId> --depth 1'
assert_contains templates/.output/wiki-publication.md '设备码、私钥、Token、密码'

bash -n "$ROOT/scripts/check-sdd.sh"
bash "$ROOT/scripts/check-sdd.sh" package "$ROOT"
bash "$ROOT/scripts/check-sdd.sh" status "$ROOT/tests/fixtures/valid-status.yaml"
bash "$ROOT/scripts/check-sdd.sh" project "$ROOT"

mkdir -p "$TMP_ROOT/.workbuddy/memory" "$TMP_ROOT/.workbuddy/skills/sdd-router"
cp "$ROOT/VERSION" "$TMP_ROOT/VERSION"
cp "$ROOT/.workbuddy/memory/MEMORY.md" "$TMP_ROOT/.workbuddy/memory/MEMORY.md"
cp "$ROOT/tests/fixtures/invalid-skills-manifest.yaml" "$TMP_ROOT/.workbuddy/skills-manifest.yaml"
cp "$ROOT/.workbuddy/skills/sdd-router/SKILL.md" "$TMP_ROOT/.workbuddy/skills/sdd-router/SKILL.md"
if bash "$ROOT/scripts/check-sdd.sh" package "$TMP_ROOT" >/dev/null 2>&1; then
  fail 'manifest with unknown next skill passed package validation'
fi

if bash "$ROOT/scripts/check-sdd.sh" status "$ROOT/tests/fixtures/invalid-frontend-order.yaml" >/dev/null 2>&1; then
  fail 'D2 status passed without frontend acceptance'
fi

if bash "$ROOT/scripts/check-sdd.sh" status "$ROOT/tests/fixtures/invalid-verified.yaml" >/dev/null 2>&1; then
  fail 'verified status passed without evidence'
fi

printf 'PASS: WorkBuddy SDD V4 package tests\n'
