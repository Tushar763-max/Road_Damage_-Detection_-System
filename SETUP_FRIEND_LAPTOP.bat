@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   Setup Road Damage Detection on New / Friend Laptop
echo ===================================================
echo.

:: Detect Python
set "PY_CMD=python"
where python >nul 2>&1
if %errorlevel% neq 0 (
    where py >nul 2>&1
    if %errorlevel% equ 0 (
        set "PY_CMD=py"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
        set "PY_CMD=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    ) else (
        echo [ERROR] Python not found!
        echo Please install Python 3.10, 3.11, or 3.12 and ensure "Add Python to PATH" is ticked during install.
        pause
        exit /b 1
    )
)

:: Check Node.js
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo [1/2] Installing Python backend packages (Flask, YOLOv8, PyTorch, OpenCV)...
cd /d "%~dp0backend"
!PY_CMD! -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [WARNING] Some python packages had issues, retrying core packages...
    !PY_CMD! -m pip install flask flask-cors ultralytics opencv-python-headless imageio-ffmpeg
)

echo.
echo [2/2] Installing Frontend Node.js dependencies...
cd /d "%~dp0frontend"
call npm install

echo.
echo ===================================================
echo   SETUP COMPLETED SUCCESSFULLY!
echo   You can now run: START_PROJECT.bat
echo ===================================================
pause
