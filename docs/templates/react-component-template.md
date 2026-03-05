# React component template

This document defines the standard structure for React components in the ChurchRegister application. Follow this template when creating new components to ensure consistency.

## Component file structure

```
src/components/[Feature]/
├── MyComponent.tsx          # Main component file
├── MyComponent.test.tsx     # Tests (co-located with source)
├── MyComponent.stories.tsx  # Storybook stories (if applicable)
└── index.ts                 # Feature barrel export
```

## Component file template

```tsx
/**
 * Brief description of what this component renders and when to use it.
 * Include any important behavioural notes.
 */

// 1. React
import React, { useState, useCallback } from 'react';

// 2. Third-party libraries
import { Box, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

// 3. Internal absolute imports (path aliases)
import type { MyType } from '@types/feature';
import { myHelper } from '@utils';
import { featureKeys } from '@utils/queryKeys';

// 4. Relative imports (same feature or parent)
import { SiblingComponent } from './SiblingComponent';

// ---------------------------------------------------------------------------
// Props interface — always exported, always named [ComponentName]Props
// ---------------------------------------------------------------------------

export interface MyComponentProps {
  /** Primary label displayed in the component */
  label: string;
  /** Optional callback when the primary action is triggered */
  onAction?: () => void;
  /** Whether the component is in a disabled/loading state */
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * MyComponent — displays [describe what it does].
 *
 * @example
 * <MyComponent label="Click me" onAction={() => console.log('clicked')} />
 */
export const MyComponent: React.FC<MyComponentProps> = ({
  label,
  onAction,
  disabled = false,
}) => {
  // State & hooks (always at the top, never inside conditionals)
  const [isOpen, setIsOpen] = useState(false);

  // Queries / mutations
  const { data, isLoading } = useQuery({
    queryKey: featureKeys.list({}),
    queryFn: () => fetchItems(),
  });

  // Derived values
  const displayLabel = disabled ? `${label} (disabled)` : label;

  // Event handlers
  const handleClick = useCallback(() => {
    if (!disabled) onAction?.();
  }, [disabled, onAction]);

  // Early returns for loading / error states
  if (isLoading) return <SkeletonLoader rows={3} />;

  // Render
  return (
    <Box>
      <Typography onClick={handleClick} aria-disabled={disabled}>
        {displayLabel}
      </Typography>
    </Box>
  );
};
```

## Barrel export (`index.ts`)

```typescript
export { MyComponent } from './MyComponent';
export type { MyComponentProps } from './MyComponent';
```

## Rules & guidelines

### 1. File naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | `PascalCase.tsx` | `ChurchMemberGrid.tsx` |
| Utilities/helpers | `camelCase.ts` | `formatUtils.ts` |
| Test files | `ComponentName.test.tsx` | `ChurchMemberGrid.test.tsx` |
| Story files | `ComponentName.stories.tsx` | `ChurchMemberGrid.stories.tsx` |

### 2. Props interface

- **Always export** the props interface (enables type reuse across the codebase)
- **Name it** `[ComponentName]Props`
- Use JSDoc comments on all non-obvious props
- Prefer `optional?: Type` over `required: Type | undefined`

Consumers import the interface from the feature barrel — never from the source file directly:

```tsx
// ✅ Import from the feature barrel
import type { ChurchMemberGridProps } from '@components/ChurchMembers';

// ❌ Never import directly from the source file
import type { ChurchMemberGridProps } from '@components/ChurchMembers/ChurchMemberGrid';
```

### 3. Imports order

```tsx
// 1. React
import React, { useState, useCallback } from 'react';

// 2. Third-party libraries
import { Box } from '@mui/material';
import { useQuery } from '@tanstack/react-query';

// 3. Internal (path aliases)
import type { MyType } from '@types/feature';
import { helper } from '@utils';

// 4. Relative
import { Sibling } from './Sibling';
```

### 4. Component size

Keep components under **300 lines** of TSX. If a component grows beyond this:
- Extract sub-components into separate files in the same folder
- Extract complex logic into a custom hook
- Extract styles into `styled()` or an `sx` prop object

### 5. Accessibility (WCAG 2.1 AA)

- Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- Every form field must have an associated `<label>` (via MUI `label` prop)
- Icon-only buttons require `aria-label`
- Dynamic updates need `aria-live` regions
- Use `useEscapeKey(onClose, open)` inside drawers and modals

### 6. Error states

```tsx
// ✅ Correct
import { ErrorAlert } from '@components/ErrorAlert';
{error && <ErrorAlert error={error} />}

// ❌ Avoid
{error && <Alert severity="error">{error.message}</Alert>}
```

### 7. Loading states

Prefer skeleton loaders over spinners for content areas:

```tsx
// ✅ Correct
import { SkeletonLoader } from '@components/Loading';
if (isLoading) return <SkeletonLoader rows={5} />;

// ❌ Avoid for main content
if (isLoading) return <CircularProgress />;
```

### 8. Performance

- Wrap callbacks passed to children in `useCallback`
- Wrap expensive derived values in `useMemo`
- Wrap frequently-rendered pure children in `React.memo`
- Apply these only after **profiling** — do not optimise speculatively

### 9. Testing checklist

Each component should have tests for:

- Renders correctly with required props (smoke test)
- Primary user interactions (clicking, typing)
- Conditional rendering (loading, error, empty states)
- Accessibility (`getByRole`, `getByLabelText`)

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

  it('does not call onAction when disabled', async () => {
    const onAction = vi.fn();
    render(<MyComponent label="Click" onAction={onAction} disabled />);
    await userEvent.click(screen.getByText('Click (disabled)'));
    expect(onAction).not.toHaveBeenCalled();
  });
});
```
