/**
 * Runtime Type Guards
 *
 * Provides TypeScript type guards and Zod-based runtime validators for use
 * across the application. These guards enable safe type narrowing without
 * relying on `any` types.
 *
 * @example
 * ```typescript
 * import { isApiError, isString, safeParseJson } from '@utils/typeGuards';
 *
 * if (isApiError(error)) {
 *   console.error(error.message);
 * }
 * ```
 */

import { z } from 'zod';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from 'react';

// ---------------------------------------------------------------------------
// Primitive type guards
// ---------------------------------------------------------------------------

/** Returns true if the value is a non-null string */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/** Returns true if the value is a finite number (not NaN / Infinity) */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && isFinite(value);
}

/** Returns true if the value is a boolean */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/** Returns true if the value is a plain object (not null, not array) */
export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Returns true if the value is a non-empty string */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

/** Returns true if the value is null or undefined */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/** Returns true if the value is not null or undefined */
export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// ---------------------------------------------------------------------------
// API error type guards
// ---------------------------------------------------------------------------

/** Shape of a structured API error response */
export interface ApiErrorShape {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

/** Shape of an authentication error response from the auth service */
export interface AuthErrorShape {
  message?: string;
  errors?: string[];
  validationErrors?: Array<{ field?: string; message: string }>;
}

/** Type guard for AuthErrorShape */
export function isAuthError(value: unknown): value is AuthErrorShape {
  return (
    isPlainObject(value) &&
    (isString(value['message']) ||
      Array.isArray(value['errors']) ||
      Array.isArray(value['validationErrors']))
  );
}

/** Zod schema for API error response body */
const apiErrorSchema = z.object({
  message: z.string(),
  status: z.number().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

/**
 * Returns true if the value matches the expected API error shape.
 * Useful for narrowing errors thrown by the apiClient.
 */
export function isApiError(value: unknown): value is ApiErrorShape {
  return apiErrorSchema.safeParse(value).success;
}

/**
 * Extracts the user-facing error message from an unknown thrown value,
 * falling back to a generic default message.
 *
 * @param error - The caught error (unknown type)
 * @param fallback - Fallback message when no message can be extracted
 */
export function extractErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred'
): string {
  if (isString(error)) return error;
  if (error instanceof Error) return error.message;
  if (isPlainObject(error)) {
    if (isString(error['message'])) return error['message'];
    // Axios error with response data
    const responseData = error['response'];
    if (isPlainObject(responseData)) {
      const data = responseData['data'];
      if (isPlainObject(data)) {
        // Check both 'message' and 'error' fields used by different API endpoints
        if (isString(data['message'])) return data['message'];
        if (isString(data['error'])) return data['error'];
      }
    }
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Zod-based safe parsing helpers
// ---------------------------------------------------------------------------

/**
 * Safely parses a JSON string into a validated object using a Zod schema.
 * Returns `null` on parse failure instead of throwing.
 *
 * @param json - Raw JSON string
 * @param schema - Zod schema to validate against
 */
export function safeParseJson<T>(
  json: string,
  schema: z.ZodSchema<T>
): T | null {
  try {
    const parsed: unknown = JSON.parse(json);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Validates an unknown value against a Zod schema, returning the typed
 * result or `null` on validation failure (without throwing).
 *
 * @param value - Value to validate
 * @param schema - Zod schema to validate against
 */
export function safeValidate<T>(
  value: unknown,
  schema: z.ZodSchema<T>
): T | null {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}

// ---------------------------------------------------------------------------
// Domain-specific Zod schemas for runtime validation
// ---------------------------------------------------------------------------

/** Zod schema for a paginated result envelope */
export const pagedResultSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    totalCount: z.number(),
    page: z.number(),
    pageSize: z.number(),
    totalPages: z.number(),
  });

/** Zod schema for a church member summary (lightweight) */
export const churchMemberSummarySchema = z.object({
  id: z.number(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string().optional(),
  email: z.string().nullable().optional(),
  memberNumber: z.number().nullable().optional(),
});

/** Inferred TypeScript type from the church member summary schema */
export type ChurchMemberSummaryRuntime = z.infer<
  typeof churchMemberSummarySchema
>;

/** Zod schema for a basic user summary */
export const userSummarySchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  fullName: z.string().optional(),
  email: z.string(),
});

/** Inferred TypeScript type from the user summary schema */
export type UserSummaryRuntime = z.infer<typeof userSummarySchema>;

// ---------------------------------------------------------------------------
// Array helpers
// ---------------------------------------------------------------------------

/**
 * Filters an array in a type-safe way, narrowing each element.
 *
 * @example
 * const strings = filterWithGuard(mixedArray, isString);
 */
export function filterWithGuard<T>(
  array: unknown[],
  guard: (item: unknown) => item is T
): T[] {
  return array.filter(guard);
}

// ---------------------------------------------------------------------------
// Event type guards (Phase 8 — TASK-062)
// ---------------------------------------------------------------------------

/**
 * Returns true if the value is a native KeyboardEvent.
 * Useful for narrowing `React.SyntheticEvent | Event` unions.
 */
export function isKeyboardEvent(
  event: unknown
): event is KeyboardEvent | ReactKeyboardEvent {
  return (
    isPlainObject(event) &&
    'key' in event &&
    isString((event as Record<string, unknown>)['key'])
  );
}

/**
 * Returns true if a keyboard event's key matches one of the provided keys.
 *
 * @example
 * if (isKeyPress(event, 'Enter', ' ')) handleActivate();
 */
export function isKeyPress(
  event: KeyboardEvent | ReactKeyboardEvent,
  ...keys: string[]
): boolean {
  return keys.includes(event.key);
}

/**
 * Returns true if the value is a native MouseEvent.
 */
export function isMouseEvent(
  event: unknown
): event is MouseEvent | ReactMouseEvent {
  return (
    isPlainObject(event) &&
    'clientX' in event &&
    isNumber((event as Record<string, unknown>)['clientX'])
  );
}

/**
 * Returns true if a keyboard event represents an activation key
 * (Enter or Space — used for custom interactive elements).
 */
export function isActivationKey(
  event: KeyboardEvent | ReactKeyboardEvent
): boolean {
  return isKeyPress(event, 'Enter', ' ');
}

// ---------------------------------------------------------------------------
// API response Zod schemas (Phase 8 — TASK-061)
// ---------------------------------------------------------------------------

/**
 * Zod schema for a contribution summary returned from the API.
 */
export const contributionSummarySchema = z.object({
  id: z.number(),
  churchMemberId: z.number(),
  amount: z.number(),
  date: z.string(),
  description: z.string().nullable().optional(),
  bankReference: z.string().nullable().optional(),
});

export type ContributionSummaryRuntime = z.infer<
  typeof contributionSummarySchema
>;

/**
 * Zod schema for a reminder summary returned from the API.
 */
export const reminderSummarySchema = z.object({
  id: z.number(),
  description: z.string(),
  dueDate: z.string(),
  isCompleted: z.boolean(),
  priority: z.boolean(),
  assignedToUserId: z.string().nullable().optional(),
});

export type ReminderSummaryRuntime = z.infer<typeof reminderSummarySchema>;

/**
 * Zod schema for a risk assessment summary returned from the API.
 */
export const riskAssessmentSummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  categoryId: z.number(),
  reviewDate: z.string().nullable().optional(),
  isApproved: z.boolean(),
});

export type RiskAssessmentSummaryRuntime = z.infer<
  typeof riskAssessmentSummarySchema
>;

/**
 * Validates an API response array against a Zod schema, returning only
 * the items that pass validation and logging a warning for those that don't.
 * Prevents a single malformed item from breaking the entire list.
 *
 * @example
 * const members = validateApiArray(rawData, churchMemberSummarySchema);
 */
export function validateApiArray<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T[] {
  if (!Array.isArray(data)) return [];
  return data.reduce<T[]>((acc, item) => {
    const result = schema.safeParse(item);
    if (result.success) {
      acc.push(result.data);
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        '[validateApiArray] Item failed validation:',
        result.error.flatten()
      );
    }
    return acc;
  }, []);
}
