import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { districtsApi } from '../services/api';
import type { AssignDistrictRequest } from '../types/districts';
import { useNotification } from './useNotification';

/**
 * Query keys for districts
 * Follows React Query best practices for hierarchical keys
 */
export const districtQueryKeys = {
  all: ['districts'] as const,
  list: () => [...districtQueryKeys.all, 'list'] as const,
};

/**
 * Hook to fetch all available districts
 * Districts are static data (A-L), so we set staleTime to Infinity
 */
export const useDistricts = () => {
  return useQuery({
    queryKey: districtQueryKeys.list(),
    queryFn: () => districtsApi.getDistricts(),
    staleTime: Infinity, // Districts don't change, cache indefinitely
  });
};

/**
 * Hook to assign a district to a church member
 * Invalidates church members queries on success
 */
export const useAssignDistrict = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: ({
      memberId,
      request,
    }: {
      memberId: number;
      request: AssignDistrictRequest;
    }) => districtsApi.assignDistrict(memberId, request),
    onSuccess: (_data, variables) => {
      // Invalidate church members queries to refresh grid
      queryClient.invalidateQueries({
        queryKey: ['churchMembers'],
      });
      
      // Invalidate districts queries to refresh member counts
      queryClient.invalidateQueries({
        queryKey: ['districts'],
      });
      
      const districtName = variables.request.districtId ? 'assigned' : 'unassigned';
      showSuccess(`District ${districtName} successfully`);
    },
    onError: (error: any) => {
      showError(
        error.response?.data?.message ||
          error.message ||
          'Failed to assign district'
      );
    },
  });
};
