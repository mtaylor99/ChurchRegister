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
  RadioGroup,
  Radio,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormHelperText,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import { LoadingButton } from '../Administration/LoadingButton';
import { churchMembersApi } from '@services/api';
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
      memberNumber: undefined,
      memberSince: new Date(),
      statusId: 1, // Default to Active
      baptised: false,
      giftAid: false,
      envelopes: false,
      pastoralCareRequired: false,
      address: undefined,
      roleIds: [],
    },
  });

  // Watch fields that affect the membership number sequence
  const watchedRoleIds = useWatch({ control, name: 'roleIds' });
  const watchedBaptised = useWatch({ control, name: 'baptised' });

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

  // Derive membership role selection from watched values
  const membershipRoleTypes = roles.filter(
    (r) => r.type === 'Member' || r.type === 'Non-Member'
  );
  const selectedMembershipRole = membershipRoleTypes.find((r) =>
    watchedRoleIds.includes(r.id)
  );
  const hasMembershipRole = selectedMembershipRole !== undefined;
  const isMemberRole = selectedMembershipRole?.type === 'Member';

  // Fetch next available member number — re-fetches when role or baptised changes.
  // Only enabled once roles have loaded and the user has chosen Member or Non-Member.
  // Use the role type string in the key (explicitly 'Member'/'Non-Member') rather than
  // a boolean so there is no aliasing between "no role selected" and "Non-Member selected".
  const memberTypeKey = selectedMembershipRole?.type ?? null;
  const { data: nextMemberNumber } = useQuery({
    queryKey: ['nextAvailableMemberNumber', memberTypeKey, watchedBaptised],
    queryFn: () =>
      churchMembersApi.getNextAvailableMemberNumber({
        isMember: isMemberRole,
        isBaptised: watchedBaptised,
      }),
    enabled: roles.length > 0 && hasMembershipRole,
  });

  // Create member mutation
  const createMemberMutation = useMutation({
    mutationFn: (data: CreateChurchMemberRequest) =>
      churchMembersApi.createChurchMember(data),
    onSuccess: (newMember) => {
      queryClient.invalidateQueries({ queryKey: ['churchMembers'] });
      queryClient.invalidateQueries({ queryKey: ['nextAvailableMemberNumber'], exact: false });
      reset();
      onSuccess(newMember);
    },
    onError: (error: unknown) => {
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
      memberNumber: formData.memberNumber ? Number(formData.memberNumber) : undefined,
      memberSince: formData.memberSince
        ? formData.memberSince.toISOString()
        : new Date().toISOString(),
      statusId: formData.statusId,
      baptised: formData.baptised,
      giftAid: formData.giftAid,
      envelopes: formData.envelopes,
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
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate autoComplete="off">
        <Stack spacing={3}>
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

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Controller
                  name="memberNumber"
                  control={control}
                  rules={{
                    pattern: {
                      value: /^\d+$/,
                      message: 'Member number must contain only digits',
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Member Number (Optional)"
                      placeholder="Leave blank to auto-generate"
                      error={!!errors.memberNumber}
                      helperText={
                        errors.memberNumber?.message ||
                        'Leave blank to auto-assign. Member+Baptised: 1–249 · Member+Not Baptised: 250–499 · Non-Member: 500+'
                      }
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
                  name="envelopes"
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
                      label="Envelopes"
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
            {/* Member Number Info Bar - shows once a membership role is selected */}
            {hasMembershipRole && nextMemberNumber && (
              <Alert severity="info" icon={false} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Membership Number Assignment:</strong> This new member
                  will be assigned membership number{' '}
                  <strong>{nextMemberNumber.nextNumber}</strong> for the year{' '}
                  {nextMemberNumber.year}.
                </Typography>
              </Alert>
            )}
            <Controller
              name="roleIds"
              control={control}
              render={({ field }) => {
                const membershipRoles = roles.filter(
                  (r) => r.type === 'Member' || r.type === 'Non-Member'
                );
                const otherRoles = roles.filter(
                  (r) => r.type !== 'Member' && r.type !== 'Non-Member'
                );
                const currentMembershipId = field.value.find((id) =>
                  membershipRoles.some((r) => r.id === id)
                );
                const handleMembershipChange = (
                  e: React.ChangeEvent<HTMLInputElement>
                ) => {
                  const selectedId = Number(e.target.value);
                  const filtered = field.value.filter(
                    (id) => !membershipRoles.some((r) => r.id === id)
                  );
                  field.onChange([...filtered, selectedId]);
                };
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Member?
                      </Typography>
                      <RadioGroup
                        row
                        value={currentMembershipId ?? ''}
                        onChange={handleMembershipChange}
                      >
                        {membershipRoles.map((role) => (
                          <FormControlLabel
                            key={role.id}
                            value={role.id}
                            control={<Radio disabled={isLoading} />}
                            label={role.type}
                          />
                        ))}
                      </RadioGroup>
                    </Box>
                    {otherRoles.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Other Roles
                        </Typography>
                        <FormGroup>
                          <Stack direction="row" flexWrap="wrap" spacing={1}>
                            {otherRoles.map((role) => (
                              <FormControlLabel
                                key={role.id}
                                control={
                                  <Checkbox
                                    checked={field.value.includes(role.id)}
                                    onChange={(e) => {
                                      const newValue = e.target.checked
                                        ? [...field.value, role.id]
                                        : field.value.filter(
                                            (id) => id !== role.id
                                          );
                                      field.onChange(newValue);
                                    }}
                                    disabled={isLoading}
                                  />
                                }
                                label={role.type}
                                sx={{ minWidth: '160px', mr: 2 }}
                              />
                            ))}
                          </Stack>
                        </FormGroup>
                      </Box>
                    )}
                    <FormHelperText>
                      Select whether this person is a Member or Non-Member, then
                      assign any additional roles.
                    </FormHelperText>
                  </Box>
                );
              }}
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
