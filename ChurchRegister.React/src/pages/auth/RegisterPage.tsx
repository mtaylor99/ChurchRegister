import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Link,
  Checkbox,
  FormControlLabel,
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
  PersonAddRounded,
  PersonOutlineRounded,
  EmailRounded,
  CheckCircleRounded,
  BadgeRounded,
} from '@mui/icons-material';
import { authService } from '../../services/auth';
import { PasswordInput } from '../../components/Form/PasswordInput';
import { AuthErrorDisplay } from '../../components/auth/AuthErrorDisplay';
import { validatePassword } from '../../utils';
import type { RegisterData, AuthError } from '../../services/auth/types';

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface RegistrationSteps {
  current: 'form' | 'confirmation' | 'success';
  email?: string;
}

const steps = ['Registration Details', 'Email Verification', 'Complete'];

export const RegisterPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registrationState, setRegistrationState] = useState<RegistrationSteps>(
    { current: 'form' }
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    trigger,
  } = useForm<RegisterFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
    mode: 'onBlur',
  });

  // Watch password for confirmation validation
  const password = watch('password');

  // Watch first and last name for display name placeholder
  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const email = watch('email');

  // Enhanced password validation with security checks
  const validatePasswordStrength = (value: string) => {
    const userInfo = {
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || '',
      displayName: `${firstName || ''} ${lastName || ''}`.trim(),
    };

    const result = validatePassword(value, userInfo);

    if (!result.isValid) {
      return result.errors[0] || 'Password does not meet security requirements';
    }

    return true;
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setApiError(null);

      // Final validation
      if (data.password !== data.confirmPassword) {
        setError('confirmPassword', { message: 'Passwords do not match' });
        return;
      }

      if (!data.acceptTerms) {
        setError('acceptTerms', {
          message: 'You must accept the terms and conditions',
        });
        return;
      }

      const registerData: RegisterData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        displayName:
          data.displayName.trim() ||
          `${data.firstName.trim()} ${data.lastName.trim()}`,
        email: data.email.trim().toLowerCase(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        acceptTerms: data.acceptTerms,
      };

      const response = await authService.register(registerData);

      if (response) {
        setRegistrationState({
          current: 'confirmation',
          email: registerData.email,
        });
      } else {
        setApiError('Registration failed. Please try again.');
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'message' in error) {
        const authError = error as AuthError;

        // Handle specific error cases
        if (
          authError.message.toLowerCase().includes('email') &&
          authError.message.toLowerCase().includes('taken')
        ) {
          setError('email', {
            message: 'This email address is already registered',
          });
        } else if (authError.validationErrors) {
          // Handle field-specific validation errors from API
          authError.validationErrors.forEach((validationError) => {
            if (validationError.field.toLowerCase() === 'email') {
              setError('email', { message: validationError.message });
            } else if (validationError.field.toLowerCase() === 'password') {
              setError('password', { message: validationError.message });
            } else {
              setApiError(validationError.message);
            }
          });
        } else {
          setApiError(
            authError.message || 'Registration failed. Please try again.'
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

  const handleResendConfirmation = async () => {
    if (!registrationState.email) return;

    try {
      setIsLoading(true);
      // Note: This would be implemented in authService
      // await authService.resendEmailConfirmation(registrationState.email);
      setApiError(null);
      // Show success message
    } catch {
      setApiError('Failed to resend confirmation email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRegistrationForm = () => (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Name Fields Row */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          mb: 2,
        }}
      >
        {/* First Name */}
        <Controller
          name="firstName"
          control={control}
          rules={{
            required: 'First name is required',
            minLength: {
              value: 2,
              message: 'First name must be at least 2 characters',
            },
            pattern: {
              value: /^[a-zA-Z\s'-]+$/,
              message:
                'First name can only contain letters, spaces, hyphens, and apostrophes',
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              id="firstName"
              label="First Name"
              autoComplete="given-name"
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <PersonOutlineRounded
                    sx={{ mr: 1, color: 'text.secondary' }}
                  />
                ),
              }}
            />
          )}
        />

        {/* Last Name */}
        <Controller
          name="lastName"
          control={control}
          rules={{
            required: 'Last name is required',
            minLength: {
              value: 2,
              message: 'Last name must be at least 2 characters',
            },
            pattern: {
              value: /^[a-zA-Z\s'-]+$/,
              message:
                'Last name can only contain letters, spaces, hyphens, and apostrophes',
            },
          }}
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              id="lastName"
              label="Last Name"
              autoComplete="family-name"
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <PersonOutlineRounded
                    sx={{ mr: 1, color: 'text.secondary' }}
                  />
                ),
              }}
            />
          )}
        />
      </Box>

      {/* Display Name */}
      <Controller
        name="displayName"
        control={control}
        rules={{
          required: 'Display name is required',
          minLength: {
            value: 2,
            message: 'Display name must be at least 2 characters',
          },
        }}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            id="displayName"
            label="Display Name"
            placeholder={
              firstName && lastName
                ? `${firstName} ${lastName}`
                : 'How you want to be displayed'
            }
            error={!!errors.displayName}
            helperText={
              errors.displayName?.message ||
              'This is how your name will appear to other users'
            }
            disabled={isLoading}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <BadgeRounded sx={{ mr: 1, color: 'text.secondary' }} />
              ),
            }}
          />
        )}
      />

      {/* Email */}
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
            fullWidth
            id="email"
            label="Email Address"
            type="email"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={isLoading}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <EmailRounded sx={{ mr: 1, color: 'text.secondary' }} />
              ),
            }}
          />
        )}
      />

      {/* Password */}
      <Controller
        name="password"
        control={control}
        rules={{
          required: 'Password is required',
          validate: validatePasswordStrength,
        }}
        render={({ field }) => (
          <Box sx={{ mb: 2 }}>
            <PasswordInput
              {...field}
              name="password"
              fullWidth
              label="Password"
              error={errors.password}
              helperText={errors.password?.message}
              disabled={isLoading}
              showStrengthIndicator
              userInfo={{
                firstName: firstName || '',
                lastName: lastName || '',
                email: email || '',
                displayName: `${firstName || ''} ${lastName || ''}`.trim(),
              }}
              onChange={(e) => {
                field.onChange(e);
                // Trigger validation for confirm password if it has a value
                if (watch('confirmPassword')) {
                  trigger('confirmPassword');
                }
              }}
            />
          </Box>
        )}
      />

      {/* Confirm Password */}
      <Controller
        name="confirmPassword"
        control={control}
        rules={{
          required: 'Please confirm your password',
          validate: (value) => value === password || 'Passwords do not match',
        }}
        render={({ field }) => (
          <Box sx={{ mb: 2 }}>
            <PasswordInput
              {...field}
              name="confirmPassword"
              fullWidth
              label="Confirm Password"
              error={errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
              disabled={isLoading}
              showStrengthIndicator={false}
            />
          </Box>
        )}
      />

      {/* Terms and Conditions */}
      <Box sx={{ mb: 3 }}>
        <Controller
          name="acceptTerms"
          control={control}
          rules={{
            required: 'You must accept the terms and conditions',
          }}
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
              label={
                <Typography variant="body2">
                  I accept the{' '}
                  <Link
                    component={RouterLink}
                    to="/legal/terms"
                    target="_blank"
                  >
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link
                    component={RouterLink}
                    to="/legal/privacy"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                </Typography>
              }
              sx={{
                alignItems: 'flex-start',
                '& .MuiFormControlLabel-label': {
                  mt: -0.5,
                },
              }}
            />
          )}
        />
        {errors.acceptTerms && (
          <Typography variant="caption" color="error" sx={{ ml: 4 }}>
            {errors.acceptTerms.message}
          </Typography>
        )}
      </Box>

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
          mb: 2,
          py: 1.5,
          fontSize: '1.1rem',
          fontWeight: 'bold',
          borderRadius: 2,
          textTransform: 'none',
        }}
      >
        Create Account
      </LoadingButton>
    </Box>
  );

  const renderEmailConfirmation = () => (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <EmailRounded
          sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }}
        />
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Check Your Email
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          We've sent a confirmation email to:
        </Typography>
        <Typography variant="h6" color="primary" sx={{ mb: 3 }}>
          {registrationState.email}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
          Please click the confirmation link in the email to activate your
          account. The link will expire in 24 hours.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <LoadingButton
            variant="outlined"
            onClick={handleResendConfirmation}
            loading={isLoading}
            disabled={isLoading}
          >
            Resend Confirmation Email
          </LoadingButton>

          <Link component={RouterLink} to="/auth/login" variant="body2">
            Back to Login
          </Link>
        </Box>
      </CardContent>
    </Card>
  );

  const renderSuccess = () => (
    <Card>
      <CardContent sx={{ textAlign: 'center', py: 4 }}>
        <CheckCircleRounded
          sx={{ fontSize: 64, color: theme.palette.success.main, mb: 2 }}
        />
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Registration Complete!
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
          Your account has been successfully created and verified. You can now
          sign in with your credentials.
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
    switch (registrationState.current) {
      case 'form':
        return 0;
      case 'confirmation':
        return 1;
      case 'success':
        return 2;
      default:
        return 0;
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
              <PersonAddRounded
                sx={{ fontSize: 32, color: theme.palette.primary.main }}
              />
            </Box>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              gutterBottom
            >
              Create Account
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Join the Church Register community
            </Typography>
          </Box>

          {/* Progress Stepper */}
          <Stepper activeStep={getActiveStep()} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* API Error */}
          {apiError && (
            <AuthErrorDisplay
              error={apiError}
              onDismiss={() => setApiError(null)}
              onRetry={() => {
                // Clear error and allow retry
                setApiError(null);
              }}
              onResendConfirmation={() => {
                // Handle email resend
                handleResendConfirmation();
              }}
              showUserActions={true}
              showSupportActions={true}
            />
          )}

          {/* Content based on registration state */}
          {registrationState.current === 'form' && renderRegistrationForm()}
          {registrationState.current === 'confirmation' &&
            renderEmailConfirmation()}
          {registrationState.current === 'success' && renderSuccess()}

          {/* Footer Links - only show during form step */}
          {registrationState.current === 'form' && (
            <>
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  or
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  Already have an account?{' '}
                  <Link
                    component={RouterLink}
                    to="/auth/login"
                    fontWeight="medium"
                  >
                    Sign in here
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

export default RegisterPage;
