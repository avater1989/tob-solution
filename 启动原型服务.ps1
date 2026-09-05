# 艺博 To-B 原型服务 - 一键启动
# 双击或在 PowerShell 中运行: powershell -ExecutionPolicy Bypass -File ".\启动原型服务.ps1"

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 切换到脚本所在目录 - 使用多种方式确保生效
try {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
    if (-not $ScriptDir) {
        $ScriptDir = Split-Path -Parent $PSCommandPath
    }
    if (-not $ScriptDir) {
        $ScriptDir = (Get-Location).Path
    }
} catch {
    $ScriptDir = (Get-Location).Path
}
Set-Location -LiteralPath $ScriptDir

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  艺博 To-B 原型服务 - 一键启动" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "工作目录: $ScriptDir" -ForegroundColor Gray
Write-Host "当前目录: $((Get-Location).Path)" -ForegroundColor Gray
Write-Host ""

# 探测 Python
$pythonCmd = $null
foreach ($cmd in @("python", "python3", "py")) {
    try {
        $version = & $cmd --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            $pythonCmd = $cmd
            break
        }
    } catch {}
}
if (-not $pythonCmd) {
    Write-Host "[X] 未检测到 Python，请先安装 Python 3.x" -ForegroundColor Red
    Write-Host "    下载: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "按任意键退出..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}
Write-Host "使用 Python: $pythonCmd" -ForegroundColor Green

$PORT = 8765
Write-Host ""

# 检查端口占用
try {
    $portInUse = Get-NetTCPConnection -LocalPort $PORT -State Listen -ErrorAction Stop 2>$null
} catch {}
if ($portInUse) {
    Write-Host "[!] 端口 $PORT 已被占用，关闭旧进程..." -ForegroundColor Yellow
    $portInUse | ForEach-Object {
        try { Stop-Process -Id $_.OwningProcess -Force -ErrorAction Stop } catch {}
    }
    Start-Sleep -Seconds 1
}

# 启动服务
Write-Host "[1/2] 启动静态文件服务 (端口 $PORT)..." -ForegroundColor Green
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $pythonCmd
$psi.Arguments = "-m http.server $PORT"
$psi.WorkingDirectory = $ScriptDir
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$serverProc = [System.Diagnostics.Process]::Start($psi)
Write-Host "    服务 PID: $($serverProc.Id)" -ForegroundColor Gray

Start-Sleep -Seconds 2

# 检查是否启动成功
$ok = $false
try {
    $test = Invoke-WebRequest -Uri "http://127.0.0.1:$PORT/" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "    服务响应正常 (HTTP $($test.StatusCode))" -ForegroundColor Green
    $ok = $true
} catch {
    Write-Host "    [!] 服务响应失败: $($_.Exception.Message)" -ForegroundColor Red
}

if ($ok) {
    Write-Host ""
    Write-Host "[2/2] 打开浏览器..." -ForegroundColor Green
    Start-Process "http://127.0.0.1:$PORT/prototype/index.html"
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  服务已启动！" -ForegroundColor Cyan
Write-Host "  访问地址: http://127.0.0.1:$PORT/prototype/" -ForegroundColor White
Write-Host "  工作目录: $ScriptDir" -ForegroundColor Gray
Write-Host "  关闭服务: 关闭本窗口，或结束 PID $($serverProc.Id)" -ForegroundColor Gray
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意键停止服务并退出..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "正在停止服务..." -ForegroundColor Yellow
try { Stop-Process -Id $serverProc.Id -Force -ErrorAction Stop } catch {}
Write-Host "已停止。" -ForegroundColor Gray