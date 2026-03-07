/**
 * Unit tests for useRegisterNumbers hooks
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
  }),
}));

// ─── Mock registerNumberService ───────────────────────────────────────────────
const { mockPreviewNumbers, mockCheckStatus, mockGenerateNumbers } = vi.hoisted(() => ({
  mockPreviewNumbers: vi.fn(),
  mockCheckStatus: vi.fn(),
  mockGenerateNumbers: vi.fn(),
}));

vi.mock('../services/registerNumberService', () => ({
  registerNumberService: {
    previewNumbers: mockPreviewNumbers,
    checkStatus: mockCheckStatus,
    generateNumbers: mockGenerateNumbers,
  },
}));

import {
  useRegisterNumberPreview,
  useRegisterNumberStatus,
  useGenerateRegisterNumbers,
  useRegisterNumbers,
} from './useRegisterNumbers';

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

const mockPreviewData = [
  { memberId: 1, registerNumber: '2024-001', memberType: 'Member' },
  { memberId: 2, registerNumber: '2024-002', memberType: 'Member' },
];

const mockStatusData = { year: 2024, hasBeenGenerated: true, totalGenerated: 50 };

const mockGenerateResult = {
  year: 2024,
  totalMembersAssigned: 30,
  totalNonMembersAssigned: 20,
};

describe('useRegisterNumberPreview', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches preview when enabled', async () => {
    mockPreviewNumbers.mockResolvedValue(mockPreviewData);
    const { result } = renderHook(() => useRegisterNumberPreview(2024, true), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPreviewData);
    expect(mockPreviewNumbers).toHaveBeenCalledWith(2024);
  });

  test('does not fetch when disabled', () => {
    const { result } = renderHook(() => useRegisterNumberPreview(2024, false), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockPreviewNumbers).not.toHaveBeenCalled();
  });

  test('defaults to enabled=true when not specified', async () => {
    mockPreviewNumbers.mockResolvedValue(mockPreviewData);
    const { result } = renderHook(() => useRegisterNumberPreview(2024), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockPreviewNumbers).toHaveBeenCalledWith(2024);
  });
});

describe('useRegisterNumberStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches status for given year', async () => {
    mockCheckStatus.mockResolvedValue(mockStatusData);
    const { result } = renderHook(() => useRegisterNumberStatus(2024), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockStatusData);
    expect(mockCheckStatus).toHaveBeenCalledWith(2024);
  });

  test('handles error on status fetch', async () => {
    mockCheckStatus.mockRejectedValue(new Error('Server error'));
    const { result } = renderHook(() => useRegisterNumberStatus(2024), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useGenerateRegisterNumbers', () => {
  beforeEach(() => vi.clearAllMocks());

  test('generates numbers and shows success with details', async () => {
    mockGenerateNumbers.mockResolvedValue(mockGenerateResult);
    const { result } = renderHook(() => useGenerateRegisterNumbers(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      result.current.mutate({ targetYear: 2024, confirmGeneration: true });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith(
      'Successfully generated 30 Member and 20 Non-Member numbers for 2024'
    );
  });

  test('shows error on generation failure', async () => {
    mockGenerateNumbers.mockRejectedValue(new Error('Already generated'));
    const { result } = renderHook(() => useGenerateRegisterNumbers(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      result.current.mutate({ targetYear: 2024, confirmGeneration: true });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('useRegisterNumbers (combined hook)', () => {
  beforeEach(() => vi.clearAllMocks());

  test('combines preview, status and generate', async () => {
    mockCheckStatus.mockResolvedValue(mockStatusData);
    const { result } = renderHook(() => useRegisterNumbers(2024), {
      wrapper: createWrapper(),
    });
    expect(result.current).toHaveProperty('preview');
    expect(result.current).toHaveProperty('status');
    expect(result.current).toHaveProperty('generate');
    await waitFor(() => expect(result.current.status.isSuccess).toBe(true));
  });
});
