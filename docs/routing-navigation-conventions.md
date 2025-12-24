# Frontend Routing & Navigation Conventions

## Route Structure

All application routes follow a consistent structure with the `/app` prefix for authenticated pages.

### Route Patterns

```
Public Routes:
  /login                           - Login page
  /error/404                       - Not Found page
  /error/500                       - Server Error page
  /error/unauthorized              - Unauthorized access page

Protected Routes (requires authentication):
  /app/dashboard                   - Main dashboard
  /app/change-password             - Change password page

  /app/attendance                  - Attendance management

  /app/members                     - Church members list

  /app/contributions               - Contributions overview

  /app/financial/envelope-contributions/entry    - Envelope entry form
  /app/financial/envelope-contributions/history  - Envelope history

  /app/administration/users        - User management (SystemAdministration)
  /app/administration/register-numbers - Generate register numbers (Financial roles)
```

## Protected Route Components

### Component Hierarchy

1. **ProtectedRoute** - Base component with comprehensive RBAC

   - Path: `src/components/auth/ProtectedRoute.tsx`
   - Features: Role checking, permission checking, resource ownership, email confirmation
   - Props: `requiredRoles`, `requiredPermissions`, `resource`, `allowOwnership`, etc.

2. **ProtectedAdminRoute** - Requires `SystemAdministration` role

   - Path: `src/components/auth/ProtectedAdminRoute.tsx`
   - Usage: Administration section
   - Custom unauthorized UI with role information

3. **ProtectedFinancialRoute** - Requires financial roles

   - Path: `src/components/auth/ProtectedFinancialRoute.tsx`
   - Default roles: SystemAdministration, FinancialAdministrator, FinancialContributor, FinancialViewer
   - Can override with `requiredRoles` prop

4. **ProtectedAttendanceRoute** - Permission-based for attendance features

   - Path: `src/components/auth/ProtectedAttendanceRoute.tsx`
   - Requires specific permission (e.g., `Attendance.View`)
   - Props: `requiredPermission`, `featureName`

5. **ProtectedChurchMembersRoute** - Permission-based for member features
   - Path: `src/components/auth/ProtectedChurchMembersRoute.tsx`
   - Requires specific permission (e.g., `ChurchMembers.View`)
   - Props: `requiredPermission`, `featureName`

### Usage Pattern

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

## Navigation Components

### Sidebar Navigation

**File:** `src/components/Layout/Sidebar.tsx`

Navigation items with role-based visibility:

```tsx
const navigationItems: NavigationItem[] = [
  { id: 'dashboard', path: '/app/dashboard', ... },
  { id: 'attendance', path: '/app/attendance', ... },
  { id: 'members', path: '/app/members', ... },
  { id: 'contributions', path: '/app/contributions', roles: ['FinancialViewer', ...] },
  { id: 'administration', path: '/app/administration/users', ... },
];
```

**Role Filtering:** Sidebar items with `roles` property are only visible to users with matching roles.

### Layout Navigation

**File:** `src/components/Layout/Layout.tsx`

Main layout with drawer navigation, includes permission-based filtering:

```tsx
allNavigationItems.filter((item) => {
  if (item.requiredRole) return hasRole(item.requiredRole);
  if (item.requiredPermission) return hasPermission(item.requiredPermission);
  return true;
});
```

### Administration Layout

**File:** `src/components/Layout/AdministrationLayout.tsx`

Tab-based navigation for administration section with automatic breadcrumbs:

```tsx
const adminTabs = [
  { label: 'Users', path: '/app/administration/users', ... },
  { label: 'Register Numbers', path: '/app/administration/register-numbers', ... },
];
```

## Redirect Patterns

### Login Redirect

When not authenticated, users are redirected to `/login` with return URL:

```tsx
const loginPath = `${redirectTo}?returnUrl=${encodeURIComponent(
  location.pathname + location.search
)}`;
return <Navigate to={loginPath} replace state={{ from: location }} />;
```

**Special case:** Logout in progress skips returnUrl to prevent redirect loops.

### Unauthorized Access

When user lacks required roles/permissions:

- Custom error page shown inline (no redirect)
- UnauthorizedPage component displays required roles/permissions
- "Go Back" and "Return to Dashboard" buttons provided

### Default Route

Root path `/` redirects to `/login`:

```tsx
<Route path="/" element={<Navigate to="/login" replace />} />
```

## 404 Handling

Catch-all route at end of Routes:

```tsx
<Route path="*" element={<NotFoundPage />} />
```

Works for:

- Invalid URLs
- Routes user doesn't have permission to access
- Typos in navigation

## Navigation State

### Return URL Handling

ProtectedRoute automatically:

1. Captures current location when redirecting to login
2. Passes as `returnUrl` query parameter
3. Skips returnUrl during logout to prevent loops

### Location State

Navigation includes location state for proper back navigation:

```tsx
state={{ from: location }}
```

## Route Parameters

Currently, the application does not use route parameters (`:id`, `:memberId`, etc.). All data is passed via:

- Query parameters in URL search
- Component state
- Context (Auth, Theme, Notifications)
- React Query cache

## Code Splitting

All pages except LoginPage use lazy loading:

```tsx
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage }))
);
```

**Benefits:**

- Faster initial load
- Smaller bundle size
- Better performance

**Loading State:**

```tsx
<Suspense fallback={<CircularProgress />}>
  <Routes>...</Routes>
</Suspense>
```

## Best Practices

### 1. Always use `/app` prefix for protected routes

```tsx
// ✅ Good
path: "/app/dashboard";

// ❌ Bad
path: "/dashboard";
```

### 2. Use specific protected route components

```tsx
// ✅ Good - Uses specific component
<ProtectedFinancialRoute>
  <EnvelopeEntry />
</ProtectedFinancialRoute>

// ❌ Bad - Generic with manual role checking
<ProtectedRoute>
  {hasFinancialRole() && <EnvelopeEntry />}
</ProtectedRoute>
```

### 3. Provide feature names for better UX

```tsx
<ProtectedAttendanceRoute
  requiredPermission="Attendance.View"
  featureName="attendance tracking" // Shows in error message
>
```

### 4. Use relative paths in nested routes

```tsx
<Route path="/app" element={<Layout />}>
  <Route path="dashboard" element={<Dashboard />} /> {/* Not /app/dashboard */}
</Route>
```

### 5. Handle redirects consistently

```tsx
// ✅ Good - Absolute paths
window.location.href = "/app/dashboard";

// ✅ Also good - React Router navigation
navigate("/app/dashboard");

// ❌ Bad - Relative or inconsistent
window.location.href = "/dashboard";
```

## Maintenance Checklist

When adding new routes:

- [ ] Add route to App.tsx
- [ ] Add navigation item to Sidebar.tsx (if needed)
- [ ] Add navigation item to Layout.tsx (if needed)
- [ ] Use appropriate ProtectedRoute component
- [ ] Add lazy loading for page component
- [ ] Update breadcrumbs in AdministrationLayout if admin route
- [ ] Add role/permission checks if restricted
- [ ] Test 404 handling
- [ ] Test unauthorized access handling
- [ ] Test returnUrl redirect after login
- [ ] Update this documentation

## Related Files

- `src/App.tsx` - Main route configuration
- `src/components/auth/*.tsx` - Protected route components
- `src/components/Layout/Layout.tsx` - Main layout with navigation
- `src/components/Layout/Sidebar.tsx` - Sidebar navigation
- `src/components/Layout/AdministrationLayout.tsx` - Admin section layout
- `src/contexts/useAuth.tsx` - Authentication context
- `src/hooks/useRBAC.ts` - Role-based access control hook
