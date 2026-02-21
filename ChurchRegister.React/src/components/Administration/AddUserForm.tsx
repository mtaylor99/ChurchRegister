import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  Stack,
  Typography,
  Divider,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingButton } from './LoadingButton';
import { RoleHierarchySelector } from './RoleHierarchySelector';
import { administrationApi } from '../../services/api/administrationApi';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';
import type {
  CreateUserRequest,
  UserFormData,
  CreateUserResponse,
} from '../../types/administration';

export interface AddUserFormProps {
  onSuccess: (response: CreateUserResponse) => void;
  onCancel: () => void;
}

interface AddUserFormData extends UserFormData {
  sendInvitationEmail: boolean;
}

export const AddUserForm: React.FC<AddUserFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const notification = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form setup with react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<AddUserFormData>({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      jobTitle: '',
      phoneNumber: '',
      roles: [],
      sendInvitationEmail: true,
    },
  });

  // Fetch system roles for selection
  const { data: systemRoles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['systemRoles'],
    queryFn: () => administrationApi.getSystemRoles(),
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => administrationApi.createUser(data),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      notification.showSuccess(
        newUser.emailVerificationSent
          ? `Invitation sent to ${newUser.user.fullName} successfully!`
          : `User ${newUser.user.fullName} has been created successfully!`
      );
      reset();
      onSuccess(newUser);
    },
    onError: (error: any) => {
      // Toast notification is shown automatically by ApiClient
      // Set inline error for form feedback
      setSubmitError(getErrorMessage(error));
    },
  });

  const onSubmit = async (formData: AddUserFormData) => {
    setSubmitError(null);

    const createUserRequest: CreateUserRequest = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      jobTitle: formData.jobTitle || undefined,
      phoneNumber: formData.phoneNumber || undefined,
      roles: formData.roles,
      sendInvitationEmail: formData.sendInvitationEmail,
    };

    createUserMutation.mutate(createUserRequest);
  };

  const isLoading = createUserMutation.isPending || isLoadingRoles;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
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
                    disabled={isLoading}
                    required
                    fullWidth
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
                    disabled={isLoading}
                    required
                    fullWidth
                  />
                )}
              />
            </Stack>

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
                  type="email"
                  label="Email Address"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isLoading}
                  required
                  fullWidth
                />
              )}
            />

            <Controller
              name="jobTitle"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Job Title"
                  error={!!errors.jobTitle}
                  helperText={errors.jobTitle?.message}
                  disabled={isLoading}
                  fullWidth
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
                  disabled={isLoading}
                  fullWidth
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
                disabled={isLoading}
                required
              />
            )}
          />
        </Box>

        <Divider />

        {/* Invitation Options Section */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Account Setup Options
          </Typography>
          <Stack spacing={2}>
            <Controller
              name="sendInvitationEmail"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                    />
                  }
                  label="Send invitation email"
                  disabled={isLoading}
                />
              )}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              The user will receive an invitation email with a secure link to
              verify their email address and set up their password.
            </Typography>
          </Stack>
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
            Cancel
          </LoadingButton>

          <LoadingButton
            type="submit"
            variant="contained"
            loading={createUserMutation.isPending}
            disabled={!isValid || isLoading}
          >
            Create User
          </LoadingButton>
        </Stack>
      </Stack>
    </Box>
  );
};
