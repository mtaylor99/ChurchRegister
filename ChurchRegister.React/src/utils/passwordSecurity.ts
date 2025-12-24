/**
 * Enhanced Password Security Utility
 * Provides comprehensive password validation, strength assessment, and security features
 */

// Password strength levels
export type PasswordStrength =
  | 'very-weak'
  | 'weak'
  | 'fair'
  | 'good'
  | 'strong'
  | 'very-strong';

// Password validation result
export interface PasswordValidationResult {
  isValid: boolean;
  strength: PasswordStrength;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
  suggestions: string[];
  requirements: PasswordRequirement[];
}

// Individual password requirement
export interface PasswordRequirement {
  id: string;
  description: string;
  met: boolean;
  category: 'length' | 'character' | 'pattern' | 'security';
  severity: 'required' | 'recommended' | 'optional';
}

// Password policy configuration
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireLowercase: boolean;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  specialCharacters: string;
  preventCommonPasswords: boolean;
  preventUserInfo: boolean;
  preventSequentialChars: boolean;
  preventRepeatingChars: boolean;
  maxRepeatingChars: number;
  preventKeyboardPatterns: boolean;
  preventDictionaryWords: boolean;
  requireUniqueChars: number;
  historyCheck: boolean;
  maxPasswordAge: number; // days
}

// Default security policy (NIST/OWASP compliant)
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 12,
  maxLength: 128,
  requireLowercase: true,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  preventCommonPasswords: true,
  preventUserInfo: true,
  preventSequentialChars: true,
  preventRepeatingChars: true,
  maxRepeatingChars: 3,
  preventKeyboardPatterns: true,
  preventDictionaryWords: true,
  requireUniqueChars: 8,
  historyCheck: true,
  maxPasswordAge: 90,
};

// Church Register specific policy (balanced security and usability)
export const CHURCH_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireLowercase: true,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialCharacters: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  preventCommonPasswords: true,
  preventUserInfo: true,
  preventSequentialChars: true,
  preventRepeatingChars: true,
  maxRepeatingChars: 3,
  preventKeyboardPatterns: true,
  preventDictionaryWords: false, // More lenient for church members
  requireUniqueChars: 6,
  historyCheck: false, // Simplified for church use
  maxPasswordAge: 180, // 6 months
};

// Common weak passwords list (top 100 most common)
const COMMON_PASSWORDS = new Set([
  'password',
  '123456',
  '123456789',
  '12345678',
  '12345',
  '1234567',
  '1234567890',
  'qwerty',
  'abc123',
  'million2',
  '000000',
  '1234',
  'iloveyou',
  'aaron431',
  'password1',
  'qqww1122',
  '123123',
  'omgpop',
  '123321',
  '654321',
  'qwertyuiop',
  'qwer1234',
  '123abc',
  'password123',
  '1q2w3e4r',
  'admin',
  'pass',
  'p@ssw0rd',
  'welcome',
  'monkey',
  'dragon',
  'jesus',
  'welcome123',
  'master',
  'hello',
  'charlie',
  'aa123456',
  'donald',
  'password1234',
  'qwerty123',
]);

// Keyboard patterns to detect
const KEYBOARD_PATTERNS = [
  'qwerty',
  'qwertyui',
  'asdf',
  'asdfgh',
  'zxcv',
  'zxcvbn',
  '1234',
  '12345',
  '123456',
  '1234567',
  '12345678',
  '123456789',
  'abcd',
  'abcde',
  'abcdef',
  'abcdefg',
];

// Sequential character patterns
const SEQUENTIAL_PATTERNS = [
  'abcdefghijklmnopqrstuvwxyz',
  '0123456789',
  'qwertyuiopasdfghjklzxcvbnm',
];

/**
 * Enhanced password validation with comprehensive security checks
 */
export class PasswordValidator {
  private policy: PasswordPolicy;

  constructor(policy: PasswordPolicy = CHURCH_PASSWORD_POLICY) {
    this.policy = policy;
  }

