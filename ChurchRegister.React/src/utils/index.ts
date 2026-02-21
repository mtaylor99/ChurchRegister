/**
 * Utility Functions Barrel Export
 *
 * Provides a centralized export point for all utility functions and helpers.
 * Import utilities from this file for cleaner imports throughout the application.
 *
 * @example
 * ```typescript
 * import { logger, validatePassword, getErrorMessage } from '@utils';
 * ```
 */

// Authentication Errors
export * from './authErrors';

// Error Utilities
export * from './errorUtils';

// Export Utilities
export * from './exportUtils';

// Logger
export { logger } from './logger';

// Notification Manager
export { notificationManager } from './notificationManager';

// Password Security
export * from './passwordSecurity';

// Query Keys
export * from './queryKeys';

// RBAC (Role-Based Access Control)
export * from './rbac';

// Validation
export * from './validation';

// Higher-Order Component
export { withErrorBoundary } from './withErrorBoundary';
