import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';
import type { ErrorFallbackProps } from './ErrorBoundary';

interface ErrorFallbackVariantProps extends ErrorFallbackProps {
  /** Title for the error message */
  title?: string;
  /** Custom error message */
  message?: string;
  /** Show detailed error information */
  showDetails?: boolean;
  /** Custom action buttons */
  actions?: React.ReactNode;
  /** Error severity */
  severity?: 'error' | 'warning' | 'info';
  /** Custom icon */
  icon?: React.ReactNode;
  /** Enable auto-retry functionality */
  enableAutoRetry?: boolean;
  /** Auto-retry interval in seconds */
  retryInterval?: number;
}

export const ErrorFallback: React.FC<ErrorFallbackVariantProps> = ({
  error,
  resetError,
  hasError,
  title = 'Something went wrong',
  message,
  showDetails = false,
  actions,
  severity = 'error',
  icon,
  enableAutoRetry = false,
  retryInterval = 10,
}) => {
  const theme = useTheme();

  // Auto-retry logic
  useEffect(() => {
    if (!enableAutoRetry || !hasError) return;

    const timer = setTimeout(() => {
      resetError();
    }, retryInterval * 1000);

    return () => clearTimeout(timer);
  }, [enableAutoRetry, hasError, resetError, retryInterval]);

  const errorMessage =
    message || error?.message || 'An unexpected error occurred';
  const errorStack = error?.stack;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        p: 3,
        textAlign: 'center',
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          width: '100%',
          boxShadow: theme.shadows[4],
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Error Icon */}
          <Box sx={{ mb: 3 }}>
            {icon || (
              <ErrorIcon
                sx={{
                  fontSize: 64,
                  color:
                    severity === 'error'
                      ? 'error.main'
                      : severity === 'warning'
                        ? 'warning.main'
                        : 'info.main',
                }}
              />
            )}
          </Box>

          {/* Error Title */}
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              color:
                severity === 'error'
                  ? 'error.main'
                  : severity === 'warning'
                    ? 'warning.main'
                    : 'info.main',
              fontWeight: 600,
            }}
          >
            {title}
          </Typography>

          {/* Error Message */}
          <Alert
            severity={severity}
            sx={{ mb: 3, textAlign: 'left' }}
            icon={<BugReportIcon />}
          >
            <Typography variant="body1">{errorMessage}</Typography>
          </Alert>

          {/* Action Buttons */}
          <Box
            sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}
          >
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={resetError}
              sx={{
                minWidth: 120,
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              Try Again
            </Button>

            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
              sx={{ minWidth: 120 }}
            >
              Reload Page
            </Button>

            {actions}
          </Box>

          {/* Auto-retry indicator */}
          {enableAutoRetry && hasError && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Automatically retrying in {retryInterval} seconds...
            </Typography>
          )}

          {/* Error Details */}
          {showDetails && error && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="error-details-content"
                  id="error-details-header"
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Technical Details
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ textAlign: 'left' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Error Name:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: 'monospace',
                        bgcolor: 'grey.100',
                        p: 1,
                        borderRadius: 1,
                        mb: 2,
                      }}
                    >
                      {error.name}
                    </Typography>

                    {errorStack && (
                      <>
                        <Typography variant="subtitle2" gutterBottom>
                          Stack Trace:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            bgcolor: 'grey.100',
                            p: 1,
                            borderRadius: 1,
                            whiteSpace: 'pre-wrap',
                            maxHeight: '200px',
                            overflow: 'auto',
                          }}
                        >
                          {errorStack}
                        </Typography>
                      </>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            </>
          )}

          {/* Additional Help Text */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            If this problem persists, please contact support or try refreshing
            the page.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

// Simplified error fallback for minimal use cases
export const SimpleErrorFallback: React.FC<
  Pick<ErrorFallbackProps, 'error' | 'resetError'>
> = ({ error, resetError }) => (
  <Alert
    severity="error"
    sx={{ m: 2 }}
    action={
      <Button color="inherit" size="small" onClick={resetError}>
        Try Again
      </Button>
    }
  >
    <Typography variant="body2">
      {error?.message || 'Something went wrong'}
    </Typography>
  </Alert>
);

// Inline error fallback for components
export const InlineErrorFallback: React.FC<
  ErrorFallbackProps & { compact?: boolean }
> = ({ error, resetError, compact = false }) => (
  <Box
    sx={{
      p: compact ? 1 : 2,
      textAlign: 'center',
      bgcolor: 'error.light',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'error.main',
    }}
  >
    <Typography
      variant={compact ? 'caption' : 'body2'}
      color="error.contrastText"
    >
      {error?.message || 'Error loading content'}
    </Typography>
    <Button
      size={compact ? 'small' : 'medium'}
      onClick={resetError}
      sx={{ mt: compact ? 0.5 : 1, color: 'error.contrastText' }}
    >
      Retry
    </Button>
  </Box>
);

export default ErrorFallback;
