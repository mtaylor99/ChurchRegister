/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth';
import { sessionManager } from '../services/auth/sessionManager';
import type { User } from '../services/auth/types';
import type { SessionEvent } from '../services/auth/sessionManager';

// Authentication state interface
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  sessionWarning: boolean;
  sessionExpiry: Date | null;
}

// Provider interface
export interface AuthProviderProps {
  children: ReactNode;
}

// Authentication actions interface
export interface AuthActions {
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    acceptTerms: boolean;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  clearSessionWarning: () => void;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
  }) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (
    token: string,
    email: string,
    newPassword: string
  ) => Promise<void>;
  confirmEmail: (token: string, email: string) => Promise<void>;
  resendEmailConfirmation: (email: string) => Promise<void>;
}

// Role and permission interface (stable across re-renders)
export interface AuthPermissions {
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

// Token management interface (stable across re-renders)
export interface AuthTokens {
  getAccessToken: () => string | null;
  isTokenValid: () => boolean;
}

// Split contexts for better performance
export const AuthStateContext = createContext<AuthState | undefined>(undefined);
export const AuthActionsContext = createContext<AuthActions | undefined>(
  undefined
);
export const AuthPermissionsContext = createContext<
  AuthPermissions | undefined
>(undefined);
export const AuthTokensContext = createContext<AuthTokens | undefined>(
  undefined
);

// Backward compatibility - combined context
export interface AuthContextType
  extends AuthState,
    AuthActions,
    AuthPermissions,
    AuthTokens {}
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

// Authentication provider component with performance optimizations
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // State management
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionWarning, setSessionWarning] = useState<boolean>(false);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);

  // Ref to prevent re-creating callbacks on every render
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated and get fresh user data
      const { user: currentUser, isAuthenticated: authStatus } =
        await authService.initializeAuth();

      setUser(currentUser);
      setIsAuthenticated(authStatus);

      // Setup automatic token refresh if authenticated
      if (authStatus && currentUser) {
        // Setup session manager
        sessionManager.start();

        // Add session event callbacks
        const unsubscribe = sessionManager.addCallback(
          (event: SessionEvent, data) => {
            switch (event) {
              case 'token_refreshed':
                break;
              case 'session_warning': {
                setSessionWarning(true);
                const warningData = data as { minutesUntilExpiry: number };
                const expiryTime = new Date(
                  Date.now() + warningData.minutesUntilExpiry * 60 * 1000
                );
                setSessionExpiry(expiryTime);
                break;
              }
              case 'session_expired':
              case 'logout_required':
                handleLogout('session_expired');
                break;
              case 'inactivity_detected':
                setError('Session will expire due to inactivity');
                // Note: Don't auto-logout on inactivity detection, just warn
                break;
            }
          }
        );

        // Store cleanup function for later use
        return () => {
          unsubscribe();
          sessionManager.stop();
        };
      }
    } catch {
      // Authentication initialization failed
      setUser(null);
      setIsAuthenticated(false);
      setError('Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }
    // handleLogout is stable and defined later in the component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Login action
  const login = useCallback(
    async (
      email: string,
      password: string,
      rememberMe = false
    ): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await authService.login({
          email,
          password,
          rememberMe,
        });

        setUser(response.user);
        setIsAuthenticated(true);

        // Setup automatic token refresh
        authService.setupAutoRefresh(
          () => {},
          () => {
            handleLogout('session_expired');
          }
        );
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : 'Login failed');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    // handleLogout is stable and defined later in the component
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Enhanced logout action with proper cleanup
  const handleLogout = useCallback(
    async (
      reason:
        | 'user_action'
        | 'session_expired'
        | 'security'
        | 'inactivity' = 'user_action'
    ): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        // Stop session manager first to prevent conflicts
        sessionManager.stop();

        // Perform comprehensive logout
        await authService.logout(reason);

        // Clear any cleanup functions stored in ref
        if (cleanupRef.current) {
          cleanupRef.current();
          cleanupRef.current = null;
        }
      } catch {
        // Even if logout fails, clear local state for security
      } finally {
        // Always clear state regardless of logout success/failure
        setUser(null);
        setIsAuthenticated(false);
        setSessionWarning(false);
        setSessionExpiry(null);
        setIsLoading(false);

        // Clear any remaining error after logout
        setTimeout(() => setError(null), 100);
      }
    },
    []
  );

  // Register action
  const register = useCallback(
    async (data: {
      email: string;
      password: string;
      confirmPassword: string;
      firstName: string;
      lastName: string;
      acceptTerms: boolean;
    }): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await authService.register(data);

        setUser(response.user);
        setIsAuthenticated(true);

        // Setup automatic token refresh
        authService.setupAutoRefresh(
          () => {},
          () => {
            handleLogout('session_expired');
          }
        );
      } catch (error: unknown) {
        setError(
          error instanceof Error ? error.message : 'Registration failed'
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    // handleLogout is stable and defined later in the component
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Refresh user data
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      setError(null);

      if (!authService.isAuthenticated()) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : 'Failed to refresh user data'
      );

      // If refresh fails, user might be logged out
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Update profile action
  const updateProfile = useCallback(
    async (data: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
    }): Promise<void> => {
      try {
        setError(null);

        const updatedUser = await authService.updateProfile(data);
        setUser(updatedUser);
      } catch (error: unknown) {
        setError(
          error instanceof Error ? error.message : 'Profile update failed'
        );
        throw error;
      }
    },
    []
  );

  // Change password action
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<void> => {
      try {
        setError(null);

        await authService.changePassword({
          currentPassword,
          newPassword,
          confirmPassword: newPassword, // Assume confirmation matches for context usage
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : 'Password change failed';
        setError(errorMessage);
        throw error;
      }
    },
    []
  );

  // Request password reset
  const requestPasswordReset = useCallback(
    async (email: string): Promise<void> => {
      try {
        setError(null);

        await authService.requestPasswordReset(email);
      } catch (error: unknown) {
        setError(
          error instanceof Error
            ? error.message
            : 'Password reset request failed'
        );
        throw error;
      }
    },
    []
  );

  // Confirm password reset
  const confirmPasswordReset = useCallback(
    async (
      token: string,
      _email: string,
      newPassword: string
    ): Promise<void> => {
      try {
        setError(null);

        await authService.confirmPasswordReset({
          token,
          newPassword,
          confirmPassword: newPassword, // Assume confirmation matches
        });
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Password reset confirmation failed';
        setError(errorMessage);
        throw error;
      }
    },
    []
  );

  // Confirm email
  const confirmEmail = useCallback(
    async (token: string, email: string): Promise<void> => {
      try {
        setError(null);

        await authService.confirmEmail({
          token,
          email,
        });

        // Refresh user data to get updated email confirmation status
        await refreshUser();
      } catch (error: unknown) {
        setError(
          error instanceof Error ? error.message : 'Email confirmation failed'
        );
        throw error;
      }
    },
    [refreshUser]
  );

  // Resend email confirmation
  const resendEmailConfirmation = useCallback(
    async (email: string): Promise<void> => {
      try {
        setError(null);

        await authService.resendEmailConfirmation(email);
      } catch (error: unknown) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to resend confirmation email'
        );
        throw error;
      }
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear session warning
  const clearSessionWarning = useCallback(() => {
    setSessionWarning(false);
    setSessionExpiry(null);
  }, []);

  // Role checking functions
  const hasRole = useCallback(
    (role: string): boolean => {
      return (
        user?.roles.some(
          (userRole) => userRole.toLowerCase() === role.toLowerCase()
        ) || false
      );
    },
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some((role) => hasRole(role));
    },
    [hasRole]
  );

  const hasAllRoles = useCallback(
    (roles: string[]): boolean => {
      return roles.every((role) => hasRole(role));
    },
    [hasRole]
  );

  // Permission checking functions
  const hasPermission = useCallback(
    (permission: string): boolean => {
      return (
        user?.permissions.some(
          (userPermission) =>
            userPermission.toLowerCase() === permission.toLowerCase()
        ) || false
      );
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      return permissions.some((permission) => hasPermission(permission));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      return permissions.every((permission) => hasPermission(permission));
    },
    [hasPermission]
  );

  // Token management functions
  const getAccessToken = useCallback((): string | null => {
    return authService.getStoredUser() ? 'token_available' : null; // Simplified for now
  }, []);

  const isTokenValid = useCallback((): boolean => {
    return authService.isAuthenticated();
  }, []);

  // Initialize authentication on mount
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const initialize = async () => {
      cleanup = await initializeAuth();
    };

    initialize();

    // Store cleanup function for later use
    cleanupRef.current = cleanup || null;

    // Cleanup function
    return () => {
      if (cleanup) {
        cleanup();
      }
      cleanupRef.current = null;
    };
  }, [initializeAuth]);

  // Memoized state object to prevent unnecessary re-renders
  const authState = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      error,
      sessionWarning,
      sessionExpiry,
    }),
    [user, isAuthenticated, isLoading, error, sessionWarning, sessionExpiry]
  );

  // Memoized actions object (stable across re-renders)
  const authActions = useMemo<AuthActions>(
    () => ({
      login,
      logout: handleLogout,
      register,
      refreshUser,
      clearError,
      clearSessionWarning,
      updateProfile,
      changePassword,
      requestPasswordReset,
      confirmPasswordReset,
      confirmEmail,
      resendEmailConfirmation,
    }),
    [
      login,
      handleLogout,
      register,
      refreshUser,
      clearError,
      clearSessionWarning,
      updateProfile,
      changePassword,
      requestPasswordReset,
      confirmPasswordReset,
      confirmEmail,
      resendEmailConfirmation,
    ]
  );

  // Memoized permissions object (stable across re-renders)
  const authPermissions = useMemo<AuthPermissions>(
    () => ({
      hasRole,
      hasAnyRole,
      hasAllRoles,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    }),
    [
      hasRole,
      hasAnyRole,
      hasAllRoles,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    ]
  );

  // Memoized tokens object (stable across re-renders)
  const authTokens = useMemo<AuthTokens>(
    () => ({
      getAccessToken,
      isTokenValid,
    }),
    [getAccessToken, isTokenValid]
  );

  // Combined context value for backward compatibility
  const contextValue = useMemo<AuthContextType>(
    () => ({
      ...authState,
      ...authActions,
      ...authPermissions,
      ...authTokens,
    }),
    [authState, authActions, authPermissions, authTokens]
  );

  return (
    <AuthStateContext.Provider value={authState}>
      <AuthActionsContext.Provider value={authActions}>
        <AuthPermissionsContext.Provider value={authPermissions}>
          <AuthTokensContext.Provider value={authTokens}>
            <AuthContext.Provider value={contextValue}>
              {children}
            </AuthContext.Provider>
          </AuthTokensContext.Provider>
        </AuthPermissionsContext.Provider>
      </AuthActionsContext.Provider>
    </AuthStateContext.Provider>
  );
};

export default AuthProvider;
