import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import { ErrorAlert } from '../ErrorAlert';
import { extractErrorMessage } from '../../utils/typeGuards';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import { useCreateReminder } from '../../hooks/useReminders';
import { useReminderCategories } from '../../hooks/useReminderCategories';
import { districtsApi } from '../../services/api';
import type { ChurchMemberSummary } from '../../types';

export interface CreateReminderDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateReminderDrawer({
  open,
  onClose,
  onSuccess,
}: CreateReminderDrawerProps) {
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [assignedToChurchMemberId, setAssignedToChurchMemberId] = useState<
    number | null
  >(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [priority, setPriority] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateReminder();
  const { data: categories, isPending: categoriesLoading } =
    useReminderCategories();
  const { data: assignableMembers = [], isPending: membersLoading } = useQuery<
    ChurchMemberSummary[]
  >({
    queryKey: ['activeDeacons', 'includeMinisters'],
    queryFn: () => districtsApi.getActiveDeacons(true),
    enabled: open,
  });

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      setDescription('');
      setNotes('');
      setDueDate(null);
      setAssignedToChurchMemberId(null);
      setCategoryId(null);
      setPriority(false);
      setError(null);
    }
  }, [open]);

  const handleSave = async () => {
    // Validation
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    if (!dueDate) {
      setError('Due date is required');
      return;
    }

    if (assignedToChurchMemberId === null) {
      setError('Assigned to is required');
      return;
    }

    setError(null);

    try {
      const payload = {
        description: description.trim(),
        notes: notes.trim() || null,
        dueDate: dueDate.toISOString(),
        assignedToChurchMemberId,
        categoryId,
        priority,
      };

      console.log('Submitting reminder with payload:', payload);

      const result = await createMutation.mutateAsync(payload);

      console.log('Reminder created, result:', result);

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Error creating reminder:', err);
      setError(extractErrorMessage(err, 'Failed to create reminder'));
    }
  };

  const isFormValid =
    description.trim() && dueDate && assignedToChurchMemberId !== null;
  const isSaving = createMutation.isPending;

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 500, p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Create Reminder
        </Typography>

        <Stack spacing={3} sx={{ mt: 3 }}>
          <ErrorAlert error={error} onDismiss={() => setError(null)} />

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

          <TextField
            label="Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={4}
            fullWidth
            inputProps={{ maxLength: 2000 }}
            helperText={`${notes.length}/2000 characters`}
          />

          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={enGB}
          >
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
              value={assignedToChurchMemberId ?? ''}
              onChange={(e) =>
                setAssignedToChurchMemberId(Number(e.target.value))
              }
              label="Assigned To"
              disabled={membersLoading}
            >
              {assignableMembers.map((member) => (
                <MenuItem key={member.id} value={member.id}>
                  {member.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Category (Optional)</InputLabel>
            <Select
              value={categoryId === null ? '' : categoryId}
              onChange={(e) =>
                setCategoryId(
                  typeof e.target.value === 'string' && e.target.value === ''
                    ? null
                    : Number(e.target.value)
                )
              }
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
              disabled={!isFormValid || isSaving}
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
