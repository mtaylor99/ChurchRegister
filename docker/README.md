# Church Register - Local Docker Deployment

This guide explains how to run the Church Register application locally using Docker.

## � Summary - What You Need

| Scenario                            | Command                                                     | What It Does                                                     |
| ----------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- |
| **First time running the app**      | `.\docker\deploy-local.ps1`                                 | Builds images, starts containers, runs migrations, opens browser |
| **Running the app (already built)** | `.\docker\deploy-local.ps1`                                 | Starts existing containers, opens browser                        |
| **Deploy new code changes**         | `docker-compose -f docker/docker-compose.yml up --build -d` | Rebuilds images with your changes, restarts containers           |
| **Backup database to OneDrive**     | `.\docker\backup-database.ps1`                              | Creates backup file and copies to OneDrive for cloud sync        |
| **Restore database from backup**    | `.\docker\restore-database.ps1`                             | Restores database from a previous backup file                    |
| **Stop the app**                    | `.\docker\stop-local.ps1`                                   | Stops containers (prompts to keep/remove data)                   |
| **Reset database (fix login)**      | `docker-compose -f docker/docker-compose.yml down; docker volume rm docker_sqlserver-data; docker-compose -f docker/docker-compose.yml up -d` | Deletes database volume and recreates with fresh data |
| **View logs**                       | `docker-compose -f docker/docker-compose.yml logs -f app`   | Shows real-time application logs                                 |

**Access URL After Starting:** http://localhost:5000

## �🚀 Quick Start

### Option 1: PowerShell Script (Easiest)

```powershell
cd c:\GitHub\Personal\ChurchRegister
.\docker\deploy-local.ps1
```

This will:

- Build the Docker images
- Start SQL Server and the application
- Run database migrations
- Open the application in your browser

### Option 2: Docker Desktop GUI

1. Open Docker Desktop
2. Navigate to the project's `docker` folder
3. Right-click on `docker-compose.yml`
4. Select "Compose Up"

### Option 3: Command Line

```powershell
cd c:\GitHub\Personal\ChurchRegister
docker-compose -f docker/docker-compose.yml up --build -d
```

## 📦 What's Included

The Docker setup creates two containers:

1. **SQL Server** (sqlserver)
   - Microsoft SQL Server 2022 Developer Edition
   - Data persists in a Docker volume
   - Accessible on `localhost:1433`

2. **Application** (app)
   - .NET 9.0 API backend
   - React frontend (served from wwwroot)
   - Automatically runs database migrations on startup
   - Accessible on `http://localhost:5000`

## 🔌 Access Information

| Service         | URL/Connection                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| **Application** | http://localhost:5000                                                                                  |
| **SQL Server**  | Server: `localhost,1433`<br>User: `sa`<br>Password: `ChurchRegister123!`<br>Database: `ChurchRegister` |

### Default Admin Account

| Field    | Value                    |
| -------- | ------------------------ |
| Email    | admin@churchregister.com |
| Password | AdminPassword123!        |

### Connecting with SQL Server Management Studio (SSMS)

1. Open SQL Server Management Studio
2. In the "Connect to Server" dialog:
   - **Server type:** Database Engine
   - **Server name:** `localhost,1433` (or just `localhost`)
   - **Authentication:** SQL Server Authentication
   - **Login:** `sa`
   - **Password:** `ChurchRegister123!`
3. Click "Connect"
4. The database is named: **ChurchRegister**

**Troubleshooting SSMS Connection:**

- Verify containers are running: `docker ps`
- Check SQL Server logs: `docker logs churchregister-sqlserver`
- Try `127.0.0.1,1433` instead of `localhost,1433`
- Ensure port 1433 is not blocked by firewall

## 🛠️ Common Commands

### Start Application

```powershell
.\docker\deploy-local.ps1          # PowerShell script (from project root)
docker-compose -f docker/docker-compose.yml up -d        # Background mode
docker-compose -f docker/docker-compose.yml up           # With logs
```

### Stop Application

```powershell
.\docker\stop-local.ps1            # PowerShell script (prompts about data)
docker-compose -f docker/docker-compose.yml down         # Keep data
docker-compose -f docker/docker-compose.yml down -v      # Remove data
```

### View Logs

```powershell
docker-compose -f docker/docker-compose.yml logs -f              # All services
docker-compose -f docker/docker-compose.yml logs -f app          # App only
docker-compose -f docker/docker-compose.yml logs -f sqlserver    # SQL Server only
```

### Deploy Code Changes (Rebuild and Restart)

```powershell
# After making changes to C# or React code
docker-compose -f docker/docker-compose.yml up --build -d
```

### Fresh Start (Remove All Data)

