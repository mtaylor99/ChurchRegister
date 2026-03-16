import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingCertificatesApi } from '../services/api';
import { useNotification } from './useNotification';
import { extractErrorMessage } from '../utils/typeGuards';

/**
 * Hook to delete a training certificate
 * Removes the certificate from the system
 * Invalidates training certificate queries on success
 */
export const useDeleteTrainingCertificate = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: (id: number) =>
      trainingCertificatesApi.deleteTrainingCertificate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trainingCertificates'],
      });
      showSuccess('Training certificate deleted successfully');
    },
    onError: (error: unknown) => {
      showError(
        extractErrorMessage(error, 'Failed to delete training certificate')
      );
    },
  });
};
