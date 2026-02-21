import type { AuthError, ValidationError } from '../services/auth/types';

// Enhanced authentication error codes and messages
export const AUTH_ERROR_CODES = {
  // Login errors
  INVALID_CREDENTIALS: 'AUTH_001',
  ACCOUNT_LOCKED: 'AUTH_002',
  ACCOUNT_SUSPENDED: 'AUTH_003',
  EMAIL_NOT_CONFIRMED: 'AUTH_004',
  TWO_FACTOR_REQUIRED: 'AUTH_005',
  PASSWORD_EXPIRED: 'AUTH_006',

  // Registration errors
  EMAIL_ALREADY_EXISTS: 'REG_001',
  WEAK_PASSWORD: 'REG_002',
  TERMS_NOT_ACCEPTED: 'REG_003',
  INVALID_EMAIL_FORMAT: 'REG_004',
  PASSWORD_MISMATCH: 'REG_005',

  // Password reset errors
  INVALID_RESET_TOKEN: 'PWD_001',
  RESET_TOKEN_EXPIRED: 'PWD_002',
  PASSWORD_RECENTLY_USED: 'PWD_003',

  // General errors
  NETWORK_ERROR: 'NET_001',
  SERVER_ERROR: 'SRV_001',
  RATE_LIMITED: 'RATE_001',
  MAINTENANCE_MODE: 'MAINT_001',
} as const;

export interface AuthErrorMessage {
  title: string;
  message: string;
  details?: string;
  userActions?: string[];
  supportActions?: string[];
  severity: 'error' | 'warning' | 'info';
  icon?: string;
}

// Enhanced error messages with user guidance
export const AUTH_ERROR_MESSAGES: Record<string, AuthErrorMessage> = {
  [AUTH_ERROR_CODES.INVALID_CREDENTIALS]: {
    title: 'Invalid Login Credentials',
    message: 'The email address or password you entered is incorrect.',
    details: 'Please check your email and password, then try again.',
    userActions: [
      'Verify your email address is spelled correctly',
      'Check that Caps Lock is off',
      'Try typing your password again',
      'Use the "Forgot Password" link if you can\'t remember your password',
    ],
    severity: 'error',
    icon: 'lock',
  },

  [AUTH_ERROR_CODES.ACCOUNT_LOCKED]: {
    title: 'Account Temporarily Locked',
    message:
      'Your account has been locked due to multiple failed login attempts.',
    details:
      'For security reasons, your account is temporarily locked. Please wait 15 minutes before trying again, or contact support for immediate assistance.',
    userActions: [
      'Wait 15 minutes before attempting to log in again',
      'Contact support if you need immediate access',
      "Consider using password reset if you've forgotten your password",
    ],
    supportActions: [
      'Contact our support team at support@churchregister.com',
      'Call the help desk at (555) 123-4567',
    ],
    severity: 'warning',
    icon: 'security',
  },

  [AUTH_ERROR_CODES.ACCOUNT_SUSPENDED]: {
    title: 'Account Suspended',
    message: 'Your account has been suspended by an administrator.',
    details:
      'Please contact your church administrator or our support team for assistance with reactivating your account.',
    supportActions: [
      'Contact your church administrator',
      'Email support@churchregister.com for assistance',
      'Include your email address and organization name when contacting support',
    ],
    severity: 'error',
    icon: 'block',
  },

  [AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED]: {
    title: 'Email Confirmation Required',
    message: 'Please confirm your email address before logging in.',
    details:
      'We sent a confirmation email when you registered. Check your inbox and click the confirmation link.',
    userActions: [
      'Check your email inbox for a confirmation message',
      'Look in your spam or junk folder',
      'Click the "Resend Confirmation" button to get a new email',
      "Contact support if you still can't find the confirmation email",
    ],
    severity: 'info',
    icon: 'email',
  },

  [AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS]: {
    title: 'Email Already Registered',
    message: 'An account with this email address already exists.',
    details:
      'If this is your email address, try logging in instead. If you forgot your password, use the password reset option.',
    userActions: [
      'Try logging in with this email address',
      'Use "Forgot Password" if you can\'t remember your password',
      'Contact support if you believe this is an error',
    ],
    severity: 'warning',
    icon: 'person',
  },

  [AUTH_ERROR_CODES.WEAK_PASSWORD]: {
    title: 'Password Too Weak',
    message: 'Your password does not meet the security requirements.',
    details:
      'Please create a stronger password following the security guidelines shown below.',
    userActions: [
      'Use at least 8 characters',
      'Include uppercase and lowercase letters',
      'Add at least one number',
      'Include a special character (@, #, $, etc.)',
      'Avoid common passwords and personal information',
    ],
    severity: 'warning',
    icon: 'security',
  },

  [AUTH_ERROR_CODES.NETWORK_ERROR]: {
    title: 'Connection Problem',
    message:
      'Unable to connect to the server. Please check your internet connection.',
    details:
      'This might be a temporary network issue. Please try again in a moment.',
    userActions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Wait a moment and try again',
      'Contact support if the problem persists',
    ],
    severity: 'error',
    icon: 'wifi_off',
  },

  [AUTH_ERROR_CODES.SERVER_ERROR]: {
    title: 'Server Error',
    message:
      "We're experiencing technical difficulties. Please try again later.",
    details:
      'Our technical team has been notified and is working to resolve this issue.',
    userActions: [
      'Try again in a few minutes',
      'Clear your browser cache and cookies',
      'Contact support if the problem persists',
    ],
    supportActions: [
      'Report this error to support@churchregister.com',
      'Include the time and what you were trying to do',
    ],
    severity: 'error',
    icon: 'error',
  },

  [AUTH_ERROR_CODES.RATE_LIMITED]: {
    title: 'Too Many Attempts',
    message:
      "You've made too many requests in a short time. Please wait a moment.",
    details:
      'This is a security measure to protect against automated attacks. Please wait a few minutes before trying again.',
    userActions: [
      'Wait 5-10 minutes before trying again',
      'Avoid repeatedly clicking submit buttons',
      'Contact support if you continue to see this message',
    ],
    severity: 'warning',
    icon: 'timer',
  },

  [AUTH_ERROR_CODES.MAINTENANCE_MODE]: {
    title: 'System Maintenance',
    message: 'The system is currently undergoing maintenance.',
    details:
      "We're performing scheduled maintenance to improve your experience. Please check back shortly.",
    userActions: [
      'Try again in 15-30 minutes',
      'Check our status page for updates',
      'Follow us on social media for announcements',
    ],
    severity: 'info',
    icon: 'build',
  },
};

