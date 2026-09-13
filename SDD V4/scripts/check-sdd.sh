#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'SDD check failed: %s\n' "$1" >&2
  return 1
}

yaml_scalar() {
  local file="$1"
  local key="$2"
  awk -v key="$key" '$1 == key ":" {sub(/^[^:]+:[[:space:]]*/, ""); gsub(/^"|"$/, ""); print; exit}' "$file"
}

check_boolean() {
  [[ "$1" == "true" || "$1" == "false" ]] || fail "$2 must be true or false"
}

check_status() {
  local file="$1"
  [[ -s "$file" ]] || { fail "missing status file: $file"; return 1; }

  local stage reasoning specification low high frontend started verified handed evidence handoff
  stage="$(yaml_scalar "$file" stage)"
  case "$stage" in
    S0|R|A|B1|B2|C|D1|D2|V|H|O|complete|planned|building|reviewing|verified|handed_off) ;;
    *) fail "unknown stage: $stage"; return 1 ;;
  esac

  reasoning="$(yaml_scalar "$file" reasoning_ready)"
  specification="$(yaml_scalar "$file" specification_ready)"
  low="$(yaml_scalar "$file" low_fi_ready)"
  high="$(yaml_scalar "$file" high_fi_ready)"
  frontend="$(yaml_scalar "$file" frontend_accepted)"
  started="$(yaml_scalar "$file" implementation_started)"
  verified="$(yaml_scalar "$file" verified)"
  handed="$(yaml_scalar "$file" handed_off)"
  evidence="$(yaml_scalar "$file" evidence_file)"
  handoff="$(yaml_scalar "$file" handoff_file)"

  for pair in "reasoning_ready:$reasoning" "specification_ready:$specification" "low_fi_ready:$low" "high_fi_ready:$high" "implementation_started:$started" "verified:$verified" "handed_off:$handed"; do
    check_boolean "${pair#*:}" "${pair%%:*}" || return 1
  done
  if [[ -n "$frontend" ]]; then
    check_boolean "$frontend" frontend_accepted || return 1
  fi

  if [[ "$specification" == "true" && "$reasoning" != "true" ]]; then
    fail 'specification_ready requires reasoning_ready'; return 1
  fi
  if [[ "$high" == "true" && "$low" != "true" ]]; then
    fail 'high_fi_ready requires low_fi_ready'; return 1
  fi
  if [[ "$stage" == "D2" && "$frontend" != "true" ]]; then
    fail 'D2 requires gates.frontend_accepted=true'; return 1
  fi
  if [[ "$verified" == "true" ]]; then
    [[ -n "$evidence" && "$evidence" != "null" ]] || { fail 'verified requires evidence_file'; return 1; }
    if [[ "$evidence" != /* ]]; then
      local status_relative project_relative
      status_relative="$(dirname "$file")/$evidence"
      project_relative="$(dirname "$(dirname "$file")")/$evidence"
      if [[ -s "$status_relative" ]]; then
        evidence="$status_relative"
      else
        evidence="$project_relative"
      fi
    fi
    [[ -s "$evidence" ]] || { fail "evidence file missing or empty: $evidence"; return 1; }
  fi
  if [[ "$handed" == "true" ]]; then
    [[ "$verified" == "true" ]] || { fail 'handed_off requires verified'; return 1; }
    [[ -n "$handoff" && "$handoff" != "null" ]] || { fail 'handed_off requires handoff_file'; return 1; }
  fi
}

check_package() {
  local root="$1"
  local required=(VERSION .workbuddy/memory/MEMORY.md .workbuddy/skills-manifest.yaml .workbuddy/skills/sdd-router/SKILL.md .workbuddy/skills/wiki-publish/SKILL.md .workbuddy/skills/wiki-publish/references/zy-cli-runbook.md templates/.output/wiki-publication.md)
  local file
  for file in "${required[@]}"; do
    [[ -s "$root/$file" ]] || { fail "missing package file: $file"; return 1; }
  done
  local version manifest_version
  version="$(tr -d '[:space:]' < "$root/VERSION")"
  manifest_version="$(yaml_scalar "$root/.workbuddy/skills-manifest.yaml" sdd_version)"
  [[ "$version" == "$manifest_version" ]] || { fail "VERSION and manifest sdd_version differ: $version != $manifest_version"; return 1; }

  local bytes
  bytes="$(wc -c < "$root/.workbuddy/memory/MEMORY.md" | tr -d ' ')"
  (( bytes <= 3000 )) || { fail "MEMORY.md exceeds 3000 bytes: $bytes"; return 1; }
  local names name refs ref
  names="$(awk '$1 == "-" && $2 == "name:" {print $3}' "$root/.workbuddy/skills-manifest.yaml")"
  [[ -n "$names" ]] || { fail 'manifest has no skills'; return 1; }
  [[ -z "$(printf '%s\n' "$names" | sort | uniq -d)" ]] || { fail 'manifest has duplicate skills'; return 1; }
  while IFS= read -r name; do
    [[ -s "$root/.workbuddy/skills/$name/SKILL.md" ]] || { fail "manifest skill missing: $name"; return 1; }
  done <<< "$names"

  refs="$(awk '
    $1 == "requires:" || $1 == "next:" {
      line=$0
      sub(/^[^[]*\[/, "", line)
      sub(/\].*$/, "", line)
      gsub(/,/, " ", line)
      print line
    }
  ' "$root/.workbuddy/skills-manifest.yaml")"
  for ref in $refs; do
    [[ -z "$ref" ]] && continue
    printf '%s\n' "$names" | grep -Fqx "$ref" || { fail "manifest references unknown skill: $ref"; return 1; }
  done
}

check_project() {
  local root="$1"
  check_status "$root/.output/STATUS.yaml"
  local stage
  stage="$(yaml_scalar "$root/.output/STATUS.yaml" stage)"
  case "$stage" in
    A|B1|B2|C|D1|D2|V|H|O|complete) [[ -s "$root/.output/research.md" ]] || { fail 'research.md required after R'; return 1; } ;;
  esac
  case "$stage" in
    B1|B2|C|D1|D2|V|H|O|complete) [[ -s "$root/.output/PRD.md" ]] || { fail 'PRD.md required after A'; return 1; } ;;
  esac
  case "$stage" in
    D1|D2|V|H|O|complete)
      [[ -s "$root/.output/api-contracts.md" ]] || { fail 'api-contracts.md required for development'; return 1; }
      [[ -s "$root/.output/Plan.md" ]] || { fail 'Plan.md required for development'; return 1; }
      ;;
  esac
}

[[ $# -ge 1 ]] || { printf 'Usage: %s package ROOT | status FILE | project ROOT\n' "$0" >&2; exit 2; }
command="$1"
shift
case "$command" in
  package) [[ $# -eq 1 ]] || exit 2; check_package "$1" ;;
  status) [[ $# -eq 1 ]] || exit 2; check_status "$1" ;;
  project) [[ $# -eq 1 ]] || exit 2; check_project "$1" ;;
  *) printf 'Unknown command: %s\n' "$command" >&2; exit 2 ;;
esac
