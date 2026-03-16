# Backend architecture

This document describes the server-side architecture of the ChurchRegister application: project layout, Clean Architecture layers, FastEndpoints conventions, dependency injection, and the role of each project.

## Solution layout

| Project | Purpose |
|---------|---------|
| `ChurchRegister.ApiService` | ASP.NET Core API — endpoints, use cases, middleware, services |
| `ChurchRegister.Database` | EF Core data layer — `DbContext`, entities, migrations, interceptors |
| `ChurchRegister.AppHost` | .NET Aspire orchestration host for local development |
| `ChurchRegister.Tests` | xUnit integration test project |
| `ChurchRegister.React` | Vite/React frontend (served from Nginx in Docker) |

## Clean architecture layers

```
┌─────────────────────────────────────────┐
│            Endpoints (FastEndpoints)    │  ← HTTP concerns only
│  Parse request → call use case → send  │
├─────────────────────────────────────────┤
│               Use Cases                 │  ← Business orchestration
│  Validate → call service → log → return│
├─────────────────────────────────────────┤
│               Services                  │  ← Domain/infrastructure
│  Data access, email, Excel, crypto …   │
├─────────────────────────────────────────┤
│           Database / EF Core            │  ← Persistence
│  ChurchRegisterWebContext, entities     │
└─────────────────────────────────────────┘
```

### Endpoints (`ChurchRegister.ApiService/Endpoints/`)

Endpoints are implemented with **FastEndpoints**. Each endpoint class inherits from `Endpoint<TRequest, TResponse>` (or its variants) and is responsible solely for HTTP concerns:

- Parsing the request
- Calling the Use Case via its interface
- Returning the response with `await SendAsync(response)`

```csharp
public class GetChurchMemberEndpoint : Endpoint<GetChurchMemberRequest, ChurchMemberDto>
{
    private readonly IGetChurchMemberUseCase _useCase;

    public GetChurchMemberEndpoint(IGetChurchMemberUseCase useCase) => _useCase = useCase;

    public override void Configure()
    {
        Get("/api/members/{id}");
        Policies("Bearer");
    }

    public override async Task HandleAsync(GetChurchMemberRequest req, CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(req.Id, ct);
        await SendAsync(result, cancellation: ct);
    }
}
```

Endpoints are organised by feature folder:

```
Endpoints/
├── ChurchMembers/
├── Contributions/
├── Attendance/
├── Districts/
├── Reminders/
├── RiskAssessments/
├── Security/
└── TrainingCertificates/
```

### Use cases (`ChurchRegister.ApiService/UseCase/`)

Each distinct operation has its own use case class + interface. See [adr-001-use-case-layer.md](adr-001-use-case-layer.md) for the full decision record and implementation standards.

```
UseCase/
├── ChurchMembers/
├── Contributions/
├── Attendance/
├── DataProtection/
├── Districts/
├── MonthlyReportPack/
├── Reminders/
├── RiskAssessments/
├── Security/
└── TrainingCertificates/
```

Every use case must:
1. Inject `ILogger<T>` and log entry + success at `LogInformation`
2. Wrap execution in `try/catch` and log exceptions at `LogError`
3. Validate inputs with `ValidationHelpers` or throw `ArgumentException`
4. Return a domain DTO — no `HttpContext` references
5. Accept `CancellationToken`

### Services (`ChurchRegister.ApiService/Services/`)

Services contain domain and infrastructure logic:
- Database queries (via `ChurchRegisterWebContext`)
- Azure Communication Services (email)
- Excel generation (EPPlus)
- HSBC CSV parsing
- PDF generation

### Database (`ChurchRegister.Database/`)

```
ChurchRegister.Database/
├── Data/              # ChurchRegisterWebContext + ChurchRegisterWebUser
├── Entities/          # EF Core entity classes
├── Enums/             # Shared enumerations
├── Interceptors/      # AuditInterceptor (tracks Created/Modified by)
├── Interfaces/        # Service interfaces consumed by use cases
├── Migrations/        # EF Core migrations
└── Constants/         # Database-level constants
```

## Dependency injection

All services and use cases are registered in `Program.cs` using `AddScoped`. Use cases use their fully-qualified interface type to avoid naming collisions across features:

```csharp
builder.Services.AddScoped<
    ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMember.IGetChurchMemberUseCase,
    ChurchRegister.ApiService.UseCase.ChurchMembers.GetChurchMember.GetChurchMemberUseCase>();
```

## Middleware pipeline

Registered in `Program.cs` in this order:

1. HTTPS redirection (production)
2. CORS (`ReactDevelopment` / `ReactProduction` policy)
3. Security headers (`X-Frame-Options`, `X-Content-Type-Options`, CSP, etc.)
4. Authentication (JWT Bearer)
5. Authorisation
6. Token revocation check
7. Global exception handler (`GlobalExceptionHandlerMiddleware`)
8. FastEndpoints middleware
9. Antiforgery validation

## Authentication

- **JWT Bearer** — access tokens (12 hours), refresh tokens (7 days, stored in DB with audit trail)
- **ASP.NET Core Identity** — user/role management via `ChurchRegisterWebUser`
- **Authorization policies** — per-feature policies (e.g. `AttendanceViewPolicy`) that allow the specific permission claim **or** `SystemAdministration` role

## Key configuration (`appsettings.json`)

| Key | Description |
|-----|-------------|
| `Jwt:Key` | JWT signing key — store in User Secrets (dev) / Azure Key Vault (prod) |
| `ConnectionStrings:DefaultConnection` | SQL Server connection string |
| `AzureEmailService:ConnectionString` | Azure Communication Services |
| `MembershipNumbers:NonMemberStartNumber` | Starting number for non-member annual sequence |
| `CORS:AllowedOrigins` | Production-only; comma-separated allowed origins |
| `KeyVault:Endpoint` | Azure Key Vault URL (production) |

See [operations/environment-variables.md](../operations/environment-variables.md) for the complete reference.

## .NET Aspire (`ChurchRegister.AppHost`)

See [adr-003-aspire-app-host.md](adr-003-aspire-app-host.md). The AppHost currently orchestrates the API service with a health check at `/health`. The React app integration is commented out pending the stable Aspire JavaScript hosting API.

## Audit trail

`AuditInterceptor` (registered as a scoped EF Core interceptor) automatically sets `CreatedAt`, `CreatedBy`, `ModifiedAt`, and `ModifiedBy` on all `INSERT` and `UPDATE` operations. The user ID is read from `IHttpContextAccessor` → `ClaimsPrincipal`. This cannot be bypassed.
