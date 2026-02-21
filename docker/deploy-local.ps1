# Church Register - Local Docker Deployment Script
# This script builds and starts the Church Register application in Docker

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Church Register - Docker Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    Write-Host "  Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "Building and starting containers..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Yellow
Write-Host ""

# Change to script directory and run docker-compose
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptPath

$exitCode = 0
try {
    # Ensure the app runs in Production when deploying via Docker
    $prevAspNetEnv = $env:ASPNETCORE_ENVIRONMENT
    $env:ASPNETCORE_ENVIRONMENT = 'Production'

    # Build and start containers
    docker-compose up --build -d
    $exitCode = $LASTEXITCODE
} finally {
    # Restore previous environment value (or remove if none)
    if ($null -ne $prevAspNetEnv) {
        $env:ASPNETCORE_ENVIRONMENT = $prevAspNetEnv
    } else {
        Remove-Item Env:\ASPNETCORE_ENVIRONMENT -ErrorAction SilentlyContinue
    }

    Pop-Location
}

if ($exitCode -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "Deployment Successful!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Application URL: " -NoNewline
    Write-Host "http://localhost:5000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "SQL Server Connection:" -ForegroundColor Yellow
    Write-Host "  Server: localhost,1433"
    Write-Host "  Database: ChurchRegister"
    Write-Host "  Username: sa"
    Write-Host "  Password: ChurchRegister123!"
    Write-Host ""
    Write-Host "Useful Commands:" -ForegroundColor Yellow
    Write-Host "  View logs:        docker-compose -f docker/docker-compose.yml logs -f"
    Write-Host "  Stop containers:  .\docker\stop-local.ps1"
    Write-Host "  Restart:          docker-compose -f docker/docker-compose.yml restart"
    Write-Host ""
    Write-Host "Opening application in browser in 5 seconds..." -ForegroundColor Green
    Start-Sleep -Seconds 5
    Start-Process "http://localhost:5000"
} else {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "Deployment Failed" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Write-Host "You can view detailed logs with: docker-compose -f docker/docker-compose.yml logs" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}
