/**
 * Unit tests for useApiQuery hook
 */
import { describe, test, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useApiQuery } from './useApiQuery';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useApiQuery', () => {
  test('fetches and returns data', async () => {
    const queryFn = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });
    const { result } = renderHook(
      () => useApiQuery({ queryKey: ['test', 1], queryFn }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 1, name: 'Test' });
    expect(queryFn).toHaveBeenCalledOnce();
  });

  test('handles fetch error', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('Not found'));
    const { result } = renderHook(
      () => useApiQuery({ queryKey: ['test-error'], queryFn }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  test('starts in loading state', () => {
    const queryFn = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves
    const { result } = renderHook(
      () => useApiQuery({ queryKey: ['test-loading'], queryFn }),
      { wrapper: createWrapper() }
    );
    expect(result.current.isLoading).toBe(true);
  });

  test('passes through options to useQuery', async () => {
    const queryFn = vi.fn().mockResolvedValue([1, 2, 3]);
    const { result } = renderHook(
      () => useApiQuery<number[]>({
        queryKey: ['array-data'],
        queryFn,
        staleTime: 60000,
      }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([1, 2, 3]);
  });
});
