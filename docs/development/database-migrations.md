# Database migrations

## Overview

The ChurchRegister application uses **Entity Framework Core** with SQL Server for data persistence. Migrations are managed from the `ChurchRegister.Database` project, which contains the `DbContext`, entities, and all migration files.

## Project structure

```
ChurchRegister.Database/
├── Data/
│   └── ChurchRegisterWebContext.cs   # DbContext
├── Entities/                         # EF Core entity classes
├── Migrations/                       # Auto-generated migration files
└── Interceptors/
    └── AuditInterceptor.cs           # Sets Created/Modified timestamps automatically
```

## Current migrations

| Migration | Date | Description |
|-----------|------|-------------|
| `20260220165908_InitialCreate` | 2026-02-20 | Full initial schema |
| `20260304113334_AddEnvelopeContributionBatch` | 2026-03-04 | Envelope contribution batch tables |

## Adding a new migration

Run from the repository root:

```powershell
dotnet ef migrations add <MigrationName> \
  --project ChurchRegister.Database \
  --startup-project ChurchRegister.ApiService
```

**Migration naming convention:** `PascalCase` describing what the migration does:
- `AddPastoralCareTable`
- `RenameEnvelopeNumberColumn`
- `AddIndexToChurchMemberEmail`

The tool generates two files in `ChurchRegister.Database/Migrations/`:
- `<Timestamp>_<Name>.cs` — the migration code (`Up` and `Down` methods)
- `<Timestamp>_<Name>.Designer.cs` — the snapshot metadata

Always review the generated `Up()` method before applying to confirm it reflects the intended schema change.

## Applying migrations

### Development (local SQL Server or LocalDB)

```powershell
dotnet ef database update \
  --project ChurchRegister.Database \
  --startup-project ChurchRegister.ApiService
```

### Docker (automatic)

When running via Docker (`deploy-local.ps1`), the application applies pending migrations automatically on startup.

### Production

Apply migrations using a separate migration account before deploying the new API version:

```powershell
dotnet ef database update \
  --project ChurchRegister.Database \
  --startup-project ChurchRegister.ApiService \
  --connection "Server=tcp:...;User ID=MigrationUser;Password=..."
```

## VS Code tasks

The following VS Code tasks are available from the Command Palette (`Tasks: Run Task`):

| Task | Action |
|------|--------|
| Add Initial Migration | `dotnet ef migrations add InitialCreate ...` |
| Update Database | `dotnet ef database update ...` |
| Drop Database | `dotnet ef database drop ...` |
| Remove All Migrations | Removes all migration files |

## Removing a migration (before it is applied)

If you created a migration but have not yet applied it:

```powershell
dotnet ef migrations remove \
  --project ChurchRegister.Database \
  --startup-project ChurchRegister.ApiService
```

This removes the last migration file. **Do not** remove a migration that has already been applied to any database — use a new reverting migration instead.

## `AuditInterceptor`

`AuditInterceptor` is an EF Core `SaveChangesInterceptor` that automatically sets:

- `CreatedAt` / `CreatedBy` on `INSERT`
- `ModifiedAt` / `ModifiedBy` on `UPDATE`

The user ID is read from `IHttpContextAccessor`. It is registered as a scoped service and added to EF Core options in `Program.cs`. It is always active and cannot be bypassed via application code.

## Testing

Integration tests use EF Core's `InMemoryDatabase` provider. The `AuditInterceptor` is not active in the `Testing` environment (the real interceptor requires a real `IHttpContextAccessor`). See [testing-guide.md](testing-guide.md) for details.
