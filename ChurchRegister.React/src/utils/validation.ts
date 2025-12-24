/**
 * Common validation helpers for form inputs and data validation
 */

/**
 * Email validation using regex
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * UK phone number validation (allows various formats)
 */
export const isValidUKPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+44\s?|0)(\d\s?){9,10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Postcode validation (UK format)
 */
export const isValidUKPostcode = (postcode: string): boolean => {
  const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
  return postcodeRegex.test(postcode);
};

/**
 * Required field validation
 */
export const isRequired = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Min length validation
 */
export const minLength = (value: string, min: number): boolean => {
  return value.trim().length >= min;
};

/**
 * Max length validation
 */
export const maxLength = (value: string, max: number): boolean => {
  return value.trim().length <= max;
};

/**
 * Numeric validation
 */
export const isNumeric = (value: string): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(Number(value));
};

/**
 * Positive number validation
 */
export const isPositiveNumber = (value: number): boolean => {
  return value > 0;
};

/**
 * Non-negative number validation
 */
export const isNonNegativeNumber = (value: number): boolean => {
  return value >= 0;
};

/**
 * Date validation (not in future)
 */
export const isNotFutureDate = (date: Date): boolean => {
  return date <= new Date();
};

/**
 * Date validation (not in past)
 */
export const isNotPastDate = (date: Date): boolean => {
  return date >= new Date();
};

/**
 * Currency amount validation (max 2 decimal places)
 */
export const isValidCurrencyAmount = (amount: string): boolean => {
  const currencyRegex = /^\d+(\.\d{1,2})?$/;
  return currencyRegex.test(amount);
};

/**
 * Bank reference validation (alphanumeric with hyphens)
 */
export const isValidBankReference = (reference: string): boolean => {
  const referenceRegex = /^[A-Za-z0-9-]+$/;
  return referenceRegex.test(reference) && reference.length <= 100;
};

/**
 * Register number validation (numeric string)
 */
export const isValidRegisterNumber = (number: string): boolean => {
  return /^\d+$/.test(number) && number.length <= 10;
};

/**
 * Get error message for validation type
 */
export const getValidationMessage = (
  field: string,
  validationType: string,
  value?: unknown
): string => {
  switch (validationType) {
    case 'required':
      return `${field} is required.`;
    case 'email':
      return `Please enter a valid email address.`;
    case 'phone':
      return `Please enter a valid UK phone number.`;
    case 'postcode':
      return `Please enter a valid UK postcode.`;
    case 'minLength':
      return `${field} must be at least ${value} characters.`;
    case 'maxLength':
      return `${field} must not exceed ${value} characters.`;
    case 'numeric':
      return `${field} must be a number.`;
    case 'positive':
      return `${field} must be a positive number.`;
    case 'nonNegative':
      return `${field} must be zero or greater.`;
    case 'futureDate':
      return `${field} cannot be in the future.`;
    case 'pastDate':
      return `${field} cannot be in the past.`;
    case 'currency':
      return `${field} must be a valid amount (e.g., 10.50).`;
    case 'bankReference':
      return `${field} must contain only letters, numbers, and hyphens.`;
    case 'registerNumber':
      return `${field} must be a numeric value.`;
    default:
      return `${field} is invalid.`;
  }
};

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Composite validator - runs multiple validations
 */
export const validate = (
  value: unknown,
  validators: Array<{
    fn: (val: any) => boolean;
    message: string;
  }>
): ValidationResult => {
  for (const validator of validators) {
    if (!validator.fn(value)) {
      return { isValid: false, error: validator.message };
    }
  }
  return { isValid: true };
};
