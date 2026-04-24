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

echo Starting API...

start "CaterTrack API" /D "%BACKEND_DIR%" cmd /k "npm.cmd run dev"

echo Waiting for API to be ready...
set /a RETRIES=0
:wait_for_api
curl -s --max-time 2 "%API_URL%" >nul 2>&1
if %errorlevel% equ 0 goto api_ready
set /a RETRIES+=1
if %RETRIES% geq 30 (
    echo [ERROR] API did not respond after 60 seconds. Starting frontend anyway...
    goto start_frontend
)
timeout /t 2 /nobreak >nul
goto wait_for_api

:api_ready
echo API is ready.

:start_frontend
if not exist "%FRONTEND_DIR%\node_modules\tailwindcss\package.json" (
	echo Installing frontend dependencies...
	call npm.cmd --prefix "%FRONTEND_DIR%" install
	if errorlevel 1 (
		echo [ERROR] Frontend dependency installation failed.
		pause
		exit /b 1
	)
)

if exist "%FRONTEND_DIR%\.next" (
	echo Clearing frontend build cache...
	rmdir /s /q "%FRONTEND_DIR%\.next"
)

echo Starting frontend...
start "CaterTrack Frontend" /D "%FRONTEND_DIR%" cmd /k "npm.cmd run dev"

echo Waiting for frontend to initialize...
timeout /t 6 /nobreak >nul

echo Opening app links in your default browser...
start "" "%FRONTEND_URL%"
start "" "%SWAGGER_URL%"

echo.
echo Servers are running. Press any key to stop all services and exit...
pause >nul

echo Stopping services...
taskkill /FI "WINDOWTITLE eq CaterTrack API" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq CaterTrack Frontend" /T /F >nul 2>&1
echo All services stopped.
endlocal
exit /b 0
