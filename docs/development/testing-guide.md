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

---

## React Unit & Integration Tests — Vitest

React component and service tests live inside `ChurchRegister.React/src/` alongside the source files. They run entirely in-process (no browser, no API server) using [Vitest](https://vitest.dev) and [React Testing Library](https://testing-library.com).

### Technology stack

| Tool | Role |
|------|------|
| Vitest 4 | Test runner (jest-compatible, Vite-native) |
| `@testing-library/react` | Render components, query the DOM |
| `@testing-library/user-event` | Simulate realistic user interactions |
| `@testing-library/jest-dom` | Extra DOM matchers (`toBeVisible`, etc.) |
| MSW (Mock Service Worker) | Intercepts `fetch`/`axios` network calls in Node |
| `vi.mock` / `vi.hoisted` | Module-level mocks and factory hoisting |
| v8 (Vitest coverage) | Statement/branch/function/line coverage reporting |

### Running tests

All commands run from `ChurchRegister.React/`:

```powershell
cd ChurchRegister.React

# Run all tests (watch mode — re-runs on file change)
npm run test

# Single run with coverage report
npm run test:coverage

# Run a single file
npx vitest run src/pages/DashboardPage.test.tsx

# Run tests matching a pattern
npx vitest run --reporter=verbose -t "renders the Dashboard"
```

### Directory structure

Tests are co-located with their source files:

```
ChurchRegister.React/src/
├── __tests__/
│   └── auth/
│       └── authService.test.ts          # AuthService singleton (login, register, logout …)
├── services/
│   ├── api/
│   │   └── ApiClient.test.ts            # Axios client — interceptors, HTTP methods
│   └── auth/
│       ├── httpInterceptor.test.ts      # Token-refresh deduplication, 401 retry
│       ├── sessionManager.test.ts       # Inactivity / auto-refresh timer events
│       └── tokenService.test.ts         # Token storage, decode, expiry helpers
├── pages/
│   ├── DashboardPage.test.tsx
│   ├── RemindersPage.test.tsx
│   ├── RiskAssessmentsPage.test.tsx
│   ├── Administration/
│   │   ├── AdministrationPage.test.tsx
│   │   ├── ChurchMembersPage.test.tsx
│   │   ├── TrainingCertificatesPage.test.tsx
│   │   └── UserManagement.test.tsx
│   ├── Attendance/
│   │   ├── AttendancePage.test.tsx
│   │   ├── AttendanceAnalyticsPage.test.tsx
│   │   └── AttendanceTabsPage.test.tsx
│   └── Financial/
│       ├── ContributionsPage.test.tsx
│       └── UnmatchedTransactionsPage.test.tsx
├── components/                          # Per-component test files (*.test.tsx)
├── hooks/                               # Per-hook test files (*.test.ts)
├── mocks/
│   ├── handlers.ts                      # MSW request handlers (auth, members, contributions …)
│   └── server.ts                        # MSW Node server (used in setupTests.ts)
└── setupTests.ts                        # Global setup: MSW lifecycle, jest-dom matchers
```

### Custom render wrapper

`src/test-utils/render.tsx` exports `render` (aliased from `renderWithProviders`). It wraps the component under test with `NotificationProvider`, `QueryClientProvider`, and optionally `BrowserRouter`:

```tsx
import { render } from '../test-utils';

// Without router (default)
render(<MyComponent />);

// With router (needed for pages that call useNavigate / useLocation)
render(<MyPage />, { withRouter: true });
```

Always use this wrapper instead of the plain RTL `render` so that MUI notifications and React Query work correctly.

### MSW — mocking API calls in tests

`setupTests.ts` starts the MSW **Node** server before all tests and resets handlers after each test. The default handlers in `src/mocks/handlers.ts` cover:

- `auth` — login, logout, refresh
- `church-members` — CRUD
- `contributions` — member and history endpoints
- `users` — administration
- `attendance` — records and events

For tests that need custom responses, add a one-off handler inside the test:

```ts
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';

server.use(
  http.get('/api/members', () =>
    HttpResponse.json({ items: [{ id: 1, firstName: 'Alice' }], totalCount: 1 })
  )
);
```

For APIs not covered by MSW handlers (e.g. `dashboardApi`), mock the module directly — see the pattern below.

### Mocking modules — `vi.mock` and `vi.hoisted`

**Important:** `vi.mock()` calls are hoisted to the top of the file by Vitest at build time, regardless of where they appear in source. When a mock factory needs a variable defined in the same file, use `vi.hoisted()` so the variable is also hoisted:

```ts
// ✅ Correct — variable is hoisted along with the mock factory
const mockGetAccessToken = vi.hoisted(() => vi.fn().mockReturnValue(null));

vi.mock('../auth/tokenService', () => ({
  tokenService: { getAccessToken: mockGetAccessToken },
}));
```

```ts
// ❌ Wrong — variable is not yet defined when the factory runs
const mockGetAccessToken = vi.fn();   // NOT hoisted

vi.mock('../auth/tokenService', () => ({
  tokenService: { getAccessToken: mockGetAccessToken }, // ReferenceError
}));
```

### Mutable mock returns (controlling data per test)

For tests that need different return values per test case, declare the mock function with `vi.hoisted` and override it in `beforeEach`:

```ts
const mockGetMembers = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ items: [], totalCount: 0 })
);

vi.mock('@services/api', () => ({
  churchMembersApi: { getMembers: mockGetMembers },
}));

test('shows members', async () => {
  mockGetMembers.mockResolvedValue({ items: [{ id: 1, firstName: 'Bob' }], totalCount: 1 });
  render(<ChurchMembersPage />, { withRouter: true });
  await screen.findByText('Bob');
});
```

### Page component tests — mocking heavy sub-components

Pages import data grids (`DataGrid`, `MUI X`) which use `ResizeObserver`. JSDOM does not implement `ResizeObserver`, so any test that fully renders a data grid will throw. The pattern is to **stub out all heavy sub-components** at the module level:

```tsx
// Stub the grid — avoids ResizeObserver errors
vi.mock('../../components/ChurchMembers/ChurchMemberGrid', () => ({
  ChurchMemberGrid: ({ onMemberClick }: { onMemberClick?: (m: unknown) => void }) => (
    <div data-testid="church-member-grid">
      <button onClick={() => onMemberClick?.({ id: 1 })}>Member</button>
    </div>
  ),
}));

// Stub drawers — return null when closed
vi.mock('../../components/ChurchMembers/ChurchMemberDrawer', () => ({
  ChurchMemberDrawer: ({ open, mode }: { open: boolean; mode: string }) =>
    open ? <div data-testid="church-member-drawer" data-mode={mode} /> : null,
}));
```

Page tests then assert on **page-level behaviour**: does the heading render, do tabs switch, do buttons open the correct drawers?

```tsx
test('opens drawer in add mode when Add Member is clicked', () => {
  render(<ChurchMembersPage />, { withRouter: true });
  fireEvent.click(screen.getByRole('button', { name: /add member/i }));
  expect(screen.getByTestId('church-member-drawer').getAttribute('data-mode')).toBe('add');
});
```

### Auth service tests — mocking `httpInterceptor`

Most `AuthService` methods call `this.apiCall()` which routes through `httpInterceptor.fetch()`, **not** the global `fetch`. Tests for these methods must mock the interceptor module:

```ts
const mockHttpFetch = vi.hoisted(() => vi.fn());

vi.mock('../../services/auth/httpInterceptor', () => ({
  httpInterceptor: {
    fetch: mockHttpFetch,
    clearPendingRequests: vi.fn(),
    getPendingRequestsCount: vi.fn().mockReturnValue(0),
  },
}));

// Helper — builds a Response-like object that apiCall consumes
function makeApiCallResponse(data: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 400,
    clone: () => ({ json: () => Promise.resolve(data) }),
    json: () => Promise.resolve(data),
  } as unknown as Response;
}

test('register success calls setTokens', async () => {
  mockHttpFetch.mockResolvedValueOnce(makeApiCallResponse({
    success: true,
    data: { tokens: { accessToken: 'abc', … } },
  }));

  await authService.register({ email: 'a@b.com', password: 'Pass1!' });
  expect(mockedTokenService.setTokens).toHaveBeenCalled();
});
```

> **Note:** The `login()` method is the exception — it calls `global.fetch` directly and should be tested with `global.fetch = vi.fn()`.

### ApiClient tests — mocking axios

`ApiClient` is a singleton that calls `axios.create()` in its constructor and registers interceptors immediately. To test the interceptors themselves, capture the handler functions during construction with `vi.hoisted`:

```ts
const { mockAxiosInstance, getRequestInterceptors, getResponseInterceptors } = vi.hoisted(() => {
  let reqFulfilled: Function | null = null;
  let resFulfilled: Function | null = null;
  let resRejected: Function | null = null;

  const instance = {
    get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn((f) => { reqFulfilled = f; return 0; }) },
      response: { use: vi.fn((f, r) => { resFulfilled = f; resRejected = r; return 0; }) },
    },
  };

  return {
    mockAxiosInstance: instance,
    getRequestInterceptors: () => ({ fulfill: reqFulfilled! }),
    getResponseInterceptors: () => ({ fulfill: resFulfilled!, reject: resRejected! }),
  };
});

vi.mock('axios', () => ({ default: { create: vi.fn(() => mockAxiosInstance) } }));
```

### Timer-based tests

For `SessionManager` inactivity and auto-refresh events, use Vitest's fake timers via `vi.useFakeTimers()` / `vi.advanceTimersByTime()`:

```ts
beforeEach(() => {
  SessionManager.resetInstance();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  SessionManager.resetInstance();
});

test('emits inactivity_detected after timeout', () => {
  const mgr = SessionManager.getInstance({
    trackUserActivity: true, enableAutoRefresh: false, inactivityTimeoutMinutes: 1,
  });
  const cb = vi.fn();
  mgr.addCallback(cb);
  mgr.start();

  vi.advanceTimersByTime(60_000 + 100);

  expect(cb).toHaveBeenCalledWith('inactivity_detected');
});
```

### Singleton reset pattern

`AuthService`, `TokenService`, `SessionManager`, and `HttpInterceptor` all follow the singleton pattern. Each exposes a static `resetInstance()` method that must be called in `beforeEach` to prevent state leaking between tests:

```ts
beforeEach(() => {
  AuthService.resetInstance();
  TokenService.resetInstance();
  SessionManager.resetInstance();
});
```

### Writing a new page test

1. Co-locate the test file next to the source: `src/pages/MyPage.test.tsx`
2. Mock all sub-components that contain `DataGrid` or `ResizeObserver`-dependent code
3. Mock API modules used by the page
4. Mock auth/permission contexts if the page calls `useAuth`, `useAuthPermissions`, `useRBAC`
5. Use `render(<MyPage />, { withRouter: true })` if the page uses `useNavigate` or `useLocation`
6. Assert on page-level DOM: headings, tabs, buttons, drawer open/close state

Minimal template:

```tsx
import { describe, test, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../test-utils';
import { MyPage } from './MyPage';

vi.mock('../components/MyPage/HeavyGrid', () => ({
  HeavyGrid: () => <div data-testid="heavy-grid" />,
}));

vi.mock('@services/api', () => ({
  myApi: { getData: vi.fn().mockResolvedValue({ items: [] }) },
}));

describe('MyPage', () => {
  test('renders the heading', () => {
    render(<MyPage />, { withRouter: true });
    expect(screen.getByRole('heading', { name: 'My Page' })).toBeDefined();
  });
});
```

### Coverage baseline (as of March 2026)

| Area | Coverage before | Target after improvements |
|------|----------------|---------------------------|
| Overall statements | 66.74 % | ~80 % |
| `services/auth/authService.ts` | 11 % | ~65 % |
| `services/auth/httpInterceptor.ts` | 10 % | ~75 % |
| `services/auth/sessionManager.ts` | Low | ~55 % |
| `services/auth/tokenService.ts` | 39 % | ~75 % |
| `services/api/ApiClient.ts` | 9 % | ~70 % |
| `pages/` (all pages) | ~0 % | ~40 % |

Run coverage locally:

```powershell
cd ChurchRegister.React
npm run test:coverage
# Opens coverage/index.html with a per-file breakdown
```

