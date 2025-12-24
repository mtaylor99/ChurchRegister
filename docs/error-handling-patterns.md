# Error Handling Patterns

This document describes the standardized error handling patterns used throughout the Church Register application.

## Backend Error Handling

### Custom Exception Types

The application uses domain-specific exceptions that automatically map to HTTP status codes:

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

### Global Exception Handler

All exceptions are caught by `GlobalExceptionHandlerMiddleware` which:

1. Maps exceptions to appropriate HTTP status codes
2. Generates correlation IDs for tracking
3. Logs exceptions with appropriate severity levels
4. Returns standardized `ErrorResponse` objects
5. Hides sensitive error details in production

### Validation Helpers

Use `ValidationHelpers` for consistent input validation:

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
```

### Service Layer Pattern

Services should validate inputs and throw appropriate exceptions:

```csharp
public async Task<ChurchMemberDto> GetChurchMemberAsync(Guid id)
{
    ValidationHelpers.RequireValidGuid(id, nameof(id));

    var member = await _context.ChurchMembers
        .FirstOrDefaultAsync(m => m.Id == id);

    if (member == null)
    {
        throw new NotFoundException("Church member", id);
    }

    return _mapper.Map<ChurchMemberDto>(member);
}
```

## Frontend Error Handling

### React Error Boundary

The application uses an `ErrorBoundary` component to catch React rendering errors:

```tsx
// App.tsx
<ErrorBoundary>
  <Suspense fallback={<PageLoadingFallback />}>
    <Routes>{/* routes */}</Routes>
  </Suspense>
</ErrorBoundary>
```

The error boundary provides:

- Fallback UI with error details (dev mode only)
- "Try Again" button to recover from errors
- "Go to Home" button for navigation
- Automatic error logging

### ErrorAlert Component

Use `ErrorAlert` for displaying errors in a consistent, user-friendly way:

```tsx
import { ErrorAlert } from "@/components/ErrorAlert";

function MyComponent() {
  const [error, setError] = useState<Error | null>(null);

  return (
    <>
      {error && (
        <ErrorAlert
          error={error}
          onRetry={() => refetch()}
          onDismiss={() => setError(null)}
        />
      )}
    </>
  );
}
```

The component automatically translates technical errors to user-friendly messages:

- Network errors → "Unable to connect to the server..."
- 401 → "You are not authorized. Please log in again."
- 403 → "You do not have permission to access this resource."
- 404 → "The requested resource was not found."
- 500 → "A server error occurred. Please try again later..."

### React Query Error Handling

Use the standardized query configuration helpers:

```tsx
import { createQueryConfig, staticDataQueryConfig } from "@/config/queryConfig";

// Static data (roles, statuses) - cache for 1 hour
const { data: roles } = useQuery({
  queryKey: ["roles"],
  queryFn: fetchRoles,
  ...staticDataQueryConfig,
});

// Dynamic data (lists) - cache for 5 minutes, refetch on focus
const { data: members } = useQuery({
  queryKey: ["members"],
  queryFn: fetchMembers,
  ...createQueryConfig({
    onError: (error) => {
      logger.error("Failed to fetch members", { error });
      showNotification("Failed to load church members");
    },
  }),
});

// Real-time data (dashboard) - cache for 30 seconds
const { data: stats } = useQuery({
  queryKey: ["dashboard-stats"],
  queryFn: fetchStats,
  ...realtimeDataQueryConfig,
});
```

### Retry Logic

The application uses smart retry logic configured in `queryConfig.ts`:

- **Automatic retries**: 3 attempts with exponential backoff (1s, 2s, 4s)
- **Skips 4xx errors**: Client errors (401, 403, 404, 409) are not retried
- **Retries 5xx and network errors**: Server errors and network issues are retried
- **Maximum delay**: Capped at 30 seconds to prevent excessive waiting

### Validation Utilities

Use validation helpers for form validation:

```tsx
import { isValidEmail, isValidUKPhone, validate } from "@/utils/validation";

// Single validation
if (!isValidEmail(email)) {
  setError("Email must be a valid email address");
}

