/**
 * Unit tests for useApiMutation hook
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { NotificationProvider } from '../contexts/NotificationContext';
import { createTestQueryClient } from '../test-utils';
import { useApiMutation } from './useApiMutation';

// Hoist mock fns so they are defined before vi.mock hoisting
const { mockShowSuccess, mockShowError } = vi.hoisted(() => ({
  mockShowSuccess: vi.fn(),
  mockShowError: vi.fn(),
}));

// Spy on useNotification to capture notification calls
vi.mock('./useNotification', () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showWarning: vi.fn(),
    showInfo: vi.fn(),
    notifications: [],
    removeNotification: vi.fn(),
  }),
}));

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>{children}</NotificationProvider>
      </QueryClientProvider>
    );
  };
}

describe('useApiMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('calls mutationFn and shows success notification on success', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 });

    const { result } = renderHook(
      () =>
        useApiMutation({
          mutationFn,
          onSuccessMessage: 'Created successfully',
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate({ name: 'Test' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mutationFn).toHaveBeenCalledWith(
      { name: 'Test' },
      expect.anything()
    );
    expect(mockShowSuccess).toHaveBeenCalledWith('Created successfully');
  });

  test('shows error notification on failure', async () => {
    const mutationFn = vi.fn().mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(
      () =>
        useApiMutation({
          mutationFn,
          onErrorMessage: 'Failed to create',
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate(undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });

  test('does not show success toast when onSuccessMessage is omitted', async () => {
    const mutationFn = vi.fn().mockResolvedValue({});

    const { result } = renderHook(() => useApiMutation({ mutationFn }), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(undefined);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).not.toHaveBeenCalled();
  });

  test('supports dynamic onSuccessMessage as a function', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ name: 'Alice' });

    const { result } = renderHook(
      () =>
        useApiMutation({
          mutationFn,
          onSuccessMessage: (_data: { name: string }) =>
            `Created ${_data.name}`,
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate(undefined);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Created Alice');
  });

  test('calls caller-provided onSuccess after built-in handling', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 42 });
    const callerOnSuccess = vi.fn();

    const { result } = renderHook(
      () =>
        useApiMutation({
          mutationFn,
          onSuccess: callerOnSuccess,
        }),
      { wrapper: createWrapper() }
    );

    await act(async () => {
      result.current.mutate(undefined);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(callerOnSuccess).toHaveBeenCalled();
  });
});
