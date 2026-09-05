@echo off
REM 艺博 To-B 原型服务 - 一键启动（bat 入口）
REM 双击此文件即可启动本地静态服务并打开浏览器

chcp 65001 >nul
title 艺博 To-B 原型服务

REM 切换到本 BAT 所在目录
cd /d "%~dp0"

REM 调用 PowerShell 脚本
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0启动原型服务.ps1"

if errorlevel 1 (
  echo.
  echo ====================================
  echo 启动失败！请参考 启动服务-手动命令.txt
  echo ====================================
  echo.
  pause
)