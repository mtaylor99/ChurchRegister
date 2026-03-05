/**
 * Validation Schemas Barrel Export
 *
 * Centralised Yup schemas for all form validation in the ChurchRegister application.
 * Import schemas from this file for consistent use across forms and tests.
 *
 * @example
 * ```typescript
 * import { addChurchMemberSchema, loginSchema } from '@validation/schemas';
 * // or using the @validation alias:
 * import { addChurchMemberSchema } from '@validation';
 * ```
 */

// Church Member schemas
export {
  addChurchMemberSchema,
  editChurchMemberSchema,
} from './churchMemberSchema';
export type {
  AddChurchMemberFormValues,
  EditChurchMemberFormValues,
} from './churchMemberSchema';

// Contribution schemas
export {
  addContributionSchema,
  envelopeContributionRowSchema,
} from './contributionSchema';
export type {
  AddContributionFormValues,
  EnvelopeContributionRowFormValues,
} from './contributionSchema';

// User management schemas
export {
  addUserSchema,
  editUserSchema,
  passwordComplexity,
} from './userSchema';
export type { AddUserFormValues, EditUserFormValues } from './userSchema';

// Authentication schemas
export {
  loginSchema,
  changePasswordSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
} from './authSchema';
export type {
  LoginFormValues,
  ChangePasswordFormValues,
  RequestPasswordResetFormValues,
  ResetPasswordFormValues,
} from './authSchema';

// Attendance schemas
export { attendanceRecordSchema, createEventSchema } from './attendanceSchema';
export type {
  AttendanceRecordFormValues,
  CreateEventFormValues,
} from './attendanceSchema';

// Reminder schemas
export {
  createReminderSchema,
  editReminderSchema,
  completeReminderSchema,
  reminderCategorySchema,
} from './reminderSchema';
export type {
  CreateReminderFormValues,
  EditReminderFormValues,
  CompleteReminderFormValues,
  ReminderCategoryFormValues,
} from './reminderSchema';

// Risk Assessment schemas
export {
  addRiskAssessmentSchema,
  editRiskAssessmentSchema,
  approveRiskAssessmentSchema,
  riskAssessmentCategorySchema,
} from './riskAssessmentSchema';
export type {
  AddRiskAssessmentFormValues,
  EditRiskAssessmentFormValues,
  ApproveRiskAssessmentFormValues,
  RiskAssessmentCategoryFormValues,
} from './riskAssessmentSchema';

// Training Certificate schemas
export {
  trainingCertificateSchema,
  trainingCertificateTypeSchema,
} from './trainingCertificateSchema';
export type {
  TrainingCertificateFormValues,
  TrainingCertificateTypeFormValues,
} from './trainingCertificateSchema';
