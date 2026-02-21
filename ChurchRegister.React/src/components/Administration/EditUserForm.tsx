import React, { useState } from 'react';
import {
  Box,
  TextField,
  Alert,
  Stack,
  Typography,
  Divider,
  Chip,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingButton } from './LoadingButton';
import { RoleHierarchySelector } from './RoleHierarchySelector';
import { administrationApi } from '../../services/api/administrationApi';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';
import type {
  UpdateUserRequest,
  UserFormData,
  UserProfileDto,
} from '../../types/administration';

export interface EditUserFormProps {
  user: UserProfileDto;
  mode?: 'edit' | 'view';
  onSuccess: (user: UserProfileDto) => void;
  onCancel: () => void;
}

export const EditUserForm: React.FC<EditUserFormProps> = ({
  user,
  mode = 'edit',
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const notification = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form setup with react-hook-form, pre-populated with user data
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<UserFormData>({
    mode: 'onChange',
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      jobTitle: user.jobTitle || '',
      phoneNumber: user.phoneNumber || '',
      roles: user.roles,
    },
  });

  // Fetch system roles for selection
  const { data: systemRoles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['systemRoles'],
    queryFn: () => administrationApi.getSystemRoles(),
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: (data: {
      userId: string;
      request: Omit<UpdateUserRequest, 'userId'>;
    }) => administrationApi.updateUser(data.userId, data.request),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', user.id] });
      notification.showSuccess(
        `User ${updatedUser.fullName} has been updated successfully!`
      );
      reset();
      onSuccess(updatedUser);
    },
    onError: (error: any) => {
      // Toast notification is shown automatically by ApiClient
      // Set inline error for form feedback
      setSubmitError(getErrorMessage(error));
    },
  });

  const onSubmit = async (formData: UserFormData) => {
    setSubmitError(null);

    const updateUserRequest: Omit<UpdateUserRequest, 'userId'> = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      jobTitle: formData.jobTitle || undefined,
      phoneNumber: formData.phoneNumber || undefined,
      roles: formData.roles,
    };

    updateUserMutation.mutate({
      userId: user.id,
      request: updateUserRequest,
    });
  };

  const isLoading = updateUserMutation.isPending || isLoadingRoles;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        {/* Account Information Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Account Information
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Email Address"
              value={user.email}
              disabled
              fullWidth
              helperText="Email address cannot be changed"
            />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Account Status
              </Typography>
              <Chip
                label={
                  user.status === 2
                    ? 'Active'
                    : user.status === 5
                      ? 'Pending'
                      : user.status === 3
                        ? 'Locked'
                        : 'Inactive'
                }
                color={
                  user.status === 2
                    ? 'success'
                    : user.status === 5
                      ? 'warning'
                      : 'error'
                }
                size="small"
              />
            </Box>

            <TextField
              label="Member Since"
              value={new Date(user.dateJoined).toLocaleDateString()}
              disabled
              fullWidth
            />
          </Stack>
        </Box>

        <Divider />

        {/* Personal Information Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Personal Information
          </Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="firstName"
                control={control}
                rules={{
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name"
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                    disabled={isLoading || mode === 'view'}
                    required
                    fullWidth
                    InputProps={{
                      readOnly: mode === 'view',
                    }}
                  />
                )}
              />

              <Controller
                name="lastName"
                control={control}
                rules={{
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last Name"
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    disabled={isLoading || mode === 'view'}
                    required
                    fullWidth
                    InputProps={{
                      readOnly: mode === 'view',
                    }}
                  />
                )}
              />
            </Stack>

            <Controller
              name="jobTitle"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Job Title"
                  error={!!errors.jobTitle}
                  helperText={errors.jobTitle?.message}
                  disabled={isLoading || mode === 'view'}
                  fullWidth
                  InputProps={{
                    readOnly: mode === 'view',
                  }}
                />
              )}
            />

            <Controller
              name="phoneNumber"
              control={control}
              rules={{
                pattern: {
                  value: /^[+]?[()]?[\d\s\-()]{10,}$/,
                  message: 'Please enter a valid phone number',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Phone Number"
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber?.message}
                  disabled={isLoading || mode === 'view'}
                  fullWidth
                  InputProps={{
                    readOnly: mode === 'view',
                  }}
                />
              )}
            />
          </Stack>
        </Box>

        <Divider />

        {/* Roles Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Role Assignment
          </Typography>
          <Controller
            name="roles"
            control={control}
            rules={{
              validate: (value) =>
                value.length > 0 || 'At least one role must be assigned',
            }}
            render={({ field }) => (
              <RoleHierarchySelector
                selectedRoles={field.value}
                onRoleChange={field.onChange}
                availableRoles={systemRoles}
                error={errors.roles?.message}
                helperText="Select the roles for this user. Higher-level roles automatically include lower-level permissions."
                disabled={isLoading || mode === 'view'}
                required
              />
            )}
          />
        </Box>

        {/* Error Display */}
        {submitError && (
          <Alert severity="error" onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {/* Form Actions */}
        <Stack
          direction="row"
          spacing={2}
          justifyContent="flex-end"
          sx={{ pt: 2 }}
        >
          <LoadingButton
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading}
          >
            {mode === 'view' ? 'Close' : 'Cancel'}
          </LoadingButton>

          {mode === 'edit' && (
            <LoadingButton
              type="submit"
              variant="contained"
              loading={updateUserMutation.isPending}
              disabled={!isDirty || !isValid || isLoading}
            >
              Save Changes
            </LoadingButton>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};
