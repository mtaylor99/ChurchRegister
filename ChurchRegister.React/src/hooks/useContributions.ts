import { useMutation, useQueryClient } from '@tanstack/react-query';
import { contributionHistoryApi } from '../services/api/contributionHistoryApi';
import { useNotification } from './useNotification';
import { extractErrorMessage } from '../utils/typeGuards';

/**
 * Hook to edit a contribution amount
 * Updates the amount of a manual one-off contribution
 * Invalidates contribution history queries on success
 */
export const useEditContribution = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      contributionHistoryApi.editContribution(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['contributionHistory'],
      });
      queryClient.invalidateQueries({
        queryKey: ['churchMembers'],
      });
      queryClient.invalidateQueries({
        queryKey: ['contribution-members'],
      });
      showNotification('Contribution updated successfully', 'success');
    },
    onError: (error: unknown) => {
      showNotification(
        extractErrorMessage(error, 'Failed to update contribution'),
        'error'
      );
    },
  });
};

/**
 * Hook to delete a contribution
 * Permanently deletes a manual one-off contribution
 * Invalidates contribution history queries on success
 */
export const useDeleteContribution = () => {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation({
    mutationFn: (id: number) => contributionHistoryApi.deleteContribution(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['contributionHistory'],
      });
      queryClient.invalidateQueries({
        queryKey: ['churchMembers'],
      });
      queryClient.invalidateQueries({
        queryKey: ['contribution-members'],
      });
      showNotification('Contribution deleted successfully', 'success');
    },
    onError: (error: unknown) => {
      showNotification(
        extractErrorMessage(error, 'Failed to delete contribution'),
        'error'
      );
    },
  });
};
