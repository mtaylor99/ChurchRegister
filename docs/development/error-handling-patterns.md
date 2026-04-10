# Error handling patterns

This document describes the standardised error handling patterns used throughout the ChurchRegister application.

## Backend error handling

### Custom exception types

The application uses domain-specific exceptions that automatically map to HTTP status codes via `GlobalExceptionHandlerMiddleware`:

```csharp
// 404 Not Found
throw new NotFoundException("Church member", memberId);

// 400 Bad Request with validation errors
throw new ValidationException("Invalid email format", new List<string>
{
    "Email must be a valid email address",
    "Phone number is required"
});

// 409 Conflict
throw new ConflictException("A member with this email already exists");

// 401 Unauthorized
throw new UnauthorizedException("Invalid credentials");

// 403 Forbidden
throw new ForbiddenException("You do not have permission to access this resource");
```

### Global exception handler

All unhandled exceptions are caught by `GlobalExceptionHandlerMiddleware` which:

1. Maps exceptions to appropriate HTTP status codes
2. Generates correlation IDs for tracking
3. Logs exceptions with appropriate severity levels
4. Returns standardised `ErrorResponse` objects
5. Hides sensitive error details in production

### Error response format

All API errors return this JSON shape:

```json
{
  "message": "Resource not found",
  "errors": ["Church member with ID '123' was not found"],
  "correlationId": "7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b"
}
```

Use `correlationId` to cross-reference server logs with a specific request.

### Validation helpers

Use `ValidationHelpers` for consistent input validation inside use cases and services:

```csharp
// Required fields
ValidationHelpers.RequireNonEmpty(request.FirstName, nameof(request.FirstName));
ValidationHelpers.RequireNotNull(request.Address, nameof(request.Address));

// Format validation
ValidationHelpers.RequireValidEmail(request.Email);
ValidationHelpers.RequireValidUKPhone(request.PhoneNumber);
ValidationHelpers.RequireValidUKPostcode(request.Postcode);

// Range validation
ValidationHelpers.RequirePositive(request.Amount, nameof(request.Amount));
ValidationHelpers.RequireInRange(request.PageSize, 1, 100, nameof(request.PageSize));

// Date validation
ValidationHelpers.RequireNotFutureDate(request.BirthDate, nameof(request.BirthDate));

// Collection validation
ValidationHelpers.RequireNonEmptyCollection(request.Items, nameof(request.Items));

// Guid validation
ValidationHelpers.RequireValidGuid(id, nameof(id));
```

### Service layer pattern

Services validate inputs before calling EF Core:

```csharp
public async Task<ChurchMemberDto> GetChurchMemberAsync(Guid id)
{
    ValidationHelpers.RequireValidGuid(id, nameof(id));

    var member = await _context.ChurchMembers
        .FirstOrDefaultAsync(m => m.Id == id);

    if (member == null)
        throw new NotFoundException("Church member", id);

    return _mapper.Map<ChurchMemberDto>(member);
}
```

### Backend logging levels

```csharp
// Successful operations
_logger.LogInformation("Church member {MemberId} created successfully", memberId);

// Expected errors (validation, not found)
_logger.LogWarning("Failed login attempt for user {Username}", username);

// Unexpected exceptions
_logger.LogError(ex, "Failed to process contribution batch {BatchId}", batchId);
```

**Never** log passwords, JWT tokens, email addresses, or connection strings.

---

## Frontend error handling

### React error boundary

`ErrorBoundary` wraps the entire application in `App.tsx` and catches React rendering errors:

```tsx
<ErrorBoundary>
  <Suspense fallback={<PageLoadingFallback />}>
    <Routes>{/* routes */}</Routes>
  </Suspense>
</ErrorBoundary>
```

Use `withErrorBoundary` HOC for page-level components:

```tsx
import { withErrorBoundary } from '@utils';
export default withErrorBoundary(MyPage);
```

### ErrorAlert component

Use `<ErrorAlert>` for displaying errors consistently:

```tsx
import { ErrorAlert } from '@components/ErrorAlert';

{error && (
  <ErrorAlert
    error={error}
    onRetry={() => refetch()}
    onDismiss={() => setError(null)}
  />
)}
```

The component translates technical errors into user-friendly messages:

| HTTP status | User message |
|------------|-------------|
| Network error | "Unable to connect to the server…" |
| 401 | "You are not authorised. Please log in again." |
| 403 | "You do not have permission to access this resource." |
| 404 | "The requested resource was not found." |
| 500 | "A server error occurred. Please try again later…" |

### React Query error handling

Use the config helpers from `@config/queryConfig`:

```tsx
// Static data (roles, statuses) — cache for 1 hour
const { data: roles } = useQuery({
  queryKey: ['roles'],
  queryFn: fetchRoles,
  ...staticDataQueryConfig,
});

// Dynamic data — cache for 5 minutes
const { data: members } = useQuery({
  queryKey: ['members'],
  queryFn: fetchMembers,
  ...createQueryConfig({
    onError: (error) => showNotification('Failed to load church members'),
  }),
});
```

### Retry logic

Configured in `queryConfig.ts`:

- 3 attempts with exponential backoff (1s, 2s, 4s)
- 4xx errors (401, 403, 404, 409) are **not** retried
- 5xx and network errors **are** retried
- Maximum delay capped at 30 seconds

### Unknown error type narrowing

```typescript
import { extractErrorMessage } from '@utils/typeGuards';

onError: (error: unknown) => {
  const message = extractErrorMessage(error, 'Failed to create item');
  showError(message);
},
```

## Best practices summary

1. Throw domain-specific exceptions, not generic `Exception`
2. Validate inputs at the use case/service layer before calling EF Core
3. Use `<ErrorAlert>` — do not create custom error UI in components
4. Log with structured context (entity IDs, user IDs, correlation IDs)
5. Show technical details only in development mode
6. Let React Query retry transient failures automatically
7. Write tests for error paths, not just happy paths
