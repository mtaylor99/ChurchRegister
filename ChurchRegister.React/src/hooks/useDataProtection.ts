import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataProtectionApi } from '../services/api';
import type { UpdateDataProtectionRequest } from '../types/dataProtection';
import { useNotification } from './useNotification';

/**
 * Query keys for data protection
 * Follows React Query best practices for hierarchical keys
 */
export const dataProtectionQueryKeys = {
  all: ['dataProtection'] as const,
  byMember: (memberId: number) =>
    [...dataProtectionQueryKeys.all, 'member', memberId] as const,
};

/**
 * Hook to fetch data protection consent information for a church member
 * @param memberId - The ID of the church member
 */
export const useDataProtection = (memberId: number) => {
  return useQuery({
    queryKey: dataProtectionQueryKeys.byMember(memberId),
    queryFn: () => dataProtectionApi.getDataProtection(memberId),
    enabled: !!memberId && memberId > 0,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};

/**
 * Hook to update data protection consent information
 * Invalidates church members queries and data protection queries on success
 */
export const useUpdateDataProtection = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: ({
      memberId,
      request,
    }: {
      memberId: number;
      request: UpdateDataProtectionRequest;
    }) => dataProtectionApi.updateDataProtection(memberId, request),
    onSuccess: (_data, variables) => {
      // Invalidate church members queries to refresh grid
      queryClient.invalidateQueries({
        queryKey: ['churchMembers'],
      });
      
      // Invalidate specific data protection query
      queryClient.invalidateQueries({
        queryKey: dataProtectionQueryKeys.byMember(variables.memberId),
      });
      
      // Invalidate all data protection queries
      queryClient.invalidateQueries({
        queryKey: dataProtectionQueryKeys.all,
      });
      
      showSuccess('Data protection consent updated successfully');
    },
    onError: (error: any) => {
      showError(
        error.response?.data?.message ||
          error.message ||
          'Failed to update data protection consent'
      );
    },
  });
};
