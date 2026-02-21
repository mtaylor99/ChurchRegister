import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Autocomplete,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { trainingCertificatesApi } from '../../services/api';
import { churchMembersApi } from '../../services/api';
import type {
  TrainingCertificateDto,
  TrainingCertificateTypeDto,
  CreateTrainingCertificateRequest,
  UpdateTrainingCertificateRequest,
} from '../../types/trainingCertificates';
import { TRAINING_CERTIFICATE_STATUSES } from '../../types/trainingCertificates';

export interface TrainingCertificateFormProps {
  certificate: TrainingCertificateDto | null;
  mode: 'add' | 'edit' | 'view';
  onSuccess: () => void;
  onCancel: () => void;
}

export const TrainingCertificateForm: React.FC<
  TrainingCertificateFormProps
> = ({ certificate, mode, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  // Form state
  const [formData, setFormData] = useState({
    churchMemberId: certificate?.churchMemberId || 0,
    trainingCertificateTypeId: certificate?.trainingCertificateTypeId || 0,
    status: certificate?.status || TRAINING_CERTIFICATE_STATUSES.PENDING,
    expires: certificate?.expires ? new Date(certificate.expires) : null as Date | null,
    notes: certificate?.notes || '',
  });

  const [selectedMember, setSelectedMember] = useState<{ id: number; fullName: string } | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  const [error, setError] = useState<string | null>(null);

  // Fetch training types
  const { data: types = [] } = useQuery<TrainingCertificateTypeDto[]>({
    queryKey: ['trainingCertificateTypes', 'Active'],
    queryFn: () => trainingCertificatesApi.getTrainingCertificateTypes('Active'),
  });

  // Fetch church members for autocomplete (in add mode) - search as user types
  const { data: membersResponse } = useQuery({
    queryKey: ['churchMembers', { searchTerm: memberSearchTerm, page: 1, pageSize: 50 }],
    queryFn: () =>
      churchMembersApi.getChurchMembers({
        page: 1,
        pageSize: 50,
        searchTerm: memberSearchTerm || undefined,
        sortBy: 'firstName',
        sortDirection: 'asc',
      }),
    enabled: !isEditMode && !isViewMode,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTrainingCertificateRequest) =>
      trainingCertificatesApi.createTrainingCertificate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingCertificates'] });
      onSuccess();
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create training certificate');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Omit<UpdateTrainingCertificateRequest, 'id'>;
    }) => trainingCertificatesApi.updateTrainingCertificate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainingCertificates'] });
      onSuccess();
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update training certificate');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isViewMode) return;

    if (!isEditMode && formData.churchMemberId === 0) {
      setError('Please select a church member');
      return;
    }

    if (formData.trainingCertificateTypeId === 0) {
      setError('Please select a training type');
      return;
    }

    if (!formData.status) {
      setError('Please select a status');
      return;
    }

    // Validate expiry date for In Validity status
    if (formData.status === TRAINING_CERTIFICATE_STATUSES.IN_VALIDITY) {
      if (!formData.expires) {
        setError('Expiry date is required for In Validity status');
        return;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiryDate = new Date(formData.expires);
      expiryDate.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        setError('Expiry date cannot be in the past for In Validity status');
        return;
      }
    }

    if (isEditMode && certificate) {
      updateMutation.mutate({
        id: certificate.id,
        data: {
          status: formData.status,
          expires: formData.expires ? formData.expires.toISOString() : undefined,
          notes: formData.notes || undefined,
        },
      });
    } else {
      createMutation.mutate({
        churchMemberId: formData.churchMemberId,
        trainingCertificateTypeId: formData.trainingCertificateTypeId,
        status: formData.status,
        expires: formData.expires ? formData.expires.toISOString() : undefined,
        notes: formData.notes || undefined,
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        {/* Church Member (add mode only) */}
        {!isEditMode && !isViewMode && (
          <Autocomplete
            options={membersResponse?.items || []}
            getOptionLabel={(option) => option.fullName || ''}
            value={selectedMember}
            onChange={(_, newValue) => {
              setSelectedMember(newValue);
              setFormData({ ...formData, churchMemberId: newValue?.id || 0 });
            }}
            inputValue={memberSearchTerm}
            onInputChange={(_, newInputValue) => {
              setMemberSearchTerm(newInputValue);
            }}
            loading={false}
            disabled={isViewMode}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Church Member"
                required
                placeholder="Type to search members..."
                helperText="Start typing a member's name"
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText={memberSearchTerm ? 'No members found' : 'Start typing to search'}
          />
        )}

        {/* Member Name (view/edit mode) */}
        {(isEditMode || isViewMode) && certificate && (
          <TextField
            label="Church Member"
            value={certificate.memberName}
            disabled
            fullWidth
          />
        )}

        {/* Training Type */}
        <FormControl fullWidth required disabled={isViewMode || isEditMode}>
          <InputLabel>Training/Check Type</InputLabel>
          <Select
            value={formData.trainingCertificateTypeId || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                trainingCertificateTypeId: Number(e.target.value),
              })
            }
            label="Training/Check Type"
          >
            <MenuItem value="">
              <em>Select a type</em>
            </MenuItem>
            {types.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status */}
        <FormControl fullWidth required disabled={isViewMode}>
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            label="Status"
          >
            <MenuItem value={TRAINING_CERTIFICATE_STATUSES.PENDING}>
              Pending
            </MenuItem>
            <MenuItem value={TRAINING_CERTIFICATE_STATUSES.IN_VALIDITY}>
              In Validity
            </MenuItem>
            <MenuItem value={TRAINING_CERTIFICATE_STATUSES.EXPIRED}>
              Expired
            </MenuItem>
            <MenuItem value={TRAINING_CERTIFICATE_STATUSES.ALLOW_TO_EXPIRE}>
              Allow to Expire
            </MenuItem>
          </Select>
        </FormControl>

        {/* Expiry Date */}
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
          <DatePicker
            label="Expiry Date"
            value={formData.expires}
            onChange={(newValue) =>
              setFormData({ ...formData, expires: newValue })
            }
            disabled={isViewMode}
            minDate={
              formData.status === TRAINING_CERTIFICATE_STATUSES.IN_VALIDITY
                ? new Date()
                : undefined
            }
            slotProps={{
              textField: {
                fullWidth: true,
                required:
                  formData.status === TRAINING_CERTIFICATE_STATUSES.IN_VALIDITY,
                helperText:
                  formData.status === TRAINING_CERTIFICATE_STATUSES.IN_VALIDITY
                    ? 'Required - must be a future date'
                    : formData.status === TRAINING_CERTIFICATE_STATUSES.PENDING
                    ? 'Optional - not required for Pending status'
                    : 'Optional - can be in the past for Expired/Allow to Expire',
              },
            }}
          />
        </LocalizationProvider>

        {/* Notes */}
        <TextField
          label="Notes"
          value={formData.notes}
          onChange={(e) =>
            setFormData({ ...formData, notes: e.target.value })
          }
          disabled={isViewMode}
          fullWidth
          multiline
          rows={4}
          inputProps={{ maxLength: 500 }}
        />

        {/* Actions */}
        {!isViewMode && (
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={onCancel} variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={
                createMutation.isPending || updateMutation.isPending
              }
            >
              {isEditMode ? 'Update' : 'Create'}
            </Button>
          </Stack>
        )}
      </Stack>
    </Box>
  );
};

export default TrainingCertificateForm;
