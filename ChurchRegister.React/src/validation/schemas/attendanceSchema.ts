/**
 * Attendance Validation Schemas
 *
 * Yup validation schemas for attendance record forms.
 */
import * as yup from 'yup';

/**
 * Schema for creating or editing an attendance record.
 */
export const attendanceRecordSchema = yup.object({
  eventId: yup
    .number()
    .required('Please select an event')
    .integer()
    .moreThan(0, 'Please select an event'),
  date: yup.date().required('Date is required').nullable(),
  attendance: yup
    .number()
    .required('Attendance count is required')
    .integer('Attendance must be a whole number')
    .min(0, 'Attendance cannot be negative')
    .max(10000, 'Attendance count seems too high'),
});

/** Inferred TypeScript type from the attendance record schema */
export type AttendanceRecordFormValues = yup.InferType<
  typeof attendanceRecordSchema
>;

/**
 * Schema for creating a new event.
 */
export const createEventSchema = yup.object({
  name: yup
    .string()
    .required('Event name is required')
    .max(100, 'Event name cannot exceed 100 characters'),
  isActive: yup.boolean().required(),
});

/** Inferred TypeScript type from the create event schema */
export type CreateEventFormValues = yup.InferType<typeof createEventSchema>;
