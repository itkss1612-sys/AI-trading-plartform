@echo off
title Trading Intelligence Pro - Backend API Server
cd /d "%~dp0\backend"
set PYTHONPATH=%cd%
echo ==========================================================
echo Starting Trading Intelligence Pro - Backend FastAPI Server
echo URL: http://localhost:8000
echo Swagger Docs: http://localhost:8000/docs
echo ==========================================================
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
