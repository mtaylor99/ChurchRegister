import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dataProtectionApi } from '../services/api';
import type { UpdateDataProtectionRequest } from '../types/dataProtection';
import { useNotification } from './useNotification';
import { extractErrorMessage } from '../utils/typeGuards';
import { dataProtectionKeys } from '../utils/queryKeys';

/**
 * @deprecated Import from `@utils/queryKeys` instead.
 * Maintained for backward compatibility - re-exports the centralized key factory.
 */
export const dataProtectionQueryKeys = dataProtectionKeys;

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
    onError: (error: unknown) => {
      showError(
        extractErrorMessage(error, 'Failed to update data protection consent')
      );
    },
  });
};
