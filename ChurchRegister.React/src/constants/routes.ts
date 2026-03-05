/**
 * Route Constants
 *
 * Centralized route path definitions for the application.
 * Use these constants instead of hardcoding route strings throughout the app.
 */

export const ROUTES = {
  // Public Routes
  LOGIN: '/login',
  ROOT: '/',

  // Error Routes
  ERROR_404: '/error/404',
  ERROR_500: '/error/500',
  ERROR_UNAUTHORIZED: '/error/unauthorized',

  // Protected Routes - Main App
  APP: '/app',
  DASHBOARD: '/app/dashboard',
  CHANGE_PASSWORD: '/app/change-password',

  // Attendance Routes
  ATTENDANCE: '/app/attendance',

  // Church Members Routes
  CHURCH_MEMBERS: '/app/members',

  // Contributions Routes
  CONTRIBUTIONS: '/app/contributions',

  // Financial Routes
  ENVELOPE_ENTRY: '/app/financial/envelope-contributions/entry',
  ENVELOPE_HISTORY: '/app/financial/envelope-contributions/history',

  // Administration Routes
  ADMIN_USERS: '/app/administration/users',
  ADMIN_REGISTER_NUMBERS: '/app/administration/register-numbers',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
