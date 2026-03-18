@echo off
chcp 65001 >nul
title Smart Home Launcher
cls

echo.
echo ===========================================
echo     Smart Home for Disabled People
echo     Portable Launcher
echo ===========================================
echo.

:: Get current directory
set "CURRENT_DIR=%~dp0"
cd /d "%CURRENT_DIR%"

echo Current folder: %CURRENT_DIR%
echo.

:MAIN_MENU
cls
echo.
echo ===========================================
echo           MAIN MENU
echo ===========================================
echo.
echo 1. Quick Start (Recommended)
echo 2. Full Installation (Node.js + Dependencies)
echo 3. System Check and Troubleshooting
echo 4. Run Website Only (if already installed)
echo 5. Clean and Reinstall
echo 6. System Information
echo 7. Exit
echo.
set /p choice="Select option (1-7): "

if "%choice%"=="1" goto QUICK_START
if "%choice%"=="2" goto FULL_INSTALL
if "%choice%"=="3" goto TROUBLESHOOT
if "%choice%"=="4" goto RUN_ONLY
if "%choice%"=="5" goto CLEAN_REINSTALL
if "%choice%"=="6" goto SYSTEM_INFO
if "%choice%"=="7" exit
goto MAIN_MENU

:QUICK_START
cls
echo.
echo ===========================================
echo           QUICK START
echo ===========================================
echo.
echo Checking for Node.js...
node --version >nul 2>nul
if errorlevel 1 (
    echo Node.js not found
    echo Installing automatically...
    goto INSTALL_NODEJS
) else (
    echo Node.js is installed
)

echo.
echo Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install express axios node-fetch --no-optional
) else (
    echo Dependencies already installed
)

echo.
echo Starting server...
start "Smart Home Server" cmd /k "node lamp-server.js"
timeout /t 3 >nul

echo.
echo Opening website...
start http://localhost:3000

echo.
echo System started!
echo Website: http://localhost:3000
echo Wait for server to load...
echo.
timeout /t 5 >nul
goto MAIN_MENU

:INSTALL_NODEJS
echo Downloading Node.js installer...
powershell -Command "& {Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi' -OutFile 'node-install.msi' -UseBasicParsing}" >nul 2>&1

if exist "node-install.msi" (
    echo Running Node.js installation...
    start /wait msiexec /i "node-install.msi" /quiet /norestart
    del node-install.msi
    echo Node.js installed
    set PATH=%PATH%;C:\Program Files\nodejs\
) else (
    echo Failed to download Node.js
    echo Please install manually from https://nodejs.org
    pause
)
goto QUICK_START

:FULL_INSTALL
cls
echo.
echo ===========================================
echo           FULL INSTALLATION
echo ===========================================
echo.
echo This will install everything needed.
echo.
echo 1. Check/Install Node.js...
call :CHECK_NODEJS

echo.
echo 2. Install main dependencies...
call npm install express axios node-fetch

echo.
echo 3. Create necessary folders...
if not exist "public" mkdir public
if not exist "logs" mkdir logs

echo.
echo 4. Check file structure...
call :CHECK_FILES

echo.
echo 5. Create package.json if missing...
if not exist "package.json" (
    echo Creating package.json...
    echo { > package.json
    echo   "name": "smart-home-for-disabled", >> package.json
    echo   "version": "1.0.0", >> package.json
    echo   "description": "Smart home for disabled people", >> package.json
    echo   "main": "lamp-server.js", >> package.json
    echo   "scripts": { >> package.json
    echo     "start": "node lamp-server.js", >> package.json
    echo     "dev": "node lamp-server.js" >> package.json
    echo   }, >> package.json
    echo   "dependencies": { >> package.json
    echo     "express": "^4.18.2", >> package.json
    echo     "axios": "^1.6.0", >> package.json
    echo     "node-fetch": "^2.6.9" >> package.json
    echo   } >> package.json
    echo } >> package.json
)

