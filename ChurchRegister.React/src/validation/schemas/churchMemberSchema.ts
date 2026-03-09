/**
 * Church Member Validation Schemas
 *
 * Yup validation schemas for church member add/edit forms.
 * These schemas centralise validation rules so forms and tests share the same source of truth.
 */
import * as yup from 'yup';

/** Shared address sub-schema */
const addressSchema = yup
  .object({
    street: yup
      .string()
      .max(100, 'Street cannot exceed 100 characters')
      .optional(),
    city: yup.string().max(50, 'City cannot exceed 50 characters').optional(),
    postcode: yup
      .string()
      .max(10, 'Postcode cannot exceed 10 characters')
      .matches(
        /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
        'Please enter a valid UK postcode'
      )
      .optional()
      .nullable(),
  })
  .optional()
  .nullable();

/**
 * Schema for the add church member form.
 * Validates required personal information plus optional contact/address fields.
 */
export const addChurchMemberSchema = yup.object({
  title: yup
    .string()
    .oneOf(['', 'Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Rev', 'Prof', 'Sir', 'Lady'])
    .optional()
    .nullable(),
  firstName: yup
    .string()
    .required('First name is required')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: yup
    .string()
    .required('Last name is required')
    .max(50, 'Last name cannot exceed 50 characters'),
  email: yup
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email cannot exceed 100 characters')
    .optional()
    .nullable(),
  phone: yup
    .string()
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional()
    .nullable(),
  bankReference: yup
    .string()
    .max(100, 'Bank reference cannot exceed 100 characters')
    .optional()
    .nullable(),
  memberNumber: yup.number().positive().integer().optional().nullable(),
  memberSince: yup
    .date()
    .required('Member since date is required')
    .max(new Date(), 'Member since date cannot be in the future'),
  statusId: yup.number().required('Status is required').integer().min(1),
  baptised: yup.boolean().required(),
  giftAid: yup.boolean().required(),
  envelopes: yup.boolean().required(),
  pastoralCareRequired: yup.boolean().required(),
  address: addressSchema,
  roleIds: yup.array().of(yup.number().integer().required()).required(),
});

/** Inferred TypeScript type from the add church member schema */
export type AddChurchMemberFormValues = yup.InferType<
  typeof addChurchMemberSchema
>;

/**
 * Schema for the edit church member form.
 * Same as add but all fields except identifiers can be updated.
 */
export const editChurchMemberSchema = addChurchMemberSchema;

/** Inferred TypeScript type from the edit church member schema */
export type EditChurchMemberFormValues = yup.InferType<
  typeof editChurchMemberSchema
>;
