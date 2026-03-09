/**
 * User Management Validation Schemas
 *
 * Yup validation schemas for add/edit user forms in the administration module.
 */
import * as yup from 'yup';

/** Common password complexity validation test */
const passwordComplexity = (label = 'Password') =>
  yup
    .string()
    .required(`${label} is required`)
    .min(8, `${label} must be at least 8 characters long`)
    .matches(
      /(?=.*[a-z])/,
      `${label} must contain at least one lowercase letter`
    )
    .matches(
      /(?=.*[A-Z])/,
      `${label} must contain at least one uppercase letter`
    )
    .matches(/(?=.*\d)/, `${label} must contain at least one number`);

/**
 * Schema for the add user form.
 */
export const addUserSchema = yup.object({
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
    .required('Email address is required')
    .email('Please enter a valid email address')
    .max(100, 'Email cannot exceed 100 characters'),
  jobTitle: yup
    .string()
    .max(100, 'Job title cannot exceed 100 characters')
    .optional()
    .nullable(),
  phoneNumber: yup
    .string()
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional()
    .nullable(),
  roles: yup
    .array()
    .of(yup.string().required())
    .min(1, 'Please assign at least one role')
    .required(),
  sendInvitationEmail: yup.boolean().required(),
});

/** Inferred TypeScript type from the add user schema */
export type AddUserFormValues = yup.InferType<typeof addUserSchema>;

/**
 * Schema for the edit user form.
 * Email is not editable, so it is excluded.
 */
export const editUserSchema = yup.object({
  firstName: yup
    .string()
    .required('First name is required')
    .max(50, 'First name cannot exceed 50 characters'),
  lastName: yup
    .string()
    .required('Last name is required')
    .max(50, 'Last name cannot exceed 50 characters'),
  jobTitle: yup
    .string()
    .max(100, 'Job title cannot exceed 100 characters')
    .optional()
    .nullable(),
  phoneNumber: yup
    .string()
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional()
    .nullable(),
  roles: yup
    .array()
    .of(yup.string().required())
    .min(1, 'Please assign at least one role')
    .required(),
});

/** Inferred TypeScript type from the edit user schema */
export type EditUserFormValues = yup.InferType<typeof editUserSchema>;

export { passwordComplexity };
