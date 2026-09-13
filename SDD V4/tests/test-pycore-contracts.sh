#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

assert_contains() {
  grep -F -q -- "$2" "$ROOT/$1" || fail "$1 does not contain: $2"
}

assert_not_contains() {
  if grep -F -q -- "$2" "$ROOT/$1"; then
    fail "$1 contains forbidden text: $2"
  fi
}

[[ -s "$ROOT/pyproject.toml" ]] || fail 'missing pyproject.toml'
assert_contains pycore/api/responses.py 'code: int = 200'
assert_contains pycore/api/responses.py 'message: str = "success"'
assert_not_contains pycore/api/responses.py 'success: bool = True'
assert_contains pycore/core/config.py 'class DotEnvConfigLoader'
assert_contains pycore/core/config.py 'use_env: bool = False'
assert_contains pycore/core/config.py 'return path.suffix.lower() in (".env",)'
assert_contains pycore/api/middleware.py '"code": 500'
assert_not_contains pycore/api/middleware.py '"success": False'
assert_contains pycore/api/server.py '@app.exception_handler(HTTPException)'
assert_contains pycore/api/server.py '@app.exception_handler(RequestValidationError)'
assert_contains pycore/api/server.py '"code": 200'
assert_contains pycore/api/server.py '"message": "success"'
assert_not_contains pycore/docs/getting-started.md 'self.failure('
assert_not_contains pycore/docs/getting-started.md 'os.environ.get('

PYTHON_BIN="${PYTHON_BIN:-python3}"

PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" -c '
from pathlib import Path
for path in Path("pycore").rglob("*.py"):
    compile(path.read_text(encoding="utf-8"), str(path), "exec")
print("python_syntax=ok")
' "$ROOT"

PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" - <<'PY'
import importlib.util
import json
import sys
from pathlib import Path

path = Path("pycore/api/responses.py")
spec = importlib.util.spec_from_file_location("v4_responses_test", path)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)

success = json.loads(module.success_response({"status": "ok"}).model_dump_json())
error = json.loads(module.error_response("Not found", status_code=404)[0].model_dump_json())
page = json.loads(module.paginated_response([{"id": 1}], total_items=1).model_dump_json())

assert success == {"code": 200, "message": "success", "data": {"status": "ok"}}
assert error == {"code": 404, "message": "Not found", "data": None}
assert page["data"]["items"] == [{"id": 1}]
assert page["data"]["total"] == 1
print("response_runtime=ok")
PY

"$PYTHON_BIN" - <<'PY'
import tomllib
from pathlib import Path
tomllib.loads(Path("pyproject.toml").read_text(encoding="utf-8"))
print("pyproject_toml=ok")
PY

printf 'PASS: PyCore V4 source contracts\n'
