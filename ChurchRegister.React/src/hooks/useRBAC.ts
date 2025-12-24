import { useMemo } from 'react';
import { useAuthState } from '../contexts/useAuth';
import {
  hasRole,
  hasAnyRole,
  hasAllRoles,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  getUserRoleLevel,
  validateAccess,
  canAccessResource,
  getAllowedActions,
  CHURCH_ROLES,
  PERMISSIONS,
  type AccessContext,
} from '../utils/rbac';
import type { User } from '../services/auth/types';

export interface RBACContext {
  /** Current authenticated user */
  user: User | null;
  /** Check if user has a specific role */
  hasRole: (role: string) => boolean;
  /** Check if user has any of the specified roles */
  hasAnyRole: (roles: string[]) => boolean;
  /** Check if user has all of the specified roles */
  hasAllRoles: (roles: string[]) => boolean;
  /** Check if user has a specific permission */
  hasPermission: (permission: string) => boolean;
  /** Check if user has any of the specified permissions */
  hasAnyPermission: (permissions: string[]) => boolean;
  /** Check if user has all of the specified permissions */
  hasAllPermissions: (permissions: string[]) => boolean;
  /** Get all permissions for the current user */
  getUserPermissions: () => string[];
  /** Get user's role level (for hierarchy checks) */
  getUserRoleLevel: () => number;
  /** Check if user can access a resource */
  canAccessResource: (
    resource: AccessContext['resource'],
    requiredPermissions: string[],
    allowOwnership?: boolean
  ) => boolean;
  /** Get allowed actions for a resource */
  getAllowedActions: (resource: AccessContext['resource']) => string[];
  /** Validate access with comprehensive checking */
  validateAccess: (
    resource?: AccessContext['resource'],
    requiredRoles?: string[],
    requiredPermissions?: string[],
    allowOwnership?: boolean
  ) => { authorized: boolean; reason?: string };
  /** Check if user is admin */
  isAdmin: boolean;
  /** Check if user is trustee */
  isTrustee: boolean;
  /** Check if user is officer */
  isOfficer: boolean;
  /** Check if user is volunteer */
  isVolunteer: boolean;
  /** Check if user is member */
  isMember: boolean;
  /** Check if user is guest */
  isGuest: boolean;
  /** Check if user can view attendance */
  canViewAttendance: boolean;
  /** Check if user can record attendance */
  canRecordAttendance: boolean;
  /** Check if user can view analytics */
  canViewAnalytics: boolean;
  /** Check if user can manage events */
  canManageEvents: boolean;
}

/**
 * Hook for Role-Based Access Control functionality
 * Provides convenient methods for checking user permissions and roles
 */
