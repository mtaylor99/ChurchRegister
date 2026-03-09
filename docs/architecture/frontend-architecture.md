# Frontend architecture

This document provides a comprehensive overview of the architectural decisions, patterns, and conventions used in the ChurchRegister React application.

## Table of contents

1. [Overview](#overview)
2. [Project structure](#project-structure)
3. [Component architecture](#component-architecture)
4. [State management](#state-management)
5. [Routing strategy](#routing-strategy)
6. [Authentication & authorisation](#authentication--authorisation)
7. [API integration](#api-integration)
8. [Error handling](#error-handling)
9. [Performance optimisation](#performance-optimisation)
10. [Testing strategy](#testing-strategy)

## Overview

The ChurchRegister React application follows a modern, component-based architecture built with:

- **React 19** with hooks and functional components
- **TypeScript** for type safety
- **Vite** for fast development and optimised builds
- **Material-UI (MUI)** for consistent UI components
- **TanStack Query (React Query)** for server state management
- **React Router v6** for client-side routing
- **React Hook Form + Yup** for form validation

### Architectural principles

1. **Separation of concerns** — components, business logic, and data fetching are clearly separated
2. **Type safety** — TypeScript strict mode enforces type correctness
3. **Composition over inheritance** — favour composing components over class hierarchies
4. **Single responsibility** — each component/module has one clear purpose
5. **DRY (don't repeat yourself)** — reusable components and utilities
6. **Accessibility first** — WCAG 2.1 AA compliance built in

## Project structure

```
ChurchRegister.React/src/
├── components/          # Reusable UI components
│   ├── Administration/  # Admin-specific components
│   ├── Attendance/      # Attendance feature components
│   ├── ChurchMembers/   # Church members feature components
│   ├── Contributions/   # Contributions feature components
│   ├── Financial/       # Financial feature components
│   ├── Form/            # Form input components
│   ├── Layout/          # Layout components (Header, Sidebar, etc.)
│   ├── Loading/         # Loading state components
│   ├── Modal/           # Modal/dialog components
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
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── NotificationContext.tsx
├── hooks/               # Custom React hooks
│   ├── useAuth.ts
│   ├── useRBAC.ts
│   ├── useTheme.ts
│   ├── useNotification.ts
│   └── useTokenRefresh.ts
├── pages/               # Page components (route targets)
│   ├── DashboardPage.tsx
│   ├── LoginPage.tsx
│   ├── Administration/
│   ├── Attendance/
│   ├── Financial/
│   ├── auth/
│   └── error/
├── providers/
│   └── QueryProvider.tsx
├── services/
│   ├── api/             # API client and endpoint services
│   │   ├── ApiClient.ts
│   │   ├── churchMembersApi.ts
│   │   ├── contributionsApi.ts
│   │   └── ...
│   └── auth/
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
│   ├── typeGuards.ts
│   └── queryKeys.ts
├── validation/
│   └── schemas/         # Yup validation schemas (one per feature)
├── App.tsx              # Root component with routing
└── main.tsx             # Application entry point
```

### Folder organisation principles

- **Feature-based grouping** — components organised by domain/feature
- **Colocation** — related files (component + types + tests) live together
- **Barrel exports** — each folder has an `index.ts` for clean imports
- **Path aliases** — use `@components`, `@hooks`, `@utils`, etc. instead of relative paths

## Component architecture

### Component types

| Type | Location | Purpose |
|------|----------|---------|
| Page components | `src/pages/` | Top-level route targets; orchestrate data fetching |
| Feature components | `src/components/[Feature]/` | Domain-specific business logic |
| Shared components | `src/components/[Type]/` | Reusable UI primitives (Button, Table, Modal) |
| Layout components | `src/components/Layout/` | Application shell (Layout, Header, Sidebar) |

### Standard component pattern

```typescript
interface ComponentProps {
  prop1: string;
  prop2?: number;
  onAction: () => void;
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2, onAction }) => {
  // 1. Hooks
  const [state, setState] = useState('');
  const { data, isLoading } = useQuery({ ... });

  // 2. Derived values
  const label = `${prop1} (${prop2 ?? 0})`;

  // 3. Event handlers
  const handleClick = () => onAction();

  // 4. Early returns
  if (isLoading) return <SkeletonLoader rows={5} />;

  // 5. Render
  return <Box>{/* JSX */}</Box>;
};
```

## State management

| Category | Tool | Examples |
|----------|------|---------|
| Server state | TanStack Query (`useQuery`, `useMutation`) | Church members, contributions, attendance |
| Global client state | React Context | Auth, theme, notifications |
| Component-local state | `useState` / `useReducer` | Modal open, selected tab |
| Form state | React Hook Form | All form fields and validation |

### Query key factory

All query keys live in `src/utils/queryKeys.ts`:

```typescript
export const churchMemberKeys = {
  all: ['churchMembers'] as const,
  lists: () => [...churchMemberKeys.all, 'list'] as const,
  list: (query: object) => [...churchMemberKeys.lists(), query] as const,
  detail: (id: string) => [...churchMemberKeys.all, 'detail', id] as const,
};
```

## Routing strategy

All authenticated routes use the `/app` prefix. See [routing-navigation-conventions.md](../development/routing-navigation-conventions.md) for the full route table and protected-route component details.

Pages are lazy-loaded for optimal bundle size:

```typescript
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
```

## Authentication & authorisation

**Flow:**
1. User submits credentials → API returns JWT access token + refresh token
2. Tokens stored in `localStorage` via `tokenService`
3. `ApiClient` injects the `Authorization: Bearer <token>` header on every request
4. `useTokenRefresh` hook silently refreshes the access token before expiry
5. On logout, tokens are cleared and user is redirected to `/login`

**RBAC hooks:**
```typescript
const { hasRole } = useAuth();
const { hasPermission } = useAuthPermissions();
```

## API integration

API services are class-based singletons located in `src/services/api/`. Always import from the barrel (`@services/api`) and always call them through React Query — never directly in event handlers.

## Error handling

See [error-handling-patterns.md](../development/error-handling-patterns.md) for full details on backend exceptions, frontend `ErrorAlert`, React Query retry logic, and the `ErrorBoundary`.

## Performance optimisation

- All page-level components are code-split via `React.lazy`
- All data grids use server-side pagination (`paginationMode="server"`)
- Bundle chunks are split by vendor (react, MUI, recharts, etc.) — view with `npm run build` → `dist/stats.html`
- Apply `React.memo`, `useMemo`, `useCallback` only after profiling with React DevTools

## Testing strategy

- Co-locate test files: `MyComponent.test.tsx` alongside `MyComponent.tsx`
- Use Testing Library query priority: `getByRole` → `getByLabelText` → `getByText` → `getByTestId`
- Use MSW (Mock Service Worker) for API mocking in integration tests
- Coverage targets: >80% for hooks/utils; key interaction paths for components
