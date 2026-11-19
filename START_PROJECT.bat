@echo off
echo ===================================================
echo   Starting Indian Road Damage Detection System
echo   Tushar Jarwal - MCA Final Year Project
echo ===================================================
echo.

echo [1/3] Starting Flask + YOLOv8 Backend on Port 5000...
start "RoadScan Backend (Flask + YOLOv8)" cmd /k "cd /d %~dp0backend && C:\Users\Admin\AppData\Local\Programs\Python\Python312\python.exe app.py"

echo [2/3] Starting React + Vite Frontend on Port 5173...
start "RoadScan Frontend (React + Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

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
