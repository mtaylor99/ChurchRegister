# UseCase Folder Structure Template

This document describes the standard folder structure for creating new use cases in the ChurchRegister API.

## Folder Naming Convention

Each use case should have its own folder following this pattern:

```
UseCase/
└── {Domain}/
    └── {Operation}/
        ├── I{Operation}UseCase.cs
        └── {Operation}UseCase.cs
```

### Examples

**ChurchMembers Domain:**

```
UseCase/ChurchMembers/
├── CreateChurchMember/
│   ├── ICreateChurchMemberUseCase.cs
│   └── CreateChurchMemberUseCase.cs
├── UpdateChurchMember/
│   ├── IUpdateChurchMemberUseCase.cs
│   └── UpdateChurchMemberUseCase.cs
└── GetChurchMembers/
    ├── IGetChurchMembersUseCase.cs
    └── GetChurchMembersUseCase.cs
```

**Attendance Domain:**

```
UseCase/Attendance/
├── CreateAttendance/
│   ├── ICreateAttendanceUseCase.cs
│   └── CreateAttendanceUseCase.cs
└── GetAttendanceAnalytics/
    ├── IGetAttendanceAnalyticsUseCase.cs
    └── GetAttendanceAnalyticsUseCase.cs
```

## File Templates

### Interface Template (I{Operation}UseCase.cs)

```csharp
using ChurchRegister.ApiService.Models.{Domain};

namespace ChurchRegister.ApiService.UseCase.{Domain}.{Operation};

/// <summary>
/// Use case interface for {operation description}
/// </summary>
public interface I{Operation}UseCase : IUseCase<{Request}, {Response}>
{
}

// Or for parameterless operations:
public interface I{Operation}UseCase : IUseCase<{Response}>
{
}
```

### Implementation Template ({Operation}UseCase.cs)

```csharp
using ChurchRegister.ApiService.Exceptions;
using ChurchRegister.ApiService.Models.{Domain};
using ChurchRegister.ApiService.Services;

namespace ChurchRegister.ApiService.UseCase.{Domain}.{Operation};

/// <summary>
/// Use case implementation for {operation description}
/// </summary>
public class {Operation}UseCase : I{Operation}UseCase
{
    private readonly I{Service} _service;
    private readonly ILogger<{Operation}UseCase> _logger;

    public {Operation}UseCase(
        I{Service} service,
        ILogger<{Operation}UseCase> logger)
    {
        _service = service;
        _logger = logger;
    }

    public async Task<{Response}> ExecuteAsync(
        {Request} request,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // 1. Validate input
            ValidateRequest(request);

            // 2. Execute business logic
            var result = await _service.PerformOperationAsync(request, cancellationToken);

            // 3. Return response
            return new {Response}
            {
                Success = true,
                Data = result
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing {Operation} use case");
            throw;
        }
    }

    private void ValidateRequest({Request} request)
    {
        if (string.IsNullOrWhiteSpace(request.RequiredField))
        {
            throw new BadRequestException("RequiredField is required");
        }
    }
}
```

## Endpoint Integration Pattern

```csharp
public class {Operation}Endpoint : Endpoint<{Request}, {Response}>
{
    private readonly I{Operation}UseCase _useCase;

    public {Operation}Endpoint(I{Operation}UseCase useCase)
    {
        _useCase = useCase;
    }

    public override void Configure()
    {
        Post("/api/{domain}/{route}");
        Policies("RequireAuth");
    }

    public override async Task HandleAsync({Request} req, CancellationToken ct)
    {
        var response = await _useCase.ExecuteAsync(req, ct);
        await SendOkAsync(response, ct);
    }
}
```

## DI Registration Pattern

In Program.cs, register each use case:

```csharp
// {Domain} Use Cases
builder.Services.AddScoped<I{Operation}UseCase, {Operation}UseCase>();
```

## Checklist for Creating New Use Case

- [ ] Create domain folder under `UseCase/` if it doesn't exist
- [ ] Create operation folder under the domain folder
- [ ] Create interface file: `I{Operation}UseCase.cs`
- [ ] Create implementation file: `{Operation}UseCase.cs`
- [ ] Implement ExecuteAsync method with business logic
- [ ] Add input validation
- [ ] Add error handling and logging
- [ ] Register use case in Program.cs DI container
- [ ] Update endpoint to use the new use case
- [ ] Remove business logic from endpoint (keep it thin)
- [ ] Update service to focus on data access only
- [ ] Write unit tests for the use case
- [ ] Verify compilation and functionality

## Notes

- Use PascalCase for all folder and file names
- Keep use cases focused on a single operation
- Move complex business logic from services into use cases
- Services should become simple data access layers
- Endpoints should be thin routing layers (< 20 lines in HandleAsync)
