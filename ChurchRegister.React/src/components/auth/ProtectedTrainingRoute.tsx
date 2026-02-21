import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Container, Paper, Button } from '@mui/material';
import { School as TrainingIcon, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts';
import { useRBAC } from '../../hooks/useRBAC';

export interface ProtectedTrainingRouteProps {
  children: React.ReactNode;
  requiredPermission: string;
  featureName?: string;
}

/**
 * Protected route component that requires specific training certificates permissions
 * Redirects unauthorized users to appropriate error pages
 */
export const ProtectedTrainingRoute: React.FC<
  ProtectedTrainingRouteProps
> = ({ children, requiredPermission, featureName = 'this feature' }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasPermission } = useRBAC();
  const location = useLocation();

  // Show loading state while authentication is being verified
  if (isLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <TrainingIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
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
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <LockIcon
              sx={{ fontSize: 64, color: 'error.main', opacity: 0.8 }}
            />
          </Box>

          <Typography variant="h4" gutterBottom fontWeight={700}>
            Access Denied
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            You do not have permission to access {featureName}.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => window.history.back()}
              size="large"
            >
              Go Back
            </Button>
            <Button
              variant="contained"
              href="/app/dashboard"
              size="large"
              color="primary"
            >
              Return to Dashboard
            </Button>
          </Box>

          <Box
            sx={{
              mt: 4,
              p: 2,
              bgcolor: 'background.default',
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Required Permission: <strong>{requiredPermission}</strong>
            </Typography>
          </Box>
        </Paper>
      </Container>
    );
  }

  // User is authenticated and authorized, render children
  return <>{children}</>;
};

export default ProtectedTrainingRoute;
