import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stack,
  Typography,
  FormHelperText,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingButton } from '../Administration/LoadingButton';
import { churchMembersApi } from '../../services/api/churchMembersApi';
import { getErrorMessage } from '../../utils/errorUtils';
import type {
  ChurchMemberDetailDto,
  UpdateChurchMemberStatusRequest,
} from '../../types/churchMembers';

export interface ChurchMemberStatusDialogProps {
  open: boolean;
  onClose: () => void;
  member: ChurchMemberDetailDto | null;
  onSuccess?: () => void;
}

interface StatusFormData {
  statusId: number;
  note?: string;
}

export const ChurchMemberStatusDialog: React.FC<
  ChurchMemberStatusDialogProps
> = ({ open, onClose, member, onSuccess }) => {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<StatusFormData>({
    mode: 'onChange',
    defaultValues: {
      statusId: member?.statusId || 1,
      note: '',
    },
  });

  // Fetch statuses
  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ['churchMemberStatuses'],
    queryFn: () => churchMembersApi.getStatuses(),
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      memberId,
      request,
    }: {
      memberId: number;
      request: UpdateChurchMemberStatusRequest;
    }) => churchMembersApi.updateChurchMemberStatus(memberId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['churchMembers'] });
      reset();
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      // Toast notification is shown automatically by ApiClient
      // Set inline error for form feedback
      setSubmitError(getErrorMessage(error));
    },
  });

  const onSubmit = async (formData: StatusFormData) => {
    if (!member) return;

    setSubmitError(null);

    const request: UpdateChurchMemberStatusRequest = {
      statusId: formData.statusId,
      note: formData.note || undefined,
    };

    updateStatusMutation.mutate({ memberId: member.id, request });
  };

  const handleClose = () => {
    reset();
    setSubmitError(null);
    onClose();
  };

  const isLoading = updateStatusMutation.isPending || isLoadingStatuses;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>Change Member Status</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Change the status for{' '}
              <strong>{member?.fullName || 'this member'}</strong>
            </Typography>

            <Controller
              name="statusId"
              control={control}
              rules={{ required: 'Status is required' }}
              render={({ field }) => (
                <FormControl fullWidth required error={!!errors.statusId}>
                  <InputLabel>New Status</InputLabel>
                  <Select {...field} label="New Status" disabled={isLoading}>
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

            <Controller
              name="note"
              control={control}
              rules={{
                maxLength: {
                  value: 500,
                  message: 'Note cannot exceed 500 characters',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Note (Optional)"
                  multiline
                  rows={4}
                  error={!!errors.note}
                  helperText={
                    errors.note?.message ||
                    'Add a note explaining the reason for this status change'
                  }
                  disabled={isLoading}
                  fullWidth
                />
              )}
            />

            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <LoadingButton
            variant="outlined"
            onClick={handleClose}
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
            Update Status
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ChurchMemberStatusDialog;
