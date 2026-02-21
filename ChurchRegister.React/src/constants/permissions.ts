/**
 * Permission Constants
 *
 * Defines all permission strings used for authorization checks throughout the application.
 * These must match the permissions defined in the backend API.
 */

export const PERMISSIONS = {
  // User management permissions
  USER_VIEW: 'user.view',
  USER_CREATE: 'user.create',
  USER_EDIT: 'user.edit',
  USER_DELETE: 'user.delete',
  USER_MANAGE_ROLES: 'user.manage_roles',

  // System administration permissions
  SYSTEM_CONFIGURE: 'system.configure',
  SYSTEM_MANAGE: 'system.manage',
  SYSTEM_AUDIT: 'system.audit',
  SYSTEM_BACKUP: 'system.backup',

  // Profile management permissions
  PROFILE_VIEW_OWN: 'profile.view_own',
  PROFILE_EDIT_OWN: 'profile.edit_own',
  PROFILE_VIEW_OTHERS: 'profile.view_others',
  PROFILE_EDIT_OTHERS: 'profile.edit_others',

  // Report permissions
  REPORTS_VIEW: 'reports.view',
  REPORTS_GENERATE: 'reports.generate',
  REPORTS_EXPORT: 'reports.export',

  // Attendance tracking permissions
  ATTENDANCE_VIEW: 'Attendance.View',
  ATTENDANCE_RECORD: 'Attendance.Record',
  ATTENDANCE_VIEW_ANALYTICS: 'Attendance.ViewAnalytics',
  ATTENDANCE_SHARE_ANALYTICS: 'Attendance.ShareAnalytics',

  // Church Members permissions
  CHURCH_MEMBERS_VIEW: 'ChurchMembers.View',
  CHURCH_MEMBERS_CREATE: 'ChurchMembers.Create',
  CHURCH_MEMBERS_EDIT: 'ChurchMembers.Edit',
  CHURCH_MEMBERS_MANAGE_STATUS: 'ChurchMembers.ManageStatus',

  // Event management permissions
  EVENT_MANAGEMENT_VIEW: 'EventManagement.View',
  EVENT_MANAGEMENT_CREATE: 'EventManagement.Create',
  EVENT_MANAGEMENT_UPDATE: 'EventManagement.Update',
  EVENT_MANAGEMENT_DELETE: 'EventManagement.Delete',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
