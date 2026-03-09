---
mode: 'agent'
description: 'Create a ChurchRegister-specific implementation plan for a new feature, refactor, or upgrade that enforces the established architecture, packages, testing patterns, and 80% coverage target.'
tools: ['changes', 'codebase', 'edit/editFiles', 'extensions', 'fetch', 'githubRepo', 'openSimpleBrowser', 'problems', 'runTasks', 'search', 'searchResults', 'terminalLastCommand', 'terminalSelection', 'testFailure', 'usages', 'vscodeAPI']
---
# ChurchRegister — Bespoke Implementation Plan

> **Inherits from**: [`create-implementation-plan.prompt.md`](create-implementation-plan.prompt.md)
> Apply all rules from the base prompt first, then layer the ChurchRegister-specific constraints below.

## Primary Directive

Create a complete implementation plan for `${input:PlanPurpose}` that is fully consistent with the ChurchRegister solution's established architecture, approved package set, coding conventions, and testing standards. The plan must guarantee that the **80 % React unit-test coverage target** and **full .NET integration-test coverage for every new endpoint** are maintained or improved.

---

## Solution Context

### Projects

| Project | Role |
|---------|------|
| `ChurchRegister.ApiService` | ASP.NET Core 10 — FastEndpoints, JWT auth, use cases, services |
| `ChurchRegister.Database` | EF Core 10 — `DbContext`, entities, migrations, interceptors |
| `ChurchRegister.AppHost` | .NET Aspire orchestration host (local dev only) |
| `ChurchRegister.Tests` | xUnit v3 integration tests (in-memory DB, `WebApplicationFactory`) |
| `ChurchRegister.React` | Vite 7 / React 19 SPA (TypeScript 5.9) |

### Approved backend packages (do not add alternatives)

| Package | Version | Purpose |
|---------|---------|---------|
| `FastEndpoints` | 8.x | Endpoint routing and request/response handling |
| `Microsoft.EntityFrameworkCore.SqlServer` | 10.x | SQL Server data access |
| `Microsoft.AspNetCore.Authentication.JwtBearer` | 10.x | JWT authentication |
| `System.IdentityModel.Tokens.Jwt` | 8.x | Token generation and validation |
| `EPPlus` | 8.x | Excel file generation |
| `QuestPDF` | 2026.x | PDF generation |
| `Azure.Communication.Email` | 1.x | Transactional email |
| `Azure.Identity` / `Azure.Extensions.AspNetCore.Configuration.Secrets` | latest | Azure Key Vault config |
| `Microsoft.Extensions.Http.Resilience` | 10.x | HTTP resilience policies |
| OpenTelemetry suite | 1.x | Observability |

### Approved test packages

| Package | Purpose |
|---------|---------|
| `xunit.v3` | Test runner |
| `Microsoft.AspNetCore.Mvc.Testing` | `WebApplicationFactory` |
| `Microsoft.EntityFrameworkCore.InMemory` | In-memory DB |
| `FluentAssertions` | Fluent assertion syntax |
| `Moq` | Mocking |
| `coverlet.collector` | Coverage collection |

### Approved React packages (do not add alternatives)

| Package | Purpose |
|---------|---------|
| `@mui/material` + `@mui/x-data-grid` + `@mui/x-date-pickers` | UI component library |
| `@mui/icons-material` | Icons |
| `react-router-dom` v7 | Client-side routing |
| `@tanstack/react-query` v5 | Server state / data fetching |
| `axios` | HTTP client (`ApiClient` wrapper) |
| `react-hook-form` + `yup` / `zod` | Form handling and validation |
| `recharts` | Charts and analytics |
| `date-fns` | Date utilities |
| `msw` v2 | API mocking in tests and Storybook |

### Approved React test packages

| Package | Purpose |
|---------|---------|
| `vitest` v4 | Test runner |
| `@testing-library/react` | Component rendering |
| `@testing-library/user-event` | Realistic user interaction simulation |
| `@testing-library/jest-dom` | DOM matchers |
| `msw` v2 (Node server) | Request interception in unit tests |
| `@vitest/coverage-v8` | Code coverage |

---

## Architecture Constraints (non-negotiable)

### Backend — Clean Architecture layers

Every new backend feature **must** follow this layer order:

```
HTTP Request
    ↓
Endpoint (FastEndpoints)         — HTTP concerns only, calls use case
    ↓
Use Case (IXxxUseCase / XxxUseCase)  — business orchestration, validation, logging
    ↓
Service (injected, registered Scoped) — domain logic, DB access, external calls
    ↓
ChurchRegisterWebContext (EF Core)   — persistence
```

