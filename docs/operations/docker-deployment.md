# Docker deployment guide

## Overview

The `docker/` directory contains everything needed to run the ChurchRegister application locally via Docker Compose. The setup creates two containers: SQL Server 2022 and the .NET API (with the React frontend served from the same container via Nginx).

## Quick reference

| Scenario | Command |
|----------|---------|
| First run / start app | `.\docker\deploy-local.ps1` |
| Deploy code changes | `docker-compose -f docker/docker-compose.yml up --build -d` |
| Backup database to OneDrive | `.\docker\backup-database.ps1` |
| Restore database from backup | `.\docker\restore-database.ps1` |
| Stop the app | `.\docker\stop-local.ps1` |
| Reset database (fix login issues) | See [Reset database](#reset-database) below |
| View real-time logs | `docker-compose -f docker/docker-compose.yml logs -f app` |

**Application URL:** http://localhost:5000

## Containers

| Container | Purpose | Port |
|-----------|---------|------|
| `sqlserver` | SQL Server 2022 Developer Edition | `localhost:1433` |
| `app` | .NET 10 API + React (Nginx) | `http://localhost:5000` |

## Starting the application

### Option 1 — PowerShell script (recommended)

```powershell
cd c:\GitHub\ChurchRegister
.\docker\deploy-local.ps1
```

This script builds the Docker images, starts both containers, runs EF Core migrations, then opens the application in the browser.

### Option 2 — Docker Compose CLI

```powershell
docker-compose -f docker/docker-compose.yml up --build -d
```

### Option 3 — Docker Desktop GUI

1. Open Docker Desktop
2. Navigate to `docker/docker-compose.yml`
3. Select "Compose Up"

## Default access credentials

| Service | Value |
|---------|-------|
| Application URL | http://localhost:5000 |
| Default admin email | `admin@churchregister.com` |
| Default admin password | `AdminPassword123!` |
| SQL Server host | `localhost,1433` |
| SQL Server login | `sa` |
| SQL Server password | `ChurchRegister123!` |
| Database name | `ChurchRegister` |

## Database backup and restore

### Backup to OneDrive

```powershell
.\docker\backup-database.ps1
```

Creates a `.bak` file and copies it to OneDrive for cloud sync.

### Restore from backup

```powershell
.\docker\restore-database.ps1
```

Restores the database from the most recent backup file. Follow the on-screen prompts to select the backup.

## Reset database

If the database is corrupted or you need a clean slate:

```powershell
docker-compose -f docker/docker-compose.yml down
docker volume rm docker_sqlserver-data
docker-compose -f docker/docker-compose.yml up -d
```

This deletes the SQL Server data volume and recreates the database from scratch (migrations run automatically on startup).

## Stopping the application

```powershell
.\docker\stop-local.ps1
```

The script prompts whether to keep or remove the data volumes.

## Connecting to SQL Server from SSMS

1. Open SQL Server Management Studio
2. Connect with:
   - **Server name:** `localhost,1433`
   - **Authentication:** SQL Server Authentication
   - **Login:** `sa`
   - **Password:** `ChurchRegister123!`
3. Database: **ChurchRegister**

**Troubleshooting:**
- Verify containers are running: `docker ps`
- Check SQL Server logs: `docker logs churchregister-sqlserver`
- Try `127.0.0.1,1433` if `localhost,1433` fails

## Build architecture

| Component | Technology |
|-----------|------------|
| API | .NET 10 — built in a multi-stage Dockerfile |
| React frontend | Node.js build stage → static files served by Nginx |
| Database migrations | Run automatically on container startup via `docker-entrypoint.sh` |
| Reverse proxy | Nginx routes `/api/` traffic to the .NET backend; all other traffic serves the React SPA |

**`docker-entrypoint.sh`** waits for SQL Server to be ready, applies pending migrations, then starts the application.

## Nginx configuration

`nginx.conf` is embedded in the image. Key rules:
- Requests to `/api/` are proxied to the .NET API on port 5000 internally
- All other requests serve `index.html` (SPA fallback for React Router)
- Static assets are served with long-lived cache headers

## Environment variables in Docker

Sensitive variables (JWT key, database password) are passed through `docker-compose.yml` environment section. For production, replace hardcoded values with Azure Key Vault references or Docker secrets.

## Production deployment

For production, the same Docker image is suitable for deployment to:
- Azure App Service (Containers)
- Azure Container Instances
- Any Docker-capable hosting platform

Ensure the following before going live:
- Replace the development SQL Server password
- Rotate the JWT signing key
- Configure Azure Key Vault
- Set `CORS:AllowedOrigins` to the production domain
- Enable HTTPS (HSTS) and configure a TLS certificate
