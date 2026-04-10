# ChurchRegister

A full-stack church management system for recording and managing membership, attendance, contributions, pastoral care, risk assessments, training, and more.

## Technology stack

| Layer | Technology |
|-------|-----------|
| API | .NET 10, ASP.NET Core, FastEndpoints |
| Database | EF Core, SQL Server |
| Frontend | React 19, TypeScript, Vite, Material-UI |
| Auth | ASP.NET Core Identity, JWT Bearer |
| Orchestration | .NET Aspire (local dev) |
| Deployment | Docker Compose + Nginx |
| Testing | xUnit v3, WebApplicationFactory |

## Projects

| Project | Purpose |
|---------|---------|
| `ChurchRegister.ApiService` | REST API — endpoints, use cases, services, middleware |
| `ChurchRegister.Database` | EF Core data layer — entities, migrations, `DbContext` |
| `ChurchRegister.React` | React SPA frontend |
| `ChurchRegister.AppHost` | .NET Aspire orchestration host for local development |
| `ChurchRegister.Tests` | Integration test suite |

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/)
- SQL Server (LocalDB, Docker, or full instance)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (optional — for Docker deployment)

## Quick start (local development)

### 1. Clone the repository

```powershell
git clone https://github.com/your-org/ChurchRegister.git
cd ChurchRegister
```

### 2. Configure user secrets

```powershell
cd ChurchRegister.ApiService
dotnet user-secrets set "Jwt:Key" "your-jwt-signing-key-minimum-32-characters"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(localdb)\\mssqllocaldb;Database=ChurchRegister;Trusted_Connection=True;MultipleActiveResultSets=true"
dotnet user-secrets set "AzureEmailService:ConnectionString" "endpoint=https://...;accesskey=..."
```

### 3. Apply database migrations

```powershell
dotnet ef database update --project ChurchRegister.Database --startup-project ChurchRegister.ApiService
```

### 4. Start the API via .NET Aspire

```powershell
dotnet run --project ChurchRegister.AppHost
```

### 5. Start the React frontend

```powershell
cd ChurchRegister.React
npm install
npm run dev
```

The React app is available at `http://localhost:5173` (or the port printed by Vite). The API runs at the port printed by Aspire (typically `http://localhost:5502`).

## Quick start (Docker)

```powershell
.\docker\deploy-local.ps1
```

The application is available at `http://localhost:5000`. See [docs/operations/docker-deployment.md](docs/operations/docker-deployment.md) for full details.

## Running tests

```powershell
dotnet test ChurchRegister.Tests/ChurchRegister.Tests.csproj --verbosity minimal
```

## Documentation

Full documentation is in the [`docs/`](docs/) directory. See [docs/README.md](docs/README.md) for the index.

## Licence

Private — all rights reserved.
