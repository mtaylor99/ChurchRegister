import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Box,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { enGB } from 'date-fns/locale';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import {
  useCreateAttendance,
  useUpdateAttendance,
  useEvents,
  useNotification,
} from '../../hooks';
import type {
  CreateAttendanceRequest,
  UpdateAttendanceRequest,
  AttendanceRecord,
} from '../../services/attendanceService';

// Form data type
interface AttendanceFormData {
  eventId: number;
  date: Date;
  attendance: number | null;
}

export interface AttendanceRecordFormProps {
  /**
   * Existing record for editing mode
   */
  record?: AttendanceRecord;
  /**
   * Mode: 'add', 'edit', or 'view'
   */
  mode?: 'add' | 'edit' | 'view';
  /**
   * Called when form is successfully submitted
   */
  onSuccess?: () => void;
  /**
   * Called when form is cancelled
   */
  onCancel?: () => void;
  /**
   * Pre-selected event ID
   */
  defaultEventId?: number;
  /**
   * Pre-selected date
   */
  defaultDate?: Date;
}

/**
 * Form component for creating and editing attendance records
 */
export const AttendanceRecordForm: React.FC<AttendanceRecordFormProps> = ({
  record,
  mode = 'add',
  onSuccess,
  onCancel,
  defaultEventId,
  defaultDate,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showNotification } = useNotification();
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const createAttendance = useCreateAttendance();
  const updateAttendance = useUpdateAttendance();

  const isEditing = Boolean(record);
  const isViewMode = mode === 'view';

  // Form setup with validation
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<AttendanceFormData>({
    defaultValues: {
      eventId: record?.eventId || defaultEventId || 0,
      date: record ? new Date(record.date) : defaultDate || new Date(),
      attendance: record?.attendance ?? null,
    },
  });

  // Watch for event changes to validate
  const watchedEventId = watch('eventId');

  // Reset form when record changes
  useEffect(() => {
    if (record) {
      reset({
        eventId: record.eventId,
        date: new Date(record.date),
        attendance: record.attendance,
      });
    }
  }, [record, reset]);

  const handleFormSubmit = async (data: AttendanceFormData) => {
    setIsSubmitting(true);

    try {
      if (isEditing && record) {
        const updateRequest: UpdateAttendanceRequest = {
          id: record.id,
          eventId: data.eventId,
          date: data.date.toISOString(),
          attendance: data.attendance ?? 0,
        };

        await updateAttendance.mutateAsync(updateRequest);
        showNotification('Attendance record updated successfully', 'success');
      } else {
        const createRequest: CreateAttendanceRequest = {
          eventId: data.eventId,
          date: data.date.toISOString(),
          attendance: data.attendance ?? 0,
        };

        await createAttendance.mutateAsync(createRequest);
        showNotification('Attendance record created successfully', 'success');

        // Reset form for new entry
        reset({
          eventId: data.eventId, // Keep same event selected
          date: new Date(),
          attendance: null,
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving attendance:', error);
      showNotification(
        `Failed to ${isEditing ? 'update' : 'create'} attendance record`,
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isEditing) {
      reset();
    }
    onCancel?.();
  };

  // Get selected event details
  const selectedEvent = events.find((event) => event.id === watchedEventId);

  /**
   * Determine if a date should be disabled based on event's DayOfWeek restriction
   * @param date - The date to check
   * @returns true if date should be disabled, false if allowed
   */
  const shouldDisableDate = (date: Date): boolean => {
    // If no event selected or event has no day restriction, allow all dates
    if (
      !selectedEvent ||
      selectedEvent.dayOfWeek === undefined ||
      selectedEvent.dayOfWeek === null
    ) {
      return false;
    }

    // Get day of week from date (0=Sunday, 6=Saturday)
    const dateDay = date.getDay();

    // Disable if date's day doesn't match event's required day
    return dateDay !== selectedEvent.dayOfWeek;
  };

  /**
   * Get helper text for date picker based on event's day restriction
   */
  const getDateHelperText = (): string => {
    if (errors.date?.message) {
      return errors.date.message;
    }

    if (
      selectedEvent &&
      selectedEvent.dayOfWeek !== undefined &&
      selectedEvent.dayOfWeek !== null
    ) {
      const dayNames = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      return `This event only allows ${dayNames[selectedEvent.dayOfWeek]}s`;
    }

    return 'Select the date of attendance';
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={enGB}>
      <Card>
        <CardHeader
          title={isEditing ? 'Edit Attendance Record' : 'Record New Attendance'}
          subheader={
            selectedEvent
              ? `Event: ${selectedEvent.name}`
              : 'Please select an event to continue'
          }
        />
        <CardContent>
          <Box component="form" onSubmit={handleSubmit(handleFormSubmit)}>
            <Stack spacing={3}>
              {/* Event Selection */}
              <Controller
                name="eventId"
                control={control}
                rules={{
                  required: 'Please select an event',
                  min: { value: 1, message: 'Please select an event' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Event"
                    error={!!errors.eventId}
                    helperText={errors.eventId?.message}
                    disabled={eventsLoading || isSubmitting || isViewMode}
                    required={!isViewMode}
                    fullWidth
                  >
                    <MenuItem value={0} disabled>
                      {eventsLoading ? 'Loading events...' : 'Select an event'}
                    </MenuItem>
                    {events.map((event) => (
                      <MenuItem key={event.id} value={event.id}>
                        {event.name}
                        {!event.isActive && ' (Inactive)'}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              {/* Date Selection */}
              <Controller
                name="date"
                control={control}
                rules={{ required: 'Please select a date' }}
                render={({ field: { value, onChange } }) => (
                  <DatePicker
                    label="Date"
                    value={value}
                    onChange={(date) => onChange(date || new Date())}
                    disabled={isSubmitting || isViewMode}
                    shouldDisableDate={shouldDisableDate}
                    slotProps={{
                      textField: {
                        error: !!errors.date,
                        helperText: getDateHelperText(),
                        required: !isViewMode,
                        fullWidth: true,
                      },
                    }}
                  />
                )}
              />

              {/* Attendance Count */}
              <Controller
                name="attendance"
                control={control}
                rules={{
                  required: 'Please enter attendance count',
                  min: { value: 0, message: 'Attendance cannot be negative' },
                  max: {
                    value: 9999,
                    message: 'Attendance seems too high, please verify',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    label="Attendance Count"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === '' ? null : Number(value));
                    }}
                    error={!!errors.attendance}
                    helperText={
                      errors.attendance?.message ||
                      'Enter the number of people who attended'
                    }
                    disabled={isSubmitting || isViewMode}
                    required={!isViewMode}
                    fullWidth
                    inputProps={{ min: 0, step: 1 }}
                  />
                )}
              />

              {/* Event Info */}
              {selectedEvent && (
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Event:</strong> {selectedEvent.name}
                    {selectedEvent.description && (
                      <>
                        <br />
                        <strong>Description:</strong>{' '}
                        {selectedEvent.description}
                      </>
                    )}
                  </Typography>
                </Alert>
              )}

              {/* Form Actions */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 2,
                  justifyContent: 'flex-end',
                  mt: 2,
                }}
              >
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  startIcon={<CancelIcon />}
                >
                  {isViewMode ? 'Close' : 'Cancel'}
                </Button>
                {!isViewMode && (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting || !isDirty || !selectedEvent}
                    startIcon={
                      isSubmitting ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SaveIcon />
                      )
                    }
                  >
                    {isSubmitting
                      ? isEditing
                        ? 'Updating...'
                        : 'Saving...'
                      : isEditing
                        ? 'Update Record'
                        : 'Save Record'}
                  </Button>
                )}
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
};

export default AttendanceRecordForm;
