/**
 * Contribution Validation Schemas
 *
 * Yup validation schemas for contribution-related forms including
 * one-off contributions and envelope batch submission.
 */
import * as yup from 'yup';

/**
 * Schema for adding a one-off manual contribution.
 */
export const addContributionSchema = yup.object({
  churchMemberId: yup
    .number()
    .required('Please select a church member')
    .integer()
    .moreThan(0, 'Please select a church member'),
  amount: yup
    .number()
    .required('Amount is required')
    .moreThan(0, 'Amount must be greater than 0')
    .max(999999.99, 'Amount cannot exceed £999,999.99'),
  date: yup.string().required('Date is required'),
  description: yup
    .string()
    .max(200, 'Description cannot exceed 200 characters')
    .optional()
    .nullable(),
});

/** Inferred TypeScript type from the add contribution schema */
export type AddContributionFormValues = yup.InferType<
  typeof addContributionSchema
>;

/**
 * Schema for an individual envelope contribution row in a batch submission.
 */
export const envelopeContributionRowSchema = yup.object({
  registerNumber: yup
    .number()
    .required('Register number is required')
    .integer()
    .moreThan(0, 'Register number must be positive'),
  amount: yup
    .number()
    .required('Amount is required')
    .moreThan(0, 'Amount must be greater than 0'),
});

/** Inferred TypeScript type from the envelope contribution row schema */
export type EnvelopeContributionRowFormValues = yup.InferType<
  typeof envelopeContributionRowSchema
>;
