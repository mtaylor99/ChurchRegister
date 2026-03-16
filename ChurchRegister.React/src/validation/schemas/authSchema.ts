/**
 * Authentication Validation Schemas
 *
 * Yup validation schemas for login, change password, and reset password forms.
 */
import * as yup from 'yup';

/**
 * Schema for the login form.
 */
export const loginSchema = yup.object({
  email: yup
    .string()
    .required('Email address is required')
    .email('Please enter a valid email address'),
  password: yup.string().required('Password is required'),
  rememberMe: yup.boolean().optional(),
});

/** Inferred TypeScript type from the login schema */
export type LoginFormValues = yup.InferType<typeof loginSchema>;

/**
 * Schema for the change password form.
 * Enforces current password, plus new password complexity, plus confirmation matching.
 */
export const changePasswordSchema = yup.object({
  currentPassword: yup.string().required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      /(?=.*[a-z])/,
      'Password must contain at least one lowercase letter'
    )
    .matches(
      /(?=.*[A-Z])/,
      'Password must contain at least one uppercase letter'
    )
    .matches(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: yup
    .string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('newPassword')], 'Passwords do not match'),
});

/** Inferred TypeScript type from the change password schema */
export type ChangePasswordFormValues = yup.InferType<
  typeof changePasswordSchema
>;

/**
 * Schema for the request password reset form (enter email to receive reset link).
 */
export const requestPasswordResetSchema = yup.object({
  email: yup
    .string()
    .required('Email address is required')
    .email('Please enter a valid email address'),
});

/** Inferred TypeScript type from the request password reset schema */
export type RequestPasswordResetFormValues = yup.InferType<
  typeof requestPasswordResetSchema
>;

/**
 * Schema for the reset password form (set a new password using a reset token).
 */
export const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters long')
    .matches(
      /(?=.*[a-z])/,
      'Password must contain at least one lowercase letter'
    )
    .matches(
      /(?=.*[A-Z])/,
      'Password must contain at least one uppercase letter'
    )
    .matches(/(?=.*\d)/, 'Password must contain at least one number'),
  confirmPassword: yup
    .string()
    .required('Please confirm your new password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
});

/** Inferred TypeScript type from the reset password schema */
export type ResetPasswordFormValues = yup.InferType<typeof resetPasswordSchema>;
