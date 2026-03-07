/**
 * Unit tests for useReminderCategories hooks
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { NotificationProvider } from '../contexts/NotificationContext';

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

// ─── Mock reminderCategoriesApi ───────────────────────────────────────────────
const {
  mockGetCategories,
  mockGetCategoryById,
  mockCreateCategory,
  mockUpdateCategory,
  mockDeleteCategory,
} = vi.hoisted(() => ({
  mockGetCategories: vi.fn(),
  mockGetCategoryById: vi.fn(),
  mockCreateCategory: vi.fn(),
  mockUpdateCategory: vi.fn(),
  mockDeleteCategory: vi.fn(),
}));

vi.mock('../services/api', () => ({
  reminderCategoriesApi: {
    getCategories: mockGetCategories,
    getCategoryById: mockGetCategoryById,
    createCategory: mockCreateCategory,
    updateCategory: mockUpdateCategory,
    deleteCategory: mockDeleteCategory,
  },
  remindersApi: {
    getReminders: vi.fn(),
  },
}));

import {
  useReminderCategories,
  useReminderCategory,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from './useReminderCategories';

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

const mockCategory = {
  id: 1,
  name: 'Insurance',
  description: 'Insurance reminders',
  colorHex: '#FF0000',
  sortOrder: 1,
  reminderCount: 3,
};

describe('useReminderCategories', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches all categories', async () => {
    mockGetCategories.mockResolvedValue([mockCategory]);
    const { result } = renderHook(() => useReminderCategories(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockCategory]);
  });

  test('returns empty list when no categories', async () => {
    mockGetCategories.mockResolvedValue([]);
    const { result } = renderHook(() => useReminderCategories(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  test('handles fetch error', async () => {
    mockGetCategories.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useReminderCategories(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useReminderCategory', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches category by id', async () => {
    mockGetCategoryById.mockResolvedValue(mockCategory);
    const { result } = renderHook(() => useReminderCategory(1), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCategory);
    expect(mockGetCategoryById).toHaveBeenCalledWith(1);
  });

  test('does not fetch when id is 0', async () => {
    const { result } = renderHook(() => useReminderCategory(0), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetCategoryById).not.toHaveBeenCalled();
  });
});

describe('useCreateCategory', () => {
  beforeEach(() => vi.clearAllMocks());

  test('creates category and shows success', async () => {
    mockCreateCategory.mockResolvedValue(mockCategory);
    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      result.current.mutate({ name: 'New Category', colorHex: null });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Category created successfully');
  });

  test('shows error on create failure', async () => {
    mockCreateCategory.mockRejectedValue(new Error('Create failed'));
    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      result.current.mutate({ name: 'Bad Category', colorHex: null });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('useUpdateCategory', () => {
  beforeEach(() => vi.clearAllMocks());

  test('updates category and shows success', async () => {
    mockUpdateCategory.mockResolvedValue({ ...mockCategory, name: 'Updated' });
    const { result } = renderHook(() => useUpdateCategory(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      result.current.mutate({ id: 1, request: { name: 'Updated', colorHex: null } });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Category updated successfully');
  });

  test('shows error on update failure', async () => {
    mockUpdateCategory.mockRejectedValue(new Error('Update failed'));
    const { result } = renderHook(() => useUpdateCategory(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      result.current.mutate({ id: 1, request: { name: 'Bad', colorHex: null } });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('useDeleteCategory', () => {
  beforeEach(() => vi.clearAllMocks());

  test('deletes category and shows success', async () => {
    mockDeleteCategory.mockResolvedValue(undefined);
    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      result.current.mutate(1);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Category deleted successfully');
  });

  test('shows error on delete failure', async () => {
    mockDeleteCategory.mockRejectedValue(new Error('Delete failed'));
    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      result.current.mutate(1);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});
