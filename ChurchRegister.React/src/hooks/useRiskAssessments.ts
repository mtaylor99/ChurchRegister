import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riskAssessmentsApi } from '../services/api/riskAssessmentsApi';
import type {
  CreateRiskAssessmentRequest,
  UpdateRiskAssessmentRequest,
  ApproveRiskAssessmentRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../types/riskAssessments';
import { useNotification } from './useNotification';

/**
 * Query keys for risk assessments
 * Follows React Query best practices for hierarchical keys
 */
export const riskAssessmentQueryKeys = {
  all: ['riskAssessments'] as const,
  list: (categoryId?: number | null, status?: string | null, overdueOnly?: boolean, title?: string | null) =>
    [...riskAssessmentQueryKeys.all, 'list', { categoryId, status, overdueOnly, title }] as const,
  detail: (id: number) => [...riskAssessmentQueryKeys.all, 'detail', id] as const,
  history: (id: number) => [...riskAssessmentQueryKeys.all, 'history', id] as const,
  categories: () => [...riskAssessmentQueryKeys.all, 'categories'] as const,
  dashboardSummary: () => [...riskAssessmentQueryKeys.all, 'dashboard-summary'] as const,
};

/**
 * Hook to fetch risk assessments with optional filtering
 * Supports filtering by category, status, overdue flag, and title
 * @param categoryId - Filter by category ID
 * @param status - Filter by status (Under Review/Active)
 * @param overdueOnly - Filter to show only overdue assessments
 * @param title - Filter by title (case-insensitive contains search)
 */
export const useRiskAssessments = (
  categoryId?: number | null,
  status?: string | null,
  overdueOnly?: boolean,
  title?: string | null
) => {
  return useQuery({
    queryKey: riskAssessmentQueryKeys.list(categoryId, status, overdueOnly, title),
    queryFn: () => riskAssessmentsApi.getRiskAssessments(categoryId, status, overdueOnly, title),
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Hook to fetch a single risk assessment by ID with full details
 * Includes approvals list
 * @param id - Risk assessment ID
 */
export const useRiskAssessment = (id: number | null) => {
  return useQuery({
    queryKey: riskAssessmentQueryKeys.detail(id!),
    queryFn: () => riskAssessmentsApi.getRiskAssessmentById(id!),
    enabled: !!id,
  });
};

/**
 * Hook to create a new risk assessment
 * Invalidates risk assessment queries on success
 */
export const useCreateRiskAssessment = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: (request: CreateRiskAssessmentRequest) =>
      riskAssessmentsApi.createRiskAssessment(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: riskAssessmentQueryKeys.all,
      });
      showSuccess('Risk assessment created successfully');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to create risk assessment');
    },
  });
};

/**
 * Hook to fetch risk assessment history with review cycles
 * Shows historical approvals grouped by review date
 * @param id - Risk assessment ID
 */
export const useAssessmentHistory = (id: number | null) => {
  return useQuery({
    queryKey: riskAssessmentQueryKeys.history(id!),
    queryFn: () => riskAssessmentsApi.getAssessmentHistory(id!),
    enabled: !!id,
  });
};

/**
 * Hook to update a risk assessment
 * Invalidates risk assessment queries on success
 */
export const useUpdateRiskAssessment = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: UpdateRiskAssessmentRequest;
    }) => riskAssessmentsApi.updateRiskAssessment(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: riskAssessmentQueryKeys.all,
      });
      showSuccess('Risk assessment updated successfully');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update risk assessment');
    },
  });
};

/**
 * Hook to start a new review cycle
 * Clears all approvals and sets status to "Under Review"
 * Invalidates risk assessment queries on success
 */
export const useStartReview = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: (id: number) => riskAssessmentsApi.startReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: riskAssessmentQueryKeys.all,
      });
      showSuccess('Review started - approvals cleared');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to start review');
    },
  });
};

/**
 * Hook to approve a risk assessment
 * Records deacon approval. Auto-activates when minimum approvals met.
 * Invalidates risk assessment queries on success
 */
export const useApproveRiskAssessment = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: ApproveRiskAssessmentRequest;
    }) => riskAssessmentsApi.approveRiskAssessment(id, request),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: riskAssessmentQueryKeys.all,
      });
      
      if (response.assessmentApproved) {
        const nextReviewDate = response.nextReviewDate 
          ? new Date(response.nextReviewDate).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'N/A';
        showSuccess(
          `Risk assessment approved! Next review: ${nextReviewDate}`
        );
      } else {
        showSuccess(
          `Approval recorded (${response.totalApprovalsReceived} of ${response.minimumApprovalsRequired})`
        );
      }
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to approve risk assessment');
    },
  });
};

/**
 * Hook to fetch all risk assessment categories
 * Returns categories ordered alphabetically by name
 */
export const useRiskAssessmentCategories = () => {
  return useQuery({
    queryKey: riskAssessmentQueryKeys.categories(),
    queryFn: () => riskAssessmentsApi.getCategories(),
  });
};

/**
 * Hook to fetch dashboard summary statistics
 * Returns overdue count, due soon count, and total count
 */
export const useDashboardRiskAssessmentSummary = () => {
  return useQuery({
    queryKey: riskAssessmentQueryKeys.dashboardSummary(),
    queryFn: () => riskAssessmentsApi.getDashboardSummary(),
  });
};

/**
 * Hook to create a new risk assessment category
 * Invalidates categories query on success
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: (request: CreateCategoryRequest) =>
      riskAssessmentsApi.createCategory(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: riskAssessmentQueryKeys.categories(),
      });
      showSuccess('Category created successfully');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to create category');
    },
  });
};

/**
 * Hook to update an existing risk assessment category
 * Invalidates categories and risk assessments queries on success
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: UpdateCategoryRequest;
    }) => riskAssessmentsApi.updateCategory(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: riskAssessmentQueryKeys.categories(),
      });
      queryClient.invalidateQueries({
        queryKey: riskAssessmentQueryKeys.all,
      });
      showSuccess('Category updated successfully');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update category');
    },
  });
};

/**
 * Hook to delete a risk assessment category
 * Invalidates categories query on success
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: (id: number) => riskAssessmentsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: riskAssessmentQueryKeys.categories(),
      });
      showSuccess('Category deleted successfully');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to delete category');
    },
  });
};
