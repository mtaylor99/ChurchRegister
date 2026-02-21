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
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { useState } from 'react';
import { useCreateRiskAssessment, useRiskAssessmentCategories } from '../../hooks/useRiskAssessments';

interface AddRiskAssessmentDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddRiskAssessmentDrawer({
  open,
  onClose,
  onSuccess,
}: AddRiskAssessmentDrawerProps) {
  const [categoryId, setCategoryId] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reviewInterval, setReviewInterval] = useState<1 | 2 | 3 | 5>(1);
  const [scope, setScope] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [] } = useRiskAssessmentCategories();
  const createMutation = useCreateRiskAssessment();
  const isSaving = createMutation.isPending;

  // Validation
  const isFormValid =
    categoryId > 0 &&
    title.trim().length > 0 &&
    title.trim().length <= 200 &&
    description.length <= 1000 &&
    scope.length <= 500 &&
    [1, 2, 3, 5].includes(reviewInterval);

  const handleReset = () => {
    setCategoryId(0);
    setTitle('');
    setDescription('');
    setReviewInterval(1);
    setScope('');
    setNotes('');
    setError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSave = async () => {
    // Validation
    if (categoryId === 0) {
      setError('Please select a category');
      return;
    }

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
      await createMutation.mutateAsync({
        categoryId,
        title: title.trim(),
        description: description.trim() || undefined,
        reviewInterval,
        scope: scope.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      handleReset();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create risk assessment');
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={handleClose}>
      <Box sx={{ width: 600, p: 3 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Add Risk Assessment</Typography>
          <IconButton onClick={handleClose} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Form */}
        <Stack spacing={3}>
          {/* Category */}
          <FormControl fullWidth required>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryId}
              label="Category"
              onChange={(e) => setCategoryId(Number(e.target.value))}
              disabled={isSaving}
            >
              <MenuItem value={0} disabled>
                <em>Select a category</em>
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Title */}
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            disabled={isSaving}
            inputProps={{ maxLength: 200 }}
            helperText={`${title.length}/200 characters`}
          />

          {/* Description */}
          <TextField
            label="Assessment Notes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={4}
            disabled={isSaving}
            inputProps={{ maxLength: 1000 }}
            helperText={`${description.length}/1000 characters`}
          />

          {/* Review Interval */}
          <FormControl fullWidth required>
            <InputLabel>Review Interval</InputLabel>
            <Select
              value={reviewInterval}
              label="Review Interval"
              onChange={(e) => setReviewInterval(e.target.value as 1 | 2 | 3 | 5)}
              disabled={isSaving}
            >
              <MenuItem value={1}>1 Year</MenuItem>
              <MenuItem value={2}>2 Years</MenuItem>
              <MenuItem value={3}>3 Years</MenuItem>
              <MenuItem value={5}>5 Years</MenuItem>
            </Select>
          </FormControl>

          {/* Scope */}
          <TextField
            label="Scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            fullWidth
            multiline
            rows={3}
            disabled={isSaving}
            inputProps={{ maxLength: 500 }}
            helperText={`${scope.length}/500 characters`}
          />

          {/* Notes */}
          <TextField
            label="Additional Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            disabled={isSaving}
          />
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
          <Button onClick={handleClose} disabled={isSaving} fullWidth variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            fullWidth
            variant="contained"
          >
            {isSaving ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Creating...
              </>
            ) : (
              'Create Risk Assessment'
            )}
          </Button>
        </Stack>

        <Box sx={{ mt: 3 }}>
          <Alert severity="info">
            New risk assessments are created with status "Under Review" and will require the
            minimum number of approvals before being activated.
          </Alert>
        </Box>
      </Box>
    </Drawer>
  );
}
