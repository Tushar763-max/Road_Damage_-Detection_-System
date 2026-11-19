@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Indian Road Damage Detection System
echo   Tushar Jarwal - MCA Final Year Project
echo ===================================================
echo.

:: Detect Python executable
set "PY_CMD=python"
where python >nul 2>&1
if %errorlevel% neq 0 (
    where py >nul 2>&1
    if %errorlevel% equ 0 (
        set "PY_CMD=py"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
        set "PY_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
        set "PY_CMD=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    ) else if exist "C:\Python312\python.exe" (
        set "PY_CMD=C:\Python312\python.exe"
    ) else (
        echo [ERROR] Python was not found on this machine!
        echo Please install Python 3.10, 3.11, or 3.12 and check "Add Python to PATH".
        pause
        exit /b 1
    )
)

:: Check Node.js
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js (npm) was not found on this machine!
    echo Please install Node.js (v18 or newer) from https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Starting Flask + YOLOv8 Backend on Port 5000...
start "RoadScan Backend (Flask + YOLOv8)" cmd /k "cd /d "%~dp0backend" && !PY_CMD! app.py"

echo [2/3] Starting React + Vite Frontend on Port 5173...
start "RoadScan Frontend (React + Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo [3/3] Opening dashboard in your browser in 4 seconds...
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo ===================================================
echo   Both servers are now running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:5000
echo   Keep both command prompt windows open while presenting!
echo ===================================================
pause
