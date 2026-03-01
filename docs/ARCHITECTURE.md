# ChurchRegister React Application Architecture

This document provides a comprehensive overview of the architectural decisions, patterns, and conventions used in the ChurchRegister React application.

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Component Architecture](#component-architecture)
4. [State Management](#state-management)
5. [Routing Strategy](#routing-strategy)
6. [Authentication & Authorization](#authentication--authorization)
7. [API Integration](#api-integration)
8. [Error Handling](#error-handling)
9. [Performance Optimization](#performance-optimization)
10. [Testing Strategy](#testing-strategy)

## Overview

The ChurchRegister React application follows a modern, component-based architecture built with:

- **React 19** with hooks and functional components
- **TypeScript** for type safety
- **Vite** for fast development and optimized builds
- **Material-UI** for consistent UI components
- **React Query** for server state management
- **React Router** for client-side routing

### Architectural Principles

1. **Separation of Concerns**: Components, business logic, and data fetching are clearly separated
2. **Type Safety**: TypeScript strict mode enforces type correctness
3. **Composition over Inheritance**: Favor composing components over class hierarchies
4. **Single Responsibility**: Each component/module has one clear purpose
5. **DRY (Don't Repeat Yourself)**: Reusable components and utilities
6. **Accessibility First**: WCAG 2.1 AA compliance built-in

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Administration/  # Admin-specific components
│   ├── Attendance/      # Attendance feature components
│   ├── ChurchMembers/   # Church members feature components
│   ├── Contributions/   # Contributions feature components
│   ├── Financial/       # Financial feature components
│   ├── Form/            # Form input components
│   ├── Layout/          # Layout components (Header, Sidebar, Footer)
│   ├── Loading/         # Loading state components
│   ├── Modal/           # Modal/dialog components
│   ├── Navigation/      # Navigation components
│   ├── Button/          # Button variants
│   ├── Card/            # Card components
│   ├── Error/           # Error display components
│   └── Table/           # Table components
├── config/              # Application configuration
│   └── queryConfig.ts   # React Query configuration
├── constants/           # Application constants
│   ├── index.ts         # App config (DRAWER_WIDTH, timeouts, etc.)
│   ├── permissions.ts   # Permission constants
│   ├── roles.ts         # Role constants
│   └── routes.ts        # Route path constants
├── contexts/            # React Context providers
│   ├── AuthContext.tsx  # Authentication context
│   ├── ThemeContext.tsx # Theme management context
│   └── NotificationContext.tsx # Toast notifications context
├── hooks/               # Custom React hooks
│   ├── useAuth.ts       # Authentication hook
│   ├── useRBAC.ts       # Role-based access control hook
│   ├── useTheme.ts      # Theme management hook
│   ├── useNotification.ts # Notification hook
│   └── useTokenRefresh.ts # Token refresh hook
├── pages/               # Page components (route targets)
│   ├── DashboardPage.tsx
│   ├── LoginPage.tsx
│   ├── Administration/
│   ├── Attendance/
│   ├── Financial/
│   ├── auth/
│   └── error/
├── providers/           # Provider wrappers
│   └── QueryProvider.tsx
├── services/            # Business logic and API services
│   ├── api/             # API client and endpoints
│   │   ├── ApiClient.ts
│   │   ├── churchMembersApi.ts
│   │   ├── contributionsApi.ts
│   │   └── ...
│   └── auth/            # Authentication services
│       ├── authService.ts
│       └── tokenService.ts
├── types/               # TypeScript type definitions
│   ├── churchMembers.ts
│   ├── contributions.ts
│   ├── attendance.ts
│   └── ...
├── utils/               # Utility functions
│   ├── validation.ts
│   ├── rbac.ts
│   ├── logger.ts
│   ├── errorUtils.ts
│   └── queryKeys.ts
├── App.tsx              # Root component with routing
└── main.tsx             # Application entry point
```

### Folder Organization Principles

- **Feature-based grouping**: Components organized by domain/feature
- **Colocation**: Related files (component + types + tests) live together
- **Barrel exports**: Each folder has an index.ts for clean imports
- **Path aliases**: Use `@components`, `@hooks`, etc. instead of relative paths

## Component Architecture

### Component Types

1. **Page Components** (`src/pages/`)
   - Top-level components mapped to routes
   - Orchestrate data fetching and component composition
   - Handle page-level state
   - Example: `DashboardPage.tsx`, `ChurchMembersPage.tsx`

2. **Feature Components** (`src/components/[Feature]/`)
   - Domain-specific business logic components
   - Example: `ChurchMemberGrid.tsx`, `ContributionHistoryDialog.tsx`

3. **Shared Components** (`src/components/[ComponentType]/`)
   - Reusable UI components used across features
   - Example: `Button`, `Card`, `Modal`, `Table`

4. **Layout Components** (`src/components/Layout/`)
   - Application shell components
   - Example: `Layout.tsx`, `Header.tsx`, `Sidebar.tsx`

### Component Patterns

```typescript
/**
 * Standard Component Pattern
 */
interface ComponentProps {
  // Props defined with TypeScript interface
  prop1: string;
  prop2?: number; // Optional props marked with ?
  onAction: () => void; // Callbacks for parent communication
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2, onAction }) => {
  // 1. Hooks at the top
  const [state, setState] = useState<string>('');
  const queryClient = useQueryClient();

  // 2. Queries and mutations
  const { data, isLoading } = useQuery({
    queryKey: ['data', prop1],
    queryFn: () => fetchData(prop1),
  });

  // 3. Event handlers
  const handleClick = () => {
    // Handle event
    onAction();
  };

  // 4. Effects
  useEffect(() => {
    // Side effects
  }, []);

  // 5. Early returns for loading/error states
  if (isLoading) return <Spinner />;

  // 6. Render
  return (
    <Box>
      {/* JSX */}
    </Box>
  );
};
```

## State Management

### State Categories

1. **Server State** (React Query)
   - Data from APIs (church members, contributions, attendance)
   - Managed by React Query with automatic caching, refetching, and synchronization
   - Example: `useQuery`, `useMutation`

2. **Global Client State** (React Context)
   - Authentication state (user, tokens)
   - Theme preferences
   - Notification queue
   - Managed by Context providers

3. **Component State** (useState)
   - Local UI state (form inputs, modals, drawers)
   - Managed by `useState`, `useReducer`

4. **Form State** (React Hook Form)
   - Form field values and validation
   - Managed by `useForm` hook

### React Query Configuration

```typescript
// Query key factory pattern
export const churchMemberKeys = {
  all: ["churchMembers"] as const,
  lists: () => [...churchMemberKeys.all, "list"] as const,
  list: (query) => [...churchMemberKeys.lists(), query] as const,
  details: () => [...churchMemberKeys.all, "detail"] as const,
  detail: (id) => [...churchMemberKeys.details(), id] as const,
};

// Usage
const { data } = useQuery({
  queryKey: churchMemberKeys.list(query),
  queryFn: () => fetchChurchMembers(query),
});
```

## Routing Strategy

### Route Structure

```
/                          → Redirect to /login
/login                     → Login page (public)
/error/404                 → Not Found (public)
/error/500                 → Server Error (public)
/error/unauthorized        → Unauthorized (public)

/app                       → Protected layout
  /dashboard               → Dashboard (authenticated)
  /change-password         → Change Password (authenticated)
  /attendance              → Attendance (requires Attendance.View)
  /members                 → Church Members (requires ChurchMembers.View)
  /contributions           → Contributions (requires financial role)
  /financial/*             → Financial routes (role-based)
  /administration/*        → Admin routes (SystemAdministration role)
```

### Protected Routes

```typescript
// Permission-based protection
<ProtectedAttendanceRoute
  requiredPermission="Attendance.View"
  featureName="attendance management"
>
  <AttendanceTabsPage />
</ProtectedAttendanceRoute>

// Role-based protection
<ProtectedFinancialRoute
  requiredRoles={['SystemAdministration', 'FinancialAdministrator']}
  featureName="register number generation"
>
  <GenerateRegisterNumbers />
</ProtectedFinancialRoute>
```

### Lazy Loading

Pages are lazy-loaded for optimal bundle size:

```typescript
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
```

## Authentication & Authorization

### Authentication Flow

1. **Login**: User submits credentials → API returns JWT tokens (access + refresh)
2. **Token Storage**: Tokens stored in localStorage via tokenService
3. **API Requests**: Access token automatically injected in Authorization header
4. **Token Refresh**: Refresh token used to get new access token before expiry
5. **Logout**: Tokens cleared, user redirected to login

### Authorization Patterns

**Permission-Based**:

```typescript
const { hasPermission } = useAuthPermissions();

if (hasPermission("ChurchMembers.Edit")) {
  // Show edit button
}
```

**Role-Based**:

```typescript
const { hasRole } = useAuth();

if (hasRole("SystemAdministration")) {
  // Show admin section
}
```

**RBAC Utility**:

```typescript
import { checkPermission, checkRole } from "@utils/rbac";

const canEdit = checkPermission(user, "ChurchMembers.Edit");
const isAdmin = checkRole(user, "SystemAdministration");
```

## API Integration

### API Client

Centralized axios client with interceptors:

```typescript
class ApiClient {
  // Request interceptor: Add auth token
  // Response interceptor: Handle errors, show toasts
}
```

### API Service Pattern

```typescript
// churchMembersApi.ts
export const churchMembersApi = {
  getChurchMembers: (query: ChurchMemberGridQuery) => {
    return apiClient.get<PagedResponse<ChurchMemberDto>>("/church-members", {
      params: query,
    });
  },

  createChurchMember: (data: CreateChurchMemberDto) => {
    return apiClient.post<ChurchMemberDetailDto>("/church-members", data);
  },
};
```

### Error Handling

- API errors automatically show toast notifications
- Validation errors displayed as multiple toasts
- 401 Unauthorized → Redirect to unauthorized page
- Network errors → Generic error toast

## Error Handling

### Error Boundaries

```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

Catches React errors and displays fallback UI.

### Try-Catch Pattern

```typescript
try {
  await mutation.mutateAsync(data);
  notificationManager.showSuccess("Success!");
} catch (error) {
  // Error toast automatically shown by API client
  // Component can handle specific error cases
}
```

## Performance Optimization

### Code Splitting

- Route-based code splitting with `React.lazy()`
- Vendor chunk splitting in Vite configuration

### React Query Optimization

- Stale-while-revalidate caching
- Automatic background refetching
- Deduplication of requests
- Pagination and infinite queries

### Memoization

```typescript
// Expensive computations
const result = useMemo(() => expensiveCalculation(data), [data]);

// Callback stability
const handleClick = useCallback(() => {
  doSomething();
}, [dependency]);
```

## Testing Strategy

### Unit Tests (Vitest)

- Test utilities and hooks
- Test API services with mocked responses
- Test components in isolation

### Component Tests (React Testing Library)

- Test user interactions
- Test accessibility
- Test conditional rendering

### E2E Tests (Playwright)

- Test critical user flows
- Test authentication
- Test CRUD operations

### Storybook

- Component development in isolation
- Visual testing
- Documentation

---

## Design Decisions

### Why React Query?

- Eliminates boilerplate for data fetching
- Automatic caching and synchronization
- Optimistic updates
- Better developer experience

### Why Material-UI?

- Comprehensive component library
- Accessibility built-in
- Theming support
- Active community

### Why TypeScript?

- Catch errors at compile time
- Better IDE support
- Self-documenting code
- Refactoring confidence

### Why Vite?

- Fast HMR (Hot Module Replacement)
- Modern ES modules
- Optimized production builds
- Better DX than webpack

---

For more information, see:

- [local-development-setup.md](./local-development-setup.md)
- [error-handling-patterns.md](./error-handling-patterns.md)
- [routing-navigation-conventions.md](./routing-navigation-conventions.md)

---

## Backend API Architecture (ChurchRegister.ApiService)

The backend API is built with **ASP.NET Core (.NET 9)** using **FastEndpoints** and follows **Clean Architecture** principles.

### API Layer Pattern

```
Endpoint (HTTP concern)
    ↓ calls
Use Case (orchestration & business logic)
    ↓ calls
Service (data access & infrastructure)
    ↓ calls
Database (Entity Framework Core / PostgreSQL)
```

### Use Case Layer

Each API operation has a dedicated use case in `UseCase/{Feature}/{Operation}/`:

```
UseCase/
├── RiskAssessments/
│   ├── CreateRiskAssessment/
│   │   ├── ICreateRiskAssessmentUseCase.cs
│   │   └── CreateRiskAssessmentUseCase.cs
│   └── ApproveRiskAssessment/
│       ├── IApproveRiskAssessmentUseCase.cs
│       └── ApproveRiskAssessmentUseCase.cs
├── Reminders/
├── DataProtection/
└── Districts/
```

**Why a Use Case layer?**
- Endpoints stay thin (HTTP concerns only)
- Business logic is testable in isolation
- Consistent structured logging across all operations
- Enforces single responsibility per operation

For full details, see [ADR-001-use-case-layer.md](./ADR-001-use-case-layer.md).

### Endpoint Pattern

Endpoints use FastEndpoints and inject use case interfaces:

```csharp
public class CreateRiskAssessmentEndpoint : Endpoint<CreateRiskAssessmentRequest, RiskAssessmentDto>
{
    private readonly ICreateRiskAssessmentUseCase _useCase;

    public override void Configure() { /* route, auth */ }

    public override async Task HandleAsync(CreateRiskAssessmentRequest req, CancellationToken ct)
    {
        var result = await _useCase.ExecuteAsync(req, User.Identity!.Name!, ct);
        await SendOkAsync(result, ct);
    }
}
```

### Use Case Template

For a new use case, see [UseCase/TEMPLATE.md](../ChurchRegister.ApiService/UseCase/TEMPLATE.md).
