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

---

## End-to-End (E2E) Tests — Playwright

E2E tests run against the full live stack: a real browser, the React frontend, and the .NET API. They live in `ChurchRegister.React/e2e/` and are powered by [Playwright](https://playwright.dev).

### Technology stack

| Tool | Role |
|------|------|
| `@playwright/test` | Test runner, browser automation |
| `axe-playwright` | WCAG 2.1 AA accessibility checks |
| `storageState` | Persist login session across all tests |
| Page Object Model | `e2e/pages/` — encapsulates locators per page |

### Prerequisites

Before running E2E tests you need two services running:

| Service | URL | How to start |
|---------|-----|--------------|
| .NET API | `http://localhost:5502` | `dotnet run --project ChurchRegister.ApiService/ChurchRegister.ApiService.csproj` |
| React dev server | `http://localhost:3000` | Started **automatically** by Playwright via `webServer` config |

> The API must be running before you execute any Playwright command. The React dev server is handled for you.

### Running tests

All commands run from `ChurchRegister.React/`:

```powershell
cd ChurchRegister.React

# Run all tests headless (terminal output + HTML report)
npm run test:e2e

# Interactive Playwright UI — pick tests, watch a built-in browser panel
npm run test:e2e:ui

# Headed mode — opens a real Chrome window, watch every click live
npx playwright test --headed

# Run a single spec file
npx playwright test e2e/auth/login.spec.ts

# Run only Chromium (faster)
npx playwright test --project=chromium

# Debug a specific test step-by-step
npm run test:e2e:debug
```

### Viewing results

After a headless run, open the HTML report:

```powershell
npx playwright show-report
```

This opens a browser with a full breakdown of every test, including screenshots and traces for failures.

### Directory structure

```
ChurchRegister.React/e2e/
├── .auth/                        # Saved admin session (git-ignored, created at runtime)
├── global-setup.ts               # Runs once — logs in and saves storageState
├── fixtures.ts                   # Shared test users and custom fixtures
├── helpers/
│   └── api-seed.ts               # API helpers for seeding/deleting test data
├── pages/                        # Page Object Models (POM)
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   └── ChurchMembersPage.ts
├── auth/                         # Authentication tests (login, logout, change password)
├── dashboard/                    # Dashboard tests
├── navigation/                   # Sidebar navigation tests
├── church-members/               # Members CRUD, data protection, RBAC
├── attendance/                   # Attendance records and analytics
├── training/                     # Training certificates
├── reminders/                    # Reminders and categories
├── risk-assessments/             # Risk assessments and categories
├── contributions/                # Contributions, HSBC, envelope batch
├── administration/               # Users, districts, register numbers
├── errors/                       # Error pages (404, 500, unauthorized)
└── accessibility/                # axe WCAG 2.1 AA checks for all routes
```

### Authentication strategy

`global-setup.ts` runs once before all suites. It logs in as the admin user and saves the full browser session to `e2e/.auth/admin.json`. All tests reuse that session automatically — they start already logged in.

Tests that need to test the unauthenticated state (e.g. `login.spec.ts`) clear it explicitly:

```typescript
test.use({ storageState: { cookies: [], origins: [] } });
```

### Environment variables

Defaults are hardcoded in `global-setup.ts` and `api-seed.ts` so no configuration is needed for local development with standard settings. To override, copy `.env.test.example` to `.env.test` and set your values — the file is gitignored:

```env
PLAYWRIGHT_BASE_URL=http://localhost:3000
PLAYWRIGHT_API_URL=http://localhost:5502
TEST_ADMIN_EMAIL=admin@churchregister.com
TEST_ADMIN_PASSWORD=AdminPassword123!
```

### CI

E2E tests run automatically on pull requests to `main` via `.github/workflows/e2e.yml`. The workflow:
1. Starts the .NET API with `dotnet run`
2. Runs Playwright (which auto-starts the React dev server)
3. Uploads the HTML report as a GitHub Actions artifact on failure (retained 14 days)

Required repository secrets: `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`.
