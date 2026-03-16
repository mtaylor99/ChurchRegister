/**
 * Unit tests for useOptimisticList hook
 */

import { describe, test, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useOptimisticList } from './useOptimisticList';

type TestItem = { id: number; name: string };
const queryKey = ['testItems'];
const comparator = (a: TestItem, b: TestItem) => a.id === b.id;

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function setupQueryClient(initialData: TestItem[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(queryKey, initialData);
  return queryClient;
}

describe('useOptimisticList — optimisticRemove', () => {
  const initialData: TestItem[] = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  test('onMutate removes item from cache', async () => {
    const queryClient = setupQueryClient([...initialData]);
    const { result } = renderHook(
      () => useOptimisticList<TestItem>(queryKey, comparator),
      { wrapper: createWrapper(queryClient) }
    );
    const callbacks = result.current.optimisticRemove((id) => ({ id: id as number, name: '' }));
    await callbacks.onMutate(2);
    expect(queryClient.getQueryData<TestItem[]>(queryKey)).toEqual([
      { id: 1, name: 'Item 1' },
      { id: 3, name: 'Item 3' },
    ]);
  });

  test('onMutate returns previousData snapshot', async () => {
    const queryClient = setupQueryClient([...initialData]);
    const { result } = renderHook(
      () => useOptimisticList<TestItem>(queryKey, comparator),
      { wrapper: createWrapper(queryClient) }
    );
    const callbacks = result.current.optimisticRemove((id) => ({ id: id as number, name: '' }));
    const context = await callbacks.onMutate(1);
    expect(context.previousData).toEqual(initialData);
  });

  test('onError rolls back to previousData', async () => {
    const queryClient = setupQueryClient([...initialData]);
    const { result } = renderHook(
      () => useOptimisticList<TestItem>(queryKey, comparator),
      { wrapper: createWrapper(queryClient) }
    );
    const callbacks = result.current.optimisticRemove((id) => ({ id: id as number, name: '' }));
    const context = await callbacks.onMutate(1);
    // Simulate the cache being changed
    queryClient.setQueryData(queryKey, [{ id: 2, name: 'Item 2' }, { id: 3, name: 'Item 3' }]);
    callbacks.onError(new Error('fail'), 1, context);
    expect(queryClient.getQueryData<TestItem[]>(queryKey)).toEqual(initialData);
  });

  test('onSettled invalidates query', async () => {
    const queryClient = setupQueryClient([...initialData]);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useOptimisticList<TestItem>(queryKey, comparator),
      { wrapper: createWrapper(queryClient) }
    );
    const callbacks = result.current.optimisticRemove((id) => ({ id: id as number, name: '' }));
    callbacks.onSettled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey });
  });
});

describe('useOptimisticList — optimisticAdd', () => {
  const initialData: TestItem[] = [{ id: 1, name: 'Item 1' }];

  test('onMutate adds item to cache', async () => {
    const queryClient = setupQueryClient([...initialData]);
    const { result } = renderHook(
      () => useOptimisticList<TestItem>(queryKey, comparator),
      { wrapper: createWrapper(queryClient) }
    );
    const callbacks = result.current.optimisticAdd((item) => item as TestItem);
    await callbacks.onMutate({ id: 2, name: 'Item 2' });
    expect(queryClient.getQueryData<TestItem[]>(queryKey)).toEqual([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ]);
  });

  test('onError rolls back added item', async () => {
    const queryClient = setupQueryClient([...initialData]);
    const { result } = renderHook(
      () => useOptimisticList<TestItem>(queryKey, comparator),
      { wrapper: createWrapper(queryClient) }
    );
    const callbacks = result.current.optimisticAdd((item) => item as TestItem);
    const context = await callbacks.onMutate({ id: 2, name: 'Item 2' });
    callbacks.onError(new Error('fail'), { id: 2, name: 'Item 2' }, context);
    expect(queryClient.getQueryData<TestItem[]>(queryKey)).toEqual(initialData);
  });

  test('onSettled invalidates query', () => {
    const queryClient = setupQueryClient([...initialData]);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useOptimisticList<TestItem>(queryKey, comparator),
      { wrapper: createWrapper(queryClient) }
    );
    const callbacks = result.current.optimisticAdd((item) => item as TestItem);
    callbacks.onSettled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey });
  });
});

describe('useOptimisticList — optimisticUpdate', () => {
  const initialData: TestItem[] = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
  ];

  test('onMutate replaces matching item in cache', async () => {
    const queryClient = setupQueryClient([...initialData]);
    const { result } = renderHook(
      () => useOptimisticList<TestItem>(queryKey, comparator),
      { wrapper: createWrapper(queryClient) }
    );
    const callbacks = result.current.optimisticUpdate((item) => item as TestItem);
    await callbacks.onMutate({ id: 1, name: 'Updated Item 1' });
    expect(queryClient.getQueryData<TestItem[]>(queryKey)).toEqual([
      { id: 1, name: 'Updated Item 1' },
      { id: 2, name: 'Item 2' },
    ]);
  });

  test('onError rolls back to original data', async () => {
    const queryClient = setupQueryClient([...initialData]);
    const { result } = renderHook(
      () => useOptimisticList<TestItem>(queryKey, comparator),
      { wrapper: createWrapper(queryClient) }
    );
    const callbacks = result.current.optimisticUpdate((item) => item as TestItem);
    const context = await callbacks.onMutate({ id: 1, name: 'Bad Update' });
    callbacks.onError(new Error('fail'), { id: 1, name: 'Bad Update' }, context);
    expect(queryClient.getQueryData<TestItem[]>(queryKey)).toEqual(initialData);
  });

  test('onSettled invalidates query', () => {
    const queryClient = setupQueryClient([...initialData]);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(
      () => useOptimisticList<TestItem>(queryKey, comparator),
      { wrapper: createWrapper(queryClient) }
    );
    const callbacks = result.current.optimisticUpdate((item) => item as TestItem);
    callbacks.onSettled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey });
  });
});
