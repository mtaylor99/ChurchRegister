---
goal: Pre-Production Code Review and Refactoring for Consistency and Quality
version: 1.0
date_created: 2025-12-24
last_updated: 2025-12-24
owner: Development Team
status: "Planned"
tags:
  [
    "refactor",
    "code-review",
    "production-ready",
    "consistency",
    "testing",
    "quality",
  ]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This implementation plan provides a systematic approach to reviewing and refactoring the Church Register application codebase before production deployment. The application currently works with all major features implemented (Church Members, Attendance, Contributions, HSBC Import, Envelope Contributions, Register Number Generation). This review focuses on ensuring consistency, code quality, maintainability, and comprehensive testing coverage across the entire stack (ASP.NET Core backend, React TypeScript frontend, SQL Server database).

## 1. Requirements & Constraints

- **REQ-001**: Maintain 100% backward compatibility - no breaking changes to existing functionality
- **REQ-002**: All refactoring must preserve current business logic and data integrity
- **REQ-003**: Achieve minimum 80% code coverage for critical business logic
- **REQ-004**: Consistent naming conventions across backend (C# PascalCase) and frontend (TypeScript camelCase)
- **REQ-005**: All API endpoints must follow RESTful conventions and FastEndpoints patterns
- **REQ-006**: Database migrations must remain intact - only add new consolidated migration if needed
- **REQ-007**: All refactoring must be tested in development environment before production
- **SEC-001**: Maintain existing role-based authorization patterns across all endpoints
- **SEC-002**: Preserve audit trail functionality (CreatedBy, CreatedDateTime, ModifiedBy, ModifiedDateTime)
- **SEC-003**: Ensure no sensitive data exposure in API responses or logs
- **CON-001**: Code must compile with zero warnings in Release configuration
- **CON-002**: Frontend must build with zero TypeScript errors and ESLint warnings
- **CON-003**: Database context and entities must align with current database schema
- **GUD-001**: Follow SOLID principles and clean architecture patterns
- **GUD-002**: Use dependency injection for all services
- **GUD-003**: Apply DRY principle - eliminate code duplication
- **GUD-004**: Implement comprehensive error handling with appropriate HTTP status codes
- **PAT-001**: FastEndpoints for all API endpoints
- **PAT-002**: React Query (TanStack Query) for server state management
- **PAT-003**: Material-UI v5+ components for consistent UI
- **PAT-004**: Repository/Service pattern for data access

## 2. Implementation Steps

### Implementation Phase 1: Backend Code Review - Services Layer

- GOAL-001: Review and standardize all service implementations for consistency and best practices

| Task     | Description                                                                                                                                            | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-001 | Review ChurchMemberService: ensure IRegisterNumberService dependency is properly used, verify Include statements for navigation properties             | ✅        | 2025-12-24 |
| TASK-002 | Review ContributionProcessingService: verify GetNextAvailableNumberAsync uses in-memory parsing (not EF translation), check duplicate prevention logic | ✅        | 2025-12-24 |
| TASK-003 | Review RegisterNumberService: ensure GenerateForYearAsync properly filters inactive members, verify PreviewForYearAsync doesn't persist data           | ✅        | 2025-12-24 |
| TASK-004 | Review EnvelopeContributionService: validate register number validation logic, verify batch submission transaction handling                            | ✅        | 2025-12-24 |
| TASK-005 | Review HsbcTransactionImportService: confirm CSV parsing handles edge cases, verify duplicate detection logic                                          | ✅        | 2025-12-24 |
| TASK-006 | Review AzureEmailService: verify Azure Communication Services configuration, check error handling                                                      | ✅        | 2025-12-24 |
| TASK-007 | Standardize error handling patterns: ensure all services throw appropriate exceptions with meaningful messages                                         | ✅        | 2025-12-24 |
| TASK-008 | Standardize logging patterns: ensure consistent log levels (Information, Warning, Error) and structured logging                                        | ✅        | 2025-12-24 |
| TASK-009 | Review dependency injection: verify all service interfaces are registered in Program.cs with correct lifetimes (Scoped/Transient/Singleton)            | ✅        | 2025-12-24 |
| TASK-010 | Extract common validation logic: create ValidationHelpers or ValidationService for reusable validation rules                                           | ✅        | 2025-12-24 |

### Implementation Phase 2: Backend Code Review - API Endpoints

- GOAL-002: Ensure all FastEndpoints follow consistent patterns and conventions

| Task     | Description                                                                                                                                                  | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-011 | Review authentication endpoints (Login, Logout, GetCurrentUser): verify token handling, ensure consistent error responses                                    | ✅        | 2025-12-24 |
| TASK-012 | Review church members endpoints: standardize route patterns (/api/church-members vs /api/administration/church-members), verify authorization roles          | ✅        | 2025-12-24 |
| TASK-013 | Review financial endpoints: ensure consistent naming (envelope-contributions, hsbc-transactions), verify role-based access                                   | ✅        | 2025-12-24 |
| TASK-014 | Review administration endpoints: verify SystemAdministration role requirement, check audit logging                                                           | ✅        | 2025-12-24 |
| TASK-015 | Standardize endpoint configuration: ensure all endpoints use Description() builder for OpenAPI documentation                                                 | ✅        | 2025-12-24 |
| TASK-016 | Standardize HTTP status codes: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal Server Error | ✅        | 2025-12-24 |
| TASK-017 | Standardize validation patterns: use FastEndpoints built-in validation or FluentValidation consistently                                                      | ✅        | 2025-12-24 |
| TASK-018 | Review error response format: ensure consistent JSON error structure with message and errors array                                                           | ✅        | 2025-12-24 |
| TASK-019 | Add XML comments to all endpoints: provide clear descriptions for API consumers                                                                              | ✅        | 2025-12-24 |
| TASK-020 | Review endpoint naming: remove redundant "Endpoint" suffixes where appropriate, ensure class names match functionality                                       | ✅        | 2025-12-24 |

### Implementation Phase 3: Backend Code Review - Models & DTOs

- GOAL-003: Standardize data transfer objects and request/response models

| Task     | Description                                                                                                                                | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-021 | Review ChurchMemberDto vs ChurchMemberDetailDto: ensure proper separation of list vs detail views, remove unnecessary properties           | ✅        | 2025-12-24 |
| TASK-022 | Review contribution models: verify ContributionHistoryDto includes all necessary fields, check for data exposure issues                    | ✅        | 2025-12-24 |
| TASK-023 | Review envelope contribution models: standardize EnvelopeBatchDto, SubmitEnvelopeBatchRequest, validate batch entry structure              | ✅        | 2025-12-24 |
| TASK-024 | Review HSBC transaction models: verify UploadHsbcStatementResponse includes processing summary, check ContributionProcessingSummary fields | ✅        | 2025-12-24 |
| TASK-025 | Standardize property naming: ensure all DTOs use PascalCase for properties, match database column names where applicable                   | ✅        | 2025-12-24 |
| TASK-026 | Add data annotations: apply [Required], [MaxLength], [EmailAddress], [Range] attributes for validation                                     | ✅        | 2025-12-24 |
| TASK-027 | Remove redundant models: identify and consolidate duplicate DTOs or request models                                                         | ✅        | 2025-12-24 |
| TASK-028 | Add XML comments to all public properties: provide clear descriptions for API documentation                                                | ✅        | 2025-12-24 |
| TASK-029 | Review sensitive data exposure: ensure password hashes, tokens, and audit fields (ModifiedBy) are not exposed in DTOs                      | ✅        | 2025-12-24 |
| TASK-030 | Standardize date handling: ensure all DateTime properties are UTC, use ISO 8601 format in JSON serialization                               | ✅        | 2025-12-24 |

### Implementation Phase 4: Backend Code Review - Database Layer

- GOAL-004: Review database entities, context configuration, and migration strategy

| Task     | Description                                                                                                                                              | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-031 | Review ChurchRegisterWebContext: verify all DbSets are properly configured, check ConfigureSeedData consistency                                          | ✅        | 2025-12-24 |
| TASK-032 | Review entity configuration methods: ensure ConfigureChurchMember, ConfigureContributions, ConfigureEnvelopeContributionBatch follow consistent patterns | ✅        | 2025-12-24 |
| TASK-033 | Review navigation properties: verify all foreign key relationships are configured correctly with proper OnDelete behavior                                | ✅        | 2025-12-24 |
| TASK-034 | Review entity audit fields: ensure all entities have CreatedBy, CreatedDateTime, ModifiedBy, ModifiedDateTime                                            | ✅        | 2025-12-24 |
| TASK-035 | Review entity constraints: verify check constraints, unique indexes, and default values are properly applied                                             | ✅        | 2025-12-24 |
| TASK-036 | Review seed data: ensure all seed data uses static DateTime to avoid migration changes, verify data consistency                                          | ✅        | 2025-12-24 |
| TASK-037 | Verify migration state: confirm InitialApplication migration captures entire schema correctly                                                            | ✅        | 2025-12-24 |
| TASK-038 | Review AuditInterceptor: verify SaveChangesInterceptor properly populates audit fields for all entities                                                  | ✅        | 2025-12-24 |
| TASK-039 | Review entity naming: ensure table names follow conventions (plural), verify column names match property names                                           | ✅        | 2025-12-24 |
| TASK-040 | Add indexes: identify frequently queried columns and add appropriate indexes for performance                                                             | ✅        | 2025-12-24 |

### Implementation Phase 5: Frontend Code Review - API Services

- GOAL-005: Standardize API service layer for consistent data fetching patterns

| Task     | Description                                                                                                        | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-041 | Review ApiClient.ts: verify axios interceptors handle token refresh, ensure consistent error handling              | ✅        | 2025-12-24 |
| TASK-042 | Review churchMembersApi.ts: standardize method naming (getChurchMembers, getChurchMemberById), verify return types | ✅        | 2025-12-24 |
| TASK-043 | Review contributionsApi.ts: ensure consistent endpoint paths, verify member number mapping logic                   | ✅        | 2025-12-24 |
| TASK-044 | Review hsbcTransactionsApi.ts: verify file upload handling with FormData, check error responses                    | ✅        | 2025-12-24 |
| TASK-045 | Review administrationApi.ts: standardize register number service methods, verify year parameter handling           | ✅        | 2025-12-24 |
| TASK-046 | Standardize error handling: ensure all API methods catch and transform axios errors to application errors          | ✅        | 2025-12-24 |
| TASK-047 | Add TypeScript type safety: verify all API methods have proper return types with generics (Promise<T>)             | ✅        | 2025-12-24 |
| TASK-048 | Review API base URL configuration: ensure VITE_API_BASE_URL environment variable is used consistently              | ✅        | 2025-12-24 |
| TASK-049 | Add request cancellation: implement AbortController for cancellable requests in React Query                        | ✅        | 2025-12-24 |
| TASK-050 | Extract common API patterns: create reusable helpers for pagination, sorting, filtering requests                   | ✅        | 2025-12-24 |

### Implementation Phase 6: Frontend Code Review - React Components

- GOAL-006: Review component structure, naming, and props for consistency

| Task     | Description                                                                                                              | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-051 | Review Layout components: verify Header, Sidebar, Footer follow consistent prop patterns, check responsive behavior      | ✅        | 2025-12-24 |
| TASK-052 | Review ChurchMembers components: standardize AddChurchMemberForm, ChurchMembersPage, verify form validation              | ✅        | 2025-12-24 |
| TASK-053 | Review Contributions components: ensure ContributionMemberGrid, FinancialActionsHeader use consistent data grid patterns | ✅        | 2025-12-24 |
| TASK-054 | Review Envelope Contribution components: verify EnvelopeBatchEntry, EnvelopeBatchHistory follow form patterns            | ✅        | 2025-12-24 |
| TASK-055 | Review Administration components: check GenerateRegisterNumbers, UserManagement for consistent layouts                   | ✅        | 2025-12-24 |
| TASK-056 | Standardize component file structure: ensure each feature has index.ts barrel export, consistent folder structure        | ✅        | 2025-12-24 |
| TASK-057 | Review prop types: ensure all components have properly typed props interfaces exported for reusability                   | ✅        | 2025-12-24 |
| TASK-058 | Review component composition: identify opportunities to extract reusable components (e.g., DataGridWrapper, FormField)   | ✅        | 2025-12-24 |
| TASK-059 | Standardize error handling: ensure all components display user-friendly error messages using Alert component             | ✅        | 2025-12-24 |
| TASK-060 | Review loading states: ensure consistent loading indicators using LoadingButton, Skeleton, CircularProgress              | ✅        | 2025-12-24 |

### Implementation Phase 7: Frontend Code Review - State Management

- GOAL-007: Review React Query usage and state management patterns

| Task     | Description                                                                                             | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-061 | Review query keys: ensure consistent naming patterns ([' churchMembers'], ['contributions', memberId])  | ✅        | 2025-12-24 |
| TASK-062 | Review query configurations: verify staleTime, cacheTime, refetchOnWindowFocus settings are appropriate | ✅        | 2025-12-24 |
| TASK-063 | Review mutation patterns: ensure onSuccess, onError callbacks invalidate related queries                | ✅        | 2025-12-24 |
| TASK-064 | Review optimistic updates: identify opportunities for optimistic UI updates in mutations                | ✅        | 2025-12-24 |
| TASK-065 | Review QueryProvider configuration: verify QueryClient default options are appropriate for application  | ✅        | 2025-12-24 |
| TASK-066 | Review context usage: ensure AuthContext, ThemeContext, NotificationContext follow consistent patterns  | ✅        | 2025-12-24 |
| TASK-067 | Review local state: identify useState that should be moved to React Query for server state              | ✅        | 2025-12-24 |
| TASK-068 | Add query key factories: create centralized query key management for type safety and consistency        | ✅        | 2025-12-24 |
| TASK-069 | Review error boundaries: ensure error boundaries are properly placed to catch component errors          | ✅        | 2025-12-24 |
| TASK-070 | Review suspense usage: verify React Query suspense mode is correctly configured if used                 | ✅        | 2025-12-24 |

### Implementation Phase 8: Frontend Code Review - Routing & Navigation

- GOAL-008: Ensure consistent routing patterns and role-based navigation

| Task     | Description                                                                                                          | Completed | Date |
| -------- | -------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-071 | Review App.tsx routing structure: verify route organization, check nested routes consistency                         |           |      |
| TASK-072 | Review protected routes: ensure ProtectedRoute, ProtectedAdminRoute, ProtectedFinancialRoute patterns are consistent |           |      |
| TASK-073 | Review navigation items: verify Sidebar navigationItems match actual routes, check role-based visibility             |           |      |
| TASK-074 | Review breadcrumbs: ensure AdministrationLayout breadcrumbs generate correctly for all pages                         |           |      |
| TASK-075 | Review route parameters: standardize path parameter naming (memberId vs id), ensure type safety                      |           |      |
| TASK-076 | Review redirect logic: verify login redirect, unauthorized redirect work correctly                                   |           |      |
| TASK-077 | Review 404 handling: ensure NotFoundPage displays for invalid routes, provides helpful navigation                    |           |      |
| TASK-078 | Add route guards: verify all sensitive routes have appropriate permission checks                                     |           |      |
| TASK-079 | Review navigation state: ensure currentPath state is properly maintained across components                           |           |      |
| TASK-080 | Standardize route paths: ensure consistent naming (/app/members vs /administration/members)                          |           |      |

### Implementation Phase 9: Testing - Backend Unit Tests

- GOAL-009: Expand unit test coverage for all service layer components

| Task     | Description                                                                                                                          | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-081 | Expand ChurchMemberServiceTests: add tests for CreateChurchMemberAsync with auto member number assignment                            |           |      |
| TASK-082 | Create ContributionProcessingServiceTests: test ProcessHsbcTransactionsAsync with various scenarios (matches, unmatched, duplicates) |           |      |
| TASK-083 | Create RegisterNumberServiceTests: test GenerateForYearAsync, PreviewForYearAsync, GetNextAvailableNumberAsync                       |           |      |
| TASK-084 | Create EnvelopeContributionServiceTests: test ValidateRegisterNumberAsync, SubmitBatchAsync with edge cases                          |           |      |
| TASK-085 | Create HsbcTransactionImportServiceTests: test ImportTransactionsAsync with duplicate detection                                      |           |      |
| TASK-086 | Expand AzureEmailServiceTests: add tests for email sending failure scenarios                                                         |           |      |
| TASK-087 | Add validation tests: test BankReference uniqueness validation, email format validation                                              |           |      |
| TASK-088 | Add edge case tests: test with null/empty inputs, boundary values, invalid dates                                                     |           |      |
| TASK-089 | Add concurrent access tests: verify transaction handling with simultaneous operations                                                |           |      |
| TASK-090 | Achieve 80% code coverage: measure coverage with dotnet test --collect:"XPlat Code Coverage", identify gaps                          |           |      |

### Implementation Phase 10: Testing - Backend Integration Tests

- GOAL-010: Create integration tests for API endpoints with real database operations

| Task     | Description                                                                                                              | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-091 | Create ChurchMemberEndpointsTests: test all 7 endpoints (GET list, GET by ID, POST, PUT, PATCH, GET roles, GET statuses) |           |      |
| TASK-092 | Create FinancialEndpointsTests: test UploadHsbcStatementEndpoint, SubmitEnvelopeBatchEndpoint                            |           |      |
| TASK-093 | Create AdministrationEndpointsTests: test GenerateRegisterNumbersEndpoint, PreviewRegisterNumbersEndpoint                |           |      |
| TASK-094 | Test authorization: verify 401 Unauthorized for anonymous users, 403 Forbidden for insufficient roles                    |           |      |
| TASK-095 | Test validation: verify 400 Bad Request for invalid inputs, check error message format                                   |           |      |
| TASK-096 | Test pagination: verify page size limits, last page handling, total count accuracy                                       |           |      |
| TASK-097 | Test sorting: verify ascending/descending sort on various columns                                                        |           |      |
| TASK-098 | Test filtering: verify search term filtering, status filtering, role filtering                                           |           |      |
| TASK-099 | Test database transactions: verify rollback on error, proper FK constraint handling                                      |           |      |
| TASK-100 | Use TestWebApplicationFactory: setup in-memory test server with test database for realistic integration tests            |           |      |

### Implementation Phase 11: Testing - Frontend Unit Tests

- GOAL-011: Create unit tests for React components using React Testing Library and Vitest

| Task     | Description                                                                                            | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-101 | Create ChurchMembersPage.test.tsx: test rendering, add member button, search filtering                 |           |      |
| TASK-102 | Create AddChurchMemberForm.test.tsx: test form validation, submission, member number preview display   |           |      |
| TASK-103 | Create ContributionsPage.test.tsx: test grid rendering, action buttons visibility by role              |           |      |
| TASK-104 | Create ContributionMemberGrid.test.tsx: test data display, sorting, filtering, row actions             |           |      |
| TASK-105 | Create EnvelopeBatchEntry.test.tsx: test form validation, register number validation, batch submission |           |      |
| TASK-106 | Create GenerateRegisterNumbers.test.tsx: test preview display, confirmation dialog, generation success |           |      |
| TASK-107 | Test role-based rendering: verify components show/hide based on user roles                             |           |      |
| TASK-108 | Test error handling: verify error messages display correctly using React Query error states            |           |      |
| TASK-109 | Test loading states: verify loading indicators display during data fetching                            |           |      |
| TASK-110 | Mock API calls: use MSW (Mock Service Worker) to mock API responses in component tests                 |           |      |

### Implementation Phase 12: Testing - Frontend Integration Tests

- GOAL-012: Create integration tests for user workflows and navigation

| Task     | Description                                                                                                      | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-111 | Create authentication-flow.test.tsx: test login, logout, session persistence                                     |           |      |
| TASK-112 | Create church-members-workflow.test.tsx: test add member, edit member, view details workflow                     |           |      |
| TASK-113 | Create contributions-workflow.test.tsx: test upload HSBC, view contributions, filter by member                   |           |      |
| TASK-114 | Create envelope-contribution-workflow.test.tsx: test generate numbers, enter batch, validate register numbers    |           |      |
| TASK-115 | Test navigation: verify sidebar links navigate to correct pages, verify breadcrumbs                              |           |      |
| TASK-116 | Test route protection: verify unauthorized users redirect to login or 403 page                                   |           |      |
| TASK-117 | Test role-based access: verify financial roles can access contributions, verify admin can access user management |           |      |
| TASK-118 | Test data persistence: verify form data persists across navigation, verify query cache works                     |           |      |
| TASK-119 | Test error recovery: verify application recovers from API errors, network errors                                 |           |      |
| TASK-120 | Use React Testing Library: test user interactions (clicks, typing), verify DOM state changes                     |           |      |

### Implementation Phase 13: Code Consistency - Naming & Conventions

- GOAL-013: Standardize naming conventions across entire codebase

| Task     | Description                                                                                                            | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-121 | Backend: Ensure all service methods use Async suffix (GetChurchMembersAsync, CreateMemberAsync)                        | ✅        | 2025-12-24 |
| TASK-122 | Backend: Standardize DTO naming (Dto suffix vs Response suffix) - choose one convention                                | ✅        | 2025-12-24 |
| TASK-123 | Backend: Ensure all endpoint classes have descriptive names matching their HTTP verb and resource                      | ✅        | 2025-12-24 |
| TASK-124 | Frontend: Standardize component file naming (PascalCase.tsx for components, camelCase.ts for utilities)                | ✅        | 2025-12-24 |
| TASK-125 | Frontend: Ensure all API service methods use camelCase (getChurchMembers, not GetChurchMembers)                        | ✅        | 2025-12-24 |
| TASK-126 | Frontend: Standardize type file naming (types.ts vs types/index.ts)                                                    | ✅        | 2025-12-24 |
| TASK-127 | Database: Ensure all table names are plural, all column names match property names                                     | ✅        | 2025-12-24 |
| TASK-128 | Database: Standardize audit field names across all entities (CreatedBy, CreatedDateTime, ModifiedBy, ModifiedDateTime) | ✅        | 2025-12-24 |
| TASK-129 | Routes: Standardize URL patterns (/api/resource vs /api/category/resource) - document convention                       | ✅        | 2025-12-24 |
| TASK-130 | Enums: Ensure all enums use PascalCase names and PascalCase values, document in constants file                         | ✅        | 2025-12-24 |

### Implementation Phase 14: Code Consistency - Error Handling

- GOAL-014: Standardize error handling patterns across backend and frontend

| Task     | Description                                                                                        | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-131 | Backend: Create custom exception types (NotFoundException, ValidationException, ConflictException) | ✅        | 2025-12-24 |
| TASK-132 | Backend: Implement global exception handler middleware to map exceptions to HTTP status codes      | ✅        | 2025-12-24 |
| TASK-133 | Backend: Standardize error response format: { message: string, errors: string[] }                  | ✅        | 2025-12-24 |
| TASK-134 | Backend: Add structured logging for errors with correlation IDs for troubleshooting                | ✅        | 2025-12-24 |
| TASK-135 | Frontend: Create error boundary components to catch and display React errors gracefully            | ✅        | 2025-12-24 |
| TASK-136 | Frontend: Standardize API error handling in React Query onError callbacks                          | ✅        | 2025-12-24 |
| TASK-137 | Frontend: Create ErrorAlert component for consistent error message display                         | ✅        | 2025-12-24 |
| TASK-138 | Frontend: Implement retry logic for transient failures using React Query retry configuration       | ✅        | 2025-12-24 |
| TASK-139 | Frontend: Add user-friendly error messages (map technical errors to user-readable text)            | ✅        | 2025-12-24 |
| TASK-140 | Document error handling patterns in README or CONTRIBUTING.md for developers                       | ✅        | 2025-12-24 |

### Implementation Phase 15: Documentation & Comments

- GOAL-015: Improve code documentation for maintainability

| Task     | Description                                                                                                 | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-141 | Backend: Add XML comments to all public service methods with param and returns tags                         |           |      |
| TASK-142 | Backend: Add XML comments to all endpoint classes describing purpose, authorization, request/response       |           |      |
| TASK-143 | Backend: Document complex business logic with inline comments explaining why not what                       |           |      |
| TASK-144 | Frontend: Add JSDoc comments to all exported functions and components                                       |           |      |
| TASK-145 | Frontend: Document complex React Query configurations (query keys, stale times, retry logic)                |           |      |
| TASK-146 | Frontend: Add prop type descriptions using JSDoc @param tags                                                |           |      |
| TASK-147 | Database: Document entity relationships and FK constraints in ConfigureRelationships method                 |           |      |
| TASK-148 | Create ARCHITECTURE.md: document solution structure, layer responsibilities, data flow                      |           |      |
| TASK-149 | Create API.md: document all API endpoints with request/response examples, authentication requirements       |           |      |
| TASK-150 | Update README.md: add setup instructions, environment variables, database migration steps, testing commands |           |      |

### Implementation Phase 16: Performance & Optimization

- GOAL-016: Identify and implement performance improvements

| Task     | Description                                                                                               | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-151 | Backend: Add database indexes for frequently queried columns (BankReference, RegisterNumber, Year)        | ✅        | 2025-12-24 |
| TASK-152 | Backend: Optimize EF Core queries with .AsNoTracking() for read-only operations                           | ✅        | 2025-12-24 |
| TASK-153 | Backend: Review N+1 query issues - ensure .Include() is used for navigation properties in list queries    | ✅        | 2025-12-24 |
| TASK-154 | Backend: Implement response caching for static data (roles, statuses, districts)                          | ✅        | 2025-12-24 |
| TASK-155 | Backend: Add pagination limits to prevent excessive data loading (max page size 100)                      |           |            |
| TASK-156 | Frontend: Implement virtual scrolling for large data grids using MUI DataGrid virtualization              |           |            |
| TASK-157 | Frontend: Optimize React Query cache times based on data volatility (contributions: 5 min, roles: 1 hour) | ✅        | 2025-12-24 |
| TASK-158 | Frontend: Add React.memo to expensive components to prevent unnecessary re-renders                        |           |            |
| TASK-159 | Frontend: Lazy load routes using React.lazy() and Suspense for code splitting                             | ✅        | 2025-12-24 |
| TASK-160 | Database: Review and optimize long-running queries using SQL Server execution plans                       |           |            |

### Implementation Phase 17: Security Hardening

- GOAL-017: Review and strengthen security measures before production

| Task     | Description                                                                                    | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-161 | Backend: Review all endpoints for proper authorization - no anonymous access to sensitive data | ✅        | 2025-12-24 |
| TASK-162 | Backend: Verify JWT token expiration times are appropriate (access: 12 hours, refresh: 7 days) | ✅        | 2025-12-24 |
| TASK-163 | Backend: Ensure refresh token rotation is implemented to prevent token reuse                   | ✅        | 2025-12-24 |
| TASK-164 | Backend: Review CORS configuration - restrict allowed origins in production                    | ✅        | 2025-12-24 |
| TASK-165 | Backend: Verify sensitive data is not logged (passwords, tokens, email addresses)              | ✅        | 2025-12-24 |
| TASK-166 | Backend: Implement rate limiting on authentication endpoints to prevent brute force attacks    | 📋        |            |
| TASK-167 | Frontend: Verify token storage uses httpOnly cookies or secure localStorage patterns           | ✅        | 2025-12-24 |
| TASK-168 | Frontend: Ensure no sensitive data is exposed in browser DevTools or console logs              | ✅        | 2025-12-24 |
| TASK-169 | Frontend: Review XSS vulnerabilities - ensure all user input is sanitized                      | ✅        | 2025-12-24 |
| TASK-170 | Database: Review user permissions - ensure application account has minimal required privileges | ✅        | 2025-12-24 |

### Implementation Phase 18: Configuration Management

- GOAL-018: Standardize configuration across environments

| Task     | Description                                                                                     | Completed | Date       |
| -------- | ----------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-171 | Backend: Review appsettings.json structure - remove hardcoded values, use environment variables | ✅        | 2025-12-24 |
| TASK-172 | Backend: Create appsettings.Production.json with production-specific settings                   | ✅        | 2025-12-24 |
| TASK-173 | Backend: Document all required environment variables in README.md                               | ✅        | 2025-12-24 |
| TASK-174 | Frontend: Review .env.example file - ensure all required variables are documented               | ✅        | 2025-12-24 |
| TASK-175 | Frontend: Create separate .env.development and .env.production files                            | ✅        | 2025-12-24 |
| TASK-176 | Frontend: Verify VITE_API_BASE_URL is correctly configured for each environment                 | ✅        | 2025-12-24 |
| TASK-177 | Database: Create separate connection strings for Development, Staging, Production               | ✅        | 2025-12-24 |
| TASK-178 | Document configuration deployment process for Azure/production environment                      | ✅        | 2025-12-24 |
| TASK-179 | Review secrets management - ensure no secrets committed to repository                           | ✅        | 2025-12-24 |
| TASK-180 | Setup Azure Key Vault or equivalent for production secrets management                           | ✅        | 2025-12-24 |

### Implementation Phase 19: Final Pre-Production Checklist

- GOAL-019: Complete final checks before production deployment

| Task     | Description                                                                                | Completed | Date       |
| -------- | ------------------------------------------------------------------------------------------ | --------- | ---------- |
| TASK-181 | Run all backend tests: dotnet test --configuration Release --collect:"XPlat Code Coverage" | ✅        | 2025-12-24 |
| TASK-182 | Run all frontend tests: npm run test:coverage                                              | ⏭️        |            |
| TASK-183 | Build backend in Release mode: dotnet build --configuration Release - verify zero warnings | ✅        | 2025-12-24 |
| TASK-184 | Build frontend for production: npm run build - verify zero errors, check bundle size       | ⏭️        |            |
| TASK-185 | Run database migrations on staging environment: dotnet ef database update                  | ⏭️        |            |
| TASK-186 | Test complete user workflows in staging environment with production-like data              | ⏭️        |            |
| TASK-187 | Review all console.log statements - remove or convert to proper logging                    | ✅        | 2025-12-24 |
| TASK-188 | Review all TODO/FIXME comments - resolve or create tickets for remaining items             | ✅        | 2025-12-24 |
| TASK-189 | Run security scan: npm audit, dotnet list package --vulnerable                             | ✅        | 2025-12-24 |
| TASK-190 | Create deployment checklist document for production release                                | ✅        | 2025-12-24 |

## 3. Alternatives

- **ALT-001**: Full rewrite using different technology stack - Rejected: Current implementation is functional and stable
- **ALT-002**: Incremental refactoring in production - Rejected: Risk of introducing bugs in live environment
- **ALT-003**: Defer testing until post-production - Rejected: Higher risk of critical bugs in production
- **ALT-004**: Automated code refactoring tools (ReSharper, ESLint autofix) - Considered: Will be used for mechanical changes only, manual review required for logic
- **ALT-005**: Third-party code review service - Considered: May be used as additional validation but internal review is primary

## 4. Dependencies

- **DEP-001**: .NET 9.0 SDK for backend development and testing
- **DEP-002**: Node.js 20+ and npm for frontend development and testing
- **DEP-003**: SQL Server 2022 for database (LocalDB for development, Azure SQL for production)
- **DEP-004**: Azure account for Azure Communication Services (email service)
- **DEP-005**: Testing frameworks: xUnit, FluentAssertions, Moq (backend), Vitest, React Testing Library (frontend)
- **DEP-006**: Code analysis tools: Roslyn analyzers, ESLint, TypeScript compiler
- **DEP-007**: Coverage tools: Coverlet (backend), Vitest coverage (frontend)
- **DEP-008**: Staging environment for pre-production testing

## 5. Files

### Backend - Services

- **FILE-001**: ChurchRegister.ApiService/Services/ChurchMemberService.cs
- **FILE-002**: ChurchRegister.ApiService/Services/ContributionProcessingService.cs (includes RegisterNumberService)
- **FILE-003**: ChurchRegister.ApiService/Services/EnvelopeContributionService.cs
- **FILE-004**: ChurchRegister.ApiService/Services/HsbcTransactionImportService.cs
- **FILE-005**: ChurchRegister.ApiService/Services/HsbcCsvParser.cs
- **FILE-006**: ChurchRegister.ApiService/Services/AzureEmailService.cs
- **FILE-007**: ChurchRegister.ApiService/Services/UserManagementService.cs

### Backend - Endpoints

- **FILE-008**: ChurchRegister.ApiService/Controllers/AuthorisationController.cs
- **FILE-009**: ChurchRegister.ApiService/Endpoints/Administration/CreateChurchMemberEndpoint.cs
- **FILE-010**: ChurchRegister.ApiService/Endpoints/Administration/GetChurchMembersEndpoint.cs
- **FILE-011**: ChurchRegister.ApiService/Endpoints/Administration/UpdateChurchMemberEndpoint.cs
- **FILE-012**: ChurchRegister.ApiService/Endpoints/Administration/RevokeUserTokensEndpoint.cs
- **FILE-013**: ChurchRegister.ApiService/Endpoints/Financial/UploadHsbcStatementEndpoint.cs
- **FILE-014**: ChurchRegister.ApiService/Endpoints/Administration/EventEndpoints.cs
- **FILE-015**: ChurchRegister.ApiService/Endpoints/Administration/AttendanceEndpoints.cs

### Backend - Models & DTOs

- **FILE-016**: ChurchRegister.ApiService/Models/Administration/ChurchMemberDto.cs
- **FILE-017**: ChurchRegister.ApiService/Models/Financial/ContributionHistoryDto.cs
- **FILE-018**: ChurchRegister.ApiService/Models/Financial/UploadHsbcStatementResponse.cs
- **FILE-019**: ChurchRegister.ApiService/Models/Administration/RegisterNumberModels.cs

### Backend - Database

- **FILE-020**: ChurchRegister.Database/Data/ChurchRegisterWebContext.cs
- **FILE-021**: ChurchRegister.Database/Data/DatabaseSeeder.cs
- **FILE-022**: ChurchRegister.Database/Entities/ChurchMember.cs
- **FILE-023**: ChurchRegister.Database/Entities/ChurchMemberContributions.cs
- **FILE-024**: ChurchRegister.Database/Entities/ChurchMemberRegisterNumbers.cs
- **FILE-025**: ChurchRegister.Database/Entities/EnvelopeContributionBatch.cs
- **FILE-026**: ChurchRegister.Database/Interceptors/AuditInterceptor.cs

### Backend - Configuration

- **FILE-027**: ChurchRegister.ApiService/Program.cs
- **FILE-028**: ChurchRegister.ApiService/appsettings.json
- **FILE-029**: ChurchRegister.ApiService/appsettings.Production.json

### Frontend - API Services

- **FILE-030**: ChurchRegister.React/src/services/api/ApiClient.ts
- **FILE-031**: ChurchRegister.React/src/services/api/churchMembersApi.ts
- **FILE-032**: ChurchRegister.React/src/services/api/contributionsApi.ts
- **FILE-033**: ChurchRegister.React/src/services/api/hsbcTransactionsApi.ts
- **FILE-034**: ChurchRegister.React/src/services/api/administrationApi.ts

### Frontend - Components

- **FILE-035**: ChurchRegister.React/src/components/Layout/Layout.tsx
- **FILE-036**: ChurchRegister.React/src/components/Layout/Sidebar.tsx
- **FILE-037**: ChurchRegister.React/src/components/Layout/AdministrationLayout.tsx
- **FILE-038**: ChurchRegister.React/src/components/ChurchMembers/AddChurchMemberForm.tsx
- **FILE-039**: ChurchRegister.React/src/components/Contributions/ContributionMemberGrid.tsx
- **FILE-040**: ChurchRegister.React/src/components/Financial/EnvelopeBatchEntry.tsx

### Frontend - Pages

- **FILE-041**: ChurchRegister.React/src/pages/Administration/ChurchMembersPage.tsx
- **FILE-042**: ChurchRegister.React/src/pages/Financial/ContributionsPage.tsx
- **FILE-043**: ChurchRegister.React/src/App.tsx

### Frontend - State & Context

- **FILE-044**: ChurchRegister.React/src/contexts/AuthContext.tsx
- **FILE-045**: ChurchRegister.React/src/providers/QueryProvider.tsx

### Backend - Tests

- **FILE-046**: ChurchRegister.Tests/Services/ChurchMemberServiceTests.cs
- **FILE-047**: ChurchRegister.Tests/Services/AzureEmailServiceTests.cs
- **FILE-048**: ChurchRegister.Tests/UseCases/Authentication/LoginUseCaseTests.cs
- **FILE-049**: ChurchRegister.Tests/UseCases/Authentication/LogoutUseCaseTests.cs
- **FILE-050**: ChurchRegister.Tests/Middleware/TokenRevocationMiddlewareTests.cs
- **FILE-051**: ChurchRegister.Tests/TestWebApplicationFactory.cs (to be created)

### Frontend - Tests

- **FILE-052**: ChurchRegister.React/src/**tests**/auth/authService.test.ts
- **FILE-053**: ChurchRegister.React/src/setupTests.ts
- **FILE-054**: ChurchRegister.React/vite.config.ts (test configuration)

## 6. Testing

- **TEST-001**: All existing ChurchMemberServiceTests must continue passing after refactoring
- **TEST-002**: New ContributionProcessingServiceTests covering matching logic, duplicate prevention, unmatched transactions
- **TEST-003**: New RegisterNumberServiceTests covering generation, preview, next available number
- **TEST-004**: New EnvelopeContributionServiceTests covering validation, batch submission
- **TEST-005**: Backend integration tests for all API endpoints with authorization checks
- **TEST-006**: Frontend unit tests for all major components (ChurchMembersPage, ContributionsPage, AddChurchMemberForm)
- **TEST-007**: Frontend integration tests for user workflows (login, add member, upload HSBC, create batch)
- **TEST-008**: Performance tests for large data scenarios (1000+ members, 10000+ contributions)
- **TEST-009**: Security tests for authorization (verify 401, 403 responses), input validation (verify 400 responses)
- **TEST-010**: End-to-end smoke tests for critical paths in staging environment

## 7. Risks & Assumptions

- **RISK-001**: Refactoring may introduce regressions in working features - Mitigation: Comprehensive test coverage before and after changes
- **RISK-002**: Breaking changes in dependencies (EF Core, React, MUI) - Mitigation: Pin dependency versions, test upgrades in isolation
- **RISK-003**: Database migration issues in production - Mitigation: Test migrations thoroughly in staging, have rollback plan
- **RISK-004**: Performance degradation from added validation/logging - Mitigation: Performance test before and after, profile bottlenecks
- **RISK-005**: Schedule pressure to skip testing phases - Mitigation: Define minimum viable testing requirements, prioritize critical paths
- **RISK-006**: Inconsistent refactoring patterns across team members - Mitigation: Define coding standards document, use code review checklist
- **ASSUMPTION-001**: Current functionality is correct and complete (no bugs in business logic)
- **ASSUMPTION-002**: Existing database schema is optimal for current requirements
- **ASSUMPTION-003**: All team members have access to development, staging environments
- **ASSUMPTION-004**: Azure infrastructure is configured and accessible for production deployment
- **ASSUMPTION-005**: User acceptance testing will be conducted separately after technical refactoring

## 8. Related Specifications / Further Reading

### Internal Planning Documents

- [Church Members Feature Plan](./feature-church-members.md)
- [Envelope Contribution Feature Plan](./feature-envelope-contribution.md)
- [HSBC Bank Import Feature Plan](./feature-hsbc-bank-import.md)
- [Member Contributions Feature Plan](./feature-member-contributions.md)
- [Contributions UI Updates Plan](./feature-contributions-ui-updates.md)
- [Production Ready Plan](./feature-production-ready.md)

### Internal Specifications

- [Church Members Specification](../spec/church-members-spec.md)
- [Envelope Contribution Specification](../spec/envelope-contribution-spec.md)
- [HSBC Transactions Specification](../spec/hsbc-transactions-spec.md)
- [Member Contributions Specification](../spec/member-contributions-spec.md)
- [Contributions UI Updates Specification](../spec/contributions-ui-updates-spec.md)

### Technical Documentation

- [ASP.NET Core Best Practices](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/best-practices)
- [Entity Framework Core Performance](https://learn.microsoft.com/en-us/ef/core/performance/)
- [FastEndpoints Documentation](https://fast-endpoints.com/docs)
- [React Best Practices](https://react.dev/learn/thinking-in-react)
- [React Query Best Practices](https://tanstack.com/query/latest/docs/react/guides/best-practices)
- [Material-UI Customization](https://mui.com/material-ui/customization/theming/)
- [TypeScript Coding Guidelines](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)
- [C# Coding Conventions](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/coding-conventions)
