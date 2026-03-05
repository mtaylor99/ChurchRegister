/**
 * useOptimisticList — Optimistic UI mutations for list-based data
 *
 * Provides a typed helper for performing optimistic updates on React Query
 * list caches. The cache is updated immediately with the new/updated item
 * before the server responds; if the server call fails the cache is rolled
 * back automatically.
 *
 * @example
 * ```typescript
 * // Optimistic delete from a reminders list
 * const { optimisticRemove } = useOptimisticList<ReminderDto>(
 *   reminderKeys.all,
 *   (a, b) => a.id === b.id
 * );
 *
 * const deleteReminder = useApiMutation({
 *   mutationFn: (id: number) => remindersApi.deleteReminder(id),
 *   ...optimisticRemove((vars) => ({ id: vars, description: '' })),
 * });
 * ```
 */
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface OptimisticMutationCallbacks<TItem, TVariables> {
  /** Cancel in-flight queries and snapshot current cache before mutating */
  onMutate: (
    variables: TVariables
  ) => Promise<{ previousData: TItem[] | undefined }>;
  /** Roll back to the snapshot if the mutation fails */
  onError: (
    error: unknown,
    variables: TVariables,
    context: { previousData: TItem[] | undefined } | undefined
  ) => void;
  /** Always invalidate the query to sync server state after settle */
  onSettled: () => void;
}

/**
 * Returns helper functions that generate React Query callbacks for common
 * optimistic update patterns (add, update, remove).
 *
 * @param queryKey   - The React Query key of the list to update optimistically
 * @param comparator - Function returning `true` when two items represent the same entity
 */
export function useOptimisticList<TItem>(
  queryKey: QueryKey,
  comparator: (a: TItem, b: TItem) => boolean
) {
  const queryClient = useQueryClient();

  /**
   * Returns mutation callbacks that optimistically **remove** an item from the list.
   *
   * @param toItem - Maps mutation variables to a partial item with enough
   *                 fields to satisfy the comparator
   */
  const optimisticRemove = useCallback(
    (
      toItem: (variables: unknown) => TItem
    ): OptimisticMutationCallbacks<TItem, unknown> => ({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey });
        const previousData = queryClient.getQueryData<TItem[]>(queryKey);
        const removed = toItem(variables);
        queryClient.setQueryData<TItem[]>(queryKey, (old) =>
          (old ?? []).filter((item) => !comparator(item, removed))
        );
        return { previousData };
      },
      onError: (_err, _vars, context) => {
        if (context?.previousData !== undefined) {
          queryClient.setQueryData<TItem[]>(queryKey, context.previousData);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    }),
    [queryClient, queryKey, comparator]
  );

  /**
   * Returns mutation callbacks that optimistically **add** an item to the list.
   *
   * @param toItem - Maps mutation variables to the optimistic item
   */
  const optimisticAdd = useCallback(
    (
      toItem: (variables: unknown) => TItem
    ): OptimisticMutationCallbacks<TItem, unknown> => ({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey });
        const previousData = queryClient.getQueryData<TItem[]>(queryKey);
        const added = toItem(variables);
        queryClient.setQueryData<TItem[]>(queryKey, (old) => [
          ...(old ?? []),
          added,
        ]);
        return { previousData };
      },
      onError: (_err, _vars, context) => {
        if (context?.previousData !== undefined) {
          queryClient.setQueryData<TItem[]>(queryKey, context.previousData);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    }),
    [queryClient, queryKey, comparator]
  );

  /**
   * Returns mutation callbacks that optimistically **update** an item in the list.
   *
   * @param toItem - Maps mutation variables to the updated item
   */
  const optimisticUpdate = useCallback(
    (
      toItem: (variables: unknown) => TItem
    ): OptimisticMutationCallbacks<TItem, unknown> => ({
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey });
        const previousData = queryClient.getQueryData<TItem[]>(queryKey);
        const updated = toItem(variables);
        queryClient.setQueryData<TItem[]>(queryKey, (old) =>
          (old ?? []).map((item) =>
            comparator(item, updated) ? updated : item
          )
        );
        return { previousData };
      },
      onError: (_err, _vars, context) => {
        if (context?.previousData !== undefined) {
          queryClient.setQueryData<TItem[]>(queryKey, context.previousData);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    }),
    [queryClient, queryKey, comparator]
  );

  return { optimisticRemove, optimisticAdd, optimisticUpdate };
}
