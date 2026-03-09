/**
 * Unit tests for useRiskAssessments hooks
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { NotificationProvider } from '../contexts/NotificationContext';
import type { RiskAssessment, ApproveRiskAssessmentResponse } from '../types/riskAssessments';

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

// ─── Mock riskAssessmentsApi ───────────────────────────────────────────────────
const { mockGetRiskAssessments, mockGetRiskAssessmentById, mockCreateRiskAssessment, mockUpdateRiskAssessment, mockStartReview, mockApproveRiskAssessment, mockGetCategories, mockGetDashboardSummary, mockGetAssessmentHistory, mockCreateCategory, mockUpdateCategory, mockDeleteCategory } = vi.hoisted(() => ({
  mockGetRiskAssessments: vi.fn(),
  mockGetRiskAssessmentById: vi.fn(),
  mockCreateRiskAssessment: vi.fn(),
  mockUpdateRiskAssessment: vi.fn(),
  mockStartReview: vi.fn(),
  mockApproveRiskAssessment: vi.fn(),
  mockGetCategories: vi.fn(),
  mockGetDashboardSummary: vi.fn(),
  mockGetAssessmentHistory: vi.fn(),
  mockCreateCategory: vi.fn(),
  mockUpdateCategory: vi.fn(),
  mockDeleteCategory: vi.fn(),
}));

vi.mock('@services/api', () => ({
  riskAssessmentsApi: {
    getRiskAssessments: mockGetRiskAssessments,
    getRiskAssessmentById: mockGetRiskAssessmentById,
    createRiskAssessment: mockCreateRiskAssessment,
    updateRiskAssessment: mockUpdateRiskAssessment,
    startReview: mockStartReview,
    approveRiskAssessment: mockApproveRiskAssessment,
    getCategories: mockGetCategories,
    getDashboardSummary: mockGetDashboardSummary,
    getAssessmentHistory: mockGetAssessmentHistory,
    createCategory: mockCreateCategory,
    updateCategory: mockUpdateCategory,
    deleteCategory: mockDeleteCategory,
  },
}));

import {
  useRiskAssessments,
  useRiskAssessment,
  useCreateRiskAssessment,
  useUpdateRiskAssessment,
  useStartReview,
  useApproveRiskAssessment,
  useRiskAssessmentCategories,
  useDashboardRiskAssessmentSummary,
  useAssessmentHistory,
  useCreateRiskCategory,
  useUpdateRiskCategory,
  useDeleteRiskCategory,
} from './useRiskAssessments';

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

const mockAssessment: RiskAssessment = {
  id: 1,
  title: 'Fire Safety',
  description: 'Fire safety risk assessment',
  categoryId: 1,
  categoryName: 'Safety',
  lastReviewDate: '2024-01-01',
  nextReviewDate: '2025-01-01',
  status: 'Approved',
  isOverdue: false,
  alertStatus: 'green',
  approvalCount: 2,
  minimumApprovalsRequired: 2,
  createdBy: 'admin',
  createdDateTime: '2024-01-01T00:00:00',
} as RiskAssessment;

describe('useRiskAssessments', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches risk assessments successfully', async () => {
    mockGetRiskAssessments.mockResolvedValue([mockAssessment]);
    const { result } = renderHook(
      () => useRiskAssessments(null, null, false, null),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([mockAssessment]);
  });

  test('fetches with filter parameters', async () => {
    mockGetRiskAssessments.mockResolvedValue([]);
    renderHook(() => useRiskAssessments(1, 'Approved', true, 'Fire'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(mockGetRiskAssessments).toHaveBeenCalledWith(1, 'Approved', true, 'Fire'));
  });

  test('returns error on fetch failure', async () => {
    mockGetRiskAssessments.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useRiskAssessments(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useRiskAssessment', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches single assessment by ID', async () => {
    mockGetRiskAssessmentById.mockResolvedValue(mockAssessment);
    const { result } = renderHook(() => useRiskAssessment(1), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockAssessment);
  });

  test('does not fetch when id is null', () => {
    const { result } = renderHook(() => useRiskAssessment(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetRiskAssessmentById).not.toHaveBeenCalled();
  });
});

describe('useCreateRiskAssessment', () => {
  beforeEach(() => vi.clearAllMocks());

  test('creates assessment and shows success message', async () => {
    mockCreateRiskAssessment.mockResolvedValue(mockAssessment);
    mockGetRiskAssessments.mockResolvedValue([]);
    const { result } = renderHook(() => useCreateRiskAssessment(), {
      wrapper: createWrapper(),
    });
    await act(async () => {
      result.current.mutate({ title: 'New Assessment', categoryId: 1 } as Parameters<typeof result.current.mutate>[0]);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Risk assessment created successfully');
  });

  test('shows error when creation fails', async () => {
    mockCreateRiskAssessment.mockRejectedValue(new Error('Failed'));
    const { result } = renderHook(() => useCreateRiskAssessment(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ title: 'New', categoryId: 1 } as Parameters<typeof result.current.mutate>[0]);
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('useUpdateRiskAssessment', () => {
  beforeEach(() => vi.clearAllMocks());

  test('updates assessment and shows success message', async () => {
    mockUpdateRiskAssessment.mockResolvedValue(mockAssessment);
    mockGetRiskAssessments.mockResolvedValue([]);
    const { result } = renderHook(() => useUpdateRiskAssessment(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 1, request: { title: 'Updated' } as Parameters<typeof result.current.mutate>[0]['request'] });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Risk assessment updated successfully');
  });

  test('shows error when update fails', async () => {
    mockUpdateRiskAssessment.mockRejectedValue(new Error('Failed'));
    const { result } = renderHook(() => useUpdateRiskAssessment(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 1, request: { title: 'X' } as Parameters<typeof result.current.mutate>[0]['request'] });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('useStartReview', () => {
  beforeEach(() => vi.clearAllMocks());

  test('starts review and shows success message', async () => {
    mockStartReview.mockResolvedValue(undefined);
    mockGetRiskAssessments.mockResolvedValue([]);
    const { result } = renderHook(() => useStartReview(), { wrapper: createWrapper() });
    await act(async () => { result.current.mutate(1); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Review started - approvals cleared');
    expect(mockStartReview).toHaveBeenCalledWith(1);
  });

  test('shows error when start review fails', async () => {
    mockStartReview.mockRejectedValue(new Error('Failed'));
    const { result } = renderHook(() => useStartReview(), { wrapper: createWrapper() });
    await act(async () => { result.current.mutate(1); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('useApproveRiskAssessment', () => {
  beforeEach(() => vi.clearAllMocks());

  test('shows approved message when assessment fully approved', async () => {
    const response: ApproveRiskAssessmentResponse = {
      approvalRecorded: true,
      assessmentApproved: true,
      totalApprovalsReceived: 2,
      minimumApprovalsRequired: 2,
      nextReviewDate: '2025-01-01',
    };
    mockApproveRiskAssessment.mockResolvedValue(response);
    mockGetRiskAssessments.mockResolvedValue([]);

    const { result } = renderHook(() => useApproveRiskAssessment(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 1, request: { deaconMemberIds: [], notes: 'Approved' } });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringContaining('Risk assessment approved!'));
  });

  test('shows approved message with N/A when nextReviewDate is null', async () => {
    const response: ApproveRiskAssessmentResponse = {
      approvalRecorded: true,
      assessmentApproved: true,
      totalApprovalsReceived: 2,
      minimumApprovalsRequired: 2,
      nextReviewDate: null,
    };
    mockApproveRiskAssessment.mockResolvedValue(response);
    mockGetRiskAssessments.mockResolvedValue([]);

    const { result } = renderHook(() => useApproveRiskAssessment(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 1, request: { deaconMemberIds: [], notes: 'OK' } });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith(expect.stringContaining('N/A'));
  });

  test('shows partial approval message when assessment not yet fully approved', async () => {
    const response: ApproveRiskAssessmentResponse = {
      approvalRecorded: true,
      assessmentApproved: false,
      totalApprovalsReceived: 1,
      minimumApprovalsRequired: 3,
      nextReviewDate: null,
    };
    mockApproveRiskAssessment.mockResolvedValue(response);
    mockGetRiskAssessments.mockResolvedValue([]);

    const { result } = renderHook(() => useApproveRiskAssessment(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 1, request: { deaconMemberIds: [], notes: 'Partial' } });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Approval recorded (1 of 3)');
  });

  test('shows error when approval fails', async () => {
    mockApproveRiskAssessment.mockRejectedValue(new Error('Failed'));
    const { result } = renderHook(() => useApproveRiskAssessment(), { wrapper: createWrapper() });
    await act(async () => {
      result.current.mutate({ id: 1, request: { deaconMemberIds: [] } });
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('useRiskAssessmentCategories', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches categories successfully', async () => {
    const categories = [{ id: 1, name: 'Safety' }, { id: 2, name: 'Security' }];
    mockGetCategories.mockResolvedValue(categories);
    const { result } = renderHook(() => useRiskAssessmentCategories(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(categories);
  });
});

describe('useDashboardRiskAssessmentSummary', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches dashboard summary successfully', async () => {
    const summary = { overdueCount: 2, dueSoonCount: 3, totalCount: 10 };
    mockGetDashboardSummary.mockResolvedValue(summary);
    const { result } = renderHook(() => useDashboardRiskAssessmentSummary(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(summary);
  });
});

describe('useAssessmentHistory', () => {
  beforeEach(() => vi.clearAllMocks());

  test('fetches history for assessment', async () => {
    const history = { id: 1, title: 'Fire Safety', reviewCycles: [] };
    mockGetAssessmentHistory.mockResolvedValue(history);
    const { result } = renderHook(() => useAssessmentHistory(1), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(history);
  });

  test('does not fetch when id is null', () => {
    const { result } = renderHook(() => useAssessmentHistory(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetAssessmentHistory).not.toHaveBeenCalled();
  });
});

describe('useCreateRiskCategory', () => {
  beforeEach(() => vi.clearAllMocks());

  test('creates category and shows success message', async () => {
    mockCreateCategory.mockResolvedValue({ id: 3, name: 'New Cat' });
    mockGetCategories.mockResolvedValue([]);
    const { result } = renderHook(() => useCreateRiskCategory(), { wrapper: createWrapper() });
    await act(async () => { result.current.mutate({ name: 'New Cat', description: '' }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Category created successfully');
  });

  test('shows error when creation fails', async () => {
    mockCreateCategory.mockRejectedValue(new Error('Failed'));
    const { result } = renderHook(() => useCreateRiskCategory(), { wrapper: createWrapper() });
    await act(async () => { result.current.mutate({ name: 'Test', description: '' }); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('useUpdateRiskCategory', () => {
  beforeEach(() => vi.clearAllMocks());

  test('updates category and shows success message', async () => {
    mockUpdateCategory.mockResolvedValue(undefined);
    mockGetCategories.mockResolvedValue([]);
    mockGetRiskAssessments.mockResolvedValue([]);
    const { result } = renderHook(() => useUpdateRiskCategory(), { wrapper: createWrapper() });
    await act(async () => { result.current.mutate({ id: 1, request: { name: 'Updated', description: '' } }); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Category updated successfully');
  });

  test('shows error when update fails', async () => {
    mockUpdateCategory.mockRejectedValue(new Error('Failed'));
    const { result } = renderHook(() => useUpdateRiskCategory(), { wrapper: createWrapper() });
    await act(async () => { result.current.mutate({ id: 1, request: { name: 'X', description: '' } }); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});

describe('useDeleteRiskCategory', () => {
  beforeEach(() => vi.clearAllMocks());

  test('deletes category and shows success message', async () => {
    mockDeleteCategory.mockResolvedValue(undefined);
    mockGetCategories.mockResolvedValue([]);
    const { result } = renderHook(() => useDeleteRiskCategory(), { wrapper: createWrapper() });
    await act(async () => { result.current.mutate(1); });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockShowSuccess).toHaveBeenCalledWith('Category deleted successfully');
    expect(mockDeleteCategory).toHaveBeenCalledWith(1);
  });

  test('shows error when deletion fails', async () => {
    mockDeleteCategory.mockRejectedValue(new Error('Failed'));
    const { result } = renderHook(() => useDeleteRiskCategory(), { wrapper: createWrapper() });
    await act(async () => { result.current.mutate(2); });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(mockShowError).toHaveBeenCalled();
  });
});
