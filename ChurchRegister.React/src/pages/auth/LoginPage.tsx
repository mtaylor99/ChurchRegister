import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Link,
  Alert,
  Checkbox,
  FormControlLabel,
  CircularProgress,
  Container,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  LoginRounded,
  PersonOutlineRounded,
  LockOutlineRounded,
} from '@mui/icons-material';
import { authService } from '../../services/auth';
import { useNotification } from '../../contexts/NotificationContext';
import type { LoginCredentials } from '../../services/auth/types';

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LocationState {
  from?: {
    pathname: string;
  };
  message?: string;
}

export const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const { showError } = useNotification();

  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);

      const credentials: LoginCredentials = {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        rememberMe: data.rememberMe,
      };

      const response = await authService.login(credentials);

      if (response && response.user) {
        // Redirect to dashboard
        navigate('/app/dashboard', { replace: true });
      } else {
        showError('Login failed. Please check your credentials and try again.');
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        const authError = error as any;

        // Handle errors array from API response
        if (authError.errors && Array.isArray(authError.errors)) {
          // Show each error as a toast
          authError.errors.forEach((errorMsg: string) => {
            showError(errorMsg);
          });
        }
        // Check for account lockout/suspension (highest priority)
        else if (
          authError.message &&
          (authError.message.toLowerCase().includes('locked') ||
            authError.message.toLowerCase().includes('suspended'))
        ) {
          showError(authError.message);
        }
        // Check for email confirmation required
        else if (
          authError.message &&
          authError.message.toLowerCase().includes('email') &&
          authError.message.toLowerCase().includes('confirmed')
        ) {
          showError('Please confirm your email address before logging in.');
        }
        // Handle validation errors or invalid credentials
        else if (
          authError.message &&
          (authError.message.toLowerCase().includes('validation') ||
            authError.message.toLowerCase().includes('invalid') ||
            authError.message.toLowerCase().includes('incorrect'))
        ) {
          showError(
            'Invalid email or password. Please check your credentials and try again.'
          );
        }
        // Any other error
        else {
          showError(
            authError.message ||
              'An error occurred during login. Please try again.'
          );
        }
      } else {
        showError('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
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
              <LoginRounded
                sx={{ fontSize: 32, color: theme.palette.primary.main }}
              />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Sign in to your Church Register account
            </Typography>
          </Box>

          {/* Redirect message */}
          {state?.message && (
            <Alert severity="info" sx={{ mb: 3 }}>
              {state.message}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email Field */}
            <Controller
              name="email"
              control={control}
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
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <PersonOutlineRounded
                        sx={{ mr: 1, color: 'text.secondary' }}
                      />
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              )}
            />

            {/* Password Field */}
            <Controller
              name="password"
              control={control}
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  id="password"
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <LockOutlineRounded
                        sx={{ mr: 1, color: 'text.secondary' }}
                      />
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
              )}
            />

            {/* Remember Me */}
            <Controller
              name="rememberMe"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      {...field}
                      checked={field.value}
                      color="primary"
                      disabled={isLoading}
                    />
                  }
                  label="Remember me for 30 days"
                  sx={{ mb: 3 }}
                />
              )}
            />

            {/* Submit Button */}
            <LoadingButton
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              loading={isLoading}
              loadingIndicator={<CircularProgress size={20} />}
              sx={{
                mt: 2,
                mb: 3,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Sign In
            </LoadingButton>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="textSecondary">
                or
              </Typography>
            </Divider>

            {/* Additional Links */}
            <Box sx={{ textAlign: 'center', space: 2 }}>
              <Link
                component={RouterLink}
                to="/auth/forgot-password"
                variant="body2"
                sx={{ display: 'block', mb: 1 }}
              >
                Forgot your password?
              </Link>
              <Typography variant="body2" color="textSecondary">
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
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
