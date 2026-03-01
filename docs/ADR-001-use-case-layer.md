# ADR-001: Use Case Layer Architecture for ChurchRegister API

**Status**: Accepted  
**Date**: 2026-03-01  
**Deciders**: Development Team

---

## Context

The ChurchRegister API was originally structured with endpoints calling services directly. As the application grew, business logic began to accumulate in endpoints, making them harder to test, reason about, and maintain. A consistent architectural pattern was needed to enforce separation of concerns across all features.

## Decision

We adopted a **Use Case layer** between the endpoint (presentation) layer and the service (infrastructure) layer, following **Clean Architecture** principles. Each distinct operation is represented as a dedicated use case class with its own interface, housed in a feature subfolder.

### Folder Structure Convention

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

### Namespace Convention

```
ChurchRegister.ApiService.UseCase.{Feature}.{Operation}
```

### Implementation Standards

Every use case implementation must:

1. **Inject `ILogger<T>`** for structured logging
2. **Log entry** with structured properties (input parameters) at `LogInformation` level
3. **Log success** on completion at `LogInformation` level
4. **Wrap execution in try-catch** and log exceptions at `LogError` level
5. **Throw `ArgumentException`** for invalid input (validated before calling services)
6. **Return domain models/DTOs** — no HTTP response concerns
7. **Accept `CancellationToken`** for async cancellation support

**Template:**
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

        // Input validation
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
            throw; // or return null
        }
    }
}
```

### Dependency Injection Registration

All use cases are registered in `Program.cs` using fully-qualified type names:

```csharp
builder.Services.AddScoped<
    ChurchRegister.ApiService.UseCase.{Feature}.{Operation}.I{Operation}UseCase,
    ChurchRegister.ApiService.UseCase.{Feature}.{Operation}.{Operation}UseCase>();
```

## Consequences

### Positive

- **Testability**: Use cases can be unit-tested in isolation by mocking `ILogger<T>` and service dependencies
- **Single Responsibility**: Each use case handles exactly one operation
- **Discoverability**: Feature folder hierarchy makes it easy to find business logic
- **Consistent Logging**: Enforced structured logging pattern across all operations
- **Separation of Concerns**: Endpoints handle HTTP concerns only; use cases handle orchestration
- **Interface Segregation**: Endpoints depend on narrow use case interfaces, not broad service interfaces

### Negative

- **Boilerplate**: Each new operation requires two files (interface + implementation)
- **Indirection**: Adds one layer between endpoint and service — requires understanding the pattern

## Covered Features

| Feature          | Use Cases Refactored |
|-----------------|---------------------|
| RiskAssessments | 12 (incl. categories) |
| Reminders       | 12 (incl. categories) |
| DataProtection  | 2                   |
| Districts       | 2                   |

## Related Documents

- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) — React frontend architecture
- [feature-api-refactor.md](../plan/feature-api-refactor.md) — Implementation plan and task tracking