```powershell
docker-compose -f docker/docker-compose.yml down -v
docker-compose -f docker/docker-compose.yml up --build -d
```

### Backup Database

```powershell
.\docker\backup-database.ps1
```

This script will:

- Create a full backup of the SQL Server database
- Save it to `C:\Users\[YourUsername]\OneDrive\ChurchRegister-Backups\`
- Name it with timestamp: `ChurchRegister_YYYYMMDD_HHMMSS.bak`
- Automatically sync to OneDrive cloud storage

**Note:** The script auto-detects your OneDrive folder. If OneDrive is not found, it falls back to your Documents folder.

### Restore Database

```powershell
.\docker\restore-database.ps1
```

This script will:

- List all available backup files
- Let you select which backup to restore
- Replace the current database with the selected backup
- **Warning:** This will overwrite your current data!

## 🔧 Troubleshooting

### Port Already in Use

If port 5000 is already in use:

1. Edit `docker/docker-compose.yml`
2. Change `"5000:5000"` to `"8080:5000"` (or any other port)
3. Access the app at `http://localhost:8080`

### SQL Server Won't Start

- Ensure Docker Desktop has at least 2GB RAM allocated
- Check: Docker Desktop → Settings → Resources → Memory
- View SQL logs: `docker-compose -f docker/docker-compose.yml logs sqlserver`

### Migrations Fail

```powershell
# View app logs
docker-compose -f docker/docker-compose.yml logs app

# Manually run migrations
docker exec -it churchregister-app dotnet ef database update --project /app/ChurchRegister.Database/ChurchRegister.Database.csproj --startup-project /app/ChurchRegister.ApiService.dll
```

### Cannot Connect to SQL Server from Host

- Verify SQL container is running: `docker-compose -f docker/docker-compose.yml ps`
- Test connection: `docker exec -it churchregister-sqlserver /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P ChurchRegister123! -C -Q "SELECT 1"`

### Login Issues / Invalid Credentials

If you're getting "Invalid email or password" errors with the default admin credentials (`admin@churchregister.com` / `AdminPassword123!`), the issue is likely **stale data in the Docker volume**.

**Important:** Docker volumes persist even when containers are deleted or redeployed. Simply stopping and restarting containers (`docker-compose down` / `docker-compose up`) **does NOT** delete the database volume.

**Solution - Reset Database Volume:**

```powershell
# Stop containers
docker-compose -f docker/docker-compose.yml down

# Delete the database volume (this removes ALL data)
docker volume rm docker_sqlserver-data

# Start fresh with new database
docker-compose -f docker/docker-compose.yml up -d
```

The admin user will be recreated with the correct password during the seeding process.

**Why this happens:**
- Old database had admin user with incorrect/corrupted password hash
- Volume persisted between container restarts
- App sees user exists and doesn't recreate it
- Login fails because stored password hash doesn't match

### Clear Everything and Start Fresh

```powershell
docker-compose -f docker/docker-compose.yml down -v
docker system prune -a --volumes
docker-compose -f docker/docker-compose.yml up --build -d
```

## 📁 Files Overview

| File                   | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `docker-compose.yml`   | Defines the two services (SQL Server + App)  |
| `Dockerfile`           | Multi-stage build for React + .NET API       |
| `docker-entrypoint.sh` | Startup script for the application           |
| `.dockerignore`        | Excludes unnecessary files from Docker build |
| `deploy-local.ps1`     | One-command deployment script                |
| `stop-local.ps1`       | One-command stop script                      |
| `backup-database.ps1`  | Backup database to OneDrive                  |
| `restore-database.ps1` | Restore database from backup                 |

## 🔄 Development Workflow

1. Make changes to code in the project
2. Run `docker-compose -f docker/docker-compose.yml up --build -d` to rebuild and restart
3. View logs with `docker-compose -f docker/docker-compose.yml logs -f app`
4. Test at `http://localhost:5000`

## 📝 Notes

- **Data Persistence**: SQL Server data is stored in a Docker volume named `sqlserver-data`. It persists between container restarts unless you use `docker-compose down -v`.
- **First Run**: Initial build takes 5-10 minutes to download images and build everything.
- **Subsequent Runs**: Start time is ~30 seconds once images are built.
- **Resource Usage**: Approximately 2-3GB RAM total for both containers.

## 🔐 Security Notes

The default SQL Server password (`ChurchRegister123!`) is set in `docker-compose.yml`. For production or shared environments:

1. Change the password in `docker-compose.yml` (both places: SA_PASSWORD and ConnectionStrings)
2. Use environment variables or secrets management
3. Update JWT keys in the environment variables

## 📚 Additional Resources

- Full documentation: `../docs/local-development-setup.md`
- Architecture: `../docs/ARCHITECTURE.md`
