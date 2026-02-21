import type { User } from '../services/auth/types';

// Church Register Role-Based Access Control System

// Define the role hierarchy for Church Register
export const CHURCH_ROLES = {
  ADMINISTRATOR: 'Administrator',
  TRUSTEE: 'Trustee',
  OFFICER: 'Officer',
  VOLUNTEER: 'Volunteer',
  MEMBER: 'Member',
  GUEST: 'Guest',
} as const;

// Define permissions for different system actions
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

  // Training Certificates permissions
  TRAINING_CERTIFICATES_VIEW: 'TrainingCertificates.View',
  TRAINING_CERTIFICATES_CREATE: 'TrainingCertificates.Create',
  TRAINING_CERTIFICATES_EDIT: 'TrainingCertificates.Edit',
  TRAINING_CERTIFICATES_MANAGE_TYPES: 'TrainingCertificates.ManageTypes',

  // Event management permissions
  EVENT_MANAGEMENT_VIEW: 'EventManagement.View',
  EVENT_MANAGEMENT_CREATE: 'EventManagement.Create',
  EVENT_MANAGEMENT_UPDATE: 'EventManagement.Update',
  EVENT_MANAGEMENT_DELETE: 'EventManagement.Delete',

  // Risk Assessments permissions
  RISK_ASSESSMENTS_VIEW: 'RiskAssessments.View',
  RISK_ASSESSMENTS_EDIT: 'RiskAssessments.Edit',
  RISK_ASSESSMENTS_APPROVE: 'RiskAssessments.Approve',
  RISK_ASSESSMENTS_MANAGE: 'RiskAssessments.Manage',
} as const;

// Role to permissions mapping based on church hierarchy
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [CHURCH_ROLES.ADMINISTRATOR]: [
    // Full system access
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE_ROLES,
    PERMISSIONS.SYSTEM_CONFIGURE,
    PERMISSIONS.SYSTEM_AUDIT,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.PROFILE_VIEW_OTHERS,
    PERMISSIONS.PROFILE_EDIT_OTHERS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    // Full attendance access
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_RECORD,
    PERMISSIONS.ATTENDANCE_VIEW_ANALYTICS,
    PERMISSIONS.ATTENDANCE_SHARE_ANALYTICS,
    // Full church members access
    PERMISSIONS.CHURCH_MEMBERS_VIEW,
    PERMISSIONS.CHURCH_MEMBERS_CREATE,
    PERMISSIONS.CHURCH_MEMBERS_EDIT,
    PERMISSIONS.CHURCH_MEMBERS_MANAGE_STATUS,
    // Full training certificates access
    PERMISSIONS.TRAINING_CERTIFICATES_VIEW,
    PERMISSIONS.TRAINING_CERTIFICATES_CREATE,
    PERMISSIONS.TRAINING_CERTIFICATES_EDIT,
    PERMISSIONS.TRAINING_CERTIFICATES_MANAGE_TYPES,
    PERMISSIONS.EVENT_MANAGEMENT_VIEW,
    PERMISSIONS.EVENT_MANAGEMENT_CREATE,
    PERMISSIONS.EVENT_MANAGEMENT_UPDATE,
    PERMISSIONS.EVENT_MANAGEMENT_DELETE,
  ],

  [CHURCH_ROLES.TRUSTEE]: [
    // Trustee permissions - can manage users
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.PROFILE_VIEW_OTHERS,
    PERMISSIONS.REPORTS_VIEW,
    // Attendance management access (can record and view analytics)
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_RECORD,
    PERMISSIONS.ATTENDANCE_VIEW_ANALYTICS,
    PERMISSIONS.ATTENDANCE_SHARE_ANALYTICS,
    PERMISSIONS.EVENT_MANAGEMENT_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
  ],

  [CHURCH_ROLES.OFFICER]: [
    // Officer permissions
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    // Attendance recording and analytics access
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_RECORD,
    PERMISSIONS.ATTENDANCE_VIEW_ANALYTICS,
    PERMISSIONS.EVENT_MANAGEMENT_VIEW,
  ],

  [CHURCH_ROLES.VOLUNTEER]: [
    // Volunteer permissions
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.REPORTS_VIEW,
    // Basic attendance recording access
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_RECORD,
    PERMISSIONS.EVENT_MANAGEMENT_VIEW,
  ],

  [CHURCH_ROLES.MEMBER]: [
    // Member permissions
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
  ],

  [CHURCH_ROLES.GUEST]: [
    // Guest permissions - very limited access
    PERMISSIONS.PROFILE_VIEW_OWN,
  ],

  // Backend role mappings (ASP.NET Identity roles from database)
  SystemAdministration: [
    // System administrator has ALL permissions
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE_ROLES,
    PERMISSIONS.SYSTEM_CONFIGURE,
    PERMISSIONS.SYSTEM_AUDIT,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.PROFILE_VIEW_OWN,
    PERMISSIONS.PROFILE_EDIT_OWN,
    PERMISSIONS.PROFILE_VIEW_OTHERS,
    PERMISSIONS.PROFILE_EDIT_OTHERS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_GENERATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_RECORD,
    PERMISSIONS.ATTENDANCE_VIEW_ANALYTICS,
    PERMISSIONS.TRAINING_CERTIFICATES_VIEW,
    PERMISSIONS.TRAINING_CERTIFICATES_CREATE,
    PERMISSIONS.TRAINING_CERTIFICATES_EDIT,
    PERMISSIONS.TRAINING_CERTIFICATES_MANAGE_TYPES,
    PERMISSIONS.ATTENDANCE_SHARE_ANALYTICS,
    PERMISSIONS.CHURCH_MEMBERS_VIEW,
    PERMISSIONS.CHURCH_MEMBERS_CREATE,
    PERMISSIONS.CHURCH_MEMBERS_EDIT,
    PERMISSIONS.CHURCH_MEMBERS_MANAGE_STATUS,
    PERMISSIONS.EVENT_MANAGEMENT_VIEW,
    PERMISSIONS.EVENT_MANAGEMENT_CREATE,
    PERMISSIONS.EVENT_MANAGEMENT_UPDATE,
    PERMISSIONS.EVENT_MANAGEMENT_DELETE,
    PERMISSIONS.RISK_ASSESSMENTS_VIEW,
    PERMISSIONS.RISK_ASSESSMENTS_EDIT,
    PERMISSIONS.RISK_ASSESSMENTS_APPROVE,
    PERMISSIONS.RISK_ASSESSMENTS_MANAGE,
  ],

  // Attendance role mappings
  AttendanceViewer: [PERMISSIONS.ATTENDANCE_VIEW],
  AttendanceContributor: [
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_RECORD,
  ],
  AttendanceAdministrator: [
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_RECORD,
    PERMISSIONS.ATTENDANCE_VIEW_ANALYTICS,
    PERMISSIONS.ATTENDANCE_SHARE_ANALYTICS,
  ],

  // Church Members role mappings
  ChurchMembersViewer: [PERMISSIONS.CHURCH_MEMBERS_VIEW],
  ChurchMembersContributor: [
    PERMISSIONS.CHURCH_MEMBERS_VIEW,
    PERMISSIONS.CHURCH_MEMBERS_CREATE,
    PERMISSIONS.CHURCH_MEMBERS_EDIT,
  ],
  ChurchMembersAdministrator: [
    PERMISSIONS.CHURCH_MEMBERS_VIEW,
    PERMISSIONS.CHURCH_MEMBERS_CREATE,
    PERMISSIONS.CHURCH_MEMBERS_EDIT,
    PERMISSIONS.CHURCH_MEMBERS_MANAGE_STATUS,
  ],

  // Training Certificates role mappings
  TrainingViewer: [PERMISSIONS.TRAINING_CERTIFICATES_VIEW],
  TrainingContributor: [
    PERMISSIONS.TRAINING_CERTIFICATES_VIEW,
    PERMISSIONS.TRAINING_CERTIFICATES_CREATE,
    PERMISSIONS.TRAINING_CERTIFICATES_EDIT,
  ],
  TrainingAdministrator: [
    PERMISSIONS.TRAINING_CERTIFICATES_VIEW,
    PERMISSIONS.TRAINING_CERTIFICATES_CREATE,
    PERMISSIONS.TRAINING_CERTIFICATES_EDIT,
    PERMISSIONS.TRAINING_CERTIFICATES_MANAGE_TYPES,
  ],

  // Risk Assessments role mappings
  RiskAssessmentsViewer: [PERMISSIONS.RISK_ASSESSMENTS_VIEW],
  RiskAssessmentsContributor: [
    PERMISSIONS.RISK_ASSESSMENTS_VIEW,
    PERMISSIONS.RISK_ASSESSMENTS_EDIT,
  ],
  RiskAssessmentsAdmin: [
    PERMISSIONS.RISK_ASSESSMENTS_VIEW,
    PERMISSIONS.RISK_ASSESSMENTS_EDIT,
    PERMISSIONS.RISK_ASSESSMENTS_APPROVE,
    PERMISSIONS.RISK_ASSESSMENTS_MANAGE,
  ],
};

