/**
 * Unit tests for validation utilities
 */

import { describe, test, expect } from 'vitest';
import {
  isValidEmail,
  isValidUKPhone,
  isValidUKPostcode,
  isRequired,
  minLength,
  maxLength,
  isNumeric,
  isPositiveNumber,
  isNonNegativeNumber,
  isNotFutureDate,
  isNotPastDate,
  isValidCurrencyAmount,
  isValidBankReference,
  validate,
} from './validation';

describe('validation utilities', () => {
  describe('isValidEmail', () => {
    test('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('firstname+lastname@example.org')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('user name@example.com')).toBe(false);
    });
  });

  describe('isValidUKPhone', () => {
    test('should validate correct UK phone numbers', () => {
      expect(isValidUKPhone('07700900123')).toBe(true);
      expect(isValidUKPhone('0770 090 0123')).toBe(true);
      expect(isValidUKPhone('+447700900123')).toBe(true);
      expect(isValidUKPhone('+44 7700 900123')).toBe(true);
      expect(isValidUKPhone('02071234567')).toBe(true);
    });

    test('should reject invalid UK phone numbers', () => {
      expect(isValidUKPhone('12345')).toBe(false);
      expect(isValidUKPhone('invalid')).toBe(false);
      expect(isValidUKPhone('')).toBe(false);
      expect(isValidUKPhone('123456789012345')).toBe(false);
    });
  });

  describe('isValidUKPostcode', () => {
    test('should validate correct UK postcodes', () => {
      expect(isValidUKPostcode('SW1A 1AA')).toBe(true);
      expect(isValidUKPostcode('M1 1AA')).toBe(true);
      expect(isValidUKPostcode('B33 8TH')).toBe(true);
      expect(isValidUKPostcode('CR2 6XH')).toBe(true);
      expect(isValidUKPostcode('DN55 1PT')).toBe(true);
      expect(isValidUKPostcode('W1A 0AX')).toBe(true);
      expect(isValidUKPostcode('EC1A 1BB')).toBe(true);
    });

    test('should accept postcodes without spaces', () => {
      expect(isValidUKPostcode('SW1A1AA')).toBe(true);
      expect(isValidUKPostcode('M11AA')).toBe(true);
    });

    test('should be case insensitive', () => {
      expect(isValidUKPostcode('sw1a 1aa')).toBe(true);
      expect(isValidUKPostcode('Sw1A 1Aa')).toBe(true);
    });

    test('should reject invalid UK postcodes', () => {
      expect(isValidUKPostcode('INVALID')).toBe(false);
      expect(isValidUKPostcode('12345')).toBe(false);
      expect(isValidUKPostcode('')).toBe(false);
      expect(isValidUKPostcode('A1')).toBe(false);
    });
  });

  describe('isRequired', () => {
    test('should return true for non-empty values', () => {
      expect(isRequired('text')).toBe(true);
      expect(isRequired('a')).toBe(true);
      expect(isRequired(123)).toBe(true);
      expect(isRequired(0)).toBe(true);
      expect(isRequired(false)).toBe(true);
      expect(isRequired(['item'])).toBe(true);
      expect(isRequired({ key: 'value' })).toBe(true);
    });

    test('should return false for empty values', () => {
      expect(isRequired('')).toBe(false);
      expect(isRequired('   ')).toBe(false);
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
      expect(isRequired([])).toBe(false);
    });
  });

  describe('minLength', () => {
    test('should validate strings meeting minimum length', () => {
      expect(minLength('hello', 3)).toBe(true);
      expect(minLength('hello', 5)).toBe(true);
      expect(minLength('hello world', 5)).toBe(true);
    });

    test('should reject strings below minimum length', () => {
      expect(minLength('hi', 3)).toBe(false);
      expect(minLength('', 1)).toBe(false);
      expect(minLength('   ', 3)).toBe(false);
    });

    test('should trim whitespace', () => {
      expect(minLength('  hello  ', 5)).toBe(true);
      expect(minLength('  hi  ', 5)).toBe(false);
    });
  });

  describe('maxLength', () => {
    test('should validate strings within maximum length', () => {
      expect(maxLength('hello', 10)).toBe(true);
      expect(maxLength('hello', 5)).toBe(true);
      expect(maxLength('', 5)).toBe(true);
    });

    test('should reject strings exceeding maximum length', () => {
      expect(maxLength('hello world', 5)).toBe(false);
      expect(maxLength('this is a long string', 10)).toBe(false);
    });

    test('should trim whitespace', () => {
      expect(maxLength('  hello  ', 5)).toBe(true);
      expect(maxLength('  hello world  ', 5)).toBe(false);
    });
  });

  describe('isNumeric', () => {
    test('should validate numeric strings', () => {
      expect(isNumeric('123')).toBe(true);
      expect(isNumeric('0')).toBe(true);
      expect(isNumeric('123.45')).toBe(true);
      expect(isNumeric('-42')).toBe(true);
      expect(isNumeric('0.5')).toBe(true);
    });

    test('should reject non-numeric strings', () => {
      expect(isNumeric('abc')).toBe(false);
      expect(isNumeric('12abc')).toBe(false);
      expect(isNumeric('')).toBe(false);
      expect(isNumeric('12.34.56')).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    test('should validate positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(0.1)).toBe(true);
      expect(isPositiveNumber(999999)).toBe(true);
    });

    test('should reject zero and negative numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(-0.1)).toBe(false);
    });
  });

  describe('isNonNegativeNumber', () => {
    test('should validate non-negative numbers', () => {
      expect(isNonNegativeNumber(0)).toBe(true);
      expect(isNonNegativeNumber(1)).toBe(true);
      expect(isNonNegativeNumber(0.1)).toBe(true);
      expect(isNonNegativeNumber(999999)).toBe(true);
    });

    test('should reject negative numbers', () => {
      expect(isNonNegativeNumber(-1)).toBe(false);
      expect(isNonNegativeNumber(-0.1)).toBe(false);
    });
  });

  describe('isNotFutureDate', () => {
    test('should validate dates not in the future', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastYear = new Date(today);
      lastYear.setFullYear(lastYear.getFullYear() - 1);

      expect(isNotFutureDate(today)).toBe(true);
      expect(isNotFutureDate(yesterday)).toBe(true);
      expect(isNotFutureDate(lastYear)).toBe(true);
    });

    test('should reject future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      expect(isNotFutureDate(tomorrow)).toBe(false);
      expect(isNotFutureDate(nextYear)).toBe(false);
    });
  });

  describe('isNotPastDate', () => {
    test('should validate dates not in the past', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      expect(isNotPastDate(today)).toBe(true);
      expect(isNotPastDate(tomorrow)).toBe(true);
      expect(isNotPastDate(nextYear)).toBe(true);
    });

    test('should reject past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);

      expect(isNotPastDate(yesterday)).toBe(false);
      expect(isNotPastDate(lastYear)).toBe(false);
    });
  });

  describe('isValidCurrencyAmount', () => {
    test('should validate correct currency amounts', () => {
      expect(isValidCurrencyAmount('10')).toBe(true);
      expect(isValidCurrencyAmount('10.5')).toBe(true);
      expect(isValidCurrencyAmount('10.50')).toBe(true);
      expect(isValidCurrencyAmount('0.99')).toBe(true);
      expect(isValidCurrencyAmount('1000.00')).toBe(true);
      expect(isValidCurrencyAmount('0')).toBe(true);
    });

    test('should reject invalid currency amounts', () => {
      expect(isValidCurrencyAmount('10.123')).toBe(false);
      expect(isValidCurrencyAmount('abc')).toBe(false);
      expect(isValidCurrencyAmount('10.5.5')).toBe(false);
      expect(isValidCurrencyAmount('')).toBe(false);
      expect(isValidCurrencyAmount('-10')).toBe(false);
    });
  });

  describe('isValidBankReference', () => {
    test('should validate correct bank references', () => {
      expect(isValidBankReference('REF123')).toBe(true);
      expect(isValidBankReference('ABC-123')).toBe(true);
      expect(isValidBankReference('12345')).toBe(true);
      expect(isValidBankReference('REF-ABC-123')).toBe(true);
    });

    test('should reject invalid bank references', () => {
      expect(isValidBankReference('REF 123')).toBe(false);
      expect(isValidBankReference('REF@123')).toBe(false);
      expect(isValidBankReference('REF#123')).toBe(false);
      expect(isValidBankReference('')).toBe(false);
      expect(isValidBankReference('REF_123')).toBe(false);
    });
  });

  describe('validate', () => {
    test('should return valid result for passing validation', () => {
      const result = validate('test@example.com', [
        { fn: isValidEmail, message: 'Invalid email' },
      ]);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should return error for failing validation', () => {
      const result = validate('invalid-email', [
        { fn: isValidEmail, message: 'Invalid email' },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid email');
    });

    test('should stop at first failing validation', () => {
      const result = validate('hi', [
        { fn: (value: any) => minLength(value, 5), message: 'Too short' },
        { fn: (value: any) => maxLength(value, 10), message: 'Too long' },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Too short');
    });

    test('should pass all validations', () => {
      const result = validate('hello', [
        { fn: isRequired, message: 'Required' },
        { fn: (value: any) => minLength(value, 3), message: 'Too short' },
        { fn: (value: any) => maxLength(value, 10), message: 'Too long' },
      ]);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should handle empty validation rules', () => {
      const result = validate('any value', []);

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });
});
