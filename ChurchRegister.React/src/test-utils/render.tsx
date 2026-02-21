/**
 * Custom Render Function for Testing
 *
 * Wraps components with required providers (React Query, Notification, etc.)
 * for testing. Use this instead of @testing-library/react's render.
 *
 * @example
 * ```tsx
 * import { renderWithProviders } from '@/test-utils';
 *
 * test('renders component', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />);
 *   expect(getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */

import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { NotificationProvider } from '../contexts/NotificationContext';

/**
 * Custom render options
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Whether to wrap the component with BrowserRouter
   * @default true
   */
  withRouter?: boolean;

  /**
   * Custom QueryClient for testing
   * Provides a default client with disabled retries and no cache time
   */
  queryClient?: QueryClient;

  /**
   * Initial route for router
   * @default '/'
   */
  initialRoute?: string;
}

/**
 * Create a test QueryClient with sensible defaults
 * - No retries for faster test execution
 * - No cache time to prevent state leakage between tests
 */
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // formerly cacheTime
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Render a component with all required providers
 *
 * @param ui - The component to render
 * @param options - Render options
 * @returns Render result from @testing-library/react
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    withRouter = true,
    queryClient = createTestQueryClient(),
    initialRoute = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Set initial route if using router
  if (withRouter && initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  // Create wrapper with all providers
  function Wrapper({ children }: { children: React.ReactNode }) {
    let wrappedChildren = children;

    // Wrap with NotificationProvider
    wrappedChildren = (
      <NotificationProvider>{wrappedChildren}</NotificationProvider>
    );

    // Wrap with QueryClientProvider
    wrappedChildren = (
      <QueryClientProvider client={queryClient}>
        {wrappedChildren}
      </QueryClientProvider>
    );

    // Wrap with BrowserRouter if needed
    if (withRouter) {
      wrappedChildren = <BrowserRouter>{wrappedChildren}</BrowserRouter>;
    }

    return <>{wrappedChildren}</>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Re-export everything from @testing-library/react
 * but replace render with renderWithProviders
 */
export * from '@testing-library/react';
export { renderWithProviders as render };

/**
 * Export test QueryClient creator for advanced use cases
 */
export { createTestQueryClient };
