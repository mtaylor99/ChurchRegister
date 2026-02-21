import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  registerNumberService,
  type GenerateRegisterNumbersRequest,
} from '../services/registerNumberService';
import { useNotification } from './useNotification';

// Query keys for consistent caching
export const registerNumberQueryKeys = {
  all: ['registerNumbers'] as const,
  preview: (year: number) =>
    [...registerNumberQueryKeys.all, 'preview', year] as const,
  status: (year: number) =>
    [...registerNumberQueryKeys.all, 'status', year] as const,
};

/**
 * Hook for previewing register number assignments for a target year
 * @param year - Target year for preview
 * @param enabled - Whether the query should run
 */
export function useRegisterNumberPreview(year: number, enabled = true) {
  return useQuery({
    queryKey: registerNumberQueryKeys.preview(year),
    queryFn: () => registerNumberService.previewNumbers(year),
    enabled,
    staleTime: 0, // Always fetch fresh preview data
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook for checking if register numbers have been generated for a year
 * @param year - Year to check status for
 */
export function useRegisterNumberStatus(year: number) {
  return useQuery({
    queryKey: registerNumberQueryKeys.status(year),
    queryFn: () => registerNumberService.checkStatus(year),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for generating register numbers mutation
 */
export function useGenerateRegisterNumbers() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: (request: GenerateRegisterNumbersRequest) =>
      registerNumberService.generateNumbers(request),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: registerNumberQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['churchMembers'] });

      showSuccess(
        `Successfully generated ${data.totalMembersAssigned} membership numbers for ${data.year}`
      );
    },
    onError: (error: Error) => {
      showError(error.message || 'Failed to generate register numbers');
    },
  });
}

/**
 * Combined hook for register number operations
 */
export function useRegisterNumbers(year: number) {
  const preview = useRegisterNumberPreview(year, false);
  const status = useRegisterNumberStatus(year);
  const generate = useGenerateRegisterNumbers();

  return {
    preview,
    status,
    generate,
    isLoading: preview.isLoading || status.isLoading,
    isGenerating: generate.isPending,
  };
}
