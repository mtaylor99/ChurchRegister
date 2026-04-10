/**
 * Generic typed API query hook
 *
 * Wraps `useQuery` from React Query with a consistent pattern for fetching
 * API data. Provides TypeScript generics so callers get fully-typed results
 * without repeating the type annotation on every `useQuery` call.
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useApiQuery<ChurchMemberDto[]>({
 *   queryKey: churchMemberKeys.list(query),
 *   queryFn: () => churchMembersApi.getMembers(query),
 * });
 * ```
 */
import {
  useQuery,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

/**
 * Options accepted by `useApiQuery`.
 * Forwards all standard React Query `useQuery` options, requiring only
 * `queryKey` and `queryFn` to be specified.
 */
export type ApiQueryOptions<TData, TError = Error> = UseQueryOptions<
  TData,
  TError
>;

/**
 * Typed wrapper around `useQuery` for API data fetching.
 *
 * @param options - React Query options (queryKey + queryFn are required)
 * @returns Typed `UseQueryResult` with `data` narrowed to `TData`
 */
export function useApiQuery<TData, TError = Error>(
  options: ApiQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  return useQuery<TData, TError>(options);
}
