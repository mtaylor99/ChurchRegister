# Custom Hooks

This directory contains all custom React hooks for the ChurchRegister application.

## Naming Convention

| Pattern         | When to use                                      | Example                  |
| --------------- | ------------------------------------------------ | ------------------------ |
| `use[Feature]`  | Hooks that manage a feature's full state/queries | `useReminders`, `useRBAC`|
| `use[Action]`   | Hooks for a specific action or side effect       | `useFocus`, `useToast`   |

## Hook Structure Pattern

All hooks follow a consistent internal structure:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { featureApi } from '@services/api';
import type { FeatureDto, CreateFeatureRequest } from '@types/feature';
import { useNotification } from './useNotification';
import { featureKeys } from '@utils/queryKeys';

/**
 * Hook to fetch items with optional filtering.
 * @param params - Query parameters for filtering
 * @returns React Query result with data, loading, and error state
 */
export const useFeatureItems = (params: FeatureQueryParams) => {
  return useQuery({
    queryKey: featureKeys.list(params),
    queryFn: () => featureApi.getItems(params),
  });
};

/**
 * Hook to create a new feature item.
 * Invalidates all feature queries and shows success/error toast on completion.
 */
export const useCreateFeatureItem = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: (request: CreateFeatureRequest) =>
      featureApi.createItem(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featureKeys.all });
      showSuccess('Item created successfully');
    },
    onError: (error: unknown) => {
      showError(error instanceof Error ? error.message : 'Failed to create item');
    },
  });
};
```

## Query Keys

All query keys are centralised in `@utils/queryKeys`. **Do not define new query key
objects inside hook files.** Instead, add the key factory to `src/utils/queryKeys.ts`
and import it in the hook.

```typescript
// ✅ Correct
import { featureKeys } from '@utils/queryKeys';
queryKey: featureKeys.list(params),

// ❌ Avoid
queryKey: ['feature', 'list', params],
```

## Return Types

- **Query hooks** return the full React Query result object — consumers destructure what they need.
- **Mutation hooks** return the React Query mutation result object.
- **Utility hooks** return an object (not an array) with named properties.

```typescript
// Query hook - return full result
export const useFeatureItems = (params) => {
  return useQuery({ ... }); // ✅ Return directly
};

// Utility hook - return named object
export const useFeatureUtils = () => {
  return {
    validate: ...,
    format: ...,
  };
};
```

## Error Handling

- Mutations should use `showSuccess` / `showError` from `useNotification` inside `onSuccess` / `onError`.
- Queries expose `isError` and `error` for components to handle display.
- **Do not** throw errors from hooks when the calling component can handle them.

## Available Hooks

| Hook                     | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `useAccessibility`       | Accessibility helpers (skip links, focus management)   |
| `useAttendance`          | Attendance records, events, and analytics queries      |
| `useDataProtection`      | GDPR data protection consent queries                   |
| `useDistricts`           | District list queries and member assignment mutations  |
| `useFocus`               | Focus management utilities for modals and drawers      |
| `useNavigation`          | Application navigation helpers                         |
| `useNotification`        | Toast notification dispatch                            |
| `useRBAC`                | Role-based access control checks                       |
| `useRegisterNumbers`     | Register number generation and preview                 |
| `useReminderCategories`  | Reminder category CRUD queries                         |
| `useReminders`           | Reminder CRUD queries and dashboard summary            |
| `useRiskAssessments`     | Risk assessment CRUD queries                           |
| `useTheme`               | MUI theme and colour mode toggle                       |
| `useToast`               | Low-level toast display                                |
| `useTokenRefresh`        | JWT token refresh timer                                |

## Adding a New Hook

1. Create `src/hooks/use[Feature].ts`
2. Follow the naming and structure patterns above
3. Add query keys to `src/utils/queryKeys.ts` **first**
4. Export from `src/hooks/index.ts`
5. Add a row to the table above
