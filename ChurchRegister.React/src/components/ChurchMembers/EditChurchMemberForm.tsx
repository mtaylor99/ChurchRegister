import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  Stack,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  FormGroup,
  FormHelperText,
  Chip,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingButton } from '../Administration/LoadingButton';
import { churchMembersApi } from '../../services/api/churchMembersApi';
import { getErrorMessage } from '../../utils/errorUtils';
import type {
  ChurchMemberDetailDto,
  UpdateChurchMemberRequest,
} from '../../types/churchMembers';

export interface EditChurchMemberFormProps {
  member: ChurchMemberDetailDto;
  mode?: 'edit' | 'view';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const EditChurchMemberForm: React.FC<EditChurchMemberFormProps> = ({
  member,
  mode = 'edit',
  onSuccess,
  onCancel,
}) => {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isViewMode = mode === 'view';

  // Check if member has an address saved
  const hasAddress = useMemo(() => {
    if (!member.address) return false;
    return !!(
      member.address.nameNumber ||
      member.address.addressLineOne ||
      member.address.addressLineTwo ||
      member.address.town ||
      member.address.county ||
      member.address.postcode
    );
  }, [member.address]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid, isDirty },
  } = useForm<UpdateChurchMemberRequest>({
    mode: 'onChange',
    defaultValues: {
      id: member.id,
      title: member.title || '',
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email || '',
      phone: member.phone || '',
      bankReference: member.bankReference || '',
      memberNumber: member.memberNumber || '',
      memberSince: member.memberSince?.split('T')[0] || '',
      statusId: member.statusId || 1,
      baptised: member.baptised,
      giftAid: member.giftAid,
      pastoralCareRequired: member.pastoralCareRequired,
      roleIds: member.roles?.map((role) => role.id) || [],
      address: member.address
        ? {
            nameNumber: member.address.nameNumber || '',
            addressLineOne: member.address.addressLineOne || '',
            addressLineTwo: member.address.addressLineTwo || '',
            town: member.address.town || '',
            county: member.address.county || '',
            postcode: member.address.postcode || '',
          }
        : undefined,
    },
  });

  // Reset form when member prop changes
  useEffect(() => {
    reset({
      id: member.id,
      title: member.title || '',
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email || '',
      phone: member.phone || '',
      bankReference: member.bankReference || '',
      memberNumber: member.memberNumber || '',
      memberSince: member.memberSince?.split('T')[0] || '',
      statusId: member.statusId || 1,
      baptised: member.baptised,
      giftAid: member.giftAid,
      pastoralCareRequired: member.pastoralCareRequired,
      roleIds: member.roles?.map((role) => role.id) || [],
      address: member.address
        ? {
            nameNumber: member.address.nameNumber || '',
            addressLineOne: member.address.addressLineOne || '',
            addressLineTwo: member.address.addressLineTwo || '',
            town: member.address.town || '',
            county: member.address.county || '',
            postcode: member.address.postcode || '',
          }
        : undefined,
    });
  }, [member, reset]);

