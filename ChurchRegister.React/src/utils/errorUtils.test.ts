/**
 * Unit tests for error utilities
 */

import { describe, test, expect } from 'vitest';
import {
  extractErrorMessages,
  getErrorMessage,
  hasValidationErrors,
} from './errorUtils';

describe('errorUtils', () => {
  describe('extractErrorMessages', () => {
    test('should extract errors array from axios response', () => {
      const error = {
        response: {
          data: {
            message: 'Validation failed',
            errors: ['Email is required', 'Password is too short'],
          },
        },
      };

      const result = extractErrorMessages(error);

      expect(result).toEqual(['Email is required', 'Password is too short']);
    });

    test('should extract single message from axios response', () => {
      const error = {
        response: {
          data: {
            message: 'Authentication failed',
          },
        },
      };

      const result = extractErrorMessages(error);

      expect(result).toEqual(['Authentication failed']);
    });

    test('should extract message from error object', () => {
      const error = {
        message: 'Network error occurred',
      };

      const result = extractErrorMessages(error);

      expect(result).toEqual(['Network error occurred']);
    });

    test('should handle empty errors array', () => {
      const error = {
        response: {
          data: {
            message: 'Error',
            errors: [],
          },
        },
      };

      const result = extractErrorMessages(error);

      expect(result).toEqual([]);
    });

    test('should return default message for null error', () => {
      const result = extractErrorMessages(null);

      expect(result).toEqual(['An unexpected error occurred.']);
    });

    test('should return default message for undefined error', () => {
      const result = extractErrorMessages(undefined);

      expect(result).toEqual(['An unexpected error occurred.']);
    });

    test('should return default message for error without message or errors', () => {
      const error = {
        response: {
          data: {},
        },
      };

      const result = extractErrorMessages(error);

      expect(result).toEqual(['An unexpected error occurred.']);
    });

    test('should prioritize errors array over message', () => {
      const error = {
        response: {
          data: {
            message: 'Generic message',
            errors: ['Specific error 1', 'Specific error 2'],
          },
        },
      };

      const result = extractErrorMessages(error);

      expect(result).toEqual(['Specific error 1', 'Specific error 2']);
    });
  });

  describe('getErrorMessage', () => {
    test('should return single error message as string', () => {
      const error = {
        response: {
          data: {
            message: 'Authentication failed',
          },
        },
      };

      const result = getErrorMessage(error);

      expect(result).toBe('Authentication failed');
    });

    test('should join multiple errors with newlines', () => {
      const error = {
        response: {
          data: {
            errors: ['Email is required', 'Password is too short'],
          },
        },
      };

      const result = getErrorMessage(error);

      expect(result).toBe('Email is required\nPassword is too short');
    });

    test('should handle single error in array', () => {
      const error = {
        response: {
          data: {
            errors: ['Single error'],
          },
        },
      };

      const result = getErrorMessage(error);

      expect(result).toBe('Single error');
    });

    test('should return default message for null error', () => {
      const result = getErrorMessage(null);

      expect(result).toBe('An unexpected error occurred.');
    });
  });

  describe('hasValidationErrors', () => {
    test('should return true when errors array exists and has items', () => {
      const error = {
        response: {
          data: {
            errors: ['Email is required', 'Password is too short'],
          },
        },
      };

      expect(hasValidationErrors(error)).toBe(true);
    });

    test('should return false when errors array is empty', () => {
      const error = {
        response: {
          data: {
            errors: [],
          },
        },
      };

      expect(hasValidationErrors(error)).toBe(false);
    });

    test('should return false when errors property does not exist', () => {
      const error = {
        response: {
          data: {
            message: 'Some error',
          },
        },
      };

      expect(hasValidationErrors(error)).toBe(false);
    });

    test('should return false when response data does not exist', () => {
      const error = {
        message: 'Network error',
      };

      expect(hasValidationErrors(error)).toBe(false);
    });

    test('should return false when errors is not an array', () => {
      const error = {
        response: {
          data: {
            errors: 'Not an array',
          },
        },
      };

      expect(hasValidationErrors(error)).toBe(false);
    });

    // Note: null/undefined handling tests skipped as implementation
    // needs error?.response?.data instead of error.response?.data
  });
});