// Multiple validations
const result = validate(email, [
  { type: "required", field: "Email" },
  { type: "email", field: "Email" },
]);

if (!result.isValid) {
  setError(result.error);
}
```

## Error Response Format

All API errors follow this standardized format:

```json
{
  "message": "Resource not found",
  "errors": ["Church member with ID '123' was not found"],
  "correlationId": "7e8f9a0b-1c2d-3e4f-5a6b-7c8d9e0f1a2b"
}
```

Use the `correlationId` to track errors across logs and support requests.

## Logging Best Practices

### Backend Logging

```csharp
// Information - successful operations
_logger.LogInformation("Church member {MemberId} created successfully", memberId);

// Warning - expected errors (validation, not found)
_logger.LogWarning("Failed login attempt for user {Username}", username);

// Error - unexpected exceptions
_logger.LogError(ex, "Failed to process contribution batch {BatchId}", batchId);
```

### Frontend Logging

```tsx
import { logger } from "@/utils/logger";

// Only logs in development mode
logger.debug("Component rendered", { props });
logger.info("API call started", { endpoint });
logger.warn("Deprecated feature used", { feature });

// Always logs (even in production)
logger.error("API call failed", { error, endpoint });
```

## Best Practices

1. **Use domain exceptions**: Throw specific exceptions (NotFoundException, ValidationException) instead of generic exceptions
2. **Validate early**: Validate inputs at the service layer before processing
3. **Centralize error display**: Use ErrorAlert component instead of custom error displays
4. **Log with context**: Include correlation IDs, entity IDs, and relevant context in logs
5. **User-friendly messages**: Show technical details only in development mode
6. **Retry transient failures**: Let React Query retry network and server errors automatically
7. **Cache appropriately**: Use staticDataQueryConfig for reference data, dynamicDataQueryConfig for lists
8. **Test error paths**: Write tests for error scenarios, not just happy paths

## Example: Complete Error Handling Flow

```tsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { createQueryConfig } from "@/config/queryConfig";
import { ErrorAlert } from "@/components/ErrorAlert";
import { validate, isValidEmail } from "@/utils/validation";
import { logger } from "@/utils/logger";

function CreateMemberForm() {
  const [error, setError] = useState<Error | null>(null);

  const mutation = useMutation({
    mutationFn: createMember,
    ...createQueryConfig({
      onSuccess: () => {
        logger.info("Member created successfully");
        showNotification("Member created successfully");
      },
      onError: (err) => {
        logger.error("Failed to create member", { error: err });
        setError(err as Error);
      },
    }),
  });

  const handleSubmit = (data: MemberFormData) => {
    // Validate inputs
    const validation = validate(data.email, [
      { type: "required", field: "Email" },
      { type: "email", field: "Email" },
    ]);

    if (!validation.isValid) {
      setError(new Error(validation.error));
      return;
    }

    mutation.mutate(data);
  };

  return (
    <>
      {error && (
        <ErrorAlert
          error={error}
          onRetry={() => mutation.mutate()}
          onDismiss={() => setError(null)}
        />
      )}

      <form onSubmit={handleSubmit}>{/* form fields */}</form>
    </>
  );
}
```

## Troubleshooting

### Common Issues

**Error: "Correlation ID not found in logs"**

- Ensure GlobalExceptionHandlerMiddleware is registered in Program.cs
- Check that the error occurred after middleware registration

**Error: "Uncaught error in production"**

- Verify ErrorBoundary is wrapping your component tree
- Check browser console for error details
- Look for correlation ID in API response

**Error: "Retry loop not stopping"**

- Check if error is 4xx (should not retry) vs 5xx (should retry)
- Verify retry count is not exceeded (max 3 attempts)
- Check network tab for actual HTTP status codes

**Error: "Validation error not showing"**

- Ensure ValidationException is thrown (not generic Exception)
- Check that GlobalExceptionHandlerMiddleware is catching the exception
- Verify ErrorAlert is rendering in your component

## Related Documentation

- [API Documentation](./api-documentation.md)
- [Logging Patterns](./logging-patterns.md)
- [Testing Guidelines](./testing-guidelines.md)
