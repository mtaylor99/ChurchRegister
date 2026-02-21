import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Alert,
  CircularProgress,
  Container,
  useTheme,
  alpha,
  CardContent,
  CardHeader,
  Breadcrumbs,
  Link,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  LockRounded,
  LockOutlineRounded,
  ArrowBackRounded,
  VisibilityRounded,
  VisibilityOffRounded,
} from '@mui/icons-material';
import { authService } from '../../services/auth';
import { useNotification } from '../../contexts/NotificationContext';
import type { ChangePasswordRequest } from '../../services/auth/types';

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ChangePasswordPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    reset,
  } = useForm<ChangePasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

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

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      setIsLoading(true);

      if (data.newPassword !== data.confirmPassword) {
        setError('confirmPassword', { message: 'Passwords do not match' });
        setIsLoading(false);
        return;
      }

      if (data.currentPassword === data.newPassword) {
        setError('newPassword', {
          message: 'New password must be different from current password',
        });
        setIsLoading(false);
        return;
      }

      const changePasswordData: ChangePasswordRequest = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      };

      const result = await authService.changePassword(changePasswordData);
      console.log('Password change result:', result);

      showSuccess('Password changed successfully!');
      reset(); // Clear form

      // Navigate to dashboard
      navigate('/');
    } catch (error) {
      console.error('Password change error in component:', error);

      if (error && typeof error === 'object' && 'message' in error) {
        const authError = error as any;

        // Handle validation errors array (from API response)
        if (authError.errors && Array.isArray(authError.errors)) {
          // Show each validation error as a toast
          authError.errors.forEach((errorMsg: string) => {
            showError(errorMsg);
          });
        } else if (
          authError.message &&
          (authError.message.toLowerCase().includes('current password') ||
            authError.message.toLowerCase().includes('incorrect'))
        ) {
          setError('currentPassword', {
            message: 'Current password is incorrect',
          });
        } else if (
          authError.message &&
          (authError.message.toLowerCase().includes('same') ||
            authError.message.toLowerCase().includes('different'))
        ) {
          setError('newPassword', {
            message: 'New password must be different from current password',
          });
        } else if (
          authError.validationErrors &&
          Array.isArray(authError.validationErrors)
        ) {
          // Handle field-specific validation errors from API
          authError.validationErrors.forEach((validationError: any) => {
            if (validationError.field) {
              const fieldName = validationError.field.toLowerCase();
              if (fieldName.includes('current')) {
                setError('currentPassword', {
                  message: validationError.message,
                });
              } else if (
                fieldName.includes('new') ||
                fieldName.includes('password')
              ) {
                setError('newPassword', { message: validationError.message });
              } else {
                showError(validationError.message);
              }
            } else {
              showError(validationError.message || validationError);
            }
          });
        } else {
          showError(
            authError.message || 'Failed to change password. Please try again.'
          );
        }
      } else {
        showError('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="/profile"
          onClick={(e) => {
            e.preventDefault();
            navigate('/profile');
          }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          Profile
        </Link>
        <Typography color="textPrimary">Change Password</Typography>
      </Breadcrumbs>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          bgcolor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <CardHeader
          avatar={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              }}
            >
              <LockRounded
                sx={{ fontSize: 24, color: theme.palette.primary.main }}
              />
            </Box>
          }
          title={
            <Typography variant="h5" component="h1" fontWeight="bold">
              Change Password
            </Typography>
          }
          subheader="Update your account password for better security"
          action={
            <IconButton onClick={handleGoBack} aria-label="go back">
              <ArrowBackRounded />
            </IconButton>
          }
        />

        <CardContent sx={{ pt: 0 }}>
          {/* Security Notice */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Security Tip:</strong> Choose a strong password with at
              least 8 characters including uppercase letters, lowercase letters,
              numbers, and special characters.
            </Typography>
          </Alert>

          {/* Change Password Form */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Current Password */}
            <Controller
              name="currentPassword"
              control={control}
              rules={{
                required: 'Current password is required',
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  id="currentPassword"
                  label="Current Password"
                  type={showPasswords.current ? 'text' : 'password'}
                  autoComplete="current-password"
                  error={!!errors.currentPassword}
                  helperText={errors.currentPassword?.message}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlineRounded sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle current password visibility"
                          onClick={() => togglePasswordVisibility('current')}
                          edge="end"
                        >
                          {showPasswords.current ? (
                            <VisibilityOffRounded />
                          ) : (
                            <VisibilityRounded />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            {/* New Password */}
            <Controller
              name="newPassword"
              control={control}
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
                  type={showPasswords.new ? 'text' : 'password'}
                  autoComplete="new-password"
                  error={!!errors.newPassword}
                  helperText={errors.newPassword?.message}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlineRounded sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle new password visibility"
                          onClick={() => togglePasswordVisibility('new')}
                          edge="end"
                        >
                          {showPasswords.new ? (
                            <VisibilityOffRounded />
                          ) : (
                            <VisibilityRounded />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            {/* Confirm New Password */}
            <Controller
              name="confirmPassword"
              control={control}
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
                  type={showPasswords.confirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlineRounded sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={() => togglePasswordVisibility('confirm')}
                          edge="end"
                        >
                          {showPasswords.confirm ? (
                            <VisibilityOffRounded />
                          ) : (
                            <VisibilityRounded />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            />

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mt: 4,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <LoadingButton
                type="submit"
                variant="contained"
                size="large"
                loading={isLoading}
                loadingIndicator={<CircularProgress size={20} />}
                sx={{
                  flex: 1,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                Change Password
              </LoadingButton>

              <LoadingButton
                variant="outlined"
                size="large"
                onClick={handleGoBack}
                disabled={isLoading}
                sx={{
                  flex: { xs: 1, sm: 0 },
                  py: 1.5,
                  px: 3,
                  fontSize: '1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                }}
              >
                Cancel
              </LoadingButton>
            </Box>
          </Box>
        </CardContent>
      </Paper>
    </Container>
  );
};

export default ChangePasswordPage;
