@echo off
chcp 65001 >nul
cd /d "%~dp0"
title CloudWing - Start Preview

REM ============================================================
REM  CloudWing - one-click local preview server
REM   Usage:
REM    start-cloudwing.cmd         build, then start preview
REM    start-cloudwing.cmd -n      skip build if dist exists
REM   Close the minimized CloudWing-Preview window to stop.
REM ============================================================

set "CACHE=%~dp0..\.npm-cache"
if not exist "%CACHE%" mkdir "%CACHE%" >nul 2>&1
set "npm_config_cache=%CACHE%"

set "SKIP="
if /I "%~1"=="-n" set SKIP=1
if not exist "dist\index.html" set "SKIP="

if not defined SKIP (
  echo [1/2] Building site...
  call npm run build
  if errorlevel 1 (
    echo Build failed. Fix errors above and retry.
    pause
    exit /b 1
  )
) else (
  echo [1/2] Skip build - dist already exists.
)

echo [2/2] Starting preview at http://127.0.0.1:4321/

netstat -ano | findstr /C:":4321 " >nul 2>&1
if not errorlevel 1 (
  echo Port 4321 already in use - reusing existing server.
  goto open
)

powershell -NoProfile -WindowStyle Hidden -Command ^
  "$p = Start-Process -WindowStyle Minimized -FilePath 'npm.cmd' -ArgumentList @('run','preview','--','--port','4321','--host','127.0.0.1') -WorkingDirectory '%~dp0' -PassThru; Start-Sleep -Milliseconds 1500; if ($p.HasExited) { Write-Output ('PREVIEW_EXITED:' + $p.ExitCode) }"

:open
ping -n 3 127.0.0.1 >nul
start "" http://127.0.0.1:4321/
echo.
echo Opened http://127.0.0.1:4321/
echo - Keep the minimized CloudWing-Preview console alive.
echo - Rerun this script after code changes; drop -n to rebuild.
endlocal
