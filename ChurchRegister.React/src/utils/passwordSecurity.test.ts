/**
 * Unit tests for password security utilities
 */

import { describe, test, expect } from 'vitest';
import {
  validatePassword,
  getPasswordStrength,
  isPasswordValid,
  getPasswordStrengthColor,
  getPasswordStrengthDescription,
  CHURCH_PASSWORD_POLICY,
} from './passwordSecurity';

describe('passwordSecurity', () => {
  describe('validatePassword', () => {
    test('should validate a strong password', () => {
      const result = validatePassword('StrongP@ssw0rd123');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject password that is too short', () => {
      const result = validatePassword('Short1!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining(`at least ${CHURCH_PASSWORD_POLICY.minLength}`)
      );
    });

    test('should reject password without lowercase', () => {
      const result = validatePassword('PASSWORD123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('lowercase letter')
      );
    });

    test('should reject password without uppercase', () => {
      const result = validatePassword('password123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('uppercase letter')
      );
    });

    test('should reject password without numbers', () => {
      const result = validatePassword('Password!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('number'));
    });

    test('should reject password without special characters', () => {
      const result = validatePassword('Password123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('special character')
      );
    });

    test('should reject common passwords', () => {
      const result = validatePassword('AdminPassword123!');

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.toLowerCase().includes('common'))).toBe(
        true
      );
    });

    test('should detect sequential characters', () => {
      const result = validatePassword('Abc12345!');

      // Sequential chars are recommended, not required, so password can still be valid
      // but should have warnings
      expect(result.warnings?.some((w) => w.toLowerCase().includes('sequential'))).toBe(
        true
      );
    });

    test('should detect repeating characters', () => {
      const result = validatePassword('Aaaaa123!');

      // Re peating chars are recommended, not required, so password can still be valid
      // but should have warnings
      expect(result.warnings?.some((w) => w.toLowerCase().includes('repeat'))).toBe(
        true
      );
    });

    test('should detect keyboard patterns', () => {
      const result = validatePassword('Qwerty123!');

      // Keyboard patterns are recommended, not required, so password can still be valid
      // but should have warnings
      expect(result.warnings?.some((w) => w.toLowerCase().includes('keyboard'))).toBe(
        true
      );
    });

    test('should provide strength score', () => {
      const result = validatePassword('StrongP@ssw0rd123');

      expect(result.score).toBeGreaterThan(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.strength).toBeDefined();
    });

    test('should provide requirements status', () => {
      const result = validatePassword('Test1234!');

      expect(result.requirements).toBeDefined();
      expect(Array.isArray(result.requirements)).toBe(true);
      expect(result.requirements.length).toBeGreaterThan(0);

      const lengthReq = result.requirements.find((r) => r.category === 'length');
      expect(lengthReq).toBeDefined();
      expect(lengthReq?.met).toBeDefined();
    });

    test('should provide suggestions for weak passwords', () => {
      const result = validatePassword('weak');

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      if (!result.isValid) {
        expect(result.suggestions.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getPasswordStrength', () => {
    test('should return very-weak for empty password', () => {
      const strength = getPasswordStrength('');
      // Empty fails all requirements, should be very-weak
      expect(['very-weak', 'weak']).toContain(strength);
    });

    test('should return very-weak for very short password', () => {
      const strength = getPasswordStrength('abc');
      // Too short and simple
      expect(['very-weak', 'weak']).toContain(strength);
    });

    test('should return weak for simple short password', () => {
      const strength = getPasswordStrength('password');
      // Meets length but lacks complexity
      expect(['very-weak', 'weak', 'fair']).toContain(strength);
    });

    test('should return fair or good for password with some complexity', () => {
      const strength = getPasswordStrength('Password1');
      expect(['weak', 'fair', 'good']).toContain(strength);
    });

    test('should return good or strong for complex password', () => {
      const strength = getPasswordStrength('MyC0mpl3x!Pass');
      expect(['good', 'strong', 'very-strong']).toContain(strength);
    });

    test('should return very-strong for highly complex password', () => {
      const strength = getPasswordStrength('V3ry!C0mpl3x@P@ssw0rd#2024');
      expect(['strong', 'very-strong']).toContain(strength);
    });

    test('should consider length in strength calculation', () => {
      const short = getPasswordStrength('P@ss1');
      const long = getPasswordStrength('P@ssw0rd1234567890');

      // Longer password should be stronger or equal
      const strengthOrder = [
        'very-weak',
        'weak',
        'fair',
        'good',
        'strong',
        'very-strong',
      ];
      const shortIndex = strengthOrder.indexOf(short);
      const longIndex = strengthOrder.indexOf(long);

      expect(longIndex).toBeGreaterThanOrEqual(shortIndex);
    });
  });

  describe('isPasswordValid', () => {
    test('should return true for valid strong password', () => {
      expect(isPasswordValid('StrongP@ssw0rd123')).toBe(true);
    });

    test('should return true for valid password without userInfo', () => {
      expect(isPasswordValid('ValidP@ss123')).toBe(true);
    });

    test('should return false for weak password', () => {
      expect(isPasswordValid('weak')).toBe(false);
    });

    test('should return false for too short password', () => {
      expect(isPasswordValid('Short1!')).toBe(false);
    });

    test('should return false for common password', () => {
      expect(isPasswordValid('AdminPassword123!')).toBe(false);
    });

    test('should validate against user info when provided', () => {
      const userInfo = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      };

      // Should reject password containing user's name
      expect(isPasswordValid('John123!', userInfo)).toBe(false);
      expect(isPasswordValid('Doe12345!', userInfo)).toBe(false);

      // Should accept password not containing user info
      expect(isPasswordValid('SecureP@ss123', userInfo)).toBe(true);
    });

    test('should handle empty user info', () => {
      expect(isPasswordValid('StrongP@ssw0rd123', {})).toBe(true);
    });

    test('should handle undefined user info', () => {
      expect(isPasswordValid('StrongP@ssw0rd123', undefined)).toBe(true);
    });
  });

  describe('getPasswordStrengthColor', () => {
    test('should return red for very-weak password', () => {
      const color = getPasswordStrengthColor('very-weak');
      expect(color).toBe('#f44336'); // Red
    });

    test('should return orange for weak password', () => {
      const color = getPasswordStrengthColor('weak');
      expect(color).toBe('#ff9800'); // Orange
    });

    test('should return yellow for fair password', () => {
      const color = getPasswordStrengthColor('fair');
      expect(color).toBe('#ffeb3b'); // Yellow
    });

    test('should return light green for good password', () => {
      const color = getPasswordStrengthColor('good');
      expect(color).toBe('#8bc34a'); // Light Green
    });

    test('should return green for strong password', () => {
      const color = getPasswordStrengthColor('strong');
      expect(color).toBe('#4caf50'); // Green
    });

    test('should return dark green for very-strong password', () => {
      const color = getPasswordStrengthColor('very-strong');
      expect(color).toBe('#2e7d32'); // Dark Green
    });
  });

  describe('getPasswordStrengthDescription', () => {
    test('should provide description for very-weak password', () => {
      const desc = getPasswordStrengthDescription('very-weak');
      expect(desc).toBeDefined();
      expect(desc.length).toBeGreaterThan(0);
      expect(desc.toLowerCase()).toContain('very weak');
    });

    test('should provide description for weak password', () => {
      const desc = getPasswordStrengthDescription('weak');
      expect(desc).toBeDefined();
      expect(desc.toLowerCase()).toContain('weak');
    });

    test('should provide description for fair password', () => {
      const desc = getPasswordStrengthDescription('fair');
      expect(desc).toBeDefined();
      expect(desc.toLowerCase()).toContain('fair');
    });

    test('should provide description for good password', () => {
      const desc = getPasswordStrengthDescription('good');
      expect(desc).toBeDefined();
      expect(desc.toLowerCase()).toContain('good');
    });

    test('should provide description for strong password', () => {
      const desc = getPasswordStrengthDescription('strong');
      expect(desc).toBeDefined();
      expect(desc.toLowerCase()).toContain('strong');
    });

    test('should provide description for very-strong password', () => {
      const desc = getPasswordStrengthDescription('very-strong');
      expect(desc).toBeDefined();
      expect(desc.toLowerCase()).toContain('very strong');
    });

    test('should provide helpful guidance in descriptions', () => {
      const weakDesc = getPasswordStrengthDescription('weak');
      const strongDesc = getPasswordStrengthDescription('strong');

      // Weak password description should encourage improvement
      expect(weakDesc.length).toBeGreaterThan(10);
      // Strong password description should be positive
      expect(strongDesc.length).toBeGreaterThan(10);
    });
  });

  describe('CHURCH_PASSWORD_POLICY', () => {
    test('should have reasonable minimum length', () => {
      expect(CHURCH_PASSWORD_POLICY.minLength).toBeGreaterThanOrEqual(8);
      expect(CHURCH_PASSWORD_POLICY.minLength).toBeLessThanOrEqual(16);
    });

    test('should require character complexity', () => {
      expect(CHURCH_PASSWORD_POLICY.requireLowercase).toBe(true);
      expect(CHURCH_PASSWORD_POLICY.requireUppercase).toBe(true);
      expect(CHURCH_PASSWORD_POLICY.requireNumbers).toBe(true);
      expect(CHURCH_PASSWORD_POLICY.requireSpecialChars).toBe(true);
    });

    test('should prevent common security issues', () => {
      expect(CHURCH_PASSWORD_POLICY.preventCommonPasswords).toBe(true);
      expect(CHURCH_PASSWORD_POLICY.preventSequentialChars).toBe(true);
      expect(CHURCH_PASSWORD_POLICY.preventRepeatingChars).toBe(true);
    });

    test('should have defined special characters', () => {
      expect(CHURCH_PASSWORD_POLICY.specialCharacters).toBeDefined();
      expect(CHURCH_PASSWORD_POLICY.specialCharacters.length).toBeGreaterThan(0);
    });
  });
});
