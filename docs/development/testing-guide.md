# Testing guide

## Overview

The `ChurchRegister.Tests` project contains **integration tests** for the API service. Tests exercise the full HTTP pipeline using an in-memory database, making them fast and isolated without needing a real SQL Server instance.

## Technology stack

| Tool | Role |
|------|------|
| xUnit v3 | Test runner and assertions |
| `WebApplicationFactory<TProgram>` | Boots the real ASP.NET Core pipeline in-memory |
| EF Core InMemory provider | Replaces SQL Server during tests |
| Custom `TestAuthenticationHandler` | Issues test JWT tokens without real keys |

## Project layout

```
ChurchRegister.Tests/
├── TestWebApplicationFactory.cs   # Shared factory — boots the API with in-memory DB
├── BasicTests.cs                  # Smoke tests (health check, authentication)
├── Builders/                      # Fluent test data builders
├── Fixtures/                      # Shared xUnit fixtures (e.g. shared factory instance)
├── Helpers/                       # Test helper utilities
├── Attendance/                    # Attendance endpoint tests
├── ChurchMembers/                 # Church member endpoint tests
├── Contributions/                 # Contribution endpoint tests
├── Dashboard/                     # Dashboard endpoint tests
├── DataProtection/                # Data protection endpoint tests
├── Districts/                     # District endpoint tests
├── MonthlyReportPack/             # Monthly report pack tests
├── Reminders/                     # Reminder endpoint tests
├── RiskAssessments/               # Risk assessment endpoint tests
├── Security/                      # Auth/security endpoint tests
└── TrainingCertificates/          # Training certificate endpoint tests
```

## `TestWebApplicationFactory`

`TestWebApplicationFactory<TProgram>` inherits from `WebApplicationFactory<TProgram>` and:

1. Sets the environment to `"Testing"` — this causes `Program.cs` to skip real DB registration
2. Registers EF Core with a uniquely-named `InMemoryDatabase` per factory instance
3. Replaces JWT authentication with a `TestAuthenticationHandler` that trusts test-issued tokens
4. Suppresses logging below `Warning` to reduce test noise

### Creating clients

```csharp
// Unauthenticated
var client = factory.CreateClient();

// Authenticated as a specific user with roles
var client = factory.CreateAuthenticatedClient(
    userId: "user-id",
    email: "test@example.com",
    roles: ["SystemAdministration"]);

// Convenience: admin client
var client = factory.CreateAdminClient();
```

### Seeding data

Each test seeds its own data via EF Core directly:

```csharp
await using var scope = factory.Services.CreateAsyncScope();
var context = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();
context.ChurchMembers.Add(new ChurchMember { ... });
await context.SaveChangesAsync();
```

Use `Builders/` fluent builders for complex entities:

```csharp
var member = new ChurchMemberBuilder()
    .WithName("Jane", "Smith")
    .WithStatus(MemberStatus.Active)
    .Build();
```

## Writing a new test class

1. Create a class file in the appropriate feature folder (e.g. `Contributions/CreateContributionTests.cs`)
2. Implement `IClassFixture<TestWebApplicationFactory<Program>>` to share a single factory per test class
3. Create an authenticated client in the constructor
4. Seed data before assertions

```csharp
public class CreateContributionTests : IClassFixture<TestWebApplicationFactory<Program>>
{
    private readonly TestWebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public CreateContributionTests(TestWebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateAuthenticatedClient(
            "user-1", "admin@test.com", "FinancialAdministrator");
    }

    [Fact]
    public async Task CreateContribution_ValidRequest_Returns201()
    {
        // Arrange — seed if needed
        var request = new { Amount = 100.00m, MemberId = Guid.NewGuid() };

        // Act
        var response = await _client.PostAsJsonAsync("/api/contributions", request);

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
```

## Running tests

### From VS Code tasks

Use the **Run All Tests** VS Code task (defined in `.vscode/tasks.json`).

### From the command line

```powershell
# Run all tests (minimal output)
dotnet test ChurchRegister.Tests/ChurchRegister.Tests.csproj --verbosity minimal

# Run a single test class
dotnet test ChurchRegister.Tests/ChurchRegister.Tests.csproj \
  --filter "FullyQualifiedName~CreateContributionTests"

# Run with detailed output
dotnet test ChurchRegister.Tests/ChurchRegister.Tests.csproj --verbosity detailed
```

## Test conventions

- One test class per feature area / endpoint group
- Test method names follow the pattern: `{Method}_{Scenario}_{ExpectedResult}`
- Each test is fully independent — no shared mutable state between tests
- Always assert the HTTP status code first, then the response body
- Prefer `Assert.Equal` over `Assert.True` for clearer failure messages
