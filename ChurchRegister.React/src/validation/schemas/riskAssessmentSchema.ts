/**
 * Risk Assessment Validation Schemas
 *
 * Yup validation schemas for risk assessment and risk assessment category forms.
 */
import * as yup from 'yup';

const REVIEW_INTERVAL_OPTIONS = [1, 2, 3, 5] as const;

/**
 * Schema for creating a new risk assessment.
 */
export const addRiskAssessmentSchema = yup.object({
  categoryId: yup
    .number()
    .required('Please select a category')
    .integer()
    .moreThan(0, 'Please select a category'),
  title: yup
    .string()
    .required('Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  description: yup
    .string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional()
    .nullable(),
  reviewInterval: yup
    .number()
    .required('Review interval is required')
    .integer()
    .oneOf(
      [...REVIEW_INTERVAL_OPTIONS],
      'Review interval must be 1, 2, 3, or 5 years'
    ),
  scope: yup
    .string()
    .max(500, 'Scope cannot exceed 500 characters')
    .optional()
    .nullable(),
  notes: yup
    .string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
    .nullable(),
});

/** Inferred TypeScript type from the add risk assessment schema */
export type AddRiskAssessmentFormValues = yup.InferType<
  typeof addRiskAssessmentSchema
>;

/**
 * Schema for editing an existing risk assessment.
 * Same rules as create.
 */
export const editRiskAssessmentSchema = addRiskAssessmentSchema;

/** Inferred TypeScript type from the edit risk assessment schema */
export type EditRiskAssessmentFormValues = yup.InferType<
  typeof editRiskAssessmentSchema
>;

/**
 * Schema for approving a risk assessment.
 */
export const approveRiskAssessmentSchema = yup.object({
  approvalNotes: yup
    .string()
    .max(500, 'Approval notes cannot exceed 500 characters')
    .optional()
    .nullable(),
});

/** Inferred TypeScript type from the approve risk assessment schema */
export type ApproveRiskAssessmentFormValues = yup.InferType<
  typeof approveRiskAssessmentSchema
>;

/**
 * Schema for creating/editing a risk assessment category.
 */
export const riskAssessmentCategorySchema = yup.object({
  name: yup
    .string()
    .required('Category name is required')
    .max(100, 'Category name cannot exceed 100 characters'),
  description: yup
    .string()
    .max(300, 'Description cannot exceed 300 characters')
    .optional()
    .nullable(),
});

/** Inferred TypeScript type from the risk assessment category schema */
export type RiskAssessmentCategoryFormValues = yup.InferType<
  typeof riskAssessmentCategorySchema
>;
