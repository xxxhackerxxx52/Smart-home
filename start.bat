@echo off
chcp 65001
title Smart Home Launcher
cls

echo.
echo ================================
echo     SMART HOME LAUNCHER
echo ================================
echo.

echo 1. Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found!
    echo Install from: https://nodejs.org
    echo.
    pause
    exit
)
echo.

echo 2. Starting server...
start "Smart Home Server" cmd /k "node lamp-server.js"
echo.

echo 3. Waiting 3 seconds...
timeout /t 3 >nul
echo.

echo 4. Opening website...
start http://localhost:3000
echo.

echo ================================
echo     SYSTEM STARTED!
echo     Site: http://localhost:3000
echo ================================
echo.
echo Press any key to close this window...
pause >nul