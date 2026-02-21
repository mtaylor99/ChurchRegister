# Church Register - Restore Database from Backup
# This script restores a SQL Server database from a backup file

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Church Register - Database Restore" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if SQL Server container is running
$containerRunning = docker ps --filter "name=churchregister-sqlserver" --format "{{.Names}}"
if (-not $containerRunning) {
    Write-Host "[ERROR] SQL Server container is not running." -ForegroundColor Red
    Write-Host "  Start it with: .\docker\deploy-local.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] SQL Server container is running" -ForegroundColor Green
Write-Host ""

# Find backup folder
$oneDrivePath = "$env:USERPROFILE\OneDrive\ChurchRegister-Backups"
if (-not (Test-Path $oneDrivePath)) {
    $possibleOneDrive = Get-ChildItem "$env:USERPROFILE" -Directory -Filter "OneDrive*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($possibleOneDrive) {
        $oneDrivePath = "$($possibleOneDrive.FullName)\ChurchRegister-Backups"
    } else {
        $oneDrivePath = "$env:USERPROFILE\Documents\ChurchRegister-Backups"
    }
}

# List available backups
if (Test-Path $oneDrivePath) {
    $backups = Get-ChildItem $oneDrivePath -Filter "ChurchRegister_*.bak" | Sort-Object LastWriteTime -Descending
    
    if ($backups.Count -eq 0) {
        Write-Host "[ERROR] No backup files found in: $oneDrivePath" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Available backups:" -ForegroundColor Cyan
    Write-Host ""
    for ($i = 0; $i -lt $backups.Count; $i++) {
        $sizeMB = [math]::Round($backups[$i].Length / 1MB, 2)
        Write-Host "  [$($i+1)] $($backups[$i].Name) - $sizeMB MB - $($backups[$i].LastWriteTime)" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # Prompt user to select backup
    $selection = Read-Host "Select backup number to restore (1-$($backups.Count)) or press Enter to cancel"
    
    if ([string]::IsNullOrWhiteSpace($selection)) {
        Write-Host "Restore cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    $selectedIndex = [int]$selection - 1
    if ($selectedIndex -lt 0 -or $selectedIndex -ge $backups.Count) {
        Write-Host "[ERROR] Invalid selection." -ForegroundColor Red
        exit 1
    }
    
    $selectedBackup = $backups[$selectedIndex]
    
    Write-Host ""
    Write-Host "[WARNING] WARNING: This will replace the current database!" -ForegroundColor Yellow
    Write-Host "Selected backup: $($selectedBackup.Name)" -ForegroundColor Cyan
    $confirm = Read-Host "Are you sure? Type 'YES' to continue"
    
    if ($confirm -ne "YES") {
        Write-Host "Restore cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host ""
    Write-Host "Copying backup file to container..." -ForegroundColor Yellow
    $containerBackupPath = "/var/opt/mssql/backup/$($selectedBackup.Name)"
    docker cp "$($selectedBackup.FullName)" "churchregister-sqlserver:$containerBackupPath"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed to copy backup file to container" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[OK] Backup file copied to container" -ForegroundColor Green
    Write-Host ""
    
    # Restore database
    Write-Host "Restoring database (this may take a moment)..." -ForegroundColor Yellow
    $restoreResult = docker exec churchregister-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P ChurchRegister123! -C -Q "ALTER DATABASE [ChurchRegister] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE [ChurchRegister] FROM DISK = N'$containerBackupPath' WITH REPLACE, STATS = 10; ALTER DATABASE [ChurchRegister] SET MULTI_USER;" 2>&1
    
    # Check if restore was successful by looking for success message in output
    if ($restoreResult -match "RESTORE DATABASE successfully processed") {
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Green
        Write-Host "[SUCCESS] Database Restored Successfully!" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Restored from: $($selectedBackup.Name)" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Cleaning up..." -ForegroundColor Yellow
        docker exec churchregister-sqlserver rm -f $containerBackupPath
        Write-Host "[OK] Cleanup complete" -ForegroundColor Green
        Write-Host ""
        Write-Host "You may need to restart the application container:" -ForegroundColor Yellow
        Write-Host "  docker restart churchregister-app" -ForegroundColor Cyan
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Red
        Write-Host "[FAILED] Restore Failed" -ForegroundColor Red
        Write-Host "============================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Error details:" -ForegroundColor Yellow
        Write-Host $restoreResult
        Write-Host ""
    }
    
} else {
    Write-Host "[ERROR] Backup folder not found: $oneDrivePath" -ForegroundColor Red
    exit 1
}
