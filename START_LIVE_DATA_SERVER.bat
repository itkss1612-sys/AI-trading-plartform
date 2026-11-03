@echo off
title Trading Intelligence Pro - Live Market Data Server
echo ======================================================================
echo    TRADING INTELLIGENCE PRO - LIVE NSE DATA FEED SERVER
echo    Endpoint: http://127.0.0.1:8000
echo    Documentation: http://127.0.0.1:8000/docs
echo ======================================================================
echo.
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause
