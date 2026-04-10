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
import { yupResolver } from '@hookform/resolvers/yup';
import { addUserSchema, type AddUserFormValues } from '@validation/schemas';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingButton } from './LoadingButton';
import { RoleHierarchySelector } from './RoleHierarchySelector';
import { administrationApi } from '@services/api';
import { useNotification } from '../../hooks/useNotification';
import { getErrorMessage } from '../../utils/errorUtils';
import type {
  CreateUserRequest,
  CreateUserResponse,
} from '../../types/administration';

export interface AddUserFormProps {
  onSuccess: (response: CreateUserResponse) => void;
  onCancel: () => void;
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
  } = useForm<AddUserFormValues>({
    mode: 'onChange',
    resolver: yupResolver(addUserSchema) as never,
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
    onError: (error: unknown) => {
      // Toast notification is shown automatically by ApiClient
      // Set inline error for form feedback
      setSubmitError(getErrorMessage(error));
    },
  });

  const onSubmit = async (formData: AddUserFormValues) => {
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
