import React, { useState } from 'react';
import {
  useNavigate,
  Link as RouterLink,
  useSearchParams,
} from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Link,
  Alert,
  CircularProgress,
  Container,
  Divider,
  useTheme,
  alpha,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  LockResetRounded,
  EmailRounded,
  LockOutlineRounded,
  CheckCircleRounded,
  KeyRounded,
} from '@mui/icons-material';
import { authService } from '../../services/auth';
import type {
  PasswordResetConfirm,
  AuthError,
} from '../../services/auth/types';

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

interface PasswordResetState {
  current: 'request' | 'confirmation' | 'reset' | 'success';
  email?: string;
  token?: string;
}

const steps = ['Request Reset', 'Check Email', 'New Password', 'Complete'];

export const PasswordResetPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetState, setResetState] = useState<PasswordResetState>(() => {
    // Check if we have a reset token in URL parameters
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (token && email) {
      return { current: 'reset', token, email };
    }
    return { current: 'request' };
  });

  // Form for requesting password reset (forgot password)
  const {
    control: requestControl,
    handleSubmit: handleRequestSubmit,
    formState: { errors: requestErrors },
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: resetState.email || '',
    },
  });

  // Form for setting new password
  const {
    control: resetControl,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
    watch: watchReset,
    setError: setResetError,
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watchReset('newPassword');

  const validatePassword = (value: string) => {
    if (value.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(value)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[@$!%*?&])/.test(value)) {
      return 'Password must contain at least one special character (@$!%*?&)';
    }
    return true;
  };

  const onRequestReset = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setApiError(null);

      const email = data.email.trim().toLowerCase();

      await authService.requestPasswordReset(email);

      setResetState({
        current: 'confirmation',
        email: email,
      });
    } catch (error) {
      
      const email = data.email.trim().toLowerCase();

      if (error && typeof error === 'object' && 'message' in error) {
        const authError = error as AuthError;

        if (
          authError.message.toLowerCase().includes('not found') ||
          authError.message.toLowerCase().includes('invalid email')
        ) {
          setApiError(
            'If this email address exists in our system, you will receive a password reset link.'
          );
          // Still proceed to confirmation step for security (don't reveal if email exists)
          setResetState({
            current: 'confirmation',
            email: email,
          });
        } else {
          setApiError(
            authError.message ||
              'Failed to send password reset email. Please try again.'
          );
        }
      } else {
        setApiError(
          'Network error. Please check your connection and try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: ResetPasswordFormData) => {
    try {
      setIsLoading(true);
      setApiError(null);

      if (data.newPassword !== data.confirmPassword) {
        setResetError('confirmPassword', { message: 'Passwords do not match' });
        return;
      }

      if (!resetState.token) {
        setApiError(
          'Invalid reset token. Please request a new password reset.'
        );
        return;
      }

      const resetData: PasswordResetConfirm = {
        token: resetState.token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      };

      await authService.confirmPasswordReset(resetData);

      setResetState({
        current: 'success',
        email: resetState.email,
      });
    } catch (error) {
      

      if (error && typeof error === 'object' && 'message' in error) {
        const authError = error as AuthError;

        if (
          authError.message.toLowerCase().includes('expired') ||
          authError.message.toLowerCase().includes('invalid token')
        ) {
          setApiError(
            'The reset link has expired or is invalid. Please request a new password reset.'
          );
        } else if (authError.validationErrors) {
          // Handle field-specific validation errors from API
          authError.validationErrors.forEach((validationError) => {
            if (validationError.field.toLowerCase().includes('password')) {
              setResetError('newPassword', {
                message: validationError.message,
              });
            } else {
              setApiError(validationError.message);
            }
          });
        } else {
          setApiError(
            authError.message || 'Failed to reset password. Please try again.'
          );
        }
      } else {
        setApiError(
          'Network error. Please check your connection and try again.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendReset = async () => {
    if (!resetState.email) return;

    try {
      setIsLoading(true);
      setApiError(null);

      await authService.requestPasswordReset(resetState.email);

      // Show success message without changing state
    } catch {
      setApiError('Failed to resend reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRequestForm = () => (
    <Box
      component="form"
      onSubmit={handleRequestSubmit(onRequestReset)}
      noValidate
    >
      <Controller
        name="email"
        control={requestControl}
        rules={{
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Please enter a valid email address',
          },
        }}
        render={({ field }) => (
          <TextField
            {...field}
            margin="normal"
            fullWidth
            id="email"
            label="Email Address"
            type="email"
            autoComplete="email"
            autoFocus
            error={!!requestErrors.email}
            helperText={
              requestErrors.email?.message ||
              'Enter the email address associated with your account'
            }
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <EmailRounded sx={{ mr: 1, color: 'text.secondary' }} />
              ),
            }}
          />
        )}
      />

      <LoadingButton
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        loading={isLoading}
        loadingIndicator={<CircularProgress size={20} />}
        sx={{
          mt: 3,
          mb: 2,
          py: 1.5,
          fontSize: '1.1rem',
          fontWeight: 'bold',
          borderRadius: 2,
          textTransform: 'none',
        }}
      >
        Send Reset Link
      </LoadingButton>
    </Box>
  );

  const renderConfirmation = () => (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <EmailRounded
          sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }}
        />
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Check Your Email
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          We've sent a password reset link to:
        </Typography>
        <Typography variant="h6" color="primary" sx={{ mb: 3 }}>
          {resetState.email}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
          Click the link in the email to reset your password. The link will
          expire in 24 hours for security.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <LoadingButton
            variant="outlined"
            onClick={handleResendReset}
            loading={isLoading}
            disabled={isLoading}
          >
            Resend Reset Link
          </LoadingButton>

          <Link component={RouterLink} to="/auth/login" variant="body2">
            Back to Login
          </Link>
        </Box>
      </CardContent>
    </Card>
  );

  const renderResetForm = () => (
    <Box
      component="form"
      onSubmit={handleResetSubmit(onResetPassword)}
      noValidate
    >
      <Typography
        variant="body1"
        color="textSecondary"
        sx={{ mb: 3, textAlign: 'center' }}
      >
        Resetting password for: <strong>{resetState.email}</strong>
      </Typography>

      {/* New Password */}
      <Controller
        name="newPassword"
        control={resetControl}
        rules={{
          required: 'New password is required',
          validate: validatePassword,
        }}
        render={({ field }) => (
          <TextField
            {...field}
            margin="normal"
            fullWidth
            id="newPassword"
            label="New Password"
            type="password"
            autoComplete="new-password"
            autoFocus
            error={!!resetErrors.newPassword}
            helperText={
              resetErrors.newPassword?.message ||
              'Minimum 8 characters with uppercase, lowercase, number, and special character'
            }
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <LockOutlineRounded sx={{ mr: 1, color: 'text.secondary' }} />
              ),
            }}
          />
        )}
      />

      {/* Confirm Password */}
      <Controller
        name="confirmPassword"
        control={resetControl}
        rules={{
          required: 'Please confirm your new password',
          validate: (value) =>
            value === newPassword || 'Passwords do not match',
        }}
        render={({ field }) => (
          <TextField
            {...field}
            margin="normal"
            fullWidth
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            error={!!resetErrors.confirmPassword}
            helperText={resetErrors.confirmPassword?.message}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <LockOutlineRounded sx={{ mr: 1, color: 'text.secondary' }} />
              ),
            }}
          />
        )}
      />

      <LoadingButton
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        loading={isLoading}
        loadingIndicator={<CircularProgress size={20} />}
        sx={{
          mt: 3,
          mb: 2,
          py: 1.5,
          fontSize: '1.1rem',
          fontWeight: 'bold',
          borderRadius: 2,
          textTransform: 'none',
        }}
      >
        Update Password
      </LoadingButton>
    </Box>
  );

  const renderSuccess = () => (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <CheckCircleRounded
          sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }}
        />
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Password Reset Complete!
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Your password has been successfully updated. You can now sign in with
          your new password.
        </Typography>

        <LoadingButton
          variant="contained"
          onClick={() => navigate('/auth/login')}
          size="large"
          sx={{ px: 4 }}
        >
          Sign In
        </LoadingButton>
      </CardContent>
    </Card>
  );

  const getActiveStep = () => {
    switch (resetState.current) {
      case 'request':
        return 0;
      case 'confirmation':
        return 1;
      case 'reset':
        return 2;
      case 'success':
        return 3;
      default:
        return 0;
    }
  };

  const getPageTitle = () => {
    switch (resetState.current) {
      case 'request':
        return 'Forgot Password';
      case 'confirmation':
        return 'Check Your Email';
      case 'reset':
        return 'Set New Password';
      case 'success':
        return 'Password Reset Complete';
      default:
        return 'Reset Password';
    }
  };

  const getPageSubtitle = () => {
    switch (resetState.current) {
      case 'request':
        return 'Enter your email to receive a reset link';
      case 'confirmation':
        return "We've sent you a reset link";
      case 'reset':
        return 'Choose a strong new password';
      case 'success':
        return 'Your password has been updated';
      default:
        return 'Reset your account password';
    }
  };

  const getIcon = () => {
    switch (resetState.current) {
      case 'request':
        return (
          <LockResetRounded
            sx={{ fontSize: 32, color: theme.palette.primary.main }}
          />
        );
      case 'confirmation':
        return (
          <EmailRounded
            sx={{ fontSize: 32, color: theme.palette.primary.main }}
          />
        );
      case 'reset':
        return (
          <KeyRounded
            sx={{ fontSize: 32, color: theme.palette.primary.main }}
          />
        );
      case 'success':
        return (
          <CheckCircleRounded
            sx={{ fontSize: 32, color: theme.palette.success.main }}
          />
        );
      default:
        return (
          <LockResetRounded
            sx={{ fontSize: 32, color: theme.palette.primary.main }}
          />
        );
    }
  };

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}
    >
      <Box sx={{ width: '100%', py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                mb: 2,
              }}
            >
              {getIcon()}
            </Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
            >
              {getPageTitle()}
            </Typography>
            <Typography variant="body1" color="textSecondary">
              {getPageSubtitle()}
            </Typography>
          </Box>

          {/* Progress Stepper - only show for multi-step flow */}
          {resetState.current !== 'reset' && (
            <Stepper activeStep={getActiveStep()} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}

          {/* API Error */}
          {apiError && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setApiError(null)}
            >
              {apiError}
            </Alert>
          )}

          {/* Content based on reset state */}
          {resetState.current === 'request' && renderRequestForm()}
          {resetState.current === 'confirmation' && renderConfirmation()}
          {resetState.current === 'reset' && renderResetForm()}
          {resetState.current === 'success' && renderSuccess()}

          {/* Footer Links - only show during request step */}
          {resetState.current === 'request' && (
            <>
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  or
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  Remember your password?{' '}
                  <Link
                    component={RouterLink}
                    to="/auth/login"
                    fontWeight="medium"
                  >
                    Sign in here
                  </Link>
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mt: 1 }}
                >
                  Don't have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/auth/register"
                    fontWeight="medium"
                  >
                    Sign up here
                  </Link>
                </Typography>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default PasswordResetPage;
