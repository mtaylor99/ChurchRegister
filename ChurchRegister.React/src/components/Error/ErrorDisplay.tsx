import React from 'react';
import {
  Box,
  Typography,
  Alert,
  AlertTitle,
  Collapse,
  IconButton,
  Chip,
  Paper,
  useTheme,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  ExpandLess,
  ExpandMore,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

export interface ErrorDisplayProps {
  /** Error object or message */
  error?: Error | string | null;
  /** Error title */
  title?: string;
  /** Error severity level */
  severity?: 'error' | 'warning' | 'info' | 'success';
  /** Whether to show the error details */
  showDetails?: boolean;
  /** Custom error message */
  message?: string;
  /** Whether the error can be dismissed */
  dismissible?: boolean;
  /** Callback when error is dismissed */
  onDismiss?: () => void;
  /** Retry action callback */
  onRetry?: () => void;
  /** Custom actions */
  actions?: React.ReactNode;
  /** Error variant style */
  variant?: 'standard' | 'filled' | 'outlined' | 'card';
  /** Component size */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show error boundary suggestion */
  showBoundaryHelp?: boolean;
  /** Error code or type */
  errorCode?: string;
  /** Timestamp of the error */
  timestamp?: Date;
}

const getErrorIcon = (severity: ErrorDisplayProps['severity']) => {
  switch (severity) {
    case 'warning':
      return <WarningIcon />;
    case 'info':
      return <InfoIcon />;
    case 'success':
      return <InfoIcon />; // Success uses info icon
    default:
      return <ErrorIcon />;
  }
};

const formatTimestamp = (timestamp: Date) => {
  return timestamp.toLocaleString();
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title,
  severity = 'error',
  showDetails = false,
  message,
  dismissible = false,
  onDismiss,
  onRetry,
  actions,
  variant = 'standard',
  size = 'medium',
  showBoundaryHelp = false,
  errorCode,
  timestamp,
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(showDetails);
  const [isDismissed, setIsDismissed] = React.useState(false);

  // Don't render if dismissed
  if (isDismissed) return null;

  // Don't render if no error
  if (!error && !message) return null;

  const errorMessage =
    message ||
    (typeof error === 'string' ? error : error?.message) ||
    'An unknown error occurred';

  const errorStack =
    typeof error === 'object' && error?.stack ? error.stack : null;
  const errorName =
    typeof error === 'object' && error?.name ? error.name : null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleToggleDetails = () => {
    setIsExpanded(!isExpanded);
  };

  const renderContent = () => (
    <>
      {/* Main Alert */}
      <Alert
        severity={severity}
        variant={variant === 'card' ? 'outlined' : variant}
        icon={getErrorIcon(severity)}
        sx={{
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {(errorStack || errorName) && (
              <IconButton
                size="small"
                onClick={handleToggleDetails}
                sx={{ color: 'inherit' }}
              >
                {isExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
            {onRetry && (
              <IconButton
                size="small"
                onClick={onRetry}
                sx={{ color: 'inherit' }}
              >
                <RefreshIcon />
              </IconButton>
            )}
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
        {title && <AlertTitle>{title}</AlertTitle>}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant={size === 'small' ? 'caption' : 'body2'}>
            {errorMessage}
          </Typography>

          {/* Error metadata */}
          {(errorCode || timestamp) && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
              {errorCode && (
                <Chip
                  label={`Code: ${errorCode}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
              {timestamp && (
                <Chip
                  label={formatTimestamp(timestamp)}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
            </Box>
          )}

          {/* Custom actions */}
          {actions && <Box sx={{ mt: 1 }}>{actions}</Box>}
        </Box>
      </Alert>

      {/* Error Details */}
      <Collapse in={isExpanded}>
        <Box sx={{ mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          {errorName && (
            <Typography variant="subtitle2" gutterBottom>
              Error Type: <code>{errorName}</code>
            </Typography>
          )}

          {errorStack && (
            <>
              <Typography variant="subtitle2" gutterBottom>
                Stack Trace:
              </Typography>
              <Typography
                component="pre"
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  maxHeight: '200px',
                  overflow: 'auto',
                  bgcolor: 'common.white',
                  p: 1,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.grey[300]}`,
                }}
              >
                {errorStack}
              </Typography>
            </>
          )}

          {showBoundaryHelp && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                💡 Consider wrapping this component in an ErrorBoundary to
                handle errors gracefully.
              </Typography>
            </Alert>
          )}
        </Box>
      </Collapse>
    </>
  );

  // Render as card variant
  if (variant === 'card') {
    return (
      <Paper
        elevation={2}
        sx={{
          p: size === 'small' ? 1 : size === 'large' ? 3 : 2,
          border: `1px solid ${theme.palette[severity].main}`,
          borderLeft: `4px solid ${theme.palette[severity].main}`,
        }}
      >
        {renderContent()}
      </Paper>
    );
  }

  // Render as standard alert
  return <Box>{renderContent()}</Box>;
};

// Specialized error display components
export const NetworkErrorDisplay: React.FC<
  Omit<ErrorDisplayProps, 'severity' | 'title'>
> = (props) => (
  <ErrorDisplay
    {...props}
    severity="error"
    title="Network Error"
    showBoundaryHelp={false}
  />
);

export const ValidationErrorDisplay: React.FC<
  Omit<ErrorDisplayProps, 'severity' | 'title'>
> = (props) => (
  <ErrorDisplay
    {...props}
    severity="warning"
    title="Validation Error"
    showBoundaryHelp={false}
  />
);

export const NotFoundErrorDisplay: React.FC<
  Omit<ErrorDisplayProps, 'severity' | 'title'>
> = (props) => (
  <ErrorDisplay
    {...props}
    severity="info"
    title="Not Found"
    message="The requested resource could not be found."
    showBoundaryHelp={false}
  />
);

export default ErrorDisplay;
