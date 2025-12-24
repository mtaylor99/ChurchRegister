import React, { Component } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  AlertTitle,
  Stack,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BugReport as BugIcon,
  Home as HomeIcon,
} from '@mui/icons-material';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  showErrorDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          showErrorDetails={this.props.showErrorDetails}
        />
      );
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  showErrorDetails = false,
}) => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <BugIcon
          sx={{
            fontSize: 64,
            color: 'error.main',
            mb: 2,
          }}
        />

        <Typography variant="h4" component="h1" gutterBottom>
          Something went wrong
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          We're sorry, but something unexpected happened. Please try refreshing
          the page or contact support if the problem persists.
        </Typography>

        {showErrorDetails && (
          <>
            <Divider sx={{ my: 3 }} />
            <Alert severity="error" sx={{ textAlign: 'left' }}>
              <AlertTitle>Error Details</AlertTitle>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  mt: 1,
                }}
              >
                {error.name}: {error.message}
                {error.stack && (
                  <>
                    {'\n\nStack trace:\n'}
                    {error.stack}
                  </>
                )}
              </Typography>
            </Alert>
          </>
        )}

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ mt: 3 }}
        >
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={resetError}
            size="large"
          >
            Try Again
          </Button>

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleReload}
            size="large"
          >
            Reload Page
          </Button>

          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={handleGoHome}
            size="large"
          >
            Go Home
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Error caught by error handler:', error, errorInfo);

    // Here you could send error to logging service
    // errorReportingService.captureException(error, errorInfo);
  };
};

// Higher-order component for wrapping components with error boundary
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
): React.FC<P> => {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export { ErrorBoundary };
