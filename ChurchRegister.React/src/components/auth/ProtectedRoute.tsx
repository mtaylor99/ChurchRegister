import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../contexts';
import { useRBAC } from '../../hooks/useRBAC';
import { AuthErrorDisplay } from './AuthErrorDisplay';
import { UnauthorizedPage } from '../../pages/error';
import type { User } from '../../services/auth/types';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Required roles - user must have at least one of these roles */
  requiredRoles?: string[];
  /** Required permissions - user must have all of these permissions */
  requiredPermissions?: string[];
  /** Resource context for permission checking */
  resource?: {
    type: string;
    id?: string | number;
    ownerId?: string;
  };
  /** Allow resource ownership to bypass permission checks */
  allowOwnership?: boolean;
  /** Redirect path when unauthorized (default: '/auth/login') */
  redirectTo?: string;
  /** Show loading spinner while checking authentication */
  showLoading?: boolean;
  /** Custom unauthorized component */
  unauthorizedComponent?: React.ComponentType<{
    reason: string;
    user?: User | null;
    onRetry?: () => void;
  }>;
  /** Require email confirmation */
  requireEmailConfirmed?: boolean;
  /** Show detailed error information for debugging */
  showDebugInfo?: boolean;
}

/**
 * ProtectedRoute component that handles authentication and authorization
 * Supports role-based access control and permission checking with enhanced RBAC
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  resource,
  allowOwnership = true,
  redirectTo = '/login',
  showLoading = true,
  unauthorizedComponent: UnauthorizedComponent,
  requireEmailConfirmed = false,
}) => {
  const {
    user,
    isAuthenticated: globalIsAuthenticated,
    isLoading: globalIsLoading,
  } = useAuth();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const location = useLocation();
  const rbac = useRBAC();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use the global authentication state from AuthProvider instead of making separate API calls
        if (globalIsLoading) {
          return; // Wait for global auth check to complete
        }

        if (!globalIsAuthenticated || !user) {
          setIsAuthenticated(false);
          setAuthError('Authentication required');
          return;
        }

        setIsAuthenticated(true);
        setAuthError(null);
      } catch (error) {
        console.error('Authentication verification failed:', error);
        setIsAuthenticated(false);
        setAuthError('Authentication verification failed');
      }
    };

    checkAuth();
  }, [globalIsAuthenticated, globalIsLoading, user]);

  // Show loading spinner while checking authentication
  if ((isAuthenticated === null || globalIsLoading) && showLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        flexDirection="column"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="body2" color="text.secondary">
          Verifying authentication...
        </Typography>
      </Box>
    );
  }

  // Not authenticated - redirect to login (skip returnUrl if logout is in progress)
  if (!isAuthenticated) {
    // Check if logout is in progress to avoid adding returnUrl
    const isLogoutInProgress =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem('auth_logout_in_progress') === 'true';

    // Clear the logout flag after checking
    if (isLogoutInProgress && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('auth_logout_in_progress');
    }

    // Only add returnUrl if not logging out
    const loginPath = isLogoutInProgress
      ? redirectTo
      : `${redirectTo}?returnUrl=${encodeURIComponent(
          `${location.pathname}${location.search}`
        )}`;

    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  // Check email confirmation requirement
  if (requireEmailConfirmed && rbac.user && !rbac.user.emailConfirmed) {
    const reason = 'Email confirmation required to access this page';

    if (UnauthorizedComponent) {
      return (
        <UnauthorizedComponent
          reason={reason}
          user={rbac.user}
          onRetry={() => window.location.reload()}
        />
      );
    }

    // Use UnauthorizedPage for email confirmation requirement
    return (
      <UnauthorizedPage
        user={{
          id: rbac.user?.id || '',
          email: rbac.user?.email || '',
          name: rbac.user?.firstName || rbac.user?.email || '',
          roles: rbac.user?.roles || [],
          permissions: rbac.getUserPermissions() || [],
        }}
        reason="Please confirm your email address to access this page. Check your inbox for a confirmation email."
        requiresLogin={false}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Enhanced RBAC validation using the comprehensive RBAC system
  const accessValidation = rbac.validateAccess(
    resource,
    requiredRoles,
    requiredPermissions,
    allowOwnership
  );

  if (!accessValidation.authorized) {
    if (UnauthorizedComponent) {
      return (
        <UnauthorizedComponent
          reason={accessValidation.reason || 'Access denied'}
          user={rbac.user}
          onRetry={() => window.location.reload()}
        />
      );
    }

    // Use the new UnauthorizedPage component
    return (
      <UnauthorizedPage
        user={{
          id: rbac.user?.id || '',
          email: rbac.user?.email || '',
          name: rbac.user?.firstName || rbac.user?.email || '',
          roles: rbac.user?.roles || [],
          permissions: rbac.getUserPermissions() || [],
        }}
        reason={accessValidation.reason || 'Access denied'}
        requiredRoles={requiredRoles}
        requiredPermissions={requiredPermissions}
        resourceName={resource?.type}
        requiresLogin={false}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Show auth error if any
  if (authError) {
    return (
      <Box p={3}>
        <AuthErrorDisplay
          error={authError}
          onDismiss={() => setAuthError(null)}
          onRetry={() => window.location.reload()}
        />
      </Box>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
};

export default ProtectedRoute;
