@echo off
title Universal File Toolkit Launcher
echo ===================================================
echo     Universal File Toolkit - Starting Application
echo ===================================================
cd /d "%~dp0"

if exist "release\win-unpacked\Universal File Toolkit.exe" (
    echo Launching packaged Windows Desktop Application...
    start "" "release\win-unpacked\Universal File Toolkit.exe" %*
) else (
    echo Starting Universal File Toolkit via Electron...
    npm start
)
