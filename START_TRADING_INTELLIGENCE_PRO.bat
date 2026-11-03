@echo off
title Trading Intelligence Pro - Terminal & Live Feed
echo ======================================================================
echo    STARTING TRADING INTELLIGENCE PRO (INSTITUTIONAL TERMINAL)
echo ======================================================================
echo.
echo [1/2] Starting Live Market Data Feed Server (FastAPI / Yahoo Finance)...
start /b "" python -m uvicorn app.main:app --app-dir "%~dp0backend" --host 127.0.0.1 --port 8000
timeout /t 3 /nobreak >nul

echo [2/2] Opening Terminal in Web Browser...
start "" "%~dp0Trading_Intelligence_Pro.html"

echo.
echo ======================================================================
echo Terminal is active! Dual Market (NSE & US) + Gemini AI Copilot is streaming.
echo Keep this window open while trading to maintain live data feeds.
echo Press any key to close this server window when you are done trading.
echo ======================================================================
pause >nul
