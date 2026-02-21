import {
  Drawer,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useState, useEffect } from 'react';
import type { RiskAssessmentDetail } from '../../types/riskAssessments';
import { useUpdateRiskAssessment } from '../../hooks/useRiskAssessments';

interface EditRiskAssessmentDrawerProps {
  open: boolean;
  onClose: () => void;
  riskAssessment: RiskAssessmentDetail | null;
  onSuccess: () => void;
}

export function EditRiskAssessmentDrawer({
  open,
  onClose,
  riskAssessment,
  onSuccess,
}: EditRiskAssessmentDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reviewInterval, setReviewInterval] = useState<1 | 2 | 3 | 5>(1);
  const [scope, setScope] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useUpdateRiskAssessment();
  const isSaving = updateMutation.isPending;

  // Populate form when riskAssessment changes
  useEffect(() => {
    if (riskAssessment) {
      setTitle(riskAssessment.title);
      setDescription(riskAssessment.description || '');
      setReviewInterval(riskAssessment.reviewInterval);
      setScope(riskAssessment.scope || '');
      setNotes(riskAssessment.notes || '');
      setError(null);
    }
  }, [riskAssessment]);

  // Validation
  const isFormValid =
    title.trim().length > 0 &&
    title.trim().length <= 200 &&
    description.length <= 1000 &&
    scope.length <= 500 &&
    [1, 2, 3, 5].includes(reviewInterval);

  // Check if form has changes
  const hasChanges =
    riskAssessment &&
    (title !== riskAssessment.title ||
      description !== (riskAssessment.description || '') ||
      reviewInterval !== riskAssessment.reviewInterval ||
      scope !== (riskAssessment.scope || '') ||
      notes !== (riskAssessment.notes || ''));

  const handleSave = async () => {
    if (!riskAssessment) return;

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (title.trim().length > 200) {
      setError('Title must be 200 characters or less');
      return;
    }

    if (description.length > 1000) {
      setError('Assessment Notes must be 1000 characters or less');
      return;
    }

    if (scope.length > 500) {
      setError('Scope must be 500 characters or less');
      return;
    }

    if (![1, 2, 3, 5].includes(reviewInterval)) {
      setError('Please select a valid review interval');
      return;
    }

    setError(null);

    try {
      await updateMutation.mutateAsync({
        id: riskAssessment.id,
        request: {
          title: title.trim(),
          description: description.trim() || undefined,
          reviewInterval,
          scope: scope.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update risk assessment');
    }
  };

  if (!riskAssessment) return null;

  const intervalChanged = reviewInterval !== riskAssessment.reviewInterval;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 600, p: 3 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Edit Risk Assessment</Typography>
          <IconButton onClick={onClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Read-only Category */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Category
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
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
            <Typography variant="caption" color="text.secondary">
              Category cannot be changed after creation
            </Typography>
          </Box>

          <Divider />

          {/* Read-only Consolidated Items Reference */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Items covered by this assessment:
            </Typography>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                p: 2,
                backgroundColor: '#f5f5f5',
                borderRadius: 1,
              }}
            >
              {riskAssessment.categoryDescription}
            </Typography>
          </Box>

          <Divider />

          {/* Title */}
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            fullWidth
            inputProps={{ maxLength: 200 }}
            helperText={`${title.length}/200 characters`}
            error={title.trim().length === 0 || title.length > 200}
          />

          {/* Description (Assessment Notes) */}
          <TextField
            label="Assessment Notes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={4}
            fullWidth
            inputProps={{ maxLength: 1000 }}
            helperText={`${description.length}/1000 characters`}
            error={description.length > 1000}
          />

          {/* Review Interval */}
          <FormControl fullWidth required>
            <InputLabel>Review Interval</InputLabel>
            <Select
              value={reviewInterval}
              onChange={(e) => setReviewInterval(Number(e.target.value) as 1 | 2 | 3 | 5)}
              label="Review Interval"
            >
              <MenuItem value={1}>Every 1 year</MenuItem>
              <MenuItem value={2}>Every 2 years</MenuItem>
              <MenuItem value={3}>Every 3 years</MenuItem>
              <MenuItem value={5}>Every 5 years</MenuItem>
            </Select>
            {intervalChanged && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Next review date will recalculate upon next approval
              </Typography>
            )}
          </FormControl>

          {/* Scope */}
          <TextField
            label="Scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            multiline
            rows={2}
            fullWidth
            inputProps={{ maxLength: 500 }}
            helperText={`${scope.length}/500 characters`}
            error={scope.length > 500}
          />

          {/* Notes */}
          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />

          {/* Footer Actions */}
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={onClose} disabled={isSaving} fullWidth>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!isFormValid || !hasChanges || isSaving}
              fullWidth
              startIcon={isSaving ? <CircularProgress size={20} /> : null}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
