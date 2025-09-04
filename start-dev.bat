@echo off
REM Script to start the Mini Preorder development environment on Windows

echo 🚀 Starting Mini Preorder Development Environment
echo ==================================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ docker-compose could not be found. Please install Docker Compose.
    pause
    exit /b 1
)

REM Create environment file for backend if it doesn't exist
if not exist ".\backend\.env" (
    echo 📝 Creating backend environment file...
    copy ".\backend\.env.example" ".\backend\.env"
    echo ✅ Created backend/.env file. Please update it with your email configuration.
)

REM Build and start services
echo 🐳 Building and starting Docker containers...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check if services are ready (simplified for Windows)
echo 🍃 Checking MongoDB...
timeout /t 5 /nobreak >nul

echo 🔧 Checking backend API...
timeout /t 10 /nobreak >nul

echo ⚛️ Checking frontend...
timeout /t 20 /nobreak >nul

echo 🎉 Services should be ready now!
echo.
echo 📱 Access the application:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:5000
echo    Admin Dashboard: http://localhost:3000/dashboard
echo.
echo 🔑 Admin Login:
echo    Username: admin
echo    Password: admin123
echo.
echo 📊 View logs:
echo    docker-compose logs -f
echo.
echo 🛑 Stop services:
echo    docker-compose down
echo.
pause
