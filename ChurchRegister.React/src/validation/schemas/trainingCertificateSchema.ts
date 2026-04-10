/**
 * Training Certificate Validation Schemas
 *
 * Yup validation schemas for training certificate and certificate type forms.
 */
import * as yup from 'yup';

/**
 * Schema for creating or editing a training certificate.
 */
export const trainingCertificateSchema = yup.object({
  churchMemberId: yup
    .number()
    .required('Please select a church member')
    .integer()
    .moreThan(0, 'Please select a church member'),
  trainingCertificateTypeId: yup
    .number()
    .required('Please select a certificate type')
    .integer()
    .moreThan(0, 'Please select a certificate type'),
  status: yup
    .string()
    .required('Status is required')
    .oneOf(
      ['Active', 'Pending', 'Expired', 'Revoked'],
      'Please select a valid status'
    ),
  expires: yup.date().nullable().optional(),
  notes: yup
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .nullable(),
});

/** Inferred TypeScript type from the training certificate schema */
export type TrainingCertificateFormValues = yup.InferType<
  typeof trainingCertificateSchema
>;

/**
 * Schema for creating or editing a training certificate type.
 */
export const trainingCertificateTypeSchema = yup.object({
  name: yup
    .string()
    .required('Certificate type name is required')
    .max(100, 'Name cannot exceed 100 characters'),
  description: yup
    .string()
    .max(300, 'Description cannot exceed 300 characters')
    .optional()
    .nullable(),
  requiresExpiry: yup.boolean().required(),
  defaultValidityMonths: yup
    .number()
    .integer()
    .min(1, 'Validity must be at least 1 month')
    .when('requiresExpiry', {
      is: true,
      then: (schema) =>
        schema.required('Default validity is required when expiry is enforced'),
      otherwise: (schema) => schema.optional().nullable(),
    }),
});

/** Inferred TypeScript type from the training certificate type schema */
export type TrainingCertificateTypeFormValues = yup.InferType<
  typeof trainingCertificateTypeSchema
>;
