/**
 * Role Constants
 *
 * Defines all role strings used for role-based authorization throughout the application.
 * These must match the roles defined in the ASP.NET Core Identity system.
 */

/**
 * System Roles - Backend ASP.NET Identity Roles
 */
export const ROLES = {
  /**
   * System Administrator - Full system access
   */
  SYSTEM_ADMIN: 'SystemAdministration',

  /**
   * Financial Administrator - Full financial management access
   */
  FINANCIAL_ADMIN: 'FinancialAdministrator',

  /**
   * Financial Contributor - Can enter financial data
   */
  FINANCIAL_CONTRIBUTOR: 'FinancialContributor',

  /**
   * Financial Viewer - Read-only access to financial data
   */
  FINANCIAL_VIEWER: 'FinancialViewer',

  /**
   * Attendance Administrator - Full attendance management access
   */
  ATTENDANCE_ADMIN: 'AttendanceAdministrator',

  /**
   * Attendance Contributor - Can record attendance
   */
  ATTENDANCE_CONTRIBUTOR: 'AttendanceContributor',

  /**
   * Attendance Viewer - Read-only access to attendance data
   */
  ATTENDANCE_VIEWER: 'AttendanceViewer',

  /**
   * Church Members Administrator - Full church members management access
   */
  CHURCH_MEMBERS_ADMIN: 'ChurchMembersAdministrator',

  /**
   * Church Members Contributor - Can create and edit church members
   */
  CHURCH_MEMBERS_CONTRIBUTOR: 'ChurchMembersContributor',

  /**
   * Church Members Viewer - Read-only access to church members
   */
  CHURCH_MEMBERS_VIEWER: 'ChurchMembersViewer',
} as const;

/**
 * Church Hierarchy Roles - Organizational roles
 */
export const CHURCH_ROLES = {
  ADMINISTRATOR: 'Administrator',
  TRUSTEE: 'Trustee',
  OFFICER: 'Officer',
  VOLUNTEER: 'Volunteer',
  MEMBER: 'Member',
  GUEST: 'Guest',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
export type ChurchRole = (typeof CHURCH_ROLES)[keyof typeof CHURCH_ROLES];
