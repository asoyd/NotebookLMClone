@echo off
REM Starts backend + frontend dev servers, each in its own window.
REM First-time setup only (skip if already done):
REM   cd backend  && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt
REM   cd frontend && npm install
REM Also requires backend\.env (GROQ_API_KEY=...) and frontend\.env (VITE_API_URL=http://localhost:8000)

start "backend"  cmd /k "cd /d %~dp0backend  && venv\Scripts\activate && uvicorn main:app --reload --port 8000"
start "frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
