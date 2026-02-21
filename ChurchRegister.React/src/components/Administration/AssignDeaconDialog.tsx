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

export interface AssignDeaconDialogProps {
  open: boolean;
  onClose: () => void;
  district: District | null;
}

export const AssignDeaconDialog: React.FC<AssignDeaconDialogProps> = ({
  open,
  onClose,
  district,
}) => {
  const [selectedDeaconId, setSelectedDeaconId] = useState<number | null>(null);
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  // Fetch active deacons
  const { data: deacons, isLoading: isLoadingDeacons } = useQuery<
    ChurchMemberSummary[]
  >({
    queryKey: ['activeDeacons'],
    queryFn: () => districtsApi.getActiveDeacons(),
    enabled: open,
  });

  // Initialize selected deacon when district changes
  useEffect(() => {
    if (district) {
      setSelectedDeaconId(district.deaconId ?? null);
    }
  }, [district]);

  // Mutation for assigning deacon
  const assignDeaconMutation = useMutation({
    mutationFn: (deaconId: number | null) =>
      districtsApi.assignDeacon(district!.id, { deaconId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      showSuccess(
        selectedDeaconId
          ? 'Deacon assigned successfully'
          : 'Deacon unassigned successfully'
      );
      onClose();
    },
    onError: (error: any) => {
      showError(
        error?.response?.data?.error ||
          error?.message ||
          'Failed to assign deacon'
      );
    },
  });

  const handleSubmit = () => {
    assignDeaconMutation.mutate(selectedDeaconId);
  };

  const handleClose = () => {
    if (!assignDeaconMutation.isPending) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="assign-deacon-dialog-title"
    >
      <DialogTitle id="assign-deacon-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Assign Deacon - District {district?.name}
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            disabled={assignDeaconMutation.isPending}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {district?.districtOfficerId && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Cannot unassign deacon while a district officer is assigned. Please
            unassign the district officer first.
          </Alert>
        )}

        {isLoadingDeacons ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : (
          <FormControl fullWidth>
            <InputLabel id="deacon-select-label">Deacon</InputLabel>
            <Select
              labelId="deacon-select-label"
              id="deacon-select"
              value={selectedDeaconId ?? ''}
              label="Deacon"
              onChange={(e) => {
                const value = e.target.value as unknown as string;
                setSelectedDeaconId(
                  value === '' ? null : Number(value)
                );
              }}
              disabled={assignDeaconMutation.isPending}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {deacons?.map((deacon) => (
                <MenuItem key={deacon.id} value={deacon.id}>
                  {deacon.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {district?.deaconName && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Current Deacon: <strong>{district.deaconName}</strong>
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={assignDeaconMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={
            assignDeaconMutation.isPending ||
            isLoadingDeacons ||
            selectedDeaconId === district?.deaconId
          }
        >
          {assignDeaconMutation.isPending ? (
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
