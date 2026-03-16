/**
 * Generic typed API mutation hook
 *
 * Wraps `useMutation` from React Query with a consistent notification pattern.
 * Eliminates boilerplate in feature hooks by centralising the
 * `showSuccess / showError` pattern used across all mutation hooks.
 *
 * @example
 * ```typescript
 * const createMember = useApiMutation({
 *   mutationFn: (req: CreateChurchMemberRequest) =>
 *     churchMembersApi.createChurchMember(req),
 *   onSuccessMessage: 'Church member created successfully',
 *   onErrorMessage: 'Failed to create church member',
 *   invalidateKeys: [churchMemberKeys.all],
 * });
 * ```
 */
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
  type QueryKey,
} from '@tanstack/react-query';
import { useNotification } from './useNotification';
import { extractErrorMessage } from '../utils/typeGuards';

export interface ApiMutationOptions<
  TData,
  TVariables,
  TError = Error,
  TContext = unknown,
> extends Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    'mutationFn' | 'onSuccess' | 'onError'
  > {
  /** The async function that performs the API call */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Toast message shown on success (omit to suppress the success toast) */
  onSuccessMessage?: string | ((data: TData, variables: TVariables) => string);
  /** Fallback error message when none is available from the API */
  onErrorMessage?: string;
  /**
   * Query keys to invalidate after a successful mutation.
   * Accepts an array of keys — each key is passed to
   * `queryClient.invalidateQueries`.
   */
  invalidateKeys?: QueryKey[];
  /** Optional success callback (3-arg subset of MutationOptions.onSuccess) */
  onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
  /** Optional error callback (3-arg subset of MutationOptions.onError) */
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined
  ) => void;
}

/**
 * Typed mutation hook with built-in notification and cache invalidation support.
 *
 * @param options - Mutation configuration including the mutationFn and helpers
 * @returns Standard `UseMutationResult` from React Query
 */
export function useApiMutation<
  TData,
  TVariables,
  TError = Error,
  TContext = unknown,
>(
  options: ApiMutationOptions<TData, TVariables, TError, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useNotification();

  const {
    mutationFn,
    onSuccessMessage,
    onErrorMessage = 'An unexpected error occurred',
    invalidateKeys = [],
    onSuccess,
    onError,
    ...rest
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn,
    ...rest,
    onSuccess: (data, variables, context) => {
      // Invalidate related queries
      invalidateKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key as QueryKey });
      });

      // Show success toast
      if (onSuccessMessage) {
        const message =
          typeof onSuccessMessage === 'function'
            ? onSuccessMessage(data, variables)
            : onSuccessMessage;
        showSuccess(message);
      }

      // Call caller-provided onSuccess if present
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      showError(extractErrorMessage(error, onErrorMessage));

      // Call caller-provided onError if present
      onError?.(error, variables, context);
    },
  });
}
