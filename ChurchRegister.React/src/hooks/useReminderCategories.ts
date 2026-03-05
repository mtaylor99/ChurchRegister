import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reminderCategoriesApi } from '../services/api';
import type {
  CreateReminderCategoryRequest,
  UpdateReminderCategoryRequest,
} from '../types/reminderCategories';
import { useNotification } from './useNotification';
import { extractErrorMessage } from '../utils/typeGuards';
import { reminderCategoryKeys, reminderKeys } from '../utils/queryKeys';

/**
 * @deprecated Import from `@utils/queryKeys` instead.
 * Maintained for backward compatibility - re-exports the centralized key factory.
 */
export const reminderCategoryQueryKeys = reminderCategoryKeys;

/**
 * Hook to fetch all reminder categories
 * Returns categories ordered by sortOrder with reminder counts
 */
export const useReminderCategories = () => {
  return useQuery({
    queryKey: reminderCategoryQueryKeys.lists(),
    queryFn: () => reminderCategoriesApi.getCategories(),
  });
};

/**
 * Hook to fetch a single reminder category by ID
 * @param id - Category ID
 */
export const useReminderCategory = (id: number) => {
  return useQuery({
    queryKey: reminderCategoryQueryKeys.detail(id),
    queryFn: () => reminderCategoriesApi.getCategoryById(id),
    enabled: !!id,
  });
};

/**
 * Hook to create a new reminder category
 * Invalidates category and reminder queries on success
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: (request: CreateReminderCategoryRequest) =>
      reminderCategoriesApi.createCategory(request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reminderCategoryQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: reminderKeys.all,
      });
      showSuccess('Category created successfully');
    },
    onError: (error: unknown) => {
      showError(extractErrorMessage(error, 'Failed to create category'));
    },
  });
};

/**
 * Hook to update a reminder category
 * Invalidates category and reminder queries on success
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
      request: UpdateReminderCategoryRequest;
    }) => reminderCategoriesApi.updateCategory(id, request),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reminderCategoryQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: reminderKeys.all,
      });
      showSuccess('Category updated successfully');
    },
    onError: (error: unknown) => {
      showError(extractErrorMessage(error, 'Failed to update category'));
    },
  });
};

/**
 * Hook to delete a reminder category
 * Prevents deletion of system categories or categories in use
 * Invalidates category and reminder queries on success
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  return useMutation({
    mutationFn: (id: number) => reminderCategoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: reminderCategoryQueryKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: reminderKeys.all,
      });
      showSuccess('Category deleted successfully');
    },
    onError: (error: unknown) => {
      showError(
        extractErrorMessage(
          error,
          'Failed to delete category. System categories and categories with reminders cannot be deleted.'
        )
      );
    },
  });
};
