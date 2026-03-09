import type {
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { logger } from '../utils/logger';

/**
 * Standardized React Query configuration for error handling and retry logic
 */

/**
 * Default retry logic for transient failures
 * Retries 3 times with exponential backoff for 5xx and network errors
 */
export const defaultRetryConfig = {
  retry: (failureCount: number, error: unknown): boolean => {
    // Don't retry client errors (4xx)
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      if (
        message.includes('400') ||
        message.includes('401') ||
        message.includes('403') ||
        message.includes('404')
      ) {
        return false;
      }
    }

    // Retry up to 3 times for server errors and network issues
    return failureCount < 3;
  },
  retryDelay: (attemptIndex: number): number => {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * 2 ** attemptIndex, 30000);
  },
};

/**
 * Standard onError handler that logs errors
 */
export const defaultOnError = (error: unknown, context?: string): void => {
  logger.error(
    `Query/Mutation error${context ? ` in ${context}` : ''}`,
    error instanceof Error ? error : new Error(String(error)),
    { context }
  );
};

/**
 * Configuration for static/reference data queries (roles, statuses, districts)
 * Long cache time, rare refetching
 */
export const staticDataQueryConfig: Partial<UseQueryOptions> = {
  staleTime: 1000 * 60 * 60, // 1 hour
  gcTime: 1000 * 60 * 60 * 2, // 2 hours
  retry: defaultRetryConfig.retry,
  retryDelay: defaultRetryConfig.retryDelay,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
};

/**
 * Configuration for frequently changing data queries (contributions, members list)
 * Moderate cache time, refetch on focus
 */
export const dynamicDataQueryConfig: Partial<UseQueryOptions> = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 10, // 10 minutes
  retry: defaultRetryConfig.retry,
  retryDelay: defaultRetryConfig.retryDelay,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
};

/**
 * Configuration for real-time data queries (dashboard stats, analytics)
 * Short cache time, aggressive refetching
 */
export const realtimeDataQueryConfig: Partial<UseQueryOptions> = {
  staleTime: 1000 * 30, // 30 seconds
  gcTime: 1000 * 60 * 2, // 2 minutes
  retry: defaultRetryConfig.retry,
  retryDelay: defaultRetryConfig.retryDelay,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: 1000 * 60, // 1 minute
};

/**
 * Standard mutation configuration with error handling
 */
export const defaultMutationConfig: Partial<UseMutationOptions> = {
  retry: false, // Don't retry mutations by default
  onError: (error: unknown) => defaultOnError(error, 'mutation'),
};

/**
 * Helper to create query config with custom error handling
 */
export const createQueryConfig = <TData = unknown>(
  config: Partial<UseQueryOptions<TData>> & { context?: string } = {}
): Partial<UseQueryOptions<TData>> => {
  const { context, ...restConfig } = config;
  return {
    ...dynamicDataQueryConfig,
    ...restConfig,
    onError: (error: unknown) => defaultOnError(error, context),
  } as Partial<UseQueryOptions<TData>>;
};

/**
 * Helper to create mutation config with custom error handling
 */
export const createMutationConfig = <TData = unknown, TVariables = unknown>(
  config: Partial<UseMutationOptions<TData, unknown, TVariables>> & {
    context?: string;
  } = {}
): Partial<UseMutationOptions<TData, unknown, TVariables>> => {
  const { context, ...restConfig } = config;
  return {
    ...defaultMutationConfig,
    ...restConfig,
    onError: (error: unknown) => defaultOnError(error, context),
  } as Partial<UseMutationOptions<TData, unknown, TVariables>>;
};
