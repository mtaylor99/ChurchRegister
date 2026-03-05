import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  registerNumberService,
  type GenerateRegisterNumbersRequest,
} from '../services/registerNumberService';
import { useNotification } from './useNotification';
import { extractErrorMessage } from '../utils/typeGuards';
import { registerNumberKeys } from '../utils/queryKeys';

/**
 * @deprecated Import from `@utils/queryKeys` instead.
 * Maintained for backward compatibility - re-exports the centralized key factory.
 */
export const registerNumberQueryKeys = registerNumberKeys;

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
        `Successfully generated ${data.totalMembersAssigned} Member and ${data.totalNonMembersAssigned} Non-Member numbers for ${data.year}`
      );
    },
    onError: (error: unknown) => {
      showError(
        extractErrorMessage(error, 'Failed to generate register numbers')
      );
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
