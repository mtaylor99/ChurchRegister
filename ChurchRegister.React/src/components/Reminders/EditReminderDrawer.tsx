import { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import { useUpdateReminder } from '../../hooks/useReminders';
import { useReminderCategories } from '../../hooks/useReminderCategories';
import type { Reminder } from '../../types/reminders';

interface EditReminderDrawerProps {
  open: boolean;
  onClose: () => void;
  reminder: Reminder | null;
  onSuccess: () => void;
}

export function EditReminderDrawer({ open, onClose, reminder, onSuccess }: EditReminderDrawerProps) {
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [priority, setPriority] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useUpdateReminder();
  const { data: categories, isPending: categoriesLoading } = useReminderCategories();

  // Populate form when reminder changes
  useEffect(() => {
    if (reminder) {
      setDescription(reminder.description);
      setDueDate(new Date(reminder.dueDate));
      setAssignedToUserId(reminder.assignedToUserId);
      setCategoryId(reminder.categoryId);
      setPriority(reminder.priority || false);
      setError(null);
    }
  }, [reminder]);

  const handleSave = async () => {
    if (!reminder) return;

    // Validation
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    if (!dueDate) {
      setError('Due date is required');
      return;
    }

    if (!assignedToUserId) {
      setError('Assigned to is required');
      return;
    }

    setError(null);

    try {
      await updateMutation.mutateAsync({
        id: reminder.id,
        request: {
          description: description.trim(),
          dueDate: dueDate.toISOString(),
          assignedToUserId,
          categoryId,
          priority,
        },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update reminder');
    }
  };

  // Check if form has changes
  const hasChanges = reminder && (
    description !== reminder.description ||
    (dueDate && dueDate.toISOString() !== new Date(reminder.dueDate).toISOString()) ||
    assignedToUserId !== reminder.assignedToUserId ||
    categoryId !== reminder.categoryId ||
    priority !== (reminder.priority || false)
  );

  const isFormValid = description.trim() && dueDate && assignedToUserId;
  const isSaving = updateMutation.isPending;

  if (!reminder) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 500, p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Edit Reminder
        </Typography>

        <Stack spacing={3} sx={{ mt: 3 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            required
            fullWidth
            inputProps={{ maxLength: 500 }}
            helperText={`${description.length}/500 characters`}
          />

          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
            <DatePicker
              label="Due Date"
              value={dueDate}
              onChange={(newValue) => setDueDate(newValue)}
              minDate={new Date()}
              slotProps={{
                textField: {
                  required: true,
                  fullWidth: true,
                },
              }}
            />
          </LocalizationProvider>

          <FormControl fullWidth required>
            <InputLabel>Assigned To</InputLabel>
            <Select
              value={assignedToUserId}
              onChange={(e) => setAssignedToUserId(e.target.value)}
              label="Assigned To"
            >
              <MenuItem value={reminder.assignedToUserId}>
                {reminder.assignedToUserName}
              </MenuItem>
              {/* Note: In production, this should fetch actual users with Reminders roles */}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Category (Optional)</InputLabel>
            <Select
              value={categoryId === null ? '' : categoryId}
              onChange={(e) => setCategoryId(typeof e.target.value === 'string' && e.target.value === '' ? null : Number(e.target.value))}
              label="Category (Optional)"
              disabled={categoriesLoading}
            >
              <MenuItem value="">None</MenuItem>
              {categories?.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: cat.colorHex || '#9e9e9e',
                      }}
                    />
                    <span>{cat.name}</span>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={priority}
                onChange={(e) => setPriority(e.target.checked)}
              />
            }
            label="Mark as Important"
          />

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!isFormValid || !hasChanges || isSaving}
              fullWidth
              startIcon={isSaving ? <CircularProgress size={20} /> : null}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={isSaving}
              fullWidth
            >
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
}
