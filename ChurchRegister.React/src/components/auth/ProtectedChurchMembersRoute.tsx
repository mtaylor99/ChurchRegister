import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { Groups as MembersIcon, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts';
import { useRBAC } from '../../hooks/useRBAC';

export interface ProtectedChurchMembersRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
  featureName?: string;
}

/**
 * Protected route component that requires specific church members permissions
 * Redirects unauthorized users to appropriate error pages
 */
export const ProtectedChurchMembersRoute: React.FC<
  ProtectedChurchMembersRouteProps
> = ({ children, requiredPermission, featureName = 'this feature' }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasPermission } = useRBAC();
  const location = useLocation();

  // Show loading state while authentication is being verified
  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <MembersIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Verifying Access...
          </Typography>
          <Typography color="text.secondary">
            Please wait while we verify your permissions.
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required permission
  const hasRequiredPermission = hasPermission(requiredPermission);

  if (!hasRequiredPermission) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <LockIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="error.main">
            Access Denied
          </Typography>
          <Typography variant="body1" paragraph>
            You don't have permission to access {featureName}.
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This feature requires <strong>{requiredPermission}</strong>{' '}
            permission. Please contact your administrator if you believe this is
            an error.
          </Typography>

          <Box
            sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}
          >
            <Button variant="outlined" onClick={() => window.history.back()}>
              Go Back
            </Button>
            <Button
              variant="contained"
              onClick={() => (window.location.href = '/app/dashboard')}
            >
              Return to Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // User is authenticated and has required permission
  return <>{children}</>;
};

export default ProtectedChurchMembersRoute;
