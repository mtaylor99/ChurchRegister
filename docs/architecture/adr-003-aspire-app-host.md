# ADR-003: .NET Aspire for local service orchestration

**Status**: Accepted  
**Date**: 2026-02-15  
**Deciders**: Development Team

---

## Context

The ChurchRegister solution consists of multiple runnable projects (API service, React frontend) that need to be co-ordinated during local development. Historically this required opening multiple terminal windows, setting environment variables manually, and remembering port numbers.

.NET Aspire (introduced in .NET 8, now targeting .NET 10) provides a lightweight App Host project that orchestrates multiple services and provides a local developer dashboard.

## Decision

We adopted **.NET Aspire** with a dedicated `ChurchRegister.AppHost` project to orchestrate local development.

### What `AppHost.cs` configures

```csharp
var builder = DistributedApplication.CreateBuilder(args);

var apiService = builder.AddProject<Projects.ChurchRegister_ApiService>("apiservice")
    .WithHttpHealthCheck("/health");

builder.Build().Run();
```

- **API Service** — started automatically with a health check at `/health`
- **Developer dashboard** — available at `https://localhost:15888` when Aspire is running; shows service status, logs, traces, and environment variables

### React app integration

The React frontend is not yet wired into Aspire. Aspire's Node.js hosting API (`AddNpmApp`) was deprecated in v10+; the replacement (`AddJavaScriptApp`) is being stabilised. The block is commented out in `AppHost.cs` with a note to re-enable once `CommunityToolkit.Aspire.Hosting.JavaScript` is stable. In the meantime, run the React app separately with `npm run dev`.

### Local development workflow

1. Set user secrets on `ChurchRegister.ApiService`:
   ```powershell
   dotnet user-secrets set "Jwt:Key" "<min-32-char-key>"
   dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<sql-connection-string>"
   ```
2. Start the AppHost:
   ```powershell
   dotnet run --project ChurchRegister.AppHost
   ```
3. Open the Aspire dashboard (URL printed to console) to view API health.
4. In a separate terminal, start React:
   ```powershell
   cd ChurchRegister.React && npm run dev
   ```

## Consequences

### Positive

- **Single-command startup** — one `dotnet run` boots all backend services
- **Health monitoring** — dashboard shows real-time health, logs, and traces without extra tooling
- **Service discovery** — when React is wired in, Aspire injects the correct `VITE_API_BASE_URL` automatically

### Negative

- **Extra project** — adds an AppHost project that non-.NET developers may find confusing
- **React integration pending** — the React app must still be started manually until Aspire JavaScript hosting stabilises

## Related documents

- [backend-architecture.md](backend-architecture.md) — full solution layout
- [development/database-migrations.md](../development/database-migrations.md) — EF Core migration workflow