  // Fetch roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    queryKey: ['churchMemberRoles'],
    queryFn: () => churchMembersApi.getRoles(),
  });

  // Fetch statuses
  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ['churchMemberStatuses'],
    queryFn: () => churchMembersApi.getStatuses(),
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateChurchMemberRequest) =>
      churchMembersApi.updateChurchMember(data.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churchMembers'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      // Toast notification is shown automatically by ApiClient
      // Set inline error for form feedback
      setSubmitError(getErrorMessage(error));
    },
  });

  const onSubmit = async (formData: UpdateChurchMemberRequest) => {
    if (isViewMode) return; // Prevent submission in view mode

    setSubmitError(null);

    // Clean up address if all fields are empty
    if (formData.address) {
      const hasAddressData = Object.values(formData.address).some(
        (value) => value && value.trim() !== ''
      );
      if (!hasAddressData) {
        formData.address = undefined;
      }
    }

    updateMutation.mutate(formData);
  };

  const isLoading =
    updateMutation.isPending || isLoadingRoles || isLoadingStatuses;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack spacing={3}>
        {submitError && (
          <Alert severity="error" onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        )}

        {/* Personal Information */}
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
                    disabled={isLoading || isViewMode}
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
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters',
                  },
                  maxLength: {
                    value: 50,
                    message: 'First name cannot exceed 50 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="First Name"
                    required={!isViewMode}
                    error={!!errors.firstName}
                    helperText={errors.firstName?.message}
                    disabled={isLoading || isViewMode}
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
                  maxLength: {
                    value: 50,
                    message: 'Last name cannot exceed 50 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Last Name"
                    required={!isViewMode}
                    error={!!errors.lastName}
                    helperText={errors.lastName?.message}
                    disabled={isLoading || isViewMode}
                    fullWidth
                  />
                )}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="email"
                control={control}
                rules={{
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
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
                    label="Email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    disabled={isLoading || isViewMode}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="phone"
                control={control}
                rules={{
                  pattern: {
                    value: /^[\d\s()+-]+$/,
                    message: 'Invalid phone number format',
                  },
                  maxLength: {
                    value: 20,
                    message: 'Phone number cannot exceed 20 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="tel"
                    label="Phone Number"
                    error={!!errors.phone}
                    helperText={errors.phone?.message}
                    disabled={isLoading || isViewMode}
                    fullWidth
                  />
                )}
              />
            </Stack>

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
                  disabled={isLoading || isViewMode}
                  fullWidth
                />
              )}
            />
          </Stack>
        </Box>

        <Divider />

        {/* Membership Details */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Membership Details
          </Typography>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="memberSince"
                control={control}
                rules={{ required: 'Member Since date is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Member Since"
                    required={!isViewMode}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.memberSince}
                    helperText={errors.memberSince?.message}
                    disabled={isLoading || isViewMode}
                    fullWidth
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
                    <Select
                      {...field}
                      label="Status"
                      disabled={isLoading || isViewMode}
                    >
                      {statuses.map((status) => (
                        <MenuItem key={status.id} value={status.id}>
                          {status.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.statusId && (
                      <FormHelperText>{errors.statusId.message}</FormHelperText>
                    )}
                  </FormControl>
                )}
              />
            </Stack>

            <Controller
              name="memberNumber"
              control={control}
              rules={{
                pattern: {
                  value: /^\d+$/,
                  message: 'Member number must contain only digits',
                },
                maxLength: {
                  value: 20,
                  message: 'Member number cannot exceed 20 characters',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Member Number"
                  placeholder="Leave blank to auto-generate"
                  error={!!errors.memberNumber}
                  helperText={
                    errors.memberNumber?.message ||
                    'Enter a custom member number or leave blank to auto-generate for active members'
                  }
                  disabled={isLoading || isViewMode}
                  fullWidth
                />
              )}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="baptised"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={
                      <Checkbox
                        {...field}
                        checked={field.value}
                        disabled={isLoading || isViewMode}
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
                        {...field}
                        checked={field.value}
                        disabled={isLoading || isViewMode}
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
                        {...field}
                        checked={field.value}
                        disabled={isLoading || isViewMode}
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

        {/* Role Assignment */}
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
                            disabled={isLoading || isViewMode}
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

        {/* Address (Collapsible) */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1">Address (Optional)</Typography>
              {hasAddress && (
                <Chip
                  label="Saved"
                  icon={<CheckIcon />}
                  size="small"
                  color="primary"
                  sx={{ height: 20 }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Controller
                name="address.nameNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="House Name/Number"
                    error={!!errors.address?.nameNumber}
                    helperText={errors.address?.nameNumber?.message}
                    disabled={isLoading || isViewMode}
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
                    message: 'Address Line 1 cannot exceed 100 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address Line 1"
                    error={!!errors.address?.addressLineOne}
                    helperText={errors.address?.addressLineOne?.message}
                    disabled={isLoading || isViewMode}
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
                    message: 'Address Line 2 cannot exceed 100 characters',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Address Line 2"
                    error={!!errors.address?.addressLineTwo}
                    helperText={errors.address?.addressLineTwo?.message}
                    disabled={isLoading || isViewMode}
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
                      label="Town/City"
                      error={!!errors.address?.town}
                      helperText={errors.address?.town?.message}
                      disabled={isLoading || isViewMode}
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
                      disabled={isLoading || isViewMode}
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
                    disabled={isLoading || isViewMode}
                    fullWidth
                  />
                )}
              />
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Action Buttons */}
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
              loading={isLoading}
              disabled={!isValid || !isDirty || isLoading}
            >
              Save Changes
            </LoadingButton>
          )}
        </Stack>
      </Stack>
    </Box>
  );
};

export default EditChurchMemberForm;