**Rules:**
- **REQ-BE-001**: Every endpoint inherits `Endpoint<TRequest, TResponse>` (or `EndpointWithoutRequest<TResponse>` / `EndpointWithoutResponse` variants). No logic beyond calling the use case and sending the response.
- **REQ-BE-002**: Every distinct operation gets its own use case interface (`IXxxUseCase`) and implementation (`XxxUseCase`) in a dedicated subfolder under `UseCase/<Feature>/`.
- **REQ-BE-003**: Use cases must inject `ILogger<T>`, log entry at `LogInformation`, and catch/log all exceptions at `LogError`.
- **REQ-BE-004**: Use cases return domain DTOs. No `HttpContext`, `HttpRequest`, or HTTP-specific types.
- **REQ-BE-005**: Services are registered `AddScoped` in `Program.cs` using the fully-qualified interface type.
- **REQ-BE-006**: All new entities belong in `ChurchRegister.Database/Entities/`. Enumerations in `Enums/`. New migrations added via `dotnet ef migrations add <Name> --project ChurchRegister.Database --startup-project ChurchRegister.ApiService`.
- **REQ-BE-007**: The `AuditInterceptor` is applied automatically — do not bypass it. Every entity that needs audit tracking must implement the auditable interface/base class already established in the database project.
- **REQ-BE-008**: No new authentication or authorisation packages. Use the existing `Policies("Bearer")` and role claims already wired in `Program.cs`.
- **SEC-BE-001**: All endpoints that modify data must require authentication. Use `Roles("SystemAdministration")` or the appropriate role constant — never `AllowAnonymous` on mutation endpoints.
- **SEC-BE-002**: All input validated before the use case executes. Use `ValidationHelpers` or `ArgumentException` — never pass unvalidated data to EF queries.

### Frontend — Architecture conventions

- **REQ-FE-001**: All HTTP calls go through `apiClient` (`src/services/api/ApiClient.ts`). Never call `axios` directly in a component or page.
- **REQ-FE-002**: Feature API functions live in `src/services/api/<Feature>Api.ts` and are registered in the barrel `src/services/api/index.ts`.
- **REQ-FE-003**: Server state is managed via `@tanstack/react-query`. Use existing query key factories in `src/hooks/use<Feature>.ts`. Do not use `useState` for data that comes from the API.
- **REQ-FE-004**: Pages (`src/pages/`) orchestrate layout and state only. Heavy logic belongs in custom hooks (`src/hooks/`).
- **REQ-FE-005**: All new pages must be registered in the router (`src/App.tsx` or the relevant route file).
- **REQ-FE-006**: Auth permission checks use `useAuth()` (roles) or `useAuthPermissions()` for derived capability flags. Never check roles inline in JSX — derive a boolean from the hook.
- **REQ-FE-007**: Forms use `react-hook-form` with `yup` or `zod` schema validation. No uncontrolled inputs for user-entered data.
- **REQ-FE-008**: Drawers follow the pattern: `open: boolean`, `mode: 'add' | 'edit' | 'view'`, `onClose: () => void`, `onSuccess: () => void`. The parent page holds the open/mode state.
- **REQ-FE-009**: Excel exports use the `exportXxxToExcel` utilities in `src/utils/excelExport.ts`. PDF generation uses the `exportXxxPdf` utilities in `src/utils/export<Feature>Pdf.ts` (QuestPDF on backend) or jsPDF on frontend only when offline generation is required.

---

## Testing Requirements (mandatory for every plan)

### .NET integration tests

- **TEST-BE-001**: Every new endpoint gets at least one integration test class in `ChurchRegister.Tests/<Feature>/`.
- **TEST-BE-002**: Each test class implements `IClassFixture<TestWebApplicationFactory<Program>>`.
- **TEST-BE-003**: Test method naming: `{Method}_{Scenario}_{ExpectedResult}` (e.g. `Post_ValidRequest_Returns201Created`).
- **TEST-BE-004**: Each test seeds its own data — never depend on data seeded by another test.
- **TEST-BE-005**: Use `factory.CreateAuthenticatedClient(userId, email, role)` for role-specific tests. Test at least one forbidden-access scenario per endpoint that is role-restricted.
- **TEST-BE-006**: Use fluent builders in `Builders/` for complex entity creation. Add a new builder if none exists for the new entity.
- **TEST-BE-007**: Assert HTTP status code before asserting response body.

### React unit tests

