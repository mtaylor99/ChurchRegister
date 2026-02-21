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
export * from './useTheme';
export * from './useToast';
export * from './useTokenRefresh';
