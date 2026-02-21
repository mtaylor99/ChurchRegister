import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  TextField,
  Card,
  CardContent,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  BugReport as BugReportIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { ErrorPageLayout } from './ErrorPageLayout';

export interface ErrorDetails {
  message?: string;
  stack?: string;
  code?: string;
  timestamp?: string;
  requestId?: string;
  userAgent?: string;
  url?: string;
}

export interface ServerErrorPageProps {
  /**
   * Error details to display (typically from error boundary)
   */
  error?: Error | null;

  /**
   * Additional error context
   */
  errorDetails?: ErrorDetails;

  /**
   * Whether this is development mode (shows more details)
   */
  isDevelopment?: boolean;

  /**
   * Custom error reporting callback
   */
  onReportError?: (
    description: string,
    errorDetails: ErrorDetails
  ) => Promise<void>;

  /**
   * Custom retry callback
   */
  onRetry?: () => void;

  /**
   * Whether to show the error reporting form
   */
  showReporting?: boolean;
}

export const ServerErrorPage: React.FC<ServerErrorPageProps> = ({
  error,
  errorDetails,
  isDevelopment = process.env.NODE_ENV === 'development',
  onReportError,
  onRetry,
  showReporting = true,
}) => {
  const [reportDescription, setReportDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateErrorDetails = (): ErrorDetails => {
    return {
      message:
        error?.message || errorDetails?.message || 'Unknown error occurred',
      stack: error?.stack || errorDetails?.stack,
      code: errorDetails?.code || 'INTERNAL_SERVER_ERROR',
      timestamp: errorDetails?.timestamp || new Date().toISOString(),
      requestId: errorDetails?.requestId || `req_${Date.now()}`,
      userAgent: errorDetails?.userAgent || navigator.userAgent,
      url: errorDetails?.url || window.location.href,
      ...errorDetails,
    };
  };

  const currentErrorDetails = generateErrorDetails();

  const handleReportError = async () => {
    if (!onReportError) return;

    setIsReporting(true);
    try {
      await onReportError(reportDescription, currentErrorDetails);
      setReportSent(true);
      setReportDescription('');
    } catch (err) {
      console.error('Failed to report error:', err);
    } finally {
      setIsReporting(false);
    }
  };

  const copyErrorDetails = async () => {
    const errorText = JSON.stringify(currentErrorDetails, null, 2);
    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const ErrorReportingForm =
    showReporting && !reportSent ? (
      <Card sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <BugReportIcon color="primary" />
            Report This Error
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Help us improve by describing what you were doing when this error
            occurred.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="What were you trying to do?"
            placeholder="Please describe the steps that led to this error..."
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleReportError}
            disabled={isReporting || !reportDescription.trim()}
            fullWidth
          >
            {isReporting ? 'Sending Report...' : 'Send Error Report'}
          </Button>
        </CardContent>
      </Card>
    ) : null;

  const SuccessMessage = reportSent ? (
    <Alert
      severity="success"
      sx={{ mt: 2, maxWidth: 600, mx: 'auto' }}
      icon={<CheckCircleIcon />}
    >
      <Typography variant="body2">
        Thank you for reporting this error. Our team has been notified and will
        investigate the issue.
      </Typography>
    </Alert>
  ) : null;

  const ErrorDetailsSection = isDevelopment ? (
    <Box sx={{ mt: 3, maxWidth: 800, mx: 'auto' }}>
      <Accordion
        expanded={showDetails}
        onChange={() => setShowDetails(!showDetails)}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack direction="row" alignItems="center" spacing={1}>
            {showDetails ? <VisibilityOffIcon /> : <VisibilityIcon />}
            <Typography variant="subtitle1" fontWeight="medium">
              Technical Details
            </Typography>
            <Chip label="Development Mode" size="small" color="warning" />
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Error Information
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  overflow: 'auto',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {JSON.stringify(currentErrorDetails, null, 2)}
              </Box>
            </Box>

            <Divider />

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                size="small"
                startIcon={copied ? <CheckCircleIcon /> : <CopyIcon />}
                onClick={copyErrorDetails}
                color={copied ? 'success' : 'primary'}
              >
                {copied ? 'Copied!' : 'Copy Details'}
              </Button>
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  ) : null;

  return (
    <ErrorPageLayout
      errorCode="500"
      title="Internal Server Error"
      description="Something went wrong on our end. We're working to fix this issue. Please try again in a few moments."
      icon={
        <BugReportIcon
          sx={{
            fontSize: { xs: 60, sm: 80, md: 100 },
            color: 'error.main',
          }}
        />
      }
      variant="error"
      showBackButton={true}
      showHomeButton={true}
      showRefreshButton={true}
      onRefresh={handleRetry}
    >
      <Stack spacing={2} alignItems="center">
        {/* Error metadata chips */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          justifyContent="center"
        >
          <Chip
            label={`Request ID: ${currentErrorDetails.requestId}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`Time: ${new Date(currentErrorDetails.timestamp || '').toLocaleTimeString()}`}
            size="small"
            variant="outlined"
          />
        </Stack>

        {ErrorReportingForm}
        {SuccessMessage}
        {ErrorDetailsSection}
      </Stack>
    </ErrorPageLayout>
  );
};

export default ServerErrorPage;
