import React, { useState } from 'react';
import {
  Drawer,
  Box,
  IconButton,
  Typography,
  Stack,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import {
  VisibilityRounded,
  VisibilityOffRounded,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { authService } from '../../services/auth';
import { useNotification } from '../../contexts/NotificationContext';
import type { ChangePasswordRequest } from '../../services/auth/types';

export interface ChangePasswordDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ChangePasswordDrawer: React.FC<ChangePasswordDrawerProps> = ({
  open,
  onClose,
}) => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
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

  // Reset form when drawer opens
  React.useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const validatePassword = (value: string) => {
    if (value.length < 12) {
      return 'Password must be at least 12 characters long';
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

  const handleSave = async (data: ChangePasswordFormData) => {
    try {
      setLoading(true);

      if (data.newPassword !== data.confirmPassword) {
        setError('confirmPassword', { message: 'Passwords do not match' });
        setLoading(false);
        return;
      }

      if (data.currentPassword === data.newPassword) {
        setError('newPassword', {
          message: 'New password must be different from current password',
        });
        setLoading(false);
        return;
      }

      const changePasswordData: ChangePasswordRequest = {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      };

      await authService.changePassword(changePasswordData);

      // Show success message
      showSuccess('Password changed successfully!');
      
      // Reset form
      reset();

      // Close drawer after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Change password error in drawer:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        const authError = error as any;

        // Handle errors array from API response
        if (authError.errors && Array.isArray(authError.errors)) {
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
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: { xs: '100%', sm: 500, md: 600 },
          maxWidth: '100%',
        },
      }}
    >
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6">Change Password</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Content */}
        <Box
          component="form"
          onSubmit={handleSubmit(handleSave)}
          sx={{
            flex: 1,
            p: 3,
            overflow: 'auto',
          }}
        >
          <Stack spacing={3}>
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
                  type={showPasswords.current ? 'text' : 'password'}
                  label="Current Password"
                  error={!!errors.currentPassword}
                  helperText={errors.currentPassword?.message}
                  fullWidth
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
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
                  type={showPasswords.new ? 'text' : 'password'}
                  label="New Password"
                  error={!!errors.newPassword}
                  helperText={errors.newPassword?.message}
                  fullWidth
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
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

            {/* Confirm Password */}
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
                  type={showPasswords.confirm ? 'text' : 'password'}
                  label="Confirm New Password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  fullWidth
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
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

            {/* Password Requirements */}
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200',
              }}
            >
              <Typography variant="caption" color="textSecondary" gutterBottom>
                Password Requirements:
              </Typography>
              <Typography variant="caption" component="ul" sx={{ pl: 2, m: 0 }}>
                <li>At least 12 characters long</li>
                <li>At least one lowercase letter</li>
                <li>At least one uppercase letter</li>
                <li>At least one number</li>
                <li>At least one special character (@$!%*?&)</li>
              </Typography>
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Stack
          direction="row"
          spacing={2}
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Button
            variant="outlined"
            onClick={handleCancel}
            disabled={loading}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit(handleSave)}
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <SaveIcon />
            }
            fullWidth
          >
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default ChangePasswordDrawer;
