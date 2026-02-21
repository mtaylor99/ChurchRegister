import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { districtsApi } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import type { District, ChurchMemberSummary } from '../../types';

export interface AssignDistrictOfficerDialogProps {
  open: boolean;
  onClose: () => void;
  district: District | null;
}

export const AssignDistrictOfficerDialog: React.FC<
  AssignDistrictOfficerDialogProps
> = ({ open, onClose, district }) => {
  const [selectedOfficerId, setSelectedOfficerId] = useState<number | null>(
    null
  );
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Fetch active district officers (excluding current deacon)
  const { data: officers, isLoading: isLoadingOfficers } = useQuery<
    ChurchMemberSummary[]
  >({
    queryKey: ['activeDistrictOfficers', district?.deaconId],
    queryFn: () => districtsApi.getActiveDistrictOfficers(district?.deaconId ?? undefined),
    enabled: open && !!district,
  });

  // Initialize selected officer when district changes
  useEffect(() => {
    if (district) {
      setSelectedOfficerId(district.districtOfficerId ?? null);
    }
  }, [district]);

  // Mutation for assigning district officer
  const assignOfficerMutation = useMutation({
    mutationFn: (officerId: number | null) =>
      districtsApi.assignDistrictOfficer(district!.id, {
        districtOfficerId: officerId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      showSuccess(
        selectedOfficerId
          ? 'District officer assigned successfully'
          : 'District officer unassigned successfully'
      );
      onClose();
    },
    onError: (error: any) => {
      showError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to assign district officer'
      );
    },
  });

  const handleSubmit = () => {
    assignOfficerMutation.mutate(selectedOfficerId);
  };

  const handleClose = () => {
    if (!assignOfficerMutation.isPending) {
      onClose();
    }
  };

  const hasDeacon = !!district?.deaconId;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="assign-officer-dialog-title"
    >
      <DialogTitle id="assign-officer-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Assign District Officer - District {district?.name}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            disabled={assignOfficerMutation.isPending}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {!hasDeacon && (
          <Alert severity="error" sx={{ mb: 2 }}>
            A deacon must be assigned to this district before assigning a
            district officer.
          </Alert>
        )}

        {district?.deaconName && (
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary">
              Current Deacon: <strong>{district.deaconName}</strong>
            </Typography>
          </Box>
        )}

        {isLoadingOfficers ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : (
          <FormControl fullWidth disabled={!hasDeacon}>
            <InputLabel id="officer-select-label">District Officer</InputLabel>
            <Select
              labelId="officer-select-label"
              id="officer-select"
              value={selectedOfficerId ?? ''}
              label="District Officer"
              onChange={(e) => {
                const value = e.target.value as unknown as string;
                setSelectedOfficerId(
                  value === '' ? null : Number(value)
                );
              }}
              disabled={assignOfficerMutation.isPending || !hasDeacon}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {officers?.map((officer) => (
                <MenuItem key={officer.id} value={officer.id}>
                  {officer.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {district?.districtOfficerName && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Current District Officer:{' '}
              <strong>{district.districtOfficerName}</strong>
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={assignOfficerMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            assignOfficerMutation.isPending ||
            isLoadingOfficers ||
            !hasDeacon ||
            selectedOfficerId === district?.districtOfficerId
          }
        >
          {assignOfficerMutation.isPending ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Assigning...
            </>
          ) : (
            'Assign'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
