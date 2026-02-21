import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersApi } from '../services/api';
import type {
  CreateReminderRequest,
  UpdateReminderRequest,
  CompleteReminderRequest,
  ReminderQueryParameters,
} from '../types/reminders';
import { useNotification } from './useNotification';

/**
 * Query keys for reminders
 * Follows React Query best practices for hierarchical keys
 */
export const reminderQueryKeys = {
  all: ['reminders'] as const,
  list: (params: ReminderQueryParameters) =>
    [...reminderQueryKeys.all, 'list', params] as const,
  detail: (id: number) => [...reminderQueryKeys.all, 'detail', id] as const,
  dashboardSummary: () =>
    [...reminderQueryKeys.all, 'dashboard-summary'] as const,
};

/**
 * Hook to fetch reminders with optional filtering
 * Supports filtering by status, assignedTo, categoryId, description, and showExpired
 * @param params - Query parameters for filtering
 */
export const useReminders = (params: ReminderQueryParameters) => {
  return useQuery({
    queryKey: reminderQueryKeys.list(params),
    queryFn: async () => {
      console.log('useReminders - Fetching with params:', params);
      const result = await remindersApi.getReminders(params);
      console.log('useReminders - API returned:', result);
      console.log('useReminders - Result type:', typeof result, 'Is array:', Array.isArray(result));
      return result;
    },
  });
};

/**
 * Hook to fetch a single reminder by ID
 * @param id - Reminder ID
 */
export const useReminder = (id: number) => {
  return useQuery({
    queryKey: reminderQueryKeys.detail(id),
    queryFn: () => remindersApi.getReminderById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new reminder
 * Invalidates reminder queries and dashboard summary on success
 */
export const useCreateReminder = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: async (request: CreateReminderRequest) => {
      console.log('Creating reminder with request:', request);
      const result = await remindersApi.createReminder(request);
      console.log('Reminder created successfully:', result);
      return result;
    },
    onSuccess: (_data) => {
      console.log('onSuccess called, invalidating queries');
      queryClient.invalidateQueries({
        queryKey: reminderQueryKeys.all,
      });
      showSuccess('Reminder created successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create reminder:', error);
      showError(error.response?.data?.message || error.message || 'Failed to create reminder');
    },
  });
};

/**
 * Hook to update a reminder
 * Cannot update reminders with Status='Completed'
 * Invalidates reminder queries on success
 */
export const useUpdateReminder = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: UpdateReminderRequest;
    }) => remindersApi.updateReminder(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reminderQueryKeys.all,
      });
      showSuccess('Reminder updated successfully');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to update reminder');
    },
  });
};

/**
 * Hook to complete a reminder
 * Optionally creates next reminder with specified interval
 * Invalidates reminder queries and dashboard summary on success
 */
export const useCompleteReminder = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: ({
      id,
      request,
    }: {
      id: number;
      request: CompleteReminderRequest;
    }) => remindersApi.completeReminder(id, request),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: reminderQueryKeys.all,
      });
      const message = response.nextReminder
        ? 'Reminder completed and next reminder created successfully'
        : 'Reminder completed successfully';
      showSuccess(message);
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to complete reminder');
    },
  });
};

/**
 * Hook to delete a reminder
 * Cannot delete reminders with Status='Completed'
 * Invalidates reminder queries and dashboard summary on success
 */
export const useDeleteReminder = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: (id: number) => remindersApi.deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reminderQueryKeys.all,
      });
      showSuccess('Reminder deleted successfully');
    },
    onError: (error: any) => {
      showError(error.message || 'Failed to delete reminder');
    },
  });
};

/**
 * Hook to fetch dashboard reminder summary
 * Returns count of pending reminders due within 60 days
 * Uses 30 second stale time for dashboard widget
 */
export const useDashboardReminderSummary = () => {
  return useQuery({
    queryKey: reminderQueryKeys.dashboardSummary(),
    queryFn: () => remindersApi.getDashboardSummary(),
    staleTime: 30000, // 30 seconds
  });
};
