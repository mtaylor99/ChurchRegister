/**
 * Reminder Validation Schemas
 *
 * Yup validation schemas for reminder and reminder category forms.
 */
import * as yup from 'yup';

/**
 * Schema for creating a new reminder.
 */
export const createReminderSchema = yup.object({
  description: yup
    .string()
    .required('Description is required')
    .max(500, 'Description cannot exceed 500 characters'),
  dueDate: yup.date().required('Due date is required').nullable(),
  assignedToUserId: yup.string().required('Assigned to is required'),
  categoryId: yup.number().integer().nullable().optional(),
  priority: yup.boolean().required(),
});

/** Inferred TypeScript type from the create reminder schema */
export type CreateReminderFormValues = yup.InferType<
  typeof createReminderSchema
>;

/**
 * Schema for editing an existing reminder.
 * Same rules as create.
 */
export const editReminderSchema = createReminderSchema;

/** Inferred TypeScript type from the edit reminder schema */
export type EditReminderFormValues = yup.InferType<typeof editReminderSchema>;

/**
 * Schema for completing a reminder.
 */
export const completeReminderSchema = yup.object({
  completionNotes: yup
    .string()
    .max(1000, 'Completion notes cannot exceed 1000 characters')
    .optional()
    .nullable(),
  createNextReminder: yup.boolean().required(),
  nextReminderIntervalDays: yup
    .number()
    .integer()
    .min(1, 'Interval must be at least 1 day')
    .when('createNextReminder', {
      is: true,
      then: (schema) =>
        schema.required(
          'Interval days is required when creating a follow-up reminder'
        ),
      otherwise: (schema) => schema.optional().nullable(),
    }),
});

/** Inferred TypeScript type from the complete reminder schema */
export type CompleteReminderFormValues = yup.InferType<
  typeof completeReminderSchema
>;

/**
 * Schema for creating/editing a reminder category.
 */
export const reminderCategorySchema = yup.object({
  name: yup
    .string()
    .required('Category name is required')
    .max(100, 'Category name cannot exceed 100 characters'),
  description: yup
    .string()
    .max(300, 'Description cannot exceed 300 characters')
    .optional()
    .nullable(),
  sortOrder: yup
    .number()
    .integer()
    .min(0, 'Sort order must be 0 or greater')
    .required('Sort order is required'),
});

/** Inferred TypeScript type from the reminder category schema */
export type ReminderCategoryFormValues = yup.InferType<
  typeof reminderCategorySchema
>;
