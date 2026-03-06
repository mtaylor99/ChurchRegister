import { describe, test, expect } from 'vitest';
import { isValidEmail, generateReportEmailBody } from './emailService';

describe('emailService', () => {
  describe('isValidEmail', () => {
    test('accepts valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('first.last@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@test.org')).toBe(true);
    });

    test('rejects invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('missing@domain')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('spaces in@email.com')).toBe(false);
    });

    test('trims whitespace before validation', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true);
    });
  });

  describe('generateReportEmailBody', () => {
    test('includes event count in body', () => {
      const body = generateReportEmailBody(5);
      expect(body).toContain('5 events');
    });

    test('includes date in body', () => {
      const body = generateReportEmailBody(3);
      expect(body).toContain(new Date().toLocaleDateString());
    });

    test('is a non-empty string', () => {
      const body = generateReportEmailBody(1);
      expect(body.length).toBeGreaterThan(50);
    });
  });
});