// Resource types for granular permission checking
export const RESOURCE_TYPES = {
  USER: 'user',
  REPORT: 'report',
  SYSTEM: 'system',
} as const;

export interface AccessContext {
  /** The user requesting access */
  user: User;
  /** The resource being accessed */
  resource?: {
    type: string;
    id?: string | number;
    ownerId?: string;
  };
  /** Additional context data */
  metadata?: Record<string, unknown>;
}

// Core RBAC utility functions

/**
 * Check if user has a specific role
 */
export const hasRole = (user: User | null, role: string): boolean => {
  if (!user || !user.roles) return false;
  return user.roles.some(
    (userRole) => userRole.toLowerCase() === role.toLowerCase()
  );
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user: User | null, roles: string[]): boolean => {
  if (!user || !user.roles || roles.length === 0) return false;
  return roles.some((role) => hasRole(user, role));
};

/**
 * Check if user has all of the specified roles
 */
export const hasAllRoles = (user: User | null, roles: string[]): boolean => {
  if (!user || !user.roles || roles.length === 0) return false;
  return roles.every((role) => hasRole(user, role));
};

/**
 * Get all permissions for a user based on their roles
 */
export const getUserPermissions = (user: User | null): string[] => {
  if (!user || !user.roles) return [];

  const permissions = new Set<string>();

  // Add role-based permissions
  user.roles.forEach((role) => {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    rolePermissions.forEach((permission) => permissions.add(permission));
  });

  // Add explicit user permissions (if any)
  if (user.permissions) {
    user.permissions.forEach((permission) => permissions.add(permission));
  }

  return Array.from(permissions);
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (
  user: User | null,
  permission: string
): boolean => {
  const userPermissions = getUserPermissions(user);
  return userPermissions.includes(permission);
};

/**
 * Check if user has any of the specified permissions
 */
export const hasAnyPermission = (
  user: User | null,
  permissions: string[]
): boolean => {
  if (permissions.length === 0) return true;
  return permissions.some((permission) => hasPermission(user, permission));
};

/**
 * Check if user has all of the specified permissions
 */
export const hasAllPermissions = (
  user: User | null,
  permissions: string[]
): boolean => {
  if (permissions.length === 0) return true;
  return permissions.every((permission) => hasPermission(user, permission));
};

/**
 * Check if user owns a resource
 */
export const isResourceOwner = (context: AccessContext): boolean => {
  const { user, resource } = context;
  if (!resource || !resource.ownerId) return false;
  return user.id === resource.ownerId;
};

/**
 * Check if user can access a resource based on ownership and permissions
 */
export const canAccessResource = (
  context: AccessContext,
  requiredPermissions: string[],
  allowOwnership = true
): boolean => {
  const { user } = context;

  // Check if user has required permissions
  if (hasAllPermissions(user, requiredPermissions)) {
    return true;
  }

  // Check if user owns the resource (if ownership is allowed)
  if (allowOwnership && isResourceOwner(context)) {
    return true;
  }

  return false;
};

/**
 * Get the highest role level for a user (for hierarchy comparison)
 */
export const getUserRoleLevel = (user: User | null): number => {
  if (!user || !user.roles) return 0;

  const roleLevels: Record<string, number> = {
    [CHURCH_ROLES.ADMINISTRATOR]: 100,
    [CHURCH_ROLES.TRUSTEE]: 80,
    [CHURCH_ROLES.OFFICER]: 60,
    [CHURCH_ROLES.VOLUNTEER]: 40,
    [CHURCH_ROLES.MEMBER]: 20,
    [CHURCH_ROLES.GUEST]: 10,
  };

  let maxLevel = 0;
  user.roles.forEach((role) => {
    const level = roleLevels[role] || 0;
    if (level > maxLevel) {
      maxLevel = level;
    }
  });

  return maxLevel;
};

/**
 * Check if user has higher role level than another user
 */
export const hasHigherRoleLevel = (
  user1: User | null,
  user2: User | null
): boolean => {
  return getUserRoleLevel(user1) > getUserRoleLevel(user2);
};

/**
 * Check if user can perform an action on behalf of another user
 */
export const canActOnBehalfOf = (
  actor: User | null,
  target: User | null
): boolean => {
  if (!actor || !target) return false;

  // Administrators can act on behalf of anyone
  if (hasRole(actor, CHURCH_ROLES.ADMINISTRATOR)) return true;

  // Trustees can act on behalf of lower-level users
  if (hasRole(actor, CHURCH_ROLES.TRUSTEE)) {
    return hasHigherRoleLevel(actor, target);
  }

  // Users can only act on behalf of themselves
  return actor.id === target.id;
};

/**
 * Get allowed actions for a user on a specific resource
 */
export const getAllowedActions = (context: AccessContext): string[] => {
  const { user, resource } = context;
  const userPermissions = getUserPermissions(user);
  const allowedActions: string[] = [];

  if (!resource) return userPermissions;

  // Filter permissions based on resource type
  const resourcePrefix = `${resource.type}.`;
  const resourcePermissions = userPermissions.filter((permission) =>
    permission.startsWith(resourcePrefix)
  );

  // Add ownership-based actions
  if (isResourceOwner(context)) {
    // Resource owners can view and edit their own resources
    allowedActions.push(`${resource.type}.view`, `${resource.type}.edit`);
  }

  return [...new Set([...resourcePermissions, ...allowedActions])];
};

/**
 * Validate access control rules at runtime
 */
export const validateAccess = (
  context: AccessContext,
  requiredRoles?: string[],
  requiredPermissions?: string[],
  allowOwnership = true
): { authorized: boolean; reason?: string } => {
  const { user } = context;

  if (!user) {
    return { authorized: false, reason: 'User not authenticated' };
  }

  if (!user.isActive) {
    return { authorized: false, reason: 'User account is inactive' };
  }

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasAnyRole(user, requiredRoles)) {
      return {
        authorized: false,
        reason: `Missing required roles: ${requiredRoles.join(', ')}`,
      };
    }
  }

  // Check permission requirements
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPerms = canAccessResource(
      context,
      requiredPermissions,
      allowOwnership
    );
    if (!hasPerms) {
      const missingPermissions = requiredPermissions.filter(
        (permission) => !hasPermission(user, permission)
      );

      if (!allowOwnership || !isResourceOwner(context)) {
        return {
          authorized: false,
          reason: `Missing required permissions: ${missingPermissions.join(', ')}`,
        };
      }
    }
  }

  return { authorized: true };
};
