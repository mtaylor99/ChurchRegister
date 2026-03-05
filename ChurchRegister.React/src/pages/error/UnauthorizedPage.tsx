import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
} from '@mui/material';
import {
  Lock as LockIcon,
  Login as LoginIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  ContactSupport as ContactIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ErrorPageLayout } from './ErrorPageLayout';

export interface User {
  id?: string;
  email?: string;
  name?: string;
  roles?: string[];
  permissions?: string[];
}

export interface UnauthorizedPageProps {
  /**
   * Current user information (if available)
   */
  user?: User | null;

  /**
   * Specific reason for the unauthorized access
   */
  reason?: string;

  /**
   * Required roles for the resource
   */
  requiredRoles?: string[];

  /**
   * Required permissions for the resource
   */
  requiredPermissions?: string[];

  /**
   * Resource name that was being accessed
   */
  resourceName?: string;

  /**
   * Whether the user needs to log in (not authenticated)
   */
  requiresLogin?: boolean;

  /**
   * Custom login redirect path
   */
  loginPath?: string;

  /**
   * Custom contact support callback
   */
  onContactSupport?: () => void;

  /**
   * Custom retry callback (e.g., refresh user permissions)
   */
  onRetry?: () => void;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  user,
  reason,
  requiredRoles = [],
  requiredPermissions = [],
  resourceName,
  requiresLogin = !user,
  loginPath = '/login',
  onContactSupport,
  onRetry,
}) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Preserve current location for redirect after login
    const currentPath = window.location.pathname + window.location.search;
    navigate(loginPath, {
      state: { from: currentPath },
      replace: true,
    });
  };

  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      // Default contact support action (could open email, chat, etc.)
      window.location.href =
        'mailto:support@churchregister.com?subject=Access Request';
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const getTitle = () => {
    if (requiresLogin) {
      return 'Login Required';
    }
    return 'Access Denied';
  };

  const getDescription = () => {
    if (requiresLogin) {
      return 'You need to sign in to access this page. Please log in with your account credentials.';
    }

    if (reason) {
      return reason;
    }

    if (resourceName) {
      return `You don't have permission to access ${resourceName}. Please contact your administrator if you believe this is an error.`;
    }

    return "You don't have permission to access this page. Please contact your administrator if you believe this is an error.";
  };

  const UserInfoSection =
    user && !requiresLogin ? (
      <Card sx={{ mt: 3, maxWidth: 500, mx: 'auto' }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <PersonIcon color="primary" />
            Current User
          </Typography>

          <Stack spacing={1}>
            <Typography variant="body2">
              <strong>Name:</strong> {user.name || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {user.email || 'Unknown'}
            </Typography>

            {user.roles && user.roles.length > 0 && (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Your Roles:</strong>
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {user.roles.map((role) => (
                    <Chip
                      key={role}
                      label={role}
                      size="small"
                      icon={<GroupIcon />}
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    ) : null;

  const RequirementsSection =
    requiredRoles.length > 0 || requiredPermissions.length > 0 ? (
      <Card sx={{ mt: 3, maxWidth: 500, mx: 'auto' }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <AdminIcon color="warning" />
            Access Requirements
          </Typography>

          {requiredRoles.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Required Roles:</strong>
              </Typography>
              <List dense>
                {requiredRoles.map((role) => {
                  const hasRole = user?.roles?.includes(role);
                  return (
                    <ListItem key={role} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {hasRole ? (
                          <CheckIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="error" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={role}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: hasRole ? 'success.main' : 'text.primary',
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}

          {requiredPermissions.length > 0 && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Required Permissions:</strong>
              </Typography>
              <List dense>
                {requiredPermissions.map((permission) => {
                  const hasPermission = user?.permissions?.includes(permission);
                  return (
                    <ListItem key={permission} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {hasPermission ? (
                          <CheckIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="error" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={permission}
                        primaryTypographyProps={{
                          variant: 'body2',
                          color: hasPermission
                            ? 'success.main'
                            : 'text.primary',
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
    ) : null;

  const ActionButtons = (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
      {requiresLogin && (
        <Button
          variant="contained"
          startIcon={<LoginIcon />}
          onClick={handleLogin}
          sx={{ minWidth: { xs: '200px', sm: 'auto' } }}
        >
          Sign In
        </Button>
      )}

      {!requiresLogin && onRetry && (
        <Button
          variant="outlined"
          onClick={handleRetry}
          sx={{ minWidth: { xs: '200px', sm: 'auto' } }}
        >
          Retry
        </Button>
      )}

      <Button
        variant="outlined"
        startIcon={<ContactIcon />}
        onClick={handleContactSupport}
        sx={{ minWidth: { xs: '200px', sm: 'auto' } }}
      >
        Contact Support
      </Button>
    </Stack>
  );

  return (
    <ErrorPageLayout
      errorCode={requiresLogin ? '401' : '403'}
      title={getTitle()}
      description={getDescription()}
      icon={
        <LockIcon
          sx={{
            fontSize: { xs: 60, sm: 80, md: 100 },
            color: requiresLogin ? 'info.main' : 'warning.main',
          }}
        />
      }
      variant={requiresLogin ? 'info' : 'warning'}
      showBackButton={true}
      showHomeButton={!requiresLogin}
      showRefreshButton={false}
      homePath="/app/dashboard"
      customActions={ActionButtons}
    >
      {!requiresLogin && (
        <Alert
          severity={requiresLogin ? 'info' : 'warning'}
          sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}
        >
          <Typography variant="body2">
            {requiresLogin
              ? 'Please sign in to continue to the requested page.'
              : 'If you believe you should have access to this resource, please contact your system administrator.'}
          </Typography>
        </Alert>
      )}

      {UserInfoSection}
      {RequirementsSection}
    </ErrorPageLayout>
  );
};

export default UnauthorizedPage;
