# ADR-002: FastEndpoints instead of minimal API controllers

**Status**: Accepted  
**Date**: 2026-02-01  
**Deciders**: Development Team

---

## Context

The ChurchRegister API needed a structured, testable, and scalable approach to defining HTTP endpoints. The options considered were:

1. **ASP.NET Core Minimal APIs** (anonymous lambda-based handlers)
2. **ASP.NET Core Controllers** (class-based MVC controllers)
3. **FastEndpoints** (class-based endpoint-per-feature library built on top of Minimal APIs)

The application has a large number of distinct operations (50+ endpoints across 10+ feature areas). A pattern that enforced consistent structure, kept each endpoint focused on a single operation, and integrated cleanly with the Use Case layer was required.

## Decision

We adopted **FastEndpoints** (`FastEndpoints` NuGet package) for all HTTP endpoint definitions.

### How it is used

Each endpoint inherits from `Endpoint<TRequest, TResponse>` (or `EndpointWithoutRequest<TResponse>`, `Endpoint<TRequest>`, etc.) and overrides `Configure()` and `HandleAsync()`:

```csharp
public class CreateRiskAssessmentEndpoint : Endpoint<CreateRiskAssessmentRequest, RiskAssessmentDto>
{
    private readonly ICreateRiskAssessmentUseCase _useCase;

    public CreateRiskAssessmentEndpoint(ICreateRiskAssessmentUseCase useCase) => _useCase = useCase;

    public override void Configure()
    {
        Post("/api/risk-assessments");
        Policies("Bearer");
        // Optional: Description("...", "..."); for Swagger
    }

    public override async Task HandleAsync(CreateRiskAssessmentRequest req, CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(req, ct);
        await SendAsync(result, StatusCodes.Status201Created, cancellation: ct);
    }
}
```

### Endpoint conventions

| Convention | Rule |
|-----------|------|
| File location | `Endpoints/{Feature}/{OperationName}Endpoint.cs` |
| Class name | `{Operation}{Feature}Endpoint` |
| Base class | `Endpoint<TRequest, TResponse>` (or appropriate variant) |
| Route | Defined in `Configure()` only — never hard-coded elsewhere |
| Auth | Always call `Policies("Bearer")` or `AllowAnonymous()` explicitly |
| Response | Always use `await SendAsync(...)` — never `return` |
| Use case | Injected via constructor; single use case per endpoint |

### FastEndpoints registration

FastEndpoints is registered in `Program.cs`:

```csharp
builder.Services.AddFastEndpoints();
// ...
app.UseFastEndpoints();
```

All endpoint classes are auto-discovered by assembly scanning — no manual registration required.

## Consequences

### Positive

- **Endpoint-per-feature** — each file is a single, focused HTTP operation; easy to locate and modify
- **No controller bloat** — avoids large controller files with unrelated actions mixed together
- **Constructor injection** — DI is explicit and testable
- **Built on Minimal APIs** — full performance benefits of Minimal API routing
- **Auto-discovery** — no `[ApiController]` or route attribute ceremony
- **Integrated validation** — FastEndpoints can run inline validators alongside the use case pattern

### Negative

- **Non-standard** — developers unfamiliar with FastEndpoints need a brief onboarding period
- **Assembly scanning** — relies on convention; mis-named classes may be silently ignored

## Related documents

- [backend-architecture.md](backend-architecture.md) — overall layer diagram
- [ADR-001](adr-001-use-case-layer.md) — use case layer decision
