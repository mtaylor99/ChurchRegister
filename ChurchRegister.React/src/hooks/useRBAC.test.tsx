/**
 * Unit tests for useRBAC hook
 */

import { describe, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRBAC } from './useRBAC';
import { AuthStateContext } from '../contexts/AuthContext';
import type { ReactNode } from 'react';
import type { User } from '../services/auth/types';
import type { AuthState } from '../contexts/AuthContext';

// Mock user data
const createMockUser = (roles: string[] = []): User => ({
  id: '1',
  email: 'test@example.com',
  displayName: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  roles,
  permissions: [],
  isActive: true,
  emailConfirmed: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

// Wrapper component with mocked auth context
const createWrapper = (user: User | null) => {
  const authState: AuthState = {
    user,
    isAuthenticated: user !== null,
    isLoading: false,
    error: null,
    sessionWarning: false,
    sessionExpiry: null,
  };

  return ({ children }: { children: ReactNode }) => (
    <AuthStateContext.Provider value={authState}>
      {children}
    </AuthStateContext.Provider>
  );
};

describe('useRBAC', () => {
  describe('role checks', () => {
    test('should identify admin user', () => {
      const user = createMockUser(['SystemAdministrator']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.hasRole('SystemAdministrator')).toBe(true);
    });

    test('should identify trustee user', () => {
      const user = createMockUser(['Trustee']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(result.current.isTrustee).toBe(true);
      expect(result.current.hasRole('Trustee')).toBe(true);
    });

    test('should identify officer user', () => {
      const user = createMockUser(['Officer']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(result.current.isOfficer).toBe(true);
      expect(result.current.hasRole('Officer')).toBe(true);
    });

    test('should identify member user', () => {
      const user = createMockUser(['Member']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(result.current.isMember).toBe(true);
      expect(result.current.hasRole('Member')).toBe(true);
    });

    test('should handle user with no roles', () => {
      const user = createMockUser([]);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isTrustee).toBe(false);
      expect(result.current.isOfficer).toBe(false);
      expect(result.current.isMember).toBe(false);
    });

    test('should handle unauthenticated user', () => {
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.hasRole('SystemAdministrator')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    test('should return true if user has any of the specified roles', () => {
      const user = createMockUser(['Officer']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(
        result.current.hasAnyRole(['SystemAdministrator', 'Officer', 'Trustee'])
      ).toBe(true);
    });

    test('should return false if user has none of the specified roles', () => {
      const user = createMockUser(['Member']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(
        result.current.hasAnyRole(['SystemAdministrator', 'Officer', 'Trustee'])
      ).toBe(false);
    });
  });

  describe('hasAllRoles', () => {
    test('should return true if user has all specified roles', () => {
      const user = createMockUser(['Officer', 'Member']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(result.current.hasAllRoles(['Officer', 'Member'])).toBe(true);
    });

    test('should return false if user is missing any role', () => {
      const user = createMockUser(['Officer']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(result.current.hasAllRoles(['Officer', 'Trustee'])).toBe(false);
    });
  });

  describe('permission checks', () => {
    test('should check specific permission', () => {
      const user = createMockUser(['SystemAdministrator']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      // Admin should have all permissions
      expect(result.current.hasPermission('ATTENDANCE_VIEW')).toBe(true);
      expect(result.current.hasPermission('CHURCH_MEMBERS_VIEW')).toBe(true);
    });

    test('should return false for permission user does not have', () => {
      const user = createMockUser(['Member']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      // Member should not have admin permissions
      expect(result.current.hasPermission('USERS_DELETE')).toBe(false);
    });

    test('should get all user permissions', () => {
      const user = createMockUser(['SystemAdministrator']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      const permissions = result.current.getUserPermissions();
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBeGreaterThan(0);
    });
  });

  describe('hasAnyPermission', () => {
    test('should return true if user has any of the specified permissions', () => {
      const user = createMockUser(['Officer']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(
        result.current.hasAnyPermission(['ATTENDANCE_VIEW', 'USERS_DELETE'])
      ).toBe(true);
    });

    test('should return false if user has none of the specified permissions', () => {
      const user = createMockUser(['Member']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(
        result.current.hasAnyPermission(['USERS_DELETE', 'USERS_CREATE'])
      ).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    test('should return true if user has all specified permissions', () => {
      const user = createMockUser(['SystemAdministrator']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(
        result.current.hasAllPermissions([
          'ATTENDANCE_VIEW',
          'CHURCH_MEMBERS_VIEW',
        ])
      ).toBe(true);
    });

    test('should return false if user is missing any permission', () => {
      const user = createMockUser(['Member']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(
        result.current.hasAllPermissions([
          'CHURCH_MEMBERS_VIEW',
          'USERS_DELETE',
        ])
      ).toBe(false);
    });
  });

  describe('attendance permissions', () => {
    test('admin should have all attendance permissions', () => {
      const user = createMockUser(['SystemAdministrator']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(result.current.canViewAttendance).toBe(true);
      expect(result.current.canRecordAttendance).toBe(true);
      expect(result.current.canViewAnalytics).toBe(true);
      expect(result.current.canManageEvents).toBe(true);
    });

    test('officer should have attendance permissions', () => {
      const user = createMockUser(['Officer']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      expect(result.current.canViewAttendance).toBe(true);
      expect(result.current.canRecordAttendance).toBe(true);
    });

    test('member should have limited attendance permissions', () => {
      const user = createMockUser(['Member']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      // Members typically can only view, not manage
      expect(result.current.canManageEvents).toBe(false);
    });
  });

  describe('getUserRoleLevel', () => {
    test('should return role level for admin', () => {
      const user = createMockUser(['SystemAdministrator']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      const roleLevel = result.current.getUserRoleLevel();
      expect(roleLevel).toBeGreaterThan(0);
    });

    test('should return 0 for user  with no roles', () => {
      const user = createMockUser([]);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      const roleLevel = result.current.getUserRoleLevel();
      expect(roleLevel).toBe(0);
    });
  });

  describe('validateAccess', () => {
    test('should validate access for authorized user', () => {
      const user = createMockUser(['SystemAdministrator']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      const validation = result.current.validateAccess();
      expect(validation.authorized).toBe(true);
      expect(validation.reason).toBeUndefined();
    });

    test('should return authorization failure for unauthorized user', () => {
      const user = createMockUser(['Member']);
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      const validation = result.current.validateAccess(
        undefined,
        ['SystemAdministrator']
      );
      expect(validation.authorized).toBe(false);
      expect(validation.reason).toBeDefined();
    });

    test('should validate access for unauthenticated user', () => {
      const { result } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(null),
      });

      const validation = result.current.validateAccess();
      expect(validation.authorized).toBe(false);
      expect(validation.reason).toContain('authenticated');
    });
  });

  describe('memoization', () => {
    test('should memoize role checks', () => {
      const user = createMockUser(['SystemAdministrator']);
      const { result, rerender } = renderHook(() => useRBAC(), {
        wrapper: createWrapper(user),
      });

      const firstIsAdmin = result.current.isAdmin;
      rerender();
      const secondIsAdmin = result.current.isAdmin;

      // Values should be the same across renders
      expect(firstIsAdmin).toBe(secondIsAdmin);
      expect(firstIsAdmin).toBe(true);
    });
  });
});
