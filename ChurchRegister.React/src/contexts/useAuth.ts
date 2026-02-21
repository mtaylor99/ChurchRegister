import { useContext } from 'react';
import {
  AuthContext,
  AuthStateContext,
  AuthActionsContext,
  AuthPermissionsContext,
  AuthTokensContext,
} from './AuthContext';
import type {
  AuthContextType,
  AuthState,
  AuthActions,
  AuthPermissions,
  AuthTokens,
} from './AuthContext';

// Custom hook to use full authentication context (backward compatibility)
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Optimized hooks for specific context slices to reduce re-renders

// Hook for authentication state only (user, loading, errors, session)
export const useAuthState = (): AuthState => {
  const context = useContext(AuthStateContext);
  if (context === undefined) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return context;
};

// Hook for authentication actions only (login, logout, register, etc.)
export const useAuthActions = (): AuthActions => {
  const context = useContext(AuthActionsContext);
  if (context === undefined) {
    throw new Error('useAuthActions must be used within an AuthProvider');
  }
  return context;
};

// Hook for permissions and roles only
export const useAuthPermissions = (): AuthPermissions => {
  const context = useContext(AuthPermissionsContext);
  if (context === undefined) {
    throw new Error('useAuthPermissions must be used within an AuthProvider');
  }
  return context;
};

// Hook for token management only
export const useAuthTokens = (): AuthTokens => {
  const context = useContext(AuthTokensContext);
  if (context === undefined) {
    throw new Error('useAuthTokens must be used within an AuthProvider');
  }
  return context;
};

// Convenience hooks for common use cases

// Hook to check if user is authenticated (minimal re-renders)
export const useIsAuthenticated = (): boolean => {
  const { isAuthenticated } = useAuthState();
  return isAuthenticated;
};

// Hook to get current user (minimal re-renders)
export const useCurrentUser = () => {
  const { user } = useAuthState();
  return user;
};

// Hook to check loading state (minimal re-renders)
export const useAuthLoading = (): boolean => {
  const { isLoading } = useAuthState();
  return isLoading;
};

// Hook to get error state (minimal re-renders)
export const useAuthError = (): string | null => {
  const { error } = useAuthState();
  return error;
};
