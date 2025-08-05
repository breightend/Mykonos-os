@echo off
setlocal

echo 🚀 Starting Mykonos PostgreSQL Docker Setup...

REM Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ docker-compose is not installed. Please install docker-compose first.
    pause
    exit /b 1
)

echo ✅ docker-compose is available

REM Start the containers
echo 🐳 Starting PostgreSQL and Adminer containers...
docker-compose up -d

REM Wait for PostgreSQL to be ready
echo ⏳ Waiting for PostgreSQL to be ready...
set /a counter=0
set /a timeout=60

:waitloop
docker exec mykonos-postgres pg_isready -U mykonos_user -d mykonos >nul 2>&1
if %ERRORLEVEL% equ 0 goto ready

set /a counter+=1
if %counter% geq %timeout% (
    echo ❌ PostgreSQL failed to start within %timeout% seconds
    pause
    exit /b 1
)

timeout /t 1 /nobreak >nul
goto waitloop

:ready
echo ✅ PostgreSQL is ready!

echo.
echo 🎉 Setup complete!
echo.
echo 📊 Database Connection Info:
echo   Host: localhost
echo   Port: 5432
echo   Database: mykonos
echo   Username: mykonos_user
echo   Password: mykonos_password
echo.
echo 🌐 Adminer (Database GUI) is available at:
echo   URL: http://localhost:8080
echo   System: PostgreSQL
echo   Server: postgres
echo   Username: mykonos_user
echo   Password: mykonos_password
echo   Database: mykonos
echo.
echo 🔧 To stop the containers: docker-compose down
echo 🗑️  To remove all data: docker-compose down -v
echo.
pause
