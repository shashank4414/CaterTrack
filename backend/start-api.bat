@echo off
cd /d "%~dp0backend"
start "" cmd /c "timeout /t 3 /nobreak >nul && start "" http://localhost:3000"
npx tsx server.ts
pause