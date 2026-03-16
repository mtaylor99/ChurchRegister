# Church Register - Backup Database from Docker Container
# This script backs up the SQL Server database and copies it to OneDrive for cloud backup

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Church Register - Database Backup" -ForegroundColor Cyan
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

# Generate backup filename with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFileName = "ChurchRegister_$timestamp.bak"
$containerBackupPath = "/var/opt/mssql/backup/$backupFileName"

# OneDrive path - adjust if your OneDrive folder is different
# Common OneDrive paths:
# Personal: $env:USERPROFILE\OneDrive
# Business: $env:USERPROFILE\OneDrive - [YourCompanyName]
$oneDrivePath = "$env:USERPROFILE\OneDrive\ChurchRegister-Backups"

# If OneDrive is not found, try common business OneDrive location
if (-not (Test-Path (Split-Path $oneDrivePath))) {
    $possibleOneDrive = Get-ChildItem "$env:USERPROFILE" -Directory -Filter "OneDrive*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($possibleOneDrive) {
        $oneDrivePath = "$($possibleOneDrive.FullName)\ChurchRegister-Backups"
        Write-Host "Using OneDrive folder: $($possibleOneDrive.FullName)" -ForegroundColor Cyan
    } else {
        Write-Host "[WARNING] OneDrive folder not found. Using Documents folder instead." -ForegroundColor Yellow
        $oneDrivePath = "$env:USERPROFILE\Documents\ChurchRegister-Backups"
    }
}

# Create OneDrive backup folder if it doesn't exist
if (-not (Test-Path $oneDrivePath)) {
    Write-Host "Creating backup folder: $oneDrivePath" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $oneDrivePath -Force | Out-Null
}

Write-Host "Backup will be saved to: $oneDrivePath\$backupFileName" -ForegroundColor Cyan
Write-Host ""

# Create backup directory in container if it doesn't exist
Write-Host "Creating backup directory in container..." -ForegroundColor Yellow
docker exec churchregister-sqlserver mkdir -p /var/opt/mssql/backup 2>$null

# Run backup command inside the container
Write-Host "Backing up database (this may take a moment)..." -ForegroundColor Yellow
$backupResult = docker exec churchregister-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P ChurchRegister123! -C -Q "BACKUP DATABASE [ChurchRegister] TO DISK = N'$containerBackupPath' WITH NOFORMAT, NOINIT, NAME = 'ChurchRegister-Full', SKIP, NOREWIND, NOUNLOAD, STATS = 10" 2>&1

# Check if backup was successful by looking for success message in output
if ($backupResult -match "BACKUP DATABASE successfully processed") {
    Write-Host "[OK] Database backed up successfully in container" -ForegroundColor Green
    Write-Host ""
    
    # Copy backup file from container to local OneDrive folder
    Write-Host "Copying backup to OneDrive folder..." -ForegroundColor Yellow
    docker cp "churchregister-sqlserver:$containerBackupPath" "$oneDrivePath\$backupFileName"
    
    if ($LASTEXITCODE -eq 0) {
        $backupFile = Get-Item "$oneDrivePath\$backupFileName"
        $fileSizeMB = [math]::Round($backupFile.Length / 1MB, 2)
        
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Green
        Write-Host "[SUCCESS] Backup Completed Successfully!" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Backup Location: " -NoNewline
        Write-Host "$oneDrivePath\$backupFileName" -ForegroundColor Cyan
        Write-Host "Backup Size: " -NoNewline
        Write-Host "$fileSizeMB MB" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "The backup will be automatically synced to OneDrive." -ForegroundColor Green
        Write-Host ""
        
        # Clean up backup file in container to save space
        Write-Host "Cleaning up backup file in container..." -ForegroundColor Yellow
        docker exec churchregister-sqlserver rm -f $containerBackupPath
        Write-Host "[OK] Container cleanup complete" -ForegroundColor Green
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "[ERROR] Failed to copy backup file to local drive" -ForegroundColor Red
        Write-Host "The backup exists in the container at: $containerBackupPath" -ForegroundColor Yellow
    }
    
} else {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "[FAILED] Backup Failed" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $backupResult
    Write-Host ""
}
