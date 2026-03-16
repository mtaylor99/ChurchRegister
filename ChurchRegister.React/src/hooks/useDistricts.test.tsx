/**
 * Unit tests for useDistricts hooks
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

// ─── Mock districtsApi ─────────────────────────────────────────────────────────
const { mockGetDistricts, mockAssignDistrict } = vi.hoisted(() => ({
  mockGetDistricts: vi.fn(),
  mockAssignDistrict: vi.fn(),
}));

vi.mock('../services/api', () => ({
  districtsApi: {
    getDistricts: mockGetDistricts,
    assignDistrict: mockAssignDistrict,
  },
}));

import { useDistricts, useAssignDistrict } from './useDistricts';

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

const mockDistricts = [
  { id: 1, name: 'District A', memberCount: 10 },
  { id: 2, name: 'District B', memberCount: 5 },
];

describe('useDistricts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetches districts successfully', async () => {
    mockGetDistricts.mockResolvedValue(mockDistricts);

    const { result } = renderHook(() => useDistricts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockDistricts);
  });

  test('returns loading state initially', () => {
    mockGetDistricts.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useDistricts(), { wrapper: createWrapper() });
    expect(result.current.isLoading).toBe(true);
  });

  test('returns error state when fetch fails', async () => {
    mockGetDistricts.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useDistricts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  test('calls getDistricts API', async () => {
    mockGetDistricts.mockResolvedValue(mockDistricts);

    renderHook(() => useDistricts(), { wrapper: createWrapper() });

    await waitFor(() => expect(mockGetDistricts).toHaveBeenCalledOnce());
  });
});

describe('useAssignDistrict', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('assigns district successfully and shows success message', async () => {
    mockAssignDistrict.mockResolvedValue(undefined);
    mockGetDistricts.mockResolvedValue(mockDistricts);

    const { result } = renderHook(() => useAssignDistrict(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ memberId: 1, request: { districtId: 2 } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('District assigned successfully');
  });

  test('shows "unassigned" message when districtId is null', async () => {
    mockAssignDistrict.mockResolvedValue(undefined);
    mockGetDistricts.mockResolvedValue(mockDistricts);

    const { result } = renderHook(() => useAssignDistrict(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ memberId: 1, request: { districtId: null } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('District unassigned successfully');
  });

  test('shows error message when assignment fails', async () => {
    mockAssignDistrict.mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useAssignDistrict(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ memberId: 1, request: { districtId: 2 } });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });

  test('calls assignDistrict API with correct params', async () => {
    mockAssignDistrict.mockResolvedValue(undefined);
    mockGetDistricts.mockResolvedValue(mockDistricts);

    const { result } = renderHook(() => useAssignDistrict(), { wrapper: createWrapper() });

    await act(async () => {
      result.current.mutate({ memberId: 5, request: { districtId: 3 } });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAssignDistrict).toHaveBeenCalledWith(5, { districtId: 3 });
  });
});
