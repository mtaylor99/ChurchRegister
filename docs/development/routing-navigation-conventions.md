# Frontend routing & navigation conventions

## Route structure

All authenticated routes use the `/app` prefix. All unauthenticated routes are at the root level.

### Route table

| Route | Protection | Notes |
|-------|-----------|-------|
| `/` | Public | Redirects to `/login` |
| `/login` | Public | Login page |
| `/error/404` | Public | Not Found page |
| `/error/500` | Public | Server Error page |
| `/error/unauthorized` | Public | Unauthorised access page |
| `/app/dashboard` | `Bearer` | Main dashboard |
| `/app/change-password` | `Bearer` | Change password |
| `/app/attendance` | `AttendanceViewPolicy` | Attendance management |
| `/app/members` | `ChurchMembers.View` permission | Church members list |
| `/app/contributions` | Financial role | Contributions overview |
| `/app/financial/envelope-contributions/entry` | Financial role | Envelope entry form |
| `/app/financial/envelope-contributions/history` | Financial role | Envelope history |
| `/app/administration/users` | `SystemAdministration` role | User management |
| `/app/administration/register-numbers` | `FinancialAdministrator` or `SystemAdministration` | Annual membership numbers |

Catch-all `*` renders `<NotFoundPage />`.

## Protected route components

| Component | File | Protection mechanism |
|-----------|------|---------------------|
| `ProtectedRoute` | `src/components/auth/ProtectedRoute.tsx` | Base — role, permission, resource, email confirmation |
| `ProtectedAdminRoute` | `src/components/auth/ProtectedAdminRoute.tsx` | Requires `SystemAdministration` role |
| `ProtectedFinancialRoute` | `src/components/auth/ProtectedFinancialRoute.tsx` | Requires financial roles (configurable via `requiredRoles` prop) |
| `ProtectedAttendanceRoute` | `src/components/auth/ProtectedAttendanceRoute.tsx` | Requires specific permission (e.g. `Attendance.View`) |
| `ProtectedChurchMembersRoute` | `src/components/auth/ProtectedChurchMembersRoute.tsx` | Requires specific permission (e.g. `ChurchMembers.View`) |

### Usage pattern

```tsx
<Route
  path="members"
  element={
    <ProtectedChurchMembersRoute
      requiredPermission="ChurchMembers.View"
      featureName="church members"
    >
      <ChurchMembers />
    </ProtectedChurchMembersRoute>
  }
/>
```

## Navigation components

### Sidebar (`src/components/Layout/Sidebar.tsx`)

Navigation items include a `roles` array for visibility filtering. Items without a `roles` property are visible to all authenticated users. Items with `requiredRole` or `requiredPermission` are filtered by `hasRole()` / `hasPermission()` from `useRBAC`.

### Administration layout (`src/components/Layout/AdministrationLayout.tsx`)

Tab-based navigation for the administration section with automatic breadcrumbs:

```tsx
const adminTabs = [
  { label: 'Users', path: '/app/administration/users' },
  { label: 'Register Numbers', path: '/app/administration/register-numbers' },
];
```

## Redirect patterns

### Login redirect

When unauthenticated, users are redirected to `/login` with a `returnUrl` query parameter:

```tsx
const loginPath = `${redirectTo}?returnUrl=${encodeURIComponent(
  location.pathname + location.search
)}`;
return <Navigate to={loginPath} replace state={{ from: location }} />;
```

On logout, `returnUrl` is omitted to prevent redirect loops.

### Unauthorised access

When a user lacks required roles/permissions, the unauthorised page is shown **inline** (no redirect). It displays required roles/permissions and provides "Go Back" and "Return to Dashboard" buttons.

## Lazy loading

All page-level components are lazy-loaded in `App.tsx`:

```typescript
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
```

**Do not** import page components eagerly — this bloats the initial bundle.

## Route parameters

The application does not currently use path parameters (`:id`, `:memberId`, etc.). All data is passed via:

- Query parameters in the URL search string
- Component state
- React Context (Auth, Theme, Notifications)
- React Query cache
