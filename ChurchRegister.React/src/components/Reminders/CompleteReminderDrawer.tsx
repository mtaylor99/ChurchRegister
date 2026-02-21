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
  Divider,
  Chip,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import InfoIcon from '@mui/icons-material/Info';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import { addMonths, format } from 'date-fns';
import { useCompleteReminder } from '../../hooks/useReminders';
import type { Reminder } from '../../types/reminders';

interface CompleteReminderDrawerProps {
  open: boolean;
  onClose: () => void;
  reminder: Reminder | null;
  onSuccess: () => void;
}

export function CompleteReminderDrawer({ open, onClose, reminder, onSuccess }: CompleteReminderDrawerProps) {
  const [completionNotes, setCompletionNotes] = useState('');
  const [createNext, setCreateNext] = useState(false);
  const [nextInterval, setNextInterval] = useState<'3months' | '6months' | '12months' | 'custom'>('3months');
  const [customDueDate, setCustomDueDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completeMutation = useCompleteReminder();

  // Reset form when drawer opens/closes
  useEffect(() => {
    if (!open) {
      setCompletionNotes('');
      setCreateNext(false);
      setNextInterval('3months');
      setCustomDueDate(null);
      setError(null);
    }
  }, [open]);

  const handleComplete = async () => {
    if (!reminder) return;

    // Validation
    if (!completionNotes.trim()) {
      setError('Completion notes are required');
      return;
    }

    if (createNext && nextInterval === 'custom' && !customDueDate) {
      setError('Custom due date is required when creating next reminder');
      return;
    }

    setError(null);

    try {
      const response = await completeMutation.mutateAsync({
        id: reminder.id,
        request: {
          completionNotes: completionNotes.trim(),
          createNext,
          nextInterval: createNext ? nextInterval : null,
          customDueDate: createNext && nextInterval === 'custom' && customDueDate
            ? customDueDate.toISOString()
            : null,
        },
      });

      // Show appropriate success message
      const hasNextReminder = response.nextReminder !== null;
      const message = hasNextReminder
        ? 'Reminder completed and new reminder created with inherited category'
        : 'Reminder completed successfully';

      // In a real app, you'd show a toast notification here
      console.log(message);

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete reminder');
    }
  };

  const getCalculatedDate = (): string => {
    if (!reminder) return '';

    const originalDate = new Date(reminder.dueDate);
    let calculatedDate: Date;

    switch (nextInterval) {
      case '3months':
        calculatedDate = addMonths(originalDate, 3);
        break;
      case '6months':
        calculatedDate = addMonths(originalDate, 6);
        break;
      case '12months':
        calculatedDate = addMonths(originalDate, 12);
        break;
      default:
        return '';
    }

    return format(calculatedDate, 'dd/MM/yyyy');
  };

  const isFormValid = completionNotes.trim() && (!createNext || (nextInterval !== 'custom' || customDueDate));
  const isCompleting = completeMutation.isPending;

  if (!reminder) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 550, p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Complete Reminder
        </Typography>

        <Stack spacing={3} sx={{ mt: 3 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Read-only reminder details */}
          <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Reminder Details
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 1 }}>
              {reminder.description}
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Due: {format(new Date(reminder.dueDate), 'dd/MM/yyyy')}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Assigned to: {reminder.assignedToUserName}
              </Typography>
            </Stack>

            {reminder.categoryName && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Category:
                </Typography>
                <Chip
                  label={reminder.categoryName}
                  size="small"
                  sx={{
                    backgroundColor: reminder.categoryColorHex || '#9e9e9e',
                    color: '#fff',
                  }}
                />
              </Stack>
            )}

            {reminder.priority && (
              <Stack direction="row" spacing={1} alignItems="center">
                <StarIcon sx={{ color: '#ff9800', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">
                  Important
                </Typography>
              </Stack>
            )}
          </Box>

          <TextField
            label="Completion Notes"
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            multiline
            rows={4}
            required
            fullWidth
            helperText="Describe what was done to complete this task"
          />

          <Divider>
            <Typography variant="body2" color="text.secondary">
              Create Next Reminder
            </Typography>
          </Divider>

          <FormControlLabel
            control={
              <Checkbox
                checked={createNext}
                onChange={(e) => setCreateNext(e.target.checked)}
              />
            }
            label="Create next reminder"
          />

          {createNext && (
            <>
              <FormControl fullWidth>
                <InputLabel>Interval</InputLabel>
                <Select
                  value={nextInterval}
                  onChange={(e) => setNextInterval(e.target.value as any)}
                  label="Interval"
                >
                  <MenuItem value="3months">3 months</MenuItem>
                  <MenuItem value="6months">6 months</MenuItem>
                  <MenuItem value="12months">12 months</MenuItem>
                  <MenuItem value="custom">Custom date</MenuItem>
                </Select>
              </FormControl>

              {nextInterval !== 'custom' && (
                <Alert severity="info" icon={<InfoIcon />}>
                  New due date: {getCalculatedDate()}
                </Alert>
              )}

              {nextInterval === 'custom' && (
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
                  <DatePicker
                    label="Custom Due Date"
                    value={customDueDate}
                    onChange={(newValue) => setCustomDueDate(newValue)}
                    minDate={new Date()}
                    slotProps={{
                      textField: {
                        required: true,
                        fullWidth: true,
                      },
                    }}
                  />
                </LocalizationProvider>
              )}

              <Alert severity="info" icon={<InfoIcon />}>
                Next reminder will inherit description, assigned user, category, and priority from current reminder
              </Alert>
            </>
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleComplete}
              disabled={!isFormValid || isCompleting}
              fullWidth
              startIcon={isCompleting ? <CircularProgress size={20} /> : null}
            >
              {isCompleting ? 'Completing...' : 'Complete'}
            </Button>
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={isCompleting}
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