export const useRBAC = (): RBACContext => {
  const { user } = useAuthState();

  // Memoize role checks for performance
  const roleChecks = useMemo(
    () => ({
      isAdmin: hasRole(user, CHURCH_ROLES.ADMINISTRATOR),
      isTrustee: hasRole(user, CHURCH_ROLES.TRUSTEE),
      isOfficer: hasRole(user, CHURCH_ROLES.OFFICER),
      isVolunteer: hasRole(user, CHURCH_ROLES.VOLUNTEER),
      isMember: hasRole(user, CHURCH_ROLES.MEMBER),
      isGuest: hasRole(user, CHURCH_ROLES.GUEST),
    }),
    [user]
  );

  // Memoize attendance permission checks for performance
  const attendancePermissions = useMemo(
    () => ({
      canViewAttendance: hasPermission(user, PERMISSIONS.ATTENDANCE_VIEW),
      canRecordAttendance: hasPermission(user, PERMISSIONS.ATTENDANCE_RECORD),
      canViewAnalytics: hasPermission(
        user,
        PERMISSIONS.ATTENDANCE_VIEW_ANALYTICS
      ),
      canManageEvents:
        hasPermission(user, PERMISSIONS.EVENT_MANAGEMENT_CREATE) ||
        hasPermission(user, PERMISSIONS.EVENT_MANAGEMENT_UPDATE),
    }),
    [user]
  );

  // Memoize user permissions for performance
  const userPermissions = useMemo(() => {
    return getUserPermissions(user);
  }, [user]);

  const rbacContext: RBACContext = useMemo(
    () => ({
      user,

      // Role checking methods
      hasRole: (role: string) => hasRole(user, role),
      hasAnyRole: (roles: string[]) => hasAnyRole(user, roles),
      hasAllRoles: (roles: string[]) => hasAllRoles(user, roles),

      // Permission checking methods
      hasPermission: (permission: string) => hasPermission(user, permission),
      hasAnyPermission: (permissions: string[]) =>
        hasAnyPermission(user, permissions),
      hasAllPermissions: (permissions: string[]) =>
        hasAllPermissions(user, permissions),

      // Utility methods
      getUserPermissions: () => userPermissions,
      getUserRoleLevel: () => getUserRoleLevel(user),

      // Resource access methods
      canAccessResource: (
        resource: AccessContext['resource'],
        requiredPermissions: string[],
        allowOwnership = true
      ) => {
        if (!user) return false;
        return canAccessResource(
          { user, resource },
          requiredPermissions,
          allowOwnership
        );
      },

      getAllowedActions: (resource: AccessContext['resource']) => {
        if (!user) return [];
        return getAllowedActions({ user, resource });
      },

      validateAccess: (
        resource?: AccessContext['resource'],
        requiredRoles?: string[],
        requiredPermissions?: string[],
        allowOwnership = true
      ) => {
        if (!user) {
          return { authorized: false, reason: 'User not authenticated' };
        }
        return validateAccess(
          { user, resource },
          requiredRoles,
          requiredPermissions,
          allowOwnership
        );
      },

      // Convenience role properties
      ...roleChecks,

      // Attendance-specific permission properties
      ...attendancePermissions,
    }),
    [user, userPermissions, roleChecks, attendancePermissions]
  );

  return rbacContext;
};

/**
 * Hook for checking if user has specific permissions
 * Returns a boolean and can be used in conditional rendering
 */
export const usePermission = (permission: string): boolean => {
  const { hasPermission } = useRBAC();
  return hasPermission(permission);
};

/**
 * Hook for checking if user has any of the specified permissions
 */
export const useAnyPermission = (permissions: string[]): boolean => {
  const { hasAnyPermission } = useRBAC();
  return hasAnyPermission(permissions);
};

/**
 * Hook for checking if user has all of the specified permissions
 */
export const useAllPermissions = (permissions: string[]): boolean => {
  const { hasAllPermissions } = useRBAC();
  return hasAllPermissions(permissions);
};

/**
 * Hook for checking if user has a specific role
 */
export const useRole = (role: string): boolean => {
  const { hasRole } = useRBAC();
  return hasRole(role);
};

/**
 * Hook for checking if user has any of the specified roles
 */
export const useAnyRole = (roles: string[]): boolean => {
  const { hasAnyRole } = useRBAC();
  return hasAnyRole(roles);
};

/**
 * Hook for checking if user has all of the specified roles
 */
export const useAllRoles = (roles: string[]): boolean => {
  const { hasAllRoles } = useRBAC();
  return hasAllRoles(roles);
};

/**
 * Hook for resource-specific access control
 */
export const useResourceAccess = (
  resource: AccessContext['resource'],
  requiredPermissions: string[],
  allowOwnership = true
) => {
  const { canAccessResource, getAllowedActions } = useRBAC();

  return useMemo(
    () => ({
      canAccess: canAccessResource(
        resource,
        requiredPermissions,
        allowOwnership
      ),
      allowedActions: getAllowedActions(resource),
    }),
    [
      resource,
      requiredPermissions,
      allowOwnership,
      canAccessResource,
      getAllowedActions,
    ]
  );
};

// Export constants for easy access
export { CHURCH_ROLES, PERMISSIONS } from '../utils/rbac';
