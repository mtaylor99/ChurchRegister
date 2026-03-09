# ADR-001: Use case layer architecture

**Status**: Accepted  
**Date**: 2026-03-01  
**Deciders**: Development Team

---

## Context

The ChurchRegister API was originally structured with endpoints calling services directly. As the application grew, business logic began to accumulate in endpoints, making them harder to test, reason about, and maintain. A consistent architectural pattern was needed to enforce separation of concerns across all features.

## Decision

We adopted a **Use Case layer** between the endpoint (presentation) layer and the service (infrastructure) layer, following **Clean Architecture** principles. Each distinct operation is represented as a dedicated use case class with its own interface, housed in a feature subfolder.

### Folder structure convention

```
UseCase/
└── {Feature}/
    └── {Operation}/
        ├── I{Operation}UseCase.cs    # Interface
        └── {Operation}UseCase.cs    # Implementation
```

**Example:**

```
UseCase/
└── RiskAssessments/
    ├── CreateRiskAssessment/
    │   ├── ICreateRiskAssessmentUseCase.cs
    │   └── CreateRiskAssessmentUseCase.cs
    └── ApproveRiskAssessment/
        ├── IApproveRiskAssessmentUseCase.cs
        └── ApproveRiskAssessmentUseCase.cs
```

### Namespace convention

```
ChurchRegister.ApiService.UseCase.{Feature}.{Operation}
```

### Implementation standards

Every use case implementation must:

1. **Inject `ILogger<T>`** for structured logging
2. **Log entry** with structured properties (input parameters) at `LogInformation` level
3. **Log success** on completion at `LogInformation` level
4. **Wrap execution in try-catch** and log exceptions at `LogError` level
5. **Throw `ArgumentException`** for invalid input (validated before calling services)
6. **Return domain models/DTOs** — no HTTP response concerns
7. **Accept `CancellationToken`** for async cancellation support

**Implementation template** (`UseCase/TEMPLATE.md` in the source tree):

```csharp
namespace ChurchRegister.ApiService.UseCase.{Feature}.{Operation};

public class {Operation}UseCase : I{Operation}UseCase
{
    private readonly I{Feature}Service _{featureService};
    private readonly ILogger<{Operation}UseCase> _logger;

    public {Operation}UseCase(
        I{Feature}Service featureService,
        ILogger<{Operation}UseCase> logger)
    {
        _{featureService} = featureService;
        _logger = logger;
    }

    public async Task<TResult> ExecuteAsync(
        TRequest request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Executing {Operation} with ...", ...);

        if (/* invalid */)
            throw new ArgumentException("...");

        try
        {
            var result = await _{featureService}.{Action}Async(request);
            _logger.LogInformation("Successfully completed {Operation}", ...);
            return result;
        }
        catch (NotFoundException)
        {
            _logger.LogWarning("...");
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to execute {Operation}", ...);
            throw;
        }
    }
}
```

### Dependency injection registration

All use cases are registered in `Program.cs` using fully-qualified type names to avoid ambiguity across features:

```csharp
builder.Services.AddScoped<
    ChurchRegister.ApiService.UseCase.{Feature}.{Operation}.I{Operation}UseCase,
    ChurchRegister.ApiService.UseCase.{Feature}.{Operation}.{Operation}UseCase>();
```

## Consequences

### Positive

- **Testability** — use cases are unit-testable by mocking `ILogger<T>` and service dependencies
- **Single responsibility** — each use case handles exactly one operation
- **Discoverability** — feature folder hierarchy makes business logic easy to locate
- **Consistent logging** — structured logging pattern is enforced across all operations
- **Separation of concerns** — endpoints handle HTTP only; use cases handle orchestration
- **Interface segregation** — endpoints depend on narrow use case interfaces, not broad services

### Negative

- **Boilerplate** — each new operation requires two files (interface + implementation)
- **Indirection** — adds one layer between endpoint and service

## Covered features

| Feature | Use case count |
|---------|---------------|
| RiskAssessments | 12 (including categories) |
| Reminders | 12 (including categories) |
| DataProtection | 2 |
| Districts | 2 |
| ChurchMembers | all CRUD + export operations |
| Contributions | all batch and envelope operations |
| Attendance | all view/record operations |
| TrainingCertificates | full CRUD |
| MonthlyReportPack | report generation |
| Security | auth and user management |

## Related documents

- [backend-architecture.md](backend-architecture.md) — full backend layer diagram
- [plan/feature-api-refactor.md](../../plan/feature-api-refactor.md) — original refactor implementation plan
