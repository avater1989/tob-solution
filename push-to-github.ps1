$ErrorActionPreference = "Continue"
$env:Path = "C:\Program Files\GitHub CLI;" + $env:Path

# Don't move - we are already in the project dir
Write-Host "[cwd] $(Get-Location)"

Write-Host "[1/5] git init"
if (-not (Test-Path ".git")) { git init 2>&1 | Out-String | Write-Host }

Write-Host "[2/5] git add"
git add . 2>&1 | Out-String | Write-Host

Write-Host "[3/5] git commit (skip if nothing to commit)"
$st = git status --porcelain
if ($st) {
  git config user.email "noreply@tob-solution.local" 2>&1 | Out-String | Write-Host
  git config user.name  "ToB Solution Bot" 2>&1 | Out-String | Write-Host
  git commit -m "Initial commit: To-B cockpit prototype (static HTML)" 2>&1 | Out-String | Write-Host
} else {
  Write-Host "  (nothing to commit, skip)"
}

Write-Host "[4/5] gh repo create --push"
$repo = "tob-solution"
$gh = "C:\Program Files\GitHub CLI\gh.exe"
& $gh repo create $repo --private --source . --description "To-B cockpit prototype (static HTML)" --remote origin --push 2>&1 | Out-String | Write-Host
$ec = $LASTEXITCODE
if ($ec -ne 0) {
  Write-Host "gh repo create exit code: $ec"
  exit $ec
}

Write-Host "[5/5] done"
& $gh repo view $repo --web 2>&1 | Out-String | Write-Host