  /**
   * Validate password against all security requirements
   */
  validatePassword(
    password: string,
    userInfo?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      displayName?: string;
    }
  ): PasswordValidationResult {
    const requirements = this.checkRequirements(password, userInfo);
    const strength = this.calculateStrength(password, requirements);
    const score = this.calculateScore(requirements);

    const errors = requirements
      .filter((req) => req.severity === 'required' && !req.met)
      .map((req) => req.description);

    const warnings = requirements
      .filter((req) => req.severity === 'recommended' && !req.met)
      .map((req) => req.description);

    const suggestions = this.generateSuggestions(requirements, password);

    return {
      isValid: errors.length === 0,
      strength,
      score,
      errors,
      warnings,
      suggestions,
      requirements,
    };
  }

  /**
   * Check all password requirements
   */
  private checkRequirements(
    password: string,
    userInfo?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      displayName?: string;
    }
  ): PasswordRequirement[] {
    const requirements: PasswordRequirement[] = [];

    // Length requirements
    requirements.push({
      id: 'min-length',
      description: `At least ${this.policy.minLength} characters`,
      met: password.length >= this.policy.minLength,
      category: 'length',
      severity: 'required',
    });

    requirements.push({
      id: 'max-length',
      description: `No more than ${this.policy.maxLength} characters`,
      met: password.length <= this.policy.maxLength,
      category: 'length',
      severity: 'required',
    });

    // Character requirements
    if (this.policy.requireLowercase) {
      requirements.push({
        id: 'lowercase',
        description: 'At least one lowercase letter (a-z)',
        met: /[a-z]/.test(password),
        category: 'character',
        severity: 'required',
      });
    }

    if (this.policy.requireUppercase) {
      requirements.push({
        id: 'uppercase',
        description: 'At least one uppercase letter (A-Z)',
        met: /[A-Z]/.test(password),
        category: 'character',
        severity: 'required',
      });
    }

    if (this.policy.requireNumbers) {
      requirements.push({
        id: 'numbers',
        description: 'At least one number (0-9)',
        met: /\d/.test(password),
        category: 'character',
        severity: 'required',
      });
    }

    if (this.policy.requireSpecialChars) {
      const specialCharsRegex = new RegExp(
        `[${this.escapeRegex(this.policy.specialCharacters)}]`
      );
      requirements.push({
        id: 'special-chars',
        description: `At least one special character (${this.policy.specialCharacters})`,
        met: specialCharsRegex.test(password),
        category: 'character',
        severity: 'required',
      });
    }

    // Unique characters requirement
    const uniqueChars = new Set(password).size;
    requirements.push({
      id: 'unique-chars',
      description: `At least ${this.policy.requireUniqueChars} unique characters`,
      met: uniqueChars >= this.policy.requireUniqueChars,
      category: 'character',
      severity: 'recommended',
    });

    // Security pattern checks
    if (this.policy.preventCommonPasswords) {
      requirements.push({
        id: 'not-common',
        description: 'Not a commonly used password',
        met: !this.isCommonPassword(password),
        category: 'security',
        severity: 'required',
      });
    }

    if (this.policy.preventUserInfo && userInfo) {
      requirements.push({
        id: 'no-user-info',
        description: 'Does not contain personal information',
        met: !this.containsUserInfo(password, userInfo),
        category: 'security',
        severity: 'required',
      });
    }

    if (this.policy.preventSequentialChars) {
      requirements.push({
        id: 'no-sequential',
        description: 'No sequential characters (abc, 123)',
        met: !this.hasSequentialChars(password),
        category: 'pattern',
        severity: 'recommended',
      });
    }

    if (this.policy.preventRepeatingChars) {
      requirements.push({
        id: 'no-repeating',
        description: `No more than ${this.policy.maxRepeatingChars} repeating characters`,
        met: !this.hasExcessiveRepeating(password),
        category: 'pattern',
        severity: 'recommended',
      });
    }

    if (this.policy.preventKeyboardPatterns) {
      requirements.push({
        id: 'no-keyboard-patterns',
        description: 'No keyboard patterns (qwerty, asdf)',
        met: !this.hasKeyboardPatterns(password),
        category: 'pattern',
        severity: 'recommended',
      });
    }

    return requirements;
  }

  /**
   * Calculate password strength based on requirements
   */
  private calculateStrength(
    _password: string,
    requirements: PasswordRequirement[]
  ): PasswordStrength {
    const score = this.calculateScore(requirements);

    if (score >= 90) return 'very-strong';
    if (score >= 80) return 'strong';
    if (score >= 70) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'weak';
    return 'very-weak';
  }

  /**
   * Calculate numerical score (0-100)
   */
  private calculateScore(requirements: PasswordRequirement[]): number {
    const totalRequirements = requirements.length;

    if (totalRequirements === 0) return 0;

    // Weight required vs recommended requirements
    const requiredWeight = 0.7;
    const recommendedWeight = 0.3;

    const requiredReqs = requirements.filter(
      (req) => req.severity === 'required'
    );
    const recommendedReqs = requirements.filter(
      (req) => req.severity === 'recommended'
    );

    const requiredScore =
      requiredReqs.length > 0
        ? (requiredReqs.filter((req) => req.met).length / requiredReqs.length) *
          100
        : 100;

    const recommendedScore =
      recommendedReqs.length > 0
        ? (recommendedReqs.filter((req) => req.met).length /
            recommendedReqs.length) *
          100
        : 100;

    return Math.round(
      requiredScore * requiredWeight + recommendedScore * recommendedWeight
    );
  }

  /**
   * Generate helpful suggestions for password improvement
   */
  private generateSuggestions(
    requirements: PasswordRequirement[],
    password: string
  ): string[] {
    const suggestions: string[] = [];
    const unmetRequired = requirements.filter(
      (req) => req.severity === 'required' && !req.met
    );

    if (unmetRequired.length > 0) {
      suggestions.push('Focus on meeting the required criteria first');
    }

    if (password.length < this.policy.minLength) {
      const needed = this.policy.minLength - password.length;
      suggestions.push(`Add ${needed} more character${needed > 1 ? 's' : ''}`);
    }

    if (!/[a-z]/.test(password) && this.policy.requireLowercase) {
      suggestions.push('Add lowercase letters');
    }

    if (!/[A-Z]/.test(password) && this.policy.requireUppercase) {
      suggestions.push('Add uppercase letters');
    }

    if (!/\d/.test(password) && this.policy.requireNumbers) {
      suggestions.push('Add numbers');
    }

    if (
      !new RegExp(`[${this.escapeRegex(this.policy.specialCharacters)}]`).test(
        password
      ) &&
      this.policy.requireSpecialChars
    ) {
      suggestions.push('Add special characters');
    }

    if (this.isCommonPassword(password)) {
      suggestions.push('Use a more unique password');
    }

    if (this.hasSequentialChars(password)) {
      suggestions.push('Avoid sequential characters like abc or 123');
    }

    if (this.hasKeyboardPatterns(password)) {
      suggestions.push('Avoid keyboard patterns like qwerty');
    }

    return suggestions;
  }

  /**
   * Check if password is in common passwords list
   */
  private isCommonPassword(password: string): boolean {
    return COMMON_PASSWORDS.has(password.toLowerCase());
  }

  /**
   * Check if password contains user information
   */
  private containsUserInfo(
    password: string,
    userInfo: {
      firstName?: string;
      lastName?: string;
      email?: string;
      displayName?: string;
    }
  ): boolean {
    const lowerPassword = password.toLowerCase();
    const { firstName, lastName, email, displayName } = userInfo;

    const infoToCheck = [
      firstName?.toLowerCase(),
      lastName?.toLowerCase(),
      displayName?.toLowerCase(),
      email?.toLowerCase().split('@')[0], // Username part of email
    ].filter(Boolean);

    return infoToCheck.some(
      (info) => info && info.length >= 3 && lowerPassword.includes(info)
    );
  }

  /**
   * Check for sequential characters
   */
  private hasSequentialChars(password: string): boolean {
    const lowerPassword = password.toLowerCase();

    for (const pattern of SEQUENTIAL_PATTERNS) {
      for (let i = 0; i <= pattern.length - 4; i++) {
        const sequence = pattern.slice(i, i + 4);
        const reverseSequence = sequence.split('').reverse().join('');

        if (
          lowerPassword.includes(sequence) ||
          lowerPassword.includes(reverseSequence)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for excessive repeating characters
   */
  private hasExcessiveRepeating(password: string): boolean {
    let count = 1;
    let prevChar = password[0];

    for (let i = 1; i < password.length; i++) {
      if (password[i] === prevChar) {
        count++;
        if (count > this.policy.maxRepeatingChars) {
          return true;
        }
      } else {
        count = 1;
        prevChar = password[i];
      }
    }

    return false;
  }

  /**
   * Check for keyboard patterns
   */
  private hasKeyboardPatterns(password: string): boolean {
    const lowerPassword = password.toLowerCase();

    return KEYBOARD_PATTERNS.some(
      (pattern) =>
        lowerPassword.includes(pattern) ||
        lowerPassword.includes(pattern.split('').reverse().join(''))
    );
  }

  /**
   * Escape special characters for regex
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Update password policy
   */
  updatePolicy(newPolicy: Partial<PasswordPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };
  }

  /**
   * Get current policy
   */
  getPolicy(): PasswordPolicy {
    return { ...this.policy };
  }
}

// Create default validator instance
export const passwordValidator = new PasswordValidator(CHURCH_PASSWORD_POLICY);

// Utility functions for common use cases
export const validatePassword = (
  password: string,
  userInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    displayName?: string;
  }
): PasswordValidationResult => {
  return passwordValidator.validatePassword(password, userInfo);
};

export const getPasswordStrength = (password: string): PasswordStrength => {
  return passwordValidator.validatePassword(password).strength;
};

export const isPasswordValid = (
  password: string,
  userInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    displayName?: string;
  }
): boolean => {
  return passwordValidator.validatePassword(password, userInfo).isValid;
};

// Password strength colors for UI
export const getPasswordStrengthColor = (
  strength: PasswordStrength
): string => {
  switch (strength) {
    case 'very-weak':
      return '#f44336'; // Red
    case 'weak':
      return '#ff9800'; // Orange
    case 'fair':
      return '#ffeb3b'; // Yellow
    case 'good':
      return '#8bc34a'; // Light Green
    case 'strong':
      return '#4caf50'; // Green
    case 'very-strong':
      return '#2e7d32'; // Dark Green
    default:
      return '#9e9e9e'; // Grey
  }
};

// Password strength descriptions
export const getPasswordStrengthDescription = (
  strength: PasswordStrength
): string => {
  switch (strength) {
    case 'very-weak':
      return 'Very Weak - Easily compromised';
    case 'weak':
      return 'Weak - May be vulnerable';
    case 'fair':
      return 'Fair - Basic security';
    case 'good':
      return 'Good - Secure for most uses';
    case 'strong':
      return 'Strong - Highly secure';
    case 'very-strong':
      return 'Very Strong - Maximum security';
    default:
      return 'Unknown';
  }
};
