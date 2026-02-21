import { useEffect, useCallback, useState, useRef } from 'react';
import { tokenService } from '../services/auth/tokenService';
import type { AuthTokens } from '../services/auth/types';

export interface TokenRefreshState {
  isRefreshing: boolean;
  lastRefresh: Date | null;
  refreshCount: number;
  error: string | null;
}

export interface UseTokenRefreshOptions {
  onRefreshSuccess?: (tokens: AuthTokens) => void;
  onRefreshError?: (error: Error) => void;
  enableLogging?: boolean;
}

/**
 * React hook for managing automatic token refresh
 * Provides state and controls for token refresh operations
 */
export const useTokenRefresh = (options: UseTokenRefreshOptions = {}) => {
  const { onRefreshSuccess, onRefreshError, enableLogging = false } = options;

  const [state, setState] = useState<TokenRefreshState>({
    isRefreshing: false,
    lastRefresh: null,
    refreshCount: 0,
    error: null,
  });

  // Use refs to avoid recreating callbacks on every render
  const onRefreshSuccessRef = useRef(onRefreshSuccess);
  const onRefreshErrorRef = useRef(onRefreshError);

  // Update refs when callbacks change
  useEffect(() => {
    onRefreshSuccessRef.current = onRefreshSuccess;
    onRefreshErrorRef.current = onRefreshError;
  }, [onRefreshSuccess, onRefreshError]);

  // Setup automatic token refresh monitoring
  useEffect(() => {
    // Set up the refresh listener
    const unsubscribe = tokenService.addRefreshListener((tokens) => {
      setState((prevState) => {
        if (tokens) {
          // Successful refresh

          const newState = {
            ...prevState,
            isRefreshing: false,
            lastRefresh: new Date(),
            refreshCount: prevState.refreshCount + 1,
            error: null,
          };

          // Call success callback if provided
          if (onRefreshSuccessRef.current) {
            try {
              onRefreshSuccessRef.current(tokens);
            } catch {
              // Ignore callback errors
            }
          }

          return newState;
        } else {
          // Failed refresh

          const error = new Error('Token refresh failed');
          const newState = {
            ...prevState,
            isRefreshing: false,
            error: error.message,
          };

          // Call error callback if provided
          if (onRefreshErrorRef.current) {
            try {
              onRefreshErrorRef.current(error);
            } catch {
              // Ignore callback errors
            }
          }

          return newState;
        }
      });
    });

    // Monitor refresh state changes
    const checkRefreshState = () => {
      const isCurrentlyRefreshing = tokenService.isCurrentlyRefreshing();
      setState((prevState) => {
        if (prevState.isRefreshing !== isCurrentlyRefreshing) {
          return {
            ...prevState,
            isRefreshing: isCurrentlyRefreshing,
          };
        }
        return prevState;
      });
    };

    // Check refresh state periodically
    const stateCheckInterval = setInterval(checkRefreshState, 1000);

    // Setup auto refresh
    const cleanupAutoRefresh = tokenService.setupAutoRefresh();

    // Cleanup function
    return () => {
      unsubscribe();
      cleanupAutoRefresh();
      clearInterval(stateCheckInterval);
    };
  }, [enableLogging]);

  // Manual refresh function
  const refreshNow = useCallback(async (): Promise<AuthTokens | null> => {
    try {
      setState((prevState) => ({
        ...prevState,
        isRefreshing: true,
        error: null,
      }));

      const tokens = await tokenService.refreshTokenIfNeeded();

      if (!tokens) {
        throw new Error('No tokens returned from refresh');
      }

      return tokens;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      setState((prevState) => ({
        ...prevState,
        isRefreshing: false,
        error: errorMessage,
      }));

      throw error;
    }
  }, []);

  // Get current token info
  const getTokenInfo = useCallback(() => {
    const tokens = tokenService.getTokens();
    if (!tokens) return null;

    const timeUntilExpiry = tokens.expiresAt.getTime() - Date.now();
    const willExpireSoon = tokenService.willExpireSoon();

    return {
      expiresAt: tokens.expiresAt,
      timeUntilExpiry,
      willExpireSoon,
      isValid: tokenService.isTokenValid(),
    };
  }, []);

  // Check if token needs refresh
  const needsRefresh = useCallback((): boolean => {
    return (
      tokenService.hasToken() &&
      (!tokenService.isTokenValid() || tokenService.willExpireSoon())
    );
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      error: null,
    }));
  }, []);

  return {
    // State
    ...state,

    // Actions
    refreshNow,
    clearError,

    // Getters
    getTokenInfo,
    needsRefresh,

    // Utilities
    hasToken: tokenService.hasToken.bind(tokenService),
    isTokenValid: tokenService.isTokenValid.bind(tokenService),
    willExpireSoon: tokenService.willExpireSoon.bind(tokenService),
  };
};

export default useTokenRefresh;
