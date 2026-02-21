import {
  Drawer,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  LinearProgress,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import IconButton from '@mui/material/IconButton';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import type { RiskAssessmentDetail } from '../../types/riskAssessments';
import type { ChurchMemberSummary } from '../../types';
import { useApproveRiskAssessment } from '../../hooks/useRiskAssessments';
import { districtsApi } from '../../services/api';

interface ApproveRiskAssessmentDrawerProps {
  open: boolean;
  onClose: () => void;
  riskAssessment: RiskAssessmentDetail | null;
  onSuccess: () => void;
}

export function ApproveRiskAssessmentDrawer({
  open,
  onClose,
  riskAssessment,
  onSuccess,
}: ApproveRiskAssessmentDrawerProps) {
  const [selectedDeacons, setSelectedDeacons] = useState<ChurchMemberSummary[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const approveMutation = useApproveRiskAssessment();
  const isApproving = approveMutation.isPending;

  // Fetch active deacons
  const { data: deacons = [], isLoading: isLoadingDeacons } = useQuery<ChurchMemberSummary[]>({
    queryKey: ['activeDeacons'],
    queryFn: () => districtsApi.getActiveDeacons(),
    enabled: open,
  });

  // Reset form when drawer opens with new risk assessment
  useEffect(() => {
    if (riskAssessment) {
      setSelectedDeacons([]);
      setNotes('');
      setError(null);
    }
  }, [riskAssessment]);

  if (!riskAssessment) return null;

  // Calculate approval progress
  const approvalProgress =
    (riskAssessment.approvalCount / riskAssessment.minimumApprovalsRequired) * 100;

  // Validation - require at least 2 deacons
  const canApprove = selectedDeacons.length >= 2 && !isApproving;

  const handleApprove = async () => {
    if (selectedDeacons.length < 2) {
      setError('Please select at least 2 deacons who approved this assessment in the meeting');
      return;
    }

    if (notes.length > 500) {
      setError('Notes must be 500 characters or less');
      return;
    }

    setError(null);

    try {
      await approveMutation.mutateAsync({
        id: riskAssessment.id,
        request: {
          deaconMemberIds: selectedDeacons.map((d) => d.id),
          notes: notes.trim() || undefined,
        },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve risk assessment');
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 500, p: 3 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Record Approval</Typography>
          <IconButton onClick={onClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          <Alert severity="info">
            Select the deacons who approved this risk assessment in the meeting. This is for
            recording meeting decisions.
          </Alert>

          {/* Assessment Summary */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Assessment
            </Typography>
            <Typography variant="h6" gutterBottom>
              {riskAssessment.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mt={1}>
              <Chip
                label={riskAssessment.categoryName}
                size="small"
                sx={{
                  backgroundColor: '#757575',
                  color: '#fff',
                  fontWeight: 500,
                }}
              />
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Next Review Date
            </Typography>
            <Typography variant="body2">
              {format(new Date(riskAssessment.nextReviewDate), 'dd MMM yyyy')}
            </Typography>
          </Box>

          <Divider />

          {/* Current Approvals */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Approvals Progress ({riskAssessment.approvalCount} of{' '}
              {riskAssessment.minimumApprovalsRequired})
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(approvalProgress, 100)}
              sx={{
                height: 8,
                borderRadius: 1,
                mb: 2,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor:
                    riskAssessment.approvalCount >= riskAssessment.minimumApprovalsRequired
                      ? '#4caf50'
                      : '#2196f3',
                },
              }}
            />
          </Box>

          {riskAssessment.approvals.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current Approvals
              </Typography>
              <List dense>
                {riskAssessment.approvals.map((approval) => (
                  <ListItem key={approval.id} divider>
                    <ListItemAvatar>
                      <Avatar>{approval.approvedByMemberName.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={approval.approvedByMemberName}
                      secondary={format(new Date(approval.approvedDate), 'dd MMM yyyy HH:mm')}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Divider />

          {/* Deacon Selection */}
          <Autocomplete
            multiple
            options={deacons}
            getOptionLabel={(option) => option.fullName}
            value={selectedDeacons}
            onChange={(_, newValue) => setSelectedDeacons(newValue)}
            loading={isLoadingDeacons}
            disabled={isApproving}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Deacons Who Approved"
                required
                helperText="Select at least 2 deacons who approved this assessment in the meeting"
                error={selectedDeacons.length > 0 && selectedDeacons.length < 2}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isLoadingDeacons ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  label={option.fullName}
                  {...getTagProps({ index })}
                  size="small"
                  icon={<CheckCircleIcon />}
                />
              ))
            }
          />

          {/* Approval Notes */}
          <TextField
            label="Meeting Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={4}
            fullWidth
            disabled={isApproving}
            inputProps={{ maxLength: 500 }}
            helperText={`Document any important details from the meeting. ${notes.length}/500 characters`}
          />

          {/* Footer Actions */}
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={onClose} disabled={isApproving} fullWidth>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleApprove}
              disabled={!canApprove}
              fullWidth
              startIcon={isApproving ? <CircularProgress size={20} /> : null}
            >
              {isApproving ? 'Recording...' : 'Record Approval'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
