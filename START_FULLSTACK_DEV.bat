@echo off
title Trading Intelligence Pro - Full-Stack Developer Environment
echo ======================================================================
echo Launching Trading Intelligence Pro Full-Stack Developer Suite...
echo ======================================================================

start "Trading Intelligence Pro - Backend" cmd /c "%~dp0run_backend.bat"
timeout /t 3 /nobreak >nul
start "Trading Intelligence Pro - Frontend" cmd /c "%~dp0run_frontend.bat"
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173
echo Platform active. Press any key to exit this launcher window.
pause
