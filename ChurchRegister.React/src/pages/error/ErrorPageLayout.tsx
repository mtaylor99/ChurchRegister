import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export interface ErrorPageLayoutProps {
  /**
   * The main error code (e.g., "404", "500", "403")
   */
  errorCode: string;

  /**
   * The main title/heading for the error
   */
  title: string;

  /**
   * Detailed description of the error
   */
  description: string;

  /**
   * Optional additional content to render below the description
   */
  children?: React.ReactNode;

  /**
   * Custom icon to display above the error code
   */
  icon?: React.ReactNode;

  /**
   * Whether to show the "Go Back" button
   */
  showBackButton?: boolean;

  /**
   * Whether to show the "Go Home" button
   */
  showHomeButton?: boolean;

  /**
   * Whether to show the "Refresh" button
   */
  showRefreshButton?: boolean;

  /**
   * Custom action buttons to display
   */
  customActions?: React.ReactNode;

  /**
   * Path to redirect to for the home button
   */
  homePath?: string;

  /**
   * Callback when refresh button is clicked
   */
  onRefresh?: () => void;

  /**
   * Background color variant
   */
  variant?: 'default' | 'error' | 'warning' | 'info';
}

export const ErrorPageLayout: React.FC<ErrorPageLayoutProps> = ({
  errorCode,
  title,
  description,
  children,
  icon,
  showBackButton = true,
  showHomeButton = true,
  showRefreshButton = false,
  customActions,
  homePath = '/app/dashboard',
  onRefresh,
  variant = 'default',
}) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(homePath);
    }
  };

  const handleGoHome = () => {
    navigate(homePath);
  };

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'error':
        return theme.palette.error.light;
      case 'warning':
        return theme.palette.warning.light;
      case 'info':
        return theme.palette.info.light;
      default:
        return theme.palette.grey[50];
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'error':
        return theme.palette.error.contrastText;
      case 'warning':
        return theme.palette.warning.contrastText;
      case 'info':
        return theme.palette.info.contrastText;
      default:
        return theme.palette.text.primary;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: getBackgroundColor(),
        p: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4, md: 6 },
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          {/* Icon */}
          {icon && <Box sx={{ mb: 2, color: getTextColor() }}>{icon}</Box>}

          {/* Error Code */}
          <Typography
            variant={isMobile ? 'h2' : 'h1'}
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: getTextColor(),
              mb: 2,
              fontSize: { xs: '4rem', sm: '6rem', md: '8rem' },
              lineHeight: 1,
            }}
          >
            {errorCode}
          </Typography>

          {/* Title */}
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            component="h2"
            sx={{
              fontWeight: 'medium',
              color: 'text.primary',
              mb: 2,
            }}
          >
            {title}
          </Typography>

          {/* Description */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mb: 4,
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>

          {/* Custom Content */}
          {children && <Box sx={{ mb: 4 }}>{children}</Box>}

          {/* Action Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
            sx={{ mt: 4 }}
          >
            {showBackButton && (
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={handleGoBack}
                sx={{ minWidth: { xs: '200px', sm: 'auto' } }}
              >
                Go Back
              </Button>
            )}

            {showHomeButton && (
              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={handleGoHome}
                sx={{ minWidth: { xs: '200px', sm: 'auto' } }}
              >
                Go Home
              </Button>
            )}

            {showRefreshButton && (
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                sx={{ minWidth: { xs: '200px', sm: 'auto' } }}
              >
                Refresh
              </Button>
            )}

            {customActions}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default ErrorPageLayout;
