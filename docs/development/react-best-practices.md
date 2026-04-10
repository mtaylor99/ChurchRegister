# React best practices

Guidelines and conventions for the ChurchRegister React application. Follow these practices to ensure consistency, maintainability, and quality.

## Table of contents

1. [Component architecture](#1-component-architecture)
2. [TypeScript & type safety](#2-typescript--type-safety)
3. [Form validation](#3-form-validation)
4. [State management](#4-state-management)
5. [API services & data fetching](#5-api-services--data-fetching)
6. [React Query query keys](#6-react-query-query-keys)
7. [Error handling](#7-error-handling)
8. [Custom hooks](#8-custom-hooks)
9. [Barrel exports](#9-barrel-exports)
10. [Performance](#10-performance)
11. [Accessibility](#11-accessibility)
12. [Testing](#12-testing)

---

## 1. Component architecture

### Functional components only

Always use functional components. Class components are **not** used.

### Component structure (in order)

```
1. Imports
2. Props interface (exported)
3. Styled components (if any)
4. Component function
5. Default/named export
```

### Component size

- **Maximum 300 lines** of TSX per component file
- Extract sub-components into sibling files within the same feature folder
- Extract complex logic into a custom hook (prefix with `use`)

### Forms — controlled pattern only

All forms use `react-hook-form` with `Controller` for MUI fields. Do **not** mix controlled and uncontrolled inputs.

```tsx
// ✅ Correct
const { control, handleSubmit, formState: { errors } } = useForm({
  resolver: yupResolver(mySchema),
  defaultValues: { name: '' },
  mode: 'onChange',
});

<Controller
  name="name"
  control={control}
  render={({ field }) => (
    <TextField {...field} error={!!errors.name} helperText={errors.name?.message} />
  )}
/>

// ❌ Avoid — uncontrolled
const nameRef = useRef<HTMLInputElement>(null);
<input ref={nameRef} defaultValue="" />
```

**Rules:**
- Every form field must be registered with `react-hook-form`
- Validation schemas live in `src/validation/schemas/` — never define them inline
- Large grids with filters are **not** forms — use plain `useState` for filter state

---

## 2. TypeScript & type safety

### No `any` types

```typescript
// ✅ Correct
const handleError = (error: Error) => { ... };

// ✅ When unavoidable — document it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const legacyCallback = (data: any) => { ... }; // TODO: type properly
```

### Type guards

Use helpers from `@utils/typeGuards`:

```typescript
import { isPresent, extractErrorMessage } from '@utils/typeGuards';

const items = data?.items.filter(isPresent) ?? [];
const message = extractErrorMessage(error); // safe, never throws
```

### Runtime validation with Zod

Use Zod when validating external data (API responses, `localStorage`, URL params):

```typescript
import { z } from 'zod';
import { safeParseJson } from '@utils/typeGuards';

const prefsSchema = z.object({ theme: z.enum(['light', 'dark']) });
const prefs = safeParseJson(localStorage.getItem('prefs') ?? '', prefsSchema);
```

---

## 3. Form validation

### Centralised Yup schemas

All validation schemas live in `src/validation/schemas/`:

```typescript
// ✅ Correct
import { addChurchMemberSchema } from '@validation/schemas';

// ❌ Avoid — inline schemas
const form = useForm({
  resolver: yupResolver(yup.object({ firstName: yup.string().required() })),
});
```

### Validation error display

- Use `FormHelperText` (via MUI `helperText` prop) for field-level errors
- Use `<ErrorAlert>` for submission/API errors displayed above the form

---

## 4. State management

| State type | Tool |
|-----------|------|
| Server state | React Query (`useQuery`, `useMutation`) |
| Global client state | React Context (`AuthContext`, `NotificationContext`, `ThemeContext`) |
| Component-local state | `useState` / `useReducer` |
| Form state | React Hook Form |

**Do not** put server state in Context — React Query handles caching already.

---

## 5. API services & data fetching

### Always import from the barrel

```typescript
// ✅ Correct
import { churchMembersApi } from '@services/api';

// ❌ Avoid — direct file import
import { churchMembersApi } from '../../services/api/churchMembersApi';
```

### Class + singleton pattern

All API services are class-based singletons. See `src/services/api/` for examples.

### Never fetch outside React Query

API calls must go through `useQuery` / `useMutation`. Do not call API services directly in event handlers (use mutations instead).

---

## 6. React Query query keys

### Always use the centralised factory

```typescript
import { churchMemberKeys, reminderKeys } from '@utils/queryKeys';

useQuery({ queryKey: churchMemberKeys.list(query), ... });
queryClient.invalidateQueries({ queryKey: reminderKeys.all });
```

### Key hierarchy

| Factory method | Key shape | Use for |
|---------------|-----------|---------|
| `keys.all` | `['feature']` | Invalidate entire domain |
| `keys.lists()` | `['feature', 'list']` | All list queries |
| `keys.list(params)` | `['feature', 'list', params]` | Specific filtered list |
| `keys.detail(id)` | `['feature', 'detail', id]` | Single item by ID |

---

## 7. Error handling

### API errors — toast + inline

- Automatic toast for success/error (via `ApiClient` interceptors and mutation `onError`)
- Inline `<ErrorAlert>` above the form for submission errors

```tsx
import { ErrorAlert } from '@components/ErrorAlert';

const [submitError, setSubmitError] = useState<string | null>(null);
{submitError && <ErrorAlert message={submitError} />}
```

### Unknown error narrowing

```typescript
import { extractErrorMessage } from '@utils/typeGuards';

onError: (error: unknown) => {
  const message = extractErrorMessage(error, 'Failed to create item');
  showError(message);
},
```

---

## 8. Custom hooks

Key principles (see `src/hooks/README.md` for the full guide):
- Import query keys from `@utils/queryKeys`
- Return an object (not an array) from utility hooks
- Handle `onSuccess`/`onError` inside mutations, not in component callbacks
- Export from `src/hooks/index.ts`

---

## 9. Barrel exports

Every feature folder must have an `index.ts` barrel:

```typescript
// src/components/MyFeature/index.ts
export { MyGrid } from './MyGrid';
export type { MyGridProps } from './MyGrid';
export { MyDrawer } from './MyDrawer';
```

Import using path aliases:

```typescript
// ✅ Correct
import { MyGrid } from '@components/MyFeature';

// ❌ Avoid
import { MyGrid } from '../../components/MyFeature/MyGrid';
```

---

## 10. Performance

**Profile first** using React DevTools Profiler. Apply optimisations only where measured.

### Lazy loading

All page-level components are lazy-loaded in `App.tsx`:

```typescript
// ✅ Correct
const MyNewPage = lazy(() =>
  import('./pages/MyNewPage').then((m) => ({ default: m.MyNewPage }))
);

// ❌ Avoid — eager import bloats the initial bundle
import { MyNewPage } from './pages/MyNewPage';
```

### Bundle analysis

```bash
npm run build
# Open dist/stats.html
```

Automatic chunk splitting:

| Chunk | Contents |
|-------|----------|
| `vendor-react` | react, react-dom |
| `mui-core` | @mui/material |
| `mui-icons` | @mui/icons-material |
| `mui-datagrid` | @mui/x-data-grid |
| `vendor-pdf` | jspdf, html2canvas |
| `vendor-charts` | recharts |
| `vendor-forms` | react-hook-form, yup, zod |

Target: keep each chunk below 500 kB gzipped.

### When to use `useMemo` / `useCallback` / `React.memo`

```typescript
// ✅ useMemo — expensive derived value
const sortedItems = useMemo(() => [...items].sort(compareFn), [items]);

// ❌ useMemo — cheap calculation (not worth it)
const label = useMemo(() => `Hello ${name}`, [name]);

// ✅ useCallback — callback passed as prop to child
const handleDelete = useCallback((id: string) => deleteMutation.mutate(id), [deleteMutation]);
```

### Server-side pagination

All data grids use `paginationMode="server"`. **Never** load all records into memory.

---

## 11. Accessibility

Target: **WCAG 2.1 AA**. Minimum requirements:

- All interactive elements keyboard-accessible (`Tab`, `Enter`, `Escape`)
- Every form field has a `<label>` (via MUI `label` prop)
- Images have `alt` text; decorative images use `alt=""`
- Focus managed when modals/drawers open/close (use `useEscapeKey` hook)
- Dynamic content announced with `aria-live` regions
- Contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text

### Required ARIA patterns

```tsx
// Drawer
<Drawer open={open} aria-labelledby="drawer-title">
  <Typography id="drawer-title" variant="h6">Title</Typography>
</Drawer>

// Icon-only button
<IconButton aria-label="Delete member" onClick={handleDelete}>
  <DeleteIcon />
</IconButton>

// Escape key handling
import { useEscapeKey } from '@hooks';
useEscapeKey(onClose, open);
```

---

## 12. Testing

### Test file location

Co-locate tests with the source file:

```
MyComponent.tsx
MyComponent.test.tsx
```

### Query priority

1. `getByRole` — accessible role queries (best)
2. `getByLabelText` — for form fields
3. `getByText` — visible text
4. `getByTestId` — last resort

### Coverage targets

- Business logic (hooks, utils): **> 80%**
- Components: key interaction paths covered

### Always test

- Renders without crashing (smoke test)
- Loading / error / empty states
- Primary user interactions
- Conditional rendering based on RBAC

### Mock external calls

Use MSW (Mock Service Worker) for integration tests; `vi.mock` for unit tests.

```tsx
describe('MyComponent', () => {
  it('renders the label', () => {
    render(<MyComponent label="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onAction when clicked', async () => {
    const onAction = vi.fn();
    render(<MyComponent label="Click" onAction={onAction} />);
    await userEvent.click(screen.getByText('Click'));
    expect(onAction).toHaveBeenCalledOnce();
  });
});
```
