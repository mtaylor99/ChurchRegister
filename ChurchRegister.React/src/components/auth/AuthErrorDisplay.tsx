import React, { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  AlertTitle,
  Button,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircleOutline as ActionIcon,
  ContactSupport as SupportIcon,
  Refresh as RetryIcon,
  Security as SecurityIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Error as ErrorIcon,
  Build as BuildIcon,
  Timer as TimerIcon,
  WifiOff as NetworkIcon,
  Block as BlockIcon,
} from '@mui/icons-material';

import type { AuthError } from '../../services/auth/types';
import {
  getAuthErrorMessage,
  getAuthErrorCode,
  isRecoverableError,
  getRetryDelay,
  AUTH_ERROR_CODES,
} from '../../utils/authErrors';

export interface AuthErrorDisplayProps {
  /** Error object, message, or null */
  error: AuthError | Error | string | null;
  /** Whether the error can be dismissed */
  dismissible?: boolean;
  /** Callback when error is dismissed */
  onDismiss?: () => void;
  /** Callback for retry action */
  onRetry?: () => void;
  /** Callback for resend confirmation email */
  onResendConfirmation?: () => void;
  /** Callback for password reset */
  onPasswordReset?: () => void;
  /** Additional custom actions */
  customActions?: React.ReactNode;
  /** Whether to show detailed user actions */
  showUserActions?: boolean;
  /** Whether to show support actions */
  showSupportActions?: boolean;
  /** Whether to auto-hide after a delay */
  autoHide?: boolean;
  /** Auto-hide delay in milliseconds */
  autoHideDelay?: number;
  /** Whether to show the error timestamp */
  showTimestamp?: boolean;
  /** Custom className for styling */
  className?: string;
}

const getErrorIcon = (iconName: string) => {
  const iconProps = { fontSize: 'small' as const };

  switch (iconName) {
    case 'security':
      return <SecurityIcon {...iconProps} />;
    case 'email':
      return <EmailIcon {...iconProps} />;
    case 'lock':
      return <LockIcon {...iconProps} />;
    case 'person':
      return <PersonIcon {...iconProps} />;
    case 'build':
      return <BuildIcon {...iconProps} />;
    case 'timer':
      return <TimerIcon {...iconProps} />;
    case 'wifi_off':
      return <NetworkIcon {...iconProps} />;
    case 'block':
      return <BlockIcon {...iconProps} />;
    case 'error':
      return <ErrorIcon {...iconProps} />;
    default:
      return <ErrorIcon {...iconProps} />;
  }
};

export const AuthErrorDisplay: React.FC<AuthErrorDisplayProps> = ({
  error,
  dismissible = true,
  onDismiss,
  onRetry,
  onResendConfirmation,
  onPasswordReset,
  customActions,
  showUserActions = true,
  showSupportActions = true,
  autoHide = false,
  autoHideDelay = 5000,
  showTimestamp = false,
  className,
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Auto-hide functionality
  React.useEffect(() => {
    if (autoHide && error && !dismissed) {
      const timer = setTimeout(() => {
        setDismissed(true);
        onDismiss?.();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, error, dismissed, onDismiss]);

  if (!error || dismissed) {
    return null;
  }

  const errorCode = getAuthErrorCode(error);
  const errorMessage = getAuthErrorMessage(error);
  const canRetry = isRecoverableError(errorCode);
  const retryDelay = getRetryDelay(errorCode);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const renderActions = () => {
    const actions = [];

    // Retry action
    if (canRetry && onRetry) {
      actions.push(
        <Button
          key="retry"
          variant="outlined"
          size="small"
          startIcon={<RetryIcon />}
          onClick={onRetry}
          disabled={retryDelay > 0}
        >
          {retryDelay > 0
            ? `Retry in ${Math.ceil(retryDelay / 1000)}s`
            : 'Try Again'}
        </Button>
      );
    }

    // Email confirmation resend
    if (
      errorCode === AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED &&
      onResendConfirmation
    ) {
      actions.push(
        <Button
          key="resend"
          variant="contained"
          size="small"
          startIcon={<EmailIcon />}
          onClick={onResendConfirmation}
        >
          Resend Confirmation
        </Button>
      );
    }

    // Password reset
    if (errorCode === AUTH_ERROR_CODES.INVALID_CREDENTIALS && onPasswordReset) {
      actions.push(
        <Button
          key="reset"
          variant="outlined"
          size="small"
          startIcon={<LockIcon />}
          onClick={onPasswordReset}
        >
          Reset Password
        </Button>
      );
    }

    // Custom actions
    if (customActions) {
      actions.push(customActions);
    }

    return actions.length > 0 ? (
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {actions}
      </Box>
    ) : null;
  };

  const renderUserActions = () => {
    if (!showUserActions || !errorMessage.userActions?.length) {
      return null;
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          What you can do:
        </Typography>
        <List dense sx={{ py: 0 }}>
          {errorMessage.userActions.map((action, index) => (
            <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <ActionIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={action}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const renderSupportActions = () => {
    if (!showSupportActions || !errorMessage.supportActions?.length) {
      return null;
    }

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Need help?
        </Typography>
        <List dense sx={{ py: 0 }}>
          {errorMessage.supportActions.map((action, index) => (
            <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <SupportIcon fontSize="small" color="info" />
              </ListItemIcon>
              <ListItemText
                primary={action}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  return (
    <Alert
      severity={errorMessage.severity}
      className={className}
      sx={{
        mb: 2,
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Error code chip */}
          <Chip
            label={errorCode}
            size="small"
            variant="outlined"
            sx={{
              fontSize: '0.7rem',
              height: 20,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
            }}
          />

          {/* Expand/collapse button */}
          {(errorMessage.userActions?.length ||
            errorMessage.supportActions?.length) && (
            <IconButton
              size="small"
              onClick={handleToggleExpanded}
              sx={{ color: 'inherit' }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}

          {/* Dismiss button */}
          {dismissible && (
            <IconButton
              size="small"
              onClick={handleDismiss}
              sx={{ color: 'inherit' }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </Box>
      }
    >
      <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {errorMessage.icon && getErrorIcon(errorMessage.icon)}
        {errorMessage.title}
      </AlertTitle>

      <Typography variant="body2" sx={{ mb: 1 }}>
        {errorMessage.message}
      </Typography>

      {errorMessage.details && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {errorMessage.details}
        </Typography>
      )}

      {showTimestamp && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1 }}
        >
          Error occurred at {new Date().toLocaleString()}
        </Typography>
      )}

      {/* Action buttons */}
      {renderActions()}

      {/* Expandable details */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {(errorMessage.userActions?.length ||
          errorMessage.supportActions?.length) && (
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
            }}
          >
            {renderUserActions()}
            {errorMessage.userActions?.length &&
              errorMessage.supportActions?.length && <Divider sx={{ my: 2 }} />}
            {renderSupportActions()}
          </Box>
        )}
      </Collapse>
    </Alert>
  );
};
