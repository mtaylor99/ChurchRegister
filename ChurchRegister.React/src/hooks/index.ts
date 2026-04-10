/**
 * Custom Hooks Barrel Export
 *
 * Provides a centralized export point for all custom React hooks.
 * Import hooks from this file for cleaner imports throughout the application.
 *
 * @example
 * ```typescript
 * import { useNotification, useRBAC, useTheme } from '@hooks';
 * ```
 */

// Re-export all hooks (wildcard exports preserve tree-shaking)
export * from './useAccessibility';
export * from './useAttendance';
export * from './useDataProtection';
export * from './useDistricts';
export * from './useFocus';
export * from './useNavigation';
export * from './useNotification';
export * from './useRBAC';
export * from './useRegisterNumbers';
export * from './useReminderCategories';
export * from './useReminders';
export * from './useRiskAssessments';
export * from './useTheme';
export * from './useToast';
export * from './useTokenRefresh';

// Generic API hooks (Phase 6 - typed generics)
export * from './useApiQuery';
export * from './useApiMutation';

// UI interaction hooks (Phase 9)
export * from './useEscapeKey';
export * from './useFormFocus';
export * from './useOptimisticList';
