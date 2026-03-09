# Church Register - Stop Docker Containers
# This script stops and removes all Church Register Docker containers

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Church Register - Stop Containers" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Change to script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $scriptPath

try {
    $removeData = Read-Host "Remove database data? (y/N)"

    if ($removeData -eq "y" -or $removeData -eq "Y") {
        Write-Host "Stopping containers and removing volumes..." -ForegroundColor Yellow
        docker-compose down -v
    Write-Host ""
    Write-Host "[OK] Containers stopped and data removed" -ForegroundColor Green
} else {
    Write-Host "Stopping containers (data will be preserved)..." -ForegroundColor Yellow
    docker-compose down
    Write-Host ""
    Write-Host "[OK] Containers stopped (data preserved)" -ForegroundColor Green
}
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "To start again, run: .\docker\deploy-local.ps1" -ForegroundColor Yellow
Write-Host ""