echo.
echo Installation complete!
pause
goto QUICK_START

:CHECK_NODEJS
node --version >nul 2>nul
if errorlevel 1 (
    echo Installing Node.js...
    goto INSTALL_NODEJS
) else (
    echo Node.js is already installed
)
exit /b

:CHECK_FILES
echo Checking required files...

set "FILES_OK=1"
if not exist "lamp-server.js" (
    echo ERROR: lamp-server.js not found
    set "FILES_OK=0"
) else (
    echo OK: lamp-server.js found
)

if not exist "index.html" (
    echo WARNING: index.html not found
) else (
    echo OK: index.html found
)

if not exist "app.js" (
    echo WARNING: app.js not found
) else (
    echo OK: app.js found
)

if "%FILES_OK%"=="0" (
    echo Critical files missing. Cannot continue.
    pause
    exit
)
exit /b

:TROUBLESHOOT
cls
echo.
echo ===========================================
echo           TROUBLESHOOTING
echo ===========================================
echo.
echo Running system checks...
echo.

echo 1. Check Node.js...
node --version >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js not installed
) else (
    echo OK: Node.js found
)

echo.
echo 2. Check npm...
npm --version >nul 2>nul
if errorlevel 1 (
    echo ERROR: npm not working
) else (
    echo OK: npm found
)

echo.
echo 3. Check port 3000...
netstat -ano | findstr :3000 >nul
if errorlevel 1 (
    echo OK: Port 3000 available
) else (
    echo WARNING: Port 3000 is in use
    echo Close other programs or restart
)

echo.
echo 4. Check internet connection...
ping -n 1 8.8.8.8 >nul
if errorlevel 1 (
    echo WARNING: No internet connection
) else (
    echo OK: Internet connection available
)

echo.
echo Troubleshooting complete.
echo.
echo RECOMMENDATIONS:
echo 1. If Node.js missing - select option 2
echo 2. If port busy - close other programs
echo 3. If no internet - check connection
echo.
pause
goto MAIN_MENU

:RUN_ONLY
cls
echo.
echo ===========================================
echo           RUN WEBSITE ONLY
echo ===========================================
echo.
echo Starting server...
start "Smart Home" cmd /k "node lamp-server.js"
timeout /t 3 >nul

echo.
echo Opening browser...
start http://localhost:3000

echo.
echo Website started!
echo Address: http://localhost:3000
echo Wait 5-10 seconds for full load
echo.
timeout /t 7 >nul
goto MAIN_MENU

:CLEAN_REINSTALL
cls
echo.
echo ===========================================
echo           CLEAN AND REINSTALL
echo ===========================================
echo.
echo WARNING: This will delete all dependencies
echo and reinstall them.
echo.
set /p confirm="Are you sure? (y/n): "
if /i not "%confirm%"=="y" goto MAIN_MENU

echo.
echo Removing old dependencies...
if exist "node_modules" (
    rmdir /s /q node_modules
    echo node_modules removed
)
if exist "package-lock.json" (
    del package-lock.json
    echo package-lock.json removed
)

echo.
echo Reinstalling...
call npm install express axios node-fetch

echo.
echo Reinstallation complete!
pause
goto QUICK_START

:SYSTEM_INFO
cls
echo.
echo ===========================================
echo           SYSTEM INFORMATION
echo ===========================================
echo.
echo Current folder: %CURRENT_DIR%
echo.

echo System info:
ver
echo.

echo Node.js version:
node --version 2>nul || echo Not installed
echo.

echo npm version:
npm --version 2>nul || echo Not installed
echo.

echo Disk space in current folder:
for /f "tokens=2 delims=:" %%a in ('dir /-c ^| findstr "bytes free"') do (
    echo Free: %%a
)
echo.

echo Files in folder:
dir /b | findstr /v "node_modules" | head -10
echo.
pause
goto MAIN_MENU