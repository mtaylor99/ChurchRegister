import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { districtsApi } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { extractErrorMessage } from '../../utils/typeGuards';
import type { District } from '../../types';

export interface AssignDescriptionDialogProps {
  open: boolean;
  onClose: () => void;
  district: District | null;
}

export const AssignDescriptionDialog: React.FC<AssignDescriptionDialogProps> = ({
  open,
  onClose,
  district,
}) => {
  const [description, setDescription] = useState<string>('');
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Initialise description when district changes
  useEffect(() => {
    if (district) {
      setDescription(district.description ?? '');
    }
  }, [district]);

  const assignDescriptionMutation = useMutation({
    mutationFn: (desc: string | null) =>
      districtsApi.assignDescription(district!.id, { description: desc }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      showSuccess(
        description.trim()
          ? 'Description saved successfully'
          : 'Description cleared successfully'
      );
      onClose();
    },
    onError: (error: unknown) => {
      showError(extractErrorMessage(error, 'Failed to save description'));
    },
  });

  const handleSubmit = () => {
    assignDescriptionMutation.mutate(description.trim() || null);
  };

  const handleClose = () => {
    if (!assignDescriptionMutation.isPending) {
      onClose();
    }
  };

  const hasChanged = (description ?? '') !== (district?.description ?? '');

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="assign-description-dialog-title"
    >
      <DialogTitle id="assign-description-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Assign Description - District {district?.name}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            disabled={assignDescriptionMutation.isPending}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={4}
          inputProps={{ maxLength: 500 }}
          helperText={`${description.length}/500`}
          disabled={assignDescriptionMutation.isPending}
          placeholder="Enter a description for this district (optional)"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={assignDescriptionMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={assignDescriptionMutation.isPending || !hasChanged}
        >
          {assignDescriptionMutation.isPending ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