// Helper function to determine error code from error message or API response
export const getAuthErrorCode = (error: AuthError | Error | string): string => {
  if (typeof error === 'string') {
    const message = error.toLowerCase();

    if (message.includes('invalid') || message.includes('incorrect')) {
      return AUTH_ERROR_CODES.INVALID_CREDENTIALS;
    }
    if (message.includes('locked')) {
      return AUTH_ERROR_CODES.ACCOUNT_LOCKED;
    }
    if (message.includes('suspended')) {
      return AUTH_ERROR_CODES.ACCOUNT_SUSPENDED;
    }
    if (message.includes('email') && message.includes('confirmed')) {
      return AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED;
    }
    if (message.includes('email') && message.includes('exists')) {
      return AUTH_ERROR_CODES.EMAIL_ALREADY_EXISTS;
    }
    if (message.includes('password') && message.includes('weak')) {
      return AUTH_ERROR_CODES.WEAK_PASSWORD;
    }
    if (message.includes('network') || message.includes('connection')) {
      return AUTH_ERROR_CODES.NETWORK_ERROR;
    }
    if (message.includes('rate') || message.includes('too many')) {
      return AUTH_ERROR_CODES.RATE_LIMITED;
    }
    if (message.includes('maintenance')) {
      return AUTH_ERROR_CODES.MAINTENANCE_MODE;
    }

    return AUTH_ERROR_CODES.SERVER_ERROR;
  }

  if (error instanceof Error) {
    return getAuthErrorCode(error.message);
  }

  // If it's an AuthError object
  if ('code' in error && error.code) {
    return error.code;
  }

  if ('message' in error) {
    return getAuthErrorCode(error.message);
  }

  return AUTH_ERROR_CODES.SERVER_ERROR;
};

// Helper function to get enhanced error message
export const getAuthErrorMessage = (
  error: AuthError | Error | string
): AuthErrorMessage => {
  const errorCode = getAuthErrorCode(error);
  return (
    AUTH_ERROR_MESSAGES[errorCode] ||
    AUTH_ERROR_MESSAGES[AUTH_ERROR_CODES.SERVER_ERROR]
  );
};

// Helper function to format validation errors
export const formatValidationErrors = (
  validationErrors: ValidationError[]
): string[] => {
  return validationErrors.map((error) => {
    const fieldName =
      error.field.charAt(0).toUpperCase() + error.field.slice(1);
    return `${fieldName}: ${error.message}`;
  });
};

// Helper function to check if error requires user action vs support action
export const requiresUserAction = (errorCode: string): boolean => {
  const userActionErrors = [
    AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED,
    AUTH_ERROR_CODES.WEAK_PASSWORD,
    AUTH_ERROR_CODES.TERMS_NOT_ACCEPTED,
    AUTH_ERROR_CODES.PASSWORD_MISMATCH,
    AUTH_ERROR_CODES.NETWORK_ERROR,
    AUTH_ERROR_CODES.RATE_LIMITED,
  ] as string[];

  return userActionErrors.includes(errorCode);
};

// Helper function to check if error is recoverable
export const isRecoverableError = (errorCode: string): boolean => {
  const recoverableErrors = [
    AUTH_ERROR_CODES.INVALID_CREDENTIALS,
    AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED,
    AUTH_ERROR_CODES.WEAK_PASSWORD,
    AUTH_ERROR_CODES.TERMS_NOT_ACCEPTED,
    AUTH_ERROR_CODES.PASSWORD_MISMATCH,
    AUTH_ERROR_CODES.NETWORK_ERROR,
    AUTH_ERROR_CODES.RATE_LIMITED,
  ] as string[];

  return recoverableErrors.includes(errorCode);
};

// Helper function to get retry delay for specific errors
export const getRetryDelay = (errorCode: string): number => {
  switch (errorCode) {
    case AUTH_ERROR_CODES.ACCOUNT_LOCKED:
      return 15 * 60 * 1000; // 15 minutes
    case AUTH_ERROR_CODES.RATE_LIMITED:
      return 5 * 60 * 1000; // 5 minutes
    case AUTH_ERROR_CODES.NETWORK_ERROR:
      return 30 * 1000; // 30 seconds
    default:
      return 0; // No automatic retry
  }
};
