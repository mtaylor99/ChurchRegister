import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  Alert,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingCertificatesApi } from '../../services/api';
import type {
  TrainingCertificateTypeDto,
  CreateTrainingCertificateTypeRequest,
  UpdateTrainingCertificateTypeRequest,
} from '../../types/trainingCertificates';
import { TRAINING_TYPE_STATUSES } from '../../types/trainingCertificates';

export interface TrainingCertificateTypeFormProps {
  type: TrainingCertificateTypeDto | null;
  mode: 'add' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
}

export const TrainingCertificateTypeForm: React.FC<
  TrainingCertificateTypeFormProps
> = ({ type, mode, onSuccess, onCancel }) => {
  const queryClient = useQueryClient();
  const isEditMode = mode === 'edit';

  // Form state - isActive is true for Active, false for InActive
  // Default to true when adding new type
  const [formData, setFormData] = useState({
    type: type?.type || '',
    description: type?.description || '',
    isActive: type ? type.status === TRAINING_TYPE_STATUSES.ACTIVE : true,
  });

  const [error, setError] = useState<string | null>(null);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTrainingCertificateTypeRequest) =>
      trainingCertificatesApi.createTrainingCertificateType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trainingCertificateTypes'],
      });
      onSuccess();
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to create training type');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Omit<UpdateTrainingCertificateTypeRequest, 'id'>;
    }) => trainingCertificatesApi.updateTrainingCertificateType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['trainingCertificateTypes'],
      });
      onSuccess();
    },
    onError: (error: any) => {
      setError(error.message || 'Failed to update training type');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.type.trim()) {
      setError('Type name is required');
      return;
    }

    const status = formData.isActive
      ? TRAINING_TYPE_STATUSES.ACTIVE
      : TRAINING_TYPE_STATUSES.INACTIVE;

    if (isEditMode && type) {
      updateMutation.mutate({
        id: type.id,
        data: {
          type: formData.type,
          description: formData.description || undefined,
          status: status,
        },
      });
    } else {
      createMutation.mutate({
        type: formData.type,
        description: formData.description || undefined,
        status: status,
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}

        {/* Type Name */}
        <TextField
          label="Training/Check Type Name"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          required
          fullWidth
          inputProps={{ maxLength: 50 }}
          helperText="e.g., DBS Check, Safeguarding Level 2, First Aid"
        />

        {/* Description */}
        <TextField
          label="Description (Optional)"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          fullWidth
          multiline
          rows={3}
          inputProps={{ maxLength: 500 }}
          placeholder="Brief description of the training/check type..."
        />

        {/* Active Status Switch */}
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
              />
            }
            label="Active Type"
          />
          <Typography variant="caption" color="text.secondary" display="block">
            Active types can be assigned to church members
          </Typography>
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {isEditMode ? 'Update' : 'Create'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};

export default TrainingCertificateTypeForm;
