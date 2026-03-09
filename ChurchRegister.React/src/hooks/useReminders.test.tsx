/**
 * Unit tests for useReminders hooks
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { NotificationProvider } from '../contexts/NotificationContext';
import type { Reminder, CompleteReminderResponse } from '../types/reminders';

// ─── Hoist mock functions ─────────────────────────────────────────────────────
const { mockShowSuccess, mockShowError } = vi.hoisted(() => ({
  mockShowSuccess: vi.fn(),
  mockShowError: vi.fn(),
}));

vi.mock('./useNotification', () => ({
  useNotification: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

// ─── Mock remindersApi ─────────────────────────────────────────────────────────
const { mockGetReminders, mockGetReminderById, mockCreateReminder, mockUpdateReminder, mockCompleteReminder, mockDeleteReminder, mockGetDashboardSummary } = vi.hoisted(() => ({
  mockGetReminders: vi.fn(),
  mockGetReminderById: vi.fn(),
  mockCreateReminder: vi.fn(),
  mockUpdateReminder: vi.fn(),
  mockCompleteReminder: vi.fn(),
  mockDeleteReminder: vi.fn(),
  mockGetDashboardSummary: vi.fn(),
}));

vi.mock('../services/api', () => ({
  remindersApi: {
    getReminders: mockGetReminders,
    getReminderById: mockGetReminderById,
    createReminder: mockCreateReminder,
    updateReminder: mockUpdateReminder,
    completeReminder: mockCompleteReminder,
    deleteReminder: mockDeleteReminder,
    getDashboardSummary: mockGetDashboardSummary,
  },
}));

import {
  useReminders,
  useReminder,
  useCreateReminder,
  useUpdateReminder,
  useCompleteReminder,
  useDeleteReminder,
  useDashboardReminderSummary,
} from './useReminders';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>{children}</NotificationProvider>
      </QueryClientProvider>
    );
  };
}

const mockReminder: Reminder = {
  id: 1,
  description: 'Test reminder',
  dueDate: '2024-12-31',
  assignedToUserId: 'user-1',
  assignedToUserName: 'Alice',
  categoryId: 1,
  categoryName: 'Admin',
  categoryColorHex: '#000000',
  priority: false,
  status: 'Pending',
  completionNotes: null,
  completedBy: null,
  completedDateTime: null,
  createdBy: 'admin',
  createdDateTime: '2024-01-01T00:00:00',
  alertStatus: 'none',
  daysUntilDue: 30,
};

describe('useReminders', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches reminders with params', async () => {
    mockGetReminders.mockResolvedValue([mockReminder]);
    const { result } = renderHook(() => useReminders({ status: 'Pending' }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockReminder]);
    expect(mockGetReminders).toHaveBeenCalledWith({ status: 'Pending' });
  });

  test('returns empty array when no reminders found', async () => {
    mockGetReminders.mockResolvedValue([]);
    const { result } = renderHook(() => useReminders({}), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  test('returns error when fetch fails', async () => {
    mockGetReminders.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useReminders({}), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useReminder', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches single reminder by ID', async () => {
    mockGetReminderById.mockResolvedValue(mockReminder);
    const { result } = renderHook(() => useReminder(1), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockReminder);
  });

  test('does not fetch when id is 0', () => {
    const { result } = renderHook(() => useReminder(0), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetReminderById).not.toHaveBeenCalled();
  });
});

describe('useCreateReminder', () => {
  beforeEach(() => vi.clearAllMocks());

  test('creates reminder and shows success notification', async () => {
    mockGetReminders.mockResolvedValue([]);
    mockCreateReminder.mockResolvedValue(mockReminder);

    const { result } = renderHook(() => useCreateReminder(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        description: 'New reminder',
        dueDate: '2024-12-31',
        assignedToUserId: 'user-1',
        categoryId: 1,
        priority: false,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Reminder created successfully');
  });

  test('shows error when create fails', async () => {
    mockCreateReminder.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useCreateReminder(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        description: 'New reminder',
        dueDate: '2024-12-31',
        assignedToUserId: 'user-1',
        categoryId: null,
        priority: null,
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('useUpdateReminder', () => {
  beforeEach(() => vi.clearAllMocks());

  test('updates reminder and shows success notification', async () => {
    mockGetReminders.mockResolvedValue([]);
    mockUpdateReminder.mockResolvedValue(mockReminder);

    const { result } = renderHook(() => useUpdateReminder(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({
        id: 1,
        request: {
          description: 'Updated reminder',
          dueDate: '2024-12-31',
          assignedToUserId: 'user-1',
          categoryId: null,
          priority: null,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Reminder updated successfully');
    expect(mockUpdateReminder).toHaveBeenCalledWith(1, expect.objectContaining({ description: 'Updated reminder' }));
  });

  test('shows error when update fails', async () => {
    mockUpdateReminder.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUpdateReminder(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        id: 1,
        request: {
          description: 'Updated',
          dueDate: '2024-12-31',
          assignedToUserId: 'user-1',
          categoryId: null,
          priority: null,
        },
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('useCompleteReminder', () => {
  beforeEach(() => vi.clearAllMocks());

  test('completes reminder without next and shows appropriate message', async () => {
    const response: CompleteReminderResponse = { completed: mockReminder, nextReminder: null };
    mockCompleteReminder.mockResolvedValue(response);
    mockGetReminders.mockResolvedValue([]);

    const { result } = renderHook(() => useCompleteReminder(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        id: 1,
        request: {
          completionNotes: 'Done',
          createNext: false,
          nextInterval: null,
          customDueDate: null,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Reminder completed successfully');
  });

  test('shows next reminder message when nextReminder created', async () => {
    const response: CompleteReminderResponse = {
      completed: mockReminder,
      nextReminder: { ...mockReminder, id: 2 },
    };
    mockCompleteReminder.mockResolvedValue(response);
    mockGetReminders.mockResolvedValue([]);

    const { result } = renderHook(() => useCompleteReminder(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        id: 1,
        request: {
          completionNotes: 'Done',
          createNext: true,
          nextInterval: '3months',
          customDueDate: null,
        },
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith(
      'Reminder completed and next reminder created successfully'
    );
  });

  test('shows error when complete fails', async () => {
    mockCompleteReminder.mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useCompleteReminder(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({
        id: 1,
        request: { completionNotes: '', createNext: false, nextInterval: null, customDueDate: null },
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('useDeleteReminder', () => {
  beforeEach(() => vi.clearAllMocks());

  test('deletes reminder and shows success notification', async () => {
    mockGetReminders.mockResolvedValue([]);
    mockDeleteReminder.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteReminder(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockDeleteReminder).toHaveBeenCalledWith(1);
    expect(mockShowSuccess).toHaveBeenCalledWith('Reminder deleted successfully');
  });

  test('shows error when delete fails', async () => {
    mockDeleteReminder.mockRejectedValue(new Error('Delete failed'));

    const { result } = renderHook(() => useDeleteReminder(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate(1);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('useDashboardReminderSummary', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches dashboard reminder summary', async () => {
    const summary = { upcomingCount: 5 };
    mockGetDashboardSummary.mockResolvedValue(summary);

    const { result } = renderHook(() => useDashboardReminderSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(summary);
  });

  test('returns error state when fetch fails', async () => {
    mockGetDashboardSummary.mockRejectedValue(new Error('Failed'));

    const { result } = renderHook(() => useDashboardReminderSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
