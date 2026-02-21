/**
 * Utility functions for handling API error responses
 */

export interface ApiErrorResponse {
  message?: string;
  errors?: string[];
}

/**
 * Extract error messages from an API error response
 * Supports multiple error formats:
 * - { message: string, errors: string[] }
 * - { message: string }
 * - string
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractErrorMessages(error: any): string[] {
  if (!error) {
    return ['An unexpected error occurred.'];
  }

  // Check if it's an axios error with response data
  const responseData = error.response?.data;

  if (responseData) {
    // Handle format: { message: string, errors: string[] }
    if (responseData.errors && Array.isArray(responseData.errors)) {
      return responseData.errors;
    }

    // Handle format: { message: string }
    if (responseData.message) {
      return [responseData.message];
    }
  }

  // Handle error.message
  if (error.message) {
    return [error.message];
  }

  // Fallback
  return ['An unexpected error occurred.'];
}

/**
 * Get a single error message string from an error response
 * Joins multiple errors with line breaks
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrorMessage(error: any): string {
  const messages = extractErrorMessages(error);
  return messages.join('\n');
}

/**
 * Check if an error contains validation errors
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function hasValidationErrors(error: any): boolean {
  const responseData = error.response?.data;
  return !!(
    responseData?.errors &&
    Array.isArray(responseData.errors) &&
    responseData.errors.length > 0
  );
}
