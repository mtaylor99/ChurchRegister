# API Services

This directory contains all API service classes for the ChurchRegister application.

## Pattern

All API services follow the **class-based singleton pattern**:

```typescript
export class FeatureApi {
  private basePath = '/api/feature';

  /**
   * Get items with optional filtering
   * @param params - Query parameters
   */
  async getItems(params: QueryParams): Promise<Item[]> {
    return apiClient.get<Item[]>(`${this.basePath}?${params}`);
  }

  /**
   * Create a new item
   * @param request - Create request body
   */
  async createItem(request: CreateItemRequest): Promise<Item> {
    return apiClient.post<Item, CreateItemRequest>(this.basePath, request);
  }
}

export const featureApi = new FeatureApi();
```

## Naming Conventions

| Element        | Convention          | Example                |
| -------------- | ------------------- | ---------------------- |
| Class          | `[Feature]Api`      | `ChurchMembersApi`     |
| Singleton      | `[feature]Api`      | `churchMembersApi`     |
| File           | `[feature]Api.ts`   | `churchMembersApi.ts`  |
| Base path      | `'/api/[resource]'` | `'/api/church-members'`|

## Available Services

| Service                  | File                          | Description                              |
| ------------------------ | ----------------------------- | ---------------------------------------- |
| `churchMembersApi`       | `churchMembersApi.ts`         | Church member CRUD, roles, statuses      |
| `contributionsApi`       | `contributionsApi.ts`         | Envelope contributions management        |
| `contributionHistoryApi` | `contributionHistoryApi.ts`   | Contribution history reporting           |
| `dashboardApi`           | `dashboardApi.ts`             | Dashboard statistics                     |
| `dataProtectionApi`      | `dataProtectionApi.ts`        | GDPR data protection management          |
| `districtsApi`           | `districtsApi.ts`             | District management                      |
| `hsbcTransactionsApi`    | `hsbcTransactionsApi.ts`      | HSBC bank statement import               |
| `administrationApi`      | `administrationApi.ts`        | User and system administration           |
| `trainingCertificatesApi`| `trainingCertificatesApi.ts`  | Training certificate management          |
| `reminderCategoriesApi`  | `reminderCategoriesApi.ts`    | Reminder category management             |
| `remindersApi`           | `remindersApi.ts`             | Reminder management                      |
| `riskAssessmentsApi`     | `riskAssessmentsApi.ts`       | Risk assessment management               |

## Usage

Always import services from the barrel export for consistency:

```typescript
// ✅ Correct - import from barrel
import { churchMembersApi, remindersApi } from '@services/api';

// ❌ Avoid - direct file imports
import { churchMembersApi } from '../services/api/churchMembersApi';
```

## HTTP Client

All services use the centralized `apiClient` from `ApiClient.ts` which provides:

- Automatic JWT token injection via request interceptors
- 401 redirect to login on unauthorized responses
- Consistent error handling
- Base URL configuration from environment variables

## Error Handling

API service methods throw errors on failure. Handle errors in the consuming hook
using React Query's `onError` callback:

```typescript
const mutation = useMutation({
  mutationFn: (data) => featureApi.createItem(data),
  onError: (error: unknown) => {
    const message = getErrorMessage(error);
    showError(message);
  },
});
```

## Adding a New Service

1. Create `src/services/api/[feature]Api.ts`
2. Define the class following the naming convention
3. Add JSDoc comments to all methods describing Request/Response types
4. Export a singleton instance at the bottom of the file
5. Add the export to `src/services/api/index.ts`
