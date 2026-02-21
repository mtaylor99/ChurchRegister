import { Alert, AlertTitle, Box, Button } from '@mui/material';

export interface ErrorAlertProps {
  error: Error | string | null | undefined;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  severity?: 'error' | 'warning' | 'info';
  showDetails?: boolean;
}

/**
 * Standardized error alert component for consistent error display across the application.
 * Automatically formats error messages and provides retry/dismiss actions.
 */
export const ErrorAlert = ({
  error,
  title = 'An Error Occurred',
  onRetry,
  onDismiss,
  severity = 'error',
  showDetails = false,
}: ErrorAlertProps) => {
  if (!error) return null;

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Map common error messages to user-friendly text
  const getUserFriendlyMessage = (message: string): string => {
    if (message.includes('Network Error') || message.includes('ERR_NETWORK')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    if (message.includes('timeout')) {
      return 'The request took too long to complete. Please try again.';
    }
    if (message.includes('401')) {
      return 'You are not authorized to perform this action. Please log in again.';
    }
    if (message.includes('403')) {
      return 'You do not have permission to access this resource.';
    }
    if (message.includes('404')) {
      return 'The requested resource was not found.';
    }
    if (message.includes('500')) {
      return 'A server error occurred. Please try again later or contact support.';
    }
    return message;
  };

  const friendlyMessage = getUserFriendlyMessage(errorMessage);

  return (
    <Alert
      severity={severity}
      sx={{ mb: 2 }}
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )}
          {onDismiss && (
            <Button color="inherit" size="small" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </Box>
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {friendlyMessage}
      {showDetails &&
        errorStack &&
        typeof import.meta !== 'undefined' &&
        import.meta.env.MODE === 'development' && (
          <Box
            component="pre"
            sx={{
              mt: 1,
              p: 1,
              bgcolor: 'grey.100',
              borderRadius: 1,
              fontSize: '0.75rem',
              overflow: 'auto',
              maxHeight: 200,
            }}
          >
            {errorStack}
          </Box>
        )}
    </Alert>
  );
};
