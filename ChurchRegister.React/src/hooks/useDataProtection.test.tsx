/**
 * Unit tests for useDataProtection hooks
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
    showNotification: vi.fn(),
    showWarning: vi.fn(),
    showInfo: vi.fn(),
  }),
}));

// ─── Mock dataProtectionApi ───────────────────────────────────────────────────
const { mockGetDataProtection, mockUpdateDataProtection } = vi.hoisted(() => ({
  mockGetDataProtection: vi.fn(),
  mockUpdateDataProtection: vi.fn(),
}));

vi.mock('../services/api', () => ({
  dataProtectionApi: {
    getDataProtection: mockGetDataProtection,
    updateDataProtection: mockUpdateDataProtection,
  },
}));

import { useDataProtection, useUpdateDataProtection } from './useDataProtection';

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

const mockDataProtection = {
  id: 1,
  memberId: 10,
  emailAddress: true,
  phoneNumber: false,
  postalAddress: true,
  consentGiven: true,
  consentDate: '2024-01-01',
  retentionPeriodYears: 7,
};

describe('useDataProtection', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches data protection consent for a member', async () => {
    mockGetDataProtection.mockResolvedValue(mockDataProtection);
    const { result } = renderHook(() => useDataProtection(10), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockDataProtection);
    expect(mockGetDataProtection).toHaveBeenCalledWith(10);
  });

  test('does not fetch when memberId is 0', () => {
    const { result } = renderHook(() => useDataProtection(0), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetDataProtection).not.toHaveBeenCalled();
  });

  test('does not fetch when memberId is negative', () => {
    const { result } = renderHook(() => useDataProtection(-1), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetDataProtection).not.toHaveBeenCalled();
  });

  test('handles fetch error', async () => {
    mockGetDataProtection.mockRejectedValue(new Error('Not found'));
    const { result } = renderHook(() => useDataProtection(10), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateDataProtection', () => {
  beforeEach(() => vi.clearAllMocks());

  test('updates data protection and shows success notification', async () => {
    mockUpdateDataProtection.mockResolvedValue(mockDataProtection);
    const { result } = renderHook(() => useUpdateDataProtection(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      result.current.mutate({
        memberId: 10,
        request: { allowNameInCommunications: true, allowHealthStatusInCommunications: false, allowPhotoInCommunications: true, allowPhotoInSocialMedia: false, groupPhotos: false, permissionForMyChildren: true },
      });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Data protection consent updated successfully');
  });

  test('shows error on update failure', async () => {
    mockUpdateDataProtection.mockRejectedValue(new Error('Update failed'));
    const { result } = renderHook(() => useUpdateDataProtection(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      result.current.mutate({
        memberId: 10,
        request: { allowNameInCommunications: false, allowHealthStatusInCommunications: false, allowPhotoInCommunications: false, allowPhotoInSocialMedia: false, groupPhotos: false, permissionForMyChildren: false },
      });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});
