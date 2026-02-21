import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  Stack,
  Typography,
  Divider,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormHelperText,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import { LoadingButton } from '../Administration/LoadingButton';
import { churchMembersApi } from '../../services/api/churchMembersApi';
import { getErrorMessage } from '../../utils/errorUtils';
import type {
  CreateChurchMemberRequest,
  ChurchMemberFormData,
  CreateChurchMemberResponse,
} from '../../types/churchMembers';

export interface AddChurchMemberFormProps {
  onSuccess: (response: CreateChurchMemberResponse) => void;
  onCancel: () => void;
}

export const AddChurchMemberForm: React.FC<AddChurchMemberFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch next available member number
  const { data: nextMemberNumber } = useQuery({
    queryKey: ['nextAvailableMemberNumber'],
    queryFn: () => churchMembersApi.getNextAvailableMemberNumber(),
  });

  // Form setup with react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<ChurchMemberFormData>({
    mode: 'onChange',
    defaultValues: {
      title: undefined,
      firstName: '',
      lastName: '',
      email: undefined,
      phone: undefined,
      bankReference: undefined,
      memberSince: null,
      statusId: 1, // Default to Active
      baptised: false,
      giftAid: false,
      pastoralCareRequired: false,
      address: undefined,
      roleIds: [],
    },
  });

  // Fetch roles for selection (static data - cache for 1 hour)
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['churchMemberRoles'],
    queryFn: () => churchMembersApi.getRoles(),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours (formerly cacheTime)
  });

  // Fetch statuses for selection (static data - cache for 1 hour)
  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ['churchMemberStatuses'],
    queryFn: () => churchMembersApi.getStatuses(),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours (formerly cacheTime)
  });

  // Create member mutation
  const createMemberMutation = useMutation({
    mutationFn: (data: CreateChurchMemberRequest) =>
      churchMembersApi.createChurchMember(data),
    onSuccess: (newMember) => {
      queryClient.invalidateQueries({ queryKey: ['churchMembers'] });
      queryClient.invalidateQueries({
        queryKey: ['nextAvailableMemberNumber'],
      });
      reset();
      onSuccess(newMember);
    },
    onError: (error: any) => {
      // Toast notification is shown automatically by ApiClient
      // Set inline error for form feedback
      setSubmitError(getErrorMessage(error));
    },
  });

  const onSubmit = async (formData: ChurchMemberFormData) => {
    setSubmitError(null);

    const createRequest: CreateChurchMemberRequest = {
      title: formData.title,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      bankReference: formData.bankReference || undefined,
      memberSince: formData.memberSince
        ? formData.memberSince.toISOString()
        : new Date().toISOString(),
      statusId: formData.statusId,
      baptised: formData.baptised,
      giftAid: formData.giftAid,
      pastoralCareRequired: formData.pastoralCareRequired,
      address: formData.address,
      roleIds: formData.roleIds,
    };

    createMemberMutation.mutate(createRequest);
  };

  const isLoading =
    createMemberMutation.isPending || isLoadingRoles || isLoadingStatuses;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack spacing={3}>
          {/* Member Number Info Bar */}
          {nextMemberNumber && (
            <Alert severity="info" icon={false}>
              <Typography variant="body2">
                <strong>Membership Number Assignment:</strong> This new member
                will be assigned membership number{' '}
                <strong>{nextMemberNumber.nextNumber}</strong> for the year{' '}
                {nextMemberNumber.year}.
              </Typography>
            </Alert>
          )}

          {/* Personal Information Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Stack spacing={2}>
              {/* Title Dropdown */}
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel id="title-label">Title</InputLabel>
                    <Select
                      {...field}
                      labelId="title-label"
                      label="Title"
                      disabled={isLoading}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      <MenuItem value="Mr">Mr</MenuItem>
                      <MenuItem value="Mrs">Mrs</MenuItem>
                      <MenuItem value="Miss">Miss</MenuItem>
                      <MenuItem value="Ms">Ms</MenuItem>
                      <MenuItem value="Dr">Dr</MenuItem>
                      <MenuItem value="Rev">Rev</MenuItem>
                      <MenuItem value="Prof">Prof</MenuItem>
                      <MenuItem value="Sir">Sir</MenuItem>
                      <MenuItem value="Lady">Lady</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                  name="firstName"
                  control={control}
                  rules={{
                    required: 'First name is required',
                    maxLength: {
                      value: 50,
                      message: 'First name cannot exceed 50 characters',
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
                    maxLength: {
                      value: 50,
                      message: 'Last name cannot exceed 50 characters',
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
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please enter a valid email address',
                  },
                  maxLength: {
                    value: 100,
                    message: 'Email cannot exceed 100 characters',
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
                    fullWidth
                  />
                )}
              />

              <Controller
                name="phone"
                control={control}
                rules={{
                  maxLength: {
                    value: 20,
                    message: 'Phone number cannot exceed 20 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Phone Number"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    disabled={isLoading}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="bankReference"
                control={control}
                rules={{
                  maxLength: {
                    value: 100,
                    message: 'Bank reference cannot exceed 100 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Bank Reference"
                    error={!!errors.bankReference}
                    helperText={errors.bankReference?.message}
                    disabled={isLoading}
                    fullWidth
                  />
                )}
              />
            </Stack>
          </Box>

          <Divider />

          {/* Membership Details Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Membership Details
            </Typography>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                  name="memberSince"
                  control={control}
                  rules={{
                    required: 'Member since date is required',
                    validate: (value) => {
                      if (!value) return 'Member since date is required';
                      if (value > new Date()) {
                        return 'Member since date cannot be in the future';
                      }
                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      label="Member Since"
                      disabled={isLoading}
                      slotProps={{
                        textField: {
                          required: true,
                          error: !!errors.memberSince,
                          helperText: errors.memberSince?.message,
                          fullWidth: true,
                        },
                      }}
                    />
                  )}
                />

                <Controller
                  name="statusId"
                  control={control}
                  rules={{ required: 'Status is required' }}
                  render={({ field }) => (
                    <FormControl fullWidth required error={!!errors.statusId}>
                      <InputLabel>Status</InputLabel>
                      <Select {...field} label="Status" disabled={isLoading}>
                        {statuses.map((status) => (
                          <MenuItem key={status.id} value={status.id}>
                            {status.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.statusId && (
                        <FormHelperText>
                          {errors.statusId.message}
                        </FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Stack>

              <Stack direction="row" spacing={3}>
                <Controller
                  name="baptised"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={isLoading}
                        />
                      }
                      label="Baptised"
                    />
                  )}
                />

                <Controller
                  name="giftAid"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={isLoading}
                        />
                      }
                      label="Gift Aid"
                    />
                  )}
                />

                <Controller
                  name="pastoralCareRequired"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.value}
                          onChange={field.onChange}
                          disabled={isLoading}
                        />
                      }
                      label="Pastoral Care Required"
                    />
                  )}
                />
              </Stack>
            </Stack>
          </Box>

          <Divider />

          {/* Roles Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Role Assignment
            </Typography>
            <Controller
              name="roleIds"
              control={control}
              render={({ field }) => (
                <Box>
                  <FormGroup>
                    <Stack direction="row" flexWrap="wrap" spacing={1}>
                      {roles.map((role) => (
                        <FormControlLabel
                          key={role.id}
                          control={
                            <Checkbox
                              checked={field.value.includes(role.id)}
                              onChange={(e) => {
                                const newValue = e.target.checked
                                  ? [...field.value, role.id]
                                  : field.value.filter((id) => id !== role.id);
                                field.onChange(newValue);
                              }}
                              disabled={isLoading}
                            />
                          }
                          label={role.type}
                          sx={{ minWidth: '200px', mr: 2 }}
                        />
                      ))}
                    </Stack>
                  </FormGroup>
                  <FormHelperText>
                    Select the roles for this member. Members can have multiple
                    roles.
                  </FormHelperText>
                </Box>
              )}
            />
          </Box>

          <Divider />

          {/* Address Section - Collapsible */}
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Address (Optional)</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Controller
                  name="address.nameNumber"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 50,
                      message: 'Name/Number cannot exceed 50 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Name/Number"
                      error={!!errors.address?.nameNumber}
                      helperText={errors.address?.nameNumber?.message}
                      disabled={isLoading}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="address.addressLineOne"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 100,
                      message: 'Address line 1 cannot exceed 100 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Address Line 1"
                      error={!!errors.address?.addressLineOne}
                      helperText={errors.address?.addressLineOne?.message}
                      disabled={isLoading}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="address.addressLineTwo"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 100,
                      message: 'Address line 2 cannot exceed 100 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Address Line 2"
                      error={!!errors.address?.addressLineTwo}
                      helperText={errors.address?.addressLineTwo?.message}
                      disabled={isLoading}
                      fullWidth
                    />
                  )}
                />

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Controller
                    name="address.town"
                    control={control}
                    rules={{
                      maxLength: {
                        value: 50,
                        message: 'Town cannot exceed 50 characters',
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Town"
                        error={!!errors.address?.town}
                        helperText={errors.address?.town?.message}
                        disabled={isLoading}
                        fullWidth
                      />
                    )}
                  />

                  <Controller
                    name="address.county"
                    control={control}
                    rules={{
                      maxLength: {
                        value: 50,
                        message: 'County cannot exceed 50 characters',
                      },
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="County"
                        error={!!errors.address?.county}
                        helperText={errors.address?.county?.message}
                        disabled={isLoading}
                        fullWidth
                      />
                    )}
                  />
                </Stack>

                <Controller
                  name="address.postcode"
                  control={control}
                  rules={{
                    maxLength: {
                      value: 20,
                      message: 'Postcode cannot exceed 20 characters',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Postcode"
                      error={!!errors.address?.postcode}
                      helperText={errors.address?.postcode?.message}
                      disabled={isLoading}
                      fullWidth
                    />
                  )}
                />
              </Stack>
            </AccordionDetails>
          </Accordion>

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
              loading={isLoading}
              disabled={!isValid || isLoading}
            >
              Create Member
            </LoadingButton>
          </Stack>
        </Stack>
      </Box>
    </LocalizationProvider>
  );
};

export default AddChurchMemberForm;
