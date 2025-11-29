@echo off
echo ========================================
echo Smart Auction Platform - Setup and Run
echo ========================================
echo.

echo Step 1: Installing frontend dependencies...
cd /d C:\Users\hp\Desktop\Mini-Appathon\auctionpro
call npm install axios socket.io-client
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo Frontend dependencies installed successfully!
echo.

echo Step 2: Starting Backend Server...
cd /d C:\Users\hp\Desktop\Mini-Appathon\backend
start "Backend Server" cmd /k "node src/app.js"
echo Backend server started on http://localhost:5000
echo.

echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak >nul
echo.

echo Step 3: Starting Frontend Development Server...
cd /d C:\Users\hp\Desktop\Mini-Appathon\auctionpro
start "Frontend Server" cmd /k "npm run dev"
echo Frontend server starting...
echo.

echo ========================================
echo Both servers are starting!
echo ========================================
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173 (or check the Frontend Server window)
echo.
echo Press any key to close this window (servers will keep running)
pause >nul