- **TEST-FE-001**: Target: **≥ 80 % statement coverage** across `src/`. No individual file introduced as part of the feature may fall below 60 % coverage.
- **TEST-FE-002**: Every new service/API file (`src/services/api/<Feature>Api.ts`) gets a unit test file alongside it.
- **TEST-FE-003**: Every new custom hook (`src/hooks/use<Feature>.ts`) gets a unit test file.
- **TEST-FE-004**: Every new page gets a smoke/integration test that: renders without crashing, asserts the page heading, and verifies at least one user interaction (e.g. button opens a drawer).
- **TEST-FE-005**: Heavy sub-components (DataGrid, date-picker, canvas) are **stubbed** in page tests to avoid `ResizeObserver` / JSDOM failures. Use the pattern: `vi.mock('../components/<Feature>/HeavyGrid', () => ({ HeavyGrid: () => <div data-testid="heavy-grid" /> }))`.
- **TEST-FE-006**: Use `vi.hoisted()` for any mock variable referenced inside a `vi.mock()` factory — see [testing-guide.md](../../docs/development/testing-guide.md) for the full pattern.
- **TEST-FE-007**: Mutable mock returns (for data-driven tests) are declared with `vi.hoisted(() => vi.fn().mockResolvedValue(defaultData))` and overridden in individual test cases.
- **TEST-FE-008**: Auth service methods that route through `httpInterceptor.fetch()` (i.e. everything except `login()`) must mock `httpInterceptor` — **not** `global.fetch`.
- **TEST-FE-009**: Timer-dependent behaviour (session expiry, inactivity) must use `vi.useFakeTimers()` / `vi.advanceTimersByTime()` and call `vi.useRealTimers()` in `afterEach`.
- **TEST-FE-010**: Singleton classes (`AuthService`, `TokenService`, `SessionManager`, `HttpInterceptor`) must call their `resetInstance()` in `beforeEach`.
- **TEST-FE-011**: All page tests use `render(<Page />, { withRouter: true })` when the page calls `useNavigate` or `useLocation`.
- **TEST-FE-012**: MSW handlers for new endpoints must be added to `src/mocks/handlers.ts` so that tests relying on the default server setup do not break.

---

## Checklist for plan authors

When producing a new plan using this prompt, verify each item before finalising:

- [ ] No new package introduced unless it has no suitable equivalent in the approved package sets above
- [ ] Every new endpoint is matched to a use case and a feature folder structure consistent with the existing pattern
- [ ] A migration task is included whenever entities or relationships change
- [ ] Every new page has a corresponding test task targeting ≥ 80 % coverage
- [ ] Every new API service function has a corresponding MSW handler task
- [ ] Auth/role constraints are explicitly declared for every new endpoint
- [ ] Plan file saved to `/plan/` with the naming convention from the base prompt

---

## Example — minimal plan skeleton for a new feature

```md
---
goal: Add Pastoral Visit tracking feature
version: 1.0
date_created: 2026-03-08
status: 'Planned'
tags: [feature]
---

# Introduction
![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Allows pastoral team members to record and view pastoral visit history for church members.

## 1. Requirements & Constraints

- **REQ-001**: Endpoint must be role-restricted to `PastoralCare` and `SystemAdministration`
- **SEC-001**: Visit notes are personal data — only the recording user and admins may read them
- **CON-001**: No new NuGet packages; use existing EF Core and FastEndpoints
- **CON-002**: Frontend must use existing `ChurchMemberDrawer` pattern for the entry form
- **PAT-001**: Follow use case layer — endpoint → use case → service → DbContext
- **PAT-002**: React hook `usePastoralVisits` follows `@tanstack/react-query` pattern

## 2. Implementation Steps

### Phase 1 — Database

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Add `PastoralVisit` entity to `ChurchRegister.Database/Entities/` | | |
| TASK-002 | Register entity on `ChurchRegisterWebContext` with FK to `ChurchMember` | | |
| TASK-003 | Add EF Core migration `AddPastoralVisit` | | |

### Phase 2 — Backend

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-004 | Create `ICreatePastoralVisitUseCase` + `CreatePastoralVisitUseCase` in `UseCase/PastoralVisits/` | | |
| TASK-005 | Create `CreatePastoralVisitEndpoint` in `Endpoints/PastoralVisits/` | | |
| TASK-006 | Create `IGetPastoralVisitsUseCase` + `GetPastoralVisitsUseCase` | | |
| TASK-007 | Create `GetPastoralVisitsEndpoint` | | |
| TASK-008 | Register new use cases and services in `Program.cs` | | |

### Phase 3 — Backend tests

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Add `PastoralVisitBuilder` to `ChurchRegister.Tests/Builders/` | | |
| TASK-010 | Add `CreatePastoralVisitTests` — valid, invalid, forbidden | | |
| TASK-011 | Add `GetPastoralVisitsTests` — returns correct visits, empty list, forbidden | | |

### Phase 4 — Frontend API service and hook

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-012 | Create `src/services/api/pastoralVisitsApi.ts` with `createVisit` / `getVisits` | | |
| TASK-013 | Register in `src/services/api/index.ts` | | |
| TASK-014 | Add MSW handlers to `src/mocks/handlers.ts` | | |
| TASK-015 | Create `src/hooks/usePastoralVisits.ts` React Query hook | | |
| TASK-016 | Unit tests for `pastoralVisitsApi.ts` and `usePastoralVisits.ts` | | |

### Phase 5 — Frontend UI

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-017 | Create `PastoralVisitDrawer` component (`add` / `view` modes) | | |
| TASK-018 | Add pastoral visit tab/section to `ChurchMembersPage` | | |
| TASK-019 | Page test: renders heading, opens drawer on button click | | |
| TASK-020 | Verify `npm run test:coverage` reports ≥ 80 % overall | | |
```
