@echo off
setlocal

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "FRONTEND_URL=http://localhost:3000"
set "API_URL=http://localhost:3001"
set "SWAGGER_URL=http://localhost:3001/api-docs"

if not exist "%BACKEND_DIR%\package.json" (
	echo [ERROR] Backend package.json not found at:
	echo         %BACKEND_DIR%
	pause
	exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
	echo [ERROR] Frontend package.json not found at:
	echo         %FRONTEND_DIR%
	pause
	exit /b 1
)

echo Starting API and frontend in separate windows...

start "CaterTrack API" /D "%BACKEND_DIR%" cmd /k "npm.cmd run dev"
start "CaterTrack Frontend" /D "%FRONTEND_DIR%" cmd /k "npm.cmd run dev"

echo Waiting for servers to initialize...
timeout /t 6 /nobreak >nul

echo Opening app links in your default browser...
start "" "%FRONTEND_URL%"
start "" "%SWAGGER_URL%"

echo Done. API and frontend were started, and links were opened.
endlocal
exit /b 0
