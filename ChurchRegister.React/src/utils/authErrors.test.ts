import { describe, test, expect } from 'vitest';
import {
  AUTH_ERROR_CODES,
  AUTH_ERROR_MESSAGES,
  getAuthErrorCode,
  getAuthErrorMessage,
  formatValidationErrors,
  requiresUserAction,
  isRecoverableError,
  getRetryDelay,
} from './authErrors';

describe('authErrors', () => {
  describe('AUTH_ERROR_CODES', () => {
    test('has login error codes', () => {
      expect(AUTH_ERROR_CODES.INVALID_CREDENTIALS).toBe('AUTH_001');
      expect(AUTH_ERROR_CODES.ACCOUNT_LOCKED).toBe('AUTH_002');
      expect(AUTH_ERROR_CODES.ACCOUNT_SUSPENDED).toBe('AUTH_003');
      expect(AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED).toBe('AUTH_004');
    });

    test('has registration error codes', () => {
      expect(AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS).toBe('REG_001');
      expect(AUTH_ERROR_CODES.WEAK_PASSWORD).toBe('REG_002');
      expect(AUTH_ERROR_CODES.PASSWORD_MISMATCH).toBe('REG_005');
    });

    test('has password reset error codes', () => {
      expect(AUTH_ERROR_CODES.INVALID_RESET_TOKEN).toBe('PWD_001');
      expect(AUTH_ERROR_CODES.RESET_TOKEN_EXPIRED).toBe('PWD_002');
    });

    test('has general error codes', () => {
      expect(AUTH_ERROR_CODES.NETWORK_ERROR).toBe('NET_001');
      expect(AUTH_ERROR_CODES.SERVER_ERROR).toBe('SRV_001');
      expect(AUTH_ERROR_CODES.RATE_LIMITED).toBe('RATE_001');
      expect(AUTH_ERROR_CODES.MAINTENANCE_MODE).toBe('MAINT_001');
    });
  });

  describe('AUTH_ERROR_MESSAGES', () => {
    test('has message for each defined code', () => {
      // Not all codes need messages, but key ones should exist
      expect(
        AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.INVALID_CREDENTIALS]
      ).toBeDefined();
      expect(AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.ACCOUNT_LOCKED]).toBeDefined();
      expect(AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.NETWORK_ERROR]).toBeDefined();
      expect(AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.SERVER_ERROR]).toBeDefined();
    });

    test('messages have required fields', () => {
      const msg = AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.INVALID_CREDENTIALS];
      expect(msg.title).toBeDefined();
      expect(msg.message).toBeDefined();
      expect(msg.severity).toBe('error');
    });

    test('account locked message has warning severity', () => {
      const msg = AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.ACCOUNT_LOCKED];
      expect(msg.severity).toBe('warning');
    });

    test('email not confirmed has info severity', () => {
      const msg = AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED];
      expect(msg.severity).toBe('info');
    });

    test('messages include user actions where appropriate', () => {
      const msg = AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.INVALID_CREDENTIALS];
      expect(msg.userActions).toBeDefined();
      expect(msg.userActions!.length).toBeGreaterThan(0);
    });

    test('some messages include support actions', () => {
      const msg = AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.ACCOUNT_LOCKED];
      expect(msg.supportActions).toBeDefined();
      expect(msg.supportActions!.length).toBeGreaterThan(0);
    });
  });

  describe('getAuthErrorCode', () => {
    test('maps "invalid" string to INVALID_CREDENTIALS', () => {
      expect(getAuthErrorCode('Invalid password')).toBe(
        AUTH_ERROR_CODES.INVALID_CREDENTIALS
      );
    });

    test('maps "incorrect" string to INVALID_CREDENTIALS', () => {
      expect(getAuthErrorCode('Incorrect login')).toBe(
        AUTH_ERROR_CODES.INVALID_CREDENTIALS
      );
    });

    test('maps "locked" string to ACCOUNT_LOCKED', () => {
      expect(getAuthErrorCode('Account locked')).toBe(
        AUTH_ERROR_CODES.ACCOUNT_LOCKED
      );
    });

    test('maps "suspended" string to ACCOUNT_SUSPENDED', () => {
      expect(getAuthErrorCode('Account suspended by admin')).toBe(
        AUTH_ERROR_CODES.ACCOUNT_SUSPENDED
      );
    });

    test('maps email confirmed string', () => {
      expect(getAuthErrorCode('email not confirmed')).toBe(
        AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED
      );
    });

    test('maps email exists string', () => {
      expect(getAuthErrorCode('email already exists')).toBe(
        AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS
      );
    });

    test('maps weak password string', () => {
      expect(getAuthErrorCode('password too weak')).toBe(
        AUTH_ERROR_CODES.WEAK_PASSWORD
      );
    });

    test('maps network error string', () => {
      expect(getAuthErrorCode('network error')).toBe(
        AUTH_ERROR_CODES.NETWORK_ERROR
      );
    });

    test('maps connection error string', () => {
      expect(getAuthErrorCode('connection failed')).toBe(
        AUTH_ERROR_CODES.NETWORK_ERROR
      );
    });

    test('maps rate limited string', () => {
      expect(getAuthErrorCode('too many requests')).toBe(
        AUTH_ERROR_CODES.RATE_LIMITED
      );
    });

    test('maps maintenance string', () => {
      expect(getAuthErrorCode('system maintenance')).toBe(
        AUTH_ERROR_CODES.MAINTENANCE_MODE
      );
    });

    test('falls back to SERVER_ERROR for unknown string', () => {
      expect(getAuthErrorCode('something weird happened')).toBe(
        AUTH_ERROR_CODES.SERVER_ERROR
      );
    });

    test('handles Error objects', () => {
      expect(getAuthErrorCode(new Error('Invalid credentials'))).toBe(
        AUTH_ERROR_CODES.INVALID_CREDENTIALS
      );
    });

    test('handles AuthError objects with code', () => {
      const authError = {
        code: 'CUSTOM_CODE',
        message: 'some message',
        errors: [],
      };
      expect(getAuthErrorCode(authError as any)).toBe('CUSTOM_CODE');
    });

    test('handles AuthError objects without code', () => {
      const authError = { message: 'Account locked', errors: [] };
      expect(getAuthErrorCode(authError as any)).toBe(
        AUTH_ERROR_CODES.ACCOUNT_LOCKED
      );
    });
  });

  describe('getAuthErrorMessage', () => {
    test('returns correct message for string error', () => {
      const msg = getAuthErrorMessage('Invalid password');
      expect(msg.title).toBe('Invalid Login Credentials');
    });

    test('returns server error message for unknown errors', () => {
      const msg = getAuthErrorMessage('xyz unknown');
      expect(msg.title).toBe('Server Error');
    });

    test('returns message with all required fields', () => {
      const msg = getAuthErrorMessage('network error');
      expect(msg.title).toBeDefined();
      expect(msg.message).toBeDefined();
      expect(msg.severity).toBeDefined();
    });
  });

  describe('formatValidationErrors', () => {
    test('formats field name with capitalization', () => {
      const errors = [{ field: 'email', message: 'is required', code: 'REQUIRED' }];
      expect(formatValidationErrors(errors)).toEqual(['Email: is required']);
    });

    test('handles multiple errors', () => {
      const errors = [
        { field: 'email', message: 'is required', code: 'REQUIRED' },
        { field: 'password', message: 'too short', code: 'MIN_LENGTH' },
      ];
      const result = formatValidationErrors(errors);
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Email: is required');
      expect(result[1]).toBe('Password: too short');
    });

    test('handles empty array', () => {
      expect(formatValidationErrors([])).toEqual([]);
    });
  });

  describe('requiresUserAction', () => {
    test('returns true for invalid credentials', () => {
      expect(requiresUserAction(AUTH_ERROR_CODES.INVALID_CREDENTIALS)).toBe(
        true
      );
    });

    test('returns true for network error', () => {
      expect(requiresUserAction(AUTH_ERROR_CODES.NETWORK_ERROR)).toBe(true);
    });

    test('returns true for rate limited', () => {
      expect(requiresUserAction(AUTH_ERROR_CODES.RATE_LIMITED)).toBe(true);
    });

    test('returns false for account suspended', () => {
      expect(requiresUserAction(AUTH_ERROR_CODES.ACCOUNT_SUSPENDED)).toBe(
        false
      );
    });

    test('returns false for server error', () => {
      expect(requiresUserAction(AUTH_ERROR_CODES.SERVER_ERROR)).toBe(false);
    });
  });

  describe('isRecoverableError', () => {
    test('returns true for invalid credentials', () => {
      expect(isRecoverableError(AUTH_ERROR_CODES.INVALID_CREDENTIALS)).toBe(
        true
      );
    });

    test('returns true for network error', () => {
      expect(isRecoverableError(AUTH_ERROR_CODES.NETWORK_ERROR)).toBe(true);
    });

    test('returns false for account suspended', () => {
      expect(isRecoverableError(AUTH_ERROR_CODES.ACCOUNT_SUSPENDED)).toBe(
        false
      );
    });

    test('returns false for server error', () => {
      expect(isRecoverableError(AUTH_ERROR_CODES.SERVER_ERROR)).toBe(false);
    });

    test('returns false for unknown code', () => {
      expect(isRecoverableError('UNKNOWN_CODE')).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    test('returns 15 minutes for account locked', () => {
      expect(getRetryDelay(AUTH_ERROR_CODES.ACCOUNT_LOCKED)).toBe(
        15 * 60 * 1000
      );
    });

    test('returns 5 minutes for rate limited', () => {
      expect(getRetryDelay(AUTH_ERROR_CODES.RATE_LIMITED)).toBe(
        5 * 60 * 1000
      );
    });

    test('returns 30 seconds for network error', () => {
      expect(getRetryDelay(AUTH_ERROR_CODES.NETWORK_ERROR)).toBe(30 * 1000);
    });

    test('returns 0 for other errors', () => {
      expect(getRetryDelay(AUTH_ERROR_CODES.SERVER_ERROR)).toBe(0);
      expect(getRetryDelay(AUTH_ERROR_CODES.INVALID_CREDENTIALS)).toBe(0);
    });
  });
});
