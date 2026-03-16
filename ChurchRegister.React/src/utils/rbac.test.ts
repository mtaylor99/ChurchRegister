/**
 * Unit tests for rbac utility functions
 */
import { describe, test, expect } from 'vitest';
import {
  hasRole,
  hasAnyRole,
  hasAllRoles,
  getUserPermissions,
  hasAnyPermission,
  hasAllPermissions,
  isResourceOwner,
  canAccessResource,
  getUserRoleLevel,
  hasHigherRoleLevel,
  canActOnBehalfOf,
  getAllowedActions,
  validateAccess,
  CHURCH_ROLES,
  PERMISSIONS,
} from './rbac';
import type { User } from '../services/auth/types';

function makeUser(
  overrides: Partial<User> & { roles?: string[]; permissions?: string[] } = {}
): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    displayName: 'Test User',
    roles: ['Member'],
    permissions: [],
    isActive: true,
    emailConfirmed: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const adminUser = makeUser({ id: 'admin-1', roles: [CHURCH_ROLES.ADMINISTRATOR] });
const trusteeUser = makeUser({ id: 'trustee-1', roles: [CHURCH_ROLES.TRUSTEE] });
const officerUser = makeUser({ id: 'officer-1', roles: [CHURCH_ROLES.OFFICER] });
const memberUser = makeUser({ id: 'member-1', roles: [CHURCH_ROLES.MEMBER] });
const guestUser = makeUser({ id: 'guest-1', roles: [CHURCH_ROLES.GUEST] });

describe('isResourceOwner', () => {
  test('returns true when user owns the resource', () => {
    const user = makeUser({ id: 'user-1' });
    expect(isResourceOwner({ user, resource: { type: 'report', id: 1, ownerId: 'user-1' } })).toBe(true);
  });

  test('returns false when user does not own the resource', () => {
    const user = makeUser({ id: 'user-1' });
    expect(isResourceOwner({ user, resource: { type: 'report', id: 1, ownerId: 'other-user' } })).toBe(false);
  });

  test('returns false when resource has no ownerId', () => {
    const user = makeUser({ id: 'user-1' });
    expect(isResourceOwner({ user, resource: { type: 'report' } })).toBe(false);
  });

  test('returns false when no resource', () => {
    const user = makeUser({ id: 'user-1' });
    expect(isResourceOwner({ user })).toBe(false);
  });
});

describe('canAccessResource', () => {
  test('returns true when user has all required permissions', () => {
    const user = makeUser({ roles: [CHURCH_ROLES.ADMINISTRATOR] });
    expect(canAccessResource({ user }, [PERMISSIONS.CHURCH_MEMBERS_VIEW])).toBe(true);
  });

  test('returns true when user owns resource and ownership allowed', () => {
    const user = makeUser({ id: 'user-1', roles: [CHURCH_ROLES.MEMBER] });
    const context = { user, resource: { type: 'report', ownerId: 'user-1' } };
    expect(canAccessResource(context, [PERMISSIONS.CHURCH_MEMBERS_CREATE], true)).toBe(true);
  });

  test('returns false when user lacks permissions and does not own resource', () => {
    const user = makeUser({ id: 'user-1', roles: [CHURCH_ROLES.MEMBER] });
    expect(canAccessResource({ user }, [PERMISSIONS.USER_CREATE])).toBe(false);
  });
});

describe('getUserRoleLevel', () => {
  test('returns 100 for Administrator', () => {
    expect(getUserRoleLevel(adminUser)).toBe(100);
  });

  test('returns 80 for Trustee', () => {
    expect(getUserRoleLevel(trusteeUser)).toBe(80);
  });

  test('returns 60 for Officer', () => {
    expect(getUserRoleLevel(officerUser)).toBe(60);
  });

  test('returns 20 for Member', () => {
    expect(getUserRoleLevel(memberUser)).toBe(20);
  });

  test('returns 10 for Guest', () => {
    expect(getUserRoleLevel(guestUser)).toBe(10);
  });

  test('returns 0 for null user', () => {
    expect(getUserRoleLevel(null)).toBe(0);
  });

  test('returns highest level when user has multiple roles', () => {
    const multiRole = makeUser({ roles: [CHURCH_ROLES.MEMBER, CHURCH_ROLES.TRUSTEE] });
    expect(getUserRoleLevel(multiRole)).toBe(80);
  });
});

describe('hasHigherRoleLevel', () => {
  test('returns true when user1 has higher level than user2', () => {
    expect(hasHigherRoleLevel(adminUser, memberUser)).toBe(true);
  });

  test('returns false when user1 has lower level than user2', () => {
    expect(hasHigherRoleLevel(memberUser, adminUser)).toBe(false);
  });

  test('returns false when users have same role level', () => {
    const member2 = makeUser({ id: 'member-2', roles: [CHURCH_ROLES.MEMBER] });
    expect(hasHigherRoleLevel(memberUser, member2)).toBe(false);
  });

  test('returns false when user1 is null', () => {
    expect(hasHigherRoleLevel(null, memberUser)).toBe(false);
  });

  test('returns true when user2 is null and user1 has roles', () => {
    // null user gets role level 0; admin has level > 0
    expect(hasHigherRoleLevel(adminUser, null)).toBe(true);
  });
});

describe('canActOnBehalfOf', () => {
  test('returns false when actor is null', () => {
    expect(canActOnBehalfOf(null, memberUser)).toBe(false);
  });

  test('returns false when target is null', () => {
    expect(canActOnBehalfOf(adminUser, null)).toBe(false);
  });

  test('administrator can act on behalf of anyone', () => {
    expect(canActOnBehalfOf(adminUser, memberUser)).toBe(true);
    expect(canActOnBehalfOf(adminUser, trusteeUser)).toBe(true);
  });

  test('trustee can act on behalf of lower-level users', () => {
    expect(canActOnBehalfOf(trusteeUser, memberUser)).toBe(true);
    expect(canActOnBehalfOf(trusteeUser, officerUser)).toBe(true);
  });

  test('trustee cannot act on behalf of same-level user', () => {
    const trustee2 = makeUser({ id: 'trustee-2', roles: [CHURCH_ROLES.TRUSTEE] });
    expect(canActOnBehalfOf(trusteeUser, trustee2)).toBe(false);
  });

  test('member can only act on behalf of themselves', () => {
    const sameMember = makeUser({ id: 'member-1', roles: [CHURCH_ROLES.MEMBER] });
    expect(canActOnBehalfOf(memberUser, sameMember)).toBe(true);
  });

  test('member cannot act on behalf of other member', () => {
    const otherMember = makeUser({ id: 'other-member', roles: [CHURCH_ROLES.MEMBER] });
    expect(canActOnBehalfOf(memberUser, otherMember)).toBe(false);
  });
});

describe('getAllowedActions', () => {
  test('returns all user permissions when no resource specified', () => {
    const user = makeUser({ roles: [CHURCH_ROLES.MEMBER] });
    const actions = getAllowedActions({ user });
    expect(actions).toContain(PERMISSIONS.PROFILE_VIEW_OWN);
  });

  test('filters permissions by resource type prefix', () => {
    const user = makeUser({ roles: [CHURCH_ROLES.ADMINISTRATOR] });
    const actions = getAllowedActions({ user, resource: { type: 'user' } });
    expect(actions).toContain(`${PERMISSIONS.USER_VIEW}`);
  });

  test('adds ownership-based actions when user owns resource', () => {
    const user = makeUser({ id: 'user-1', roles: [CHURCH_ROLES.MEMBER] });
    const actions = getAllowedActions({
      user,
      resource: { type: 'report', ownerId: 'user-1' },
    });
    expect(actions).toContain('report.view');
    expect(actions).toContain('report.edit');
  });
});

describe('validateAccess', () => {
  test('returns unauthorized when user is inactive', () => {
    const inactiveUser = makeUser({ isActive: false });
    const result = validateAccess({ user: inactiveUser });
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('inactive');
  });

  test('returns authorized when no role/permission requirements', () => {
    const result = validateAccess({ user: memberUser });
    expect(result.authorized).toBe(true);
  });

  test('returns unauthorized when user lacks required roles', () => {
    const result = validateAccess({ user: memberUser }, [CHURCH_ROLES.ADMINISTRATOR]);
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('Missing required roles');
  });

  test('returns authorized when user has required role', () => {
    const result = validateAccess({ user: adminUser }, [CHURCH_ROLES.ADMINISTRATOR]);
    expect(result.authorized).toBe(true);
  });

  test('returns unauthorized when user lacks required permissions', () => {
    const result = validateAccess({ user: memberUser }, undefined, [PERMISSIONS.USER_CREATE]);
    expect(result.authorized).toBe(false);
    expect(result.reason).toContain('Missing required permissions');
  });

  test('returns authorized when user has required permissions', () => {
    const result = validateAccess({ user: adminUser }, undefined, [PERMISSIONS.USER_CREATE]);
    expect(result.authorized).toBe(true);
  });

  test('authorizes resource owner when allowOwnership is true', () => {
    const user = makeUser({ id: 'user-1', roles: [CHURCH_ROLES.MEMBER] });
    const context = { user, resource: { type: 'report', ownerId: 'user-1' } };
    const result = validateAccess(context, undefined, [PERMISSIONS.USER_CREATE], true);
    expect(result.authorized).toBe(true);
  });

  test('denies resource owner when allowOwnership is false', () => {
    const user = makeUser({ id: 'user-1', roles: [CHURCH_ROLES.MEMBER] });
    const context = { user, resource: { type: 'report', ownerId: 'user-1' } };
    const result = validateAccess(context, undefined, [PERMISSIONS.USER_CREATE], false);
    expect(result.authorized).toBe(false);
  });
});

describe('hasRole', () => {
  test('returns true when user has the role', () => {
    expect(hasRole(adminUser, CHURCH_ROLES.ADMINISTRATOR)).toBe(true);
  });

  test('returns false when user does not have the role', () => {
    expect(hasRole(memberUser, CHURCH_ROLES.ADMINISTRATOR)).toBe(false);
  });

  test('is case-insensitive', () => {
    expect(hasRole(adminUser, 'administrator')).toBe(true);
  });

  test('returns false for null user', () => {
    expect(hasRole(null, CHURCH_ROLES.MEMBER)).toBe(false);
  });
});

describe('getUserPermissions', () => {
  test('returns permissions for member role', () => {
    const perms = getUserPermissions(memberUser);
    expect(perms).toContain(PERMISSIONS.PROFILE_VIEW_OWN);
    expect(perms).toContain(PERMISSIONS.PROFILE_EDIT_OWN);
  });

  test('returns empty array for null user', () => {
    expect(getUserPermissions(null)).toEqual([]);
  });

  test('includes explicit user permissions', () => {
    const user = makeUser({ roles: [CHURCH_ROLES.MEMBER], permissions: ['custom.permission'] });
    const perms = getUserPermissions(user);
    expect(perms).toContain('custom.permission');
  });

  test('deduplicates permissions', () => {
    const user = makeUser({
      roles: [CHURCH_ROLES.MEMBER],
      permissions: [PERMISSIONS.PROFILE_VIEW_OWN], // already in MEMBER role
    });
    const perms = getUserPermissions(user);
    const count = perms.filter(p => p === PERMISSIONS.PROFILE_VIEW_OWN).length;
    expect(count).toBe(1);
  });
});

describe('hasAnyRole', () => {
  test('returns true when user has any of the roles', () => {
    expect(hasAnyRole(adminUser, [CHURCH_ROLES.TRUSTEE, CHURCH_ROLES.ADMINISTRATOR])).toBe(true);
  });

  test('returns false when user has none of the roles', () => {
    expect(hasAnyRole(memberUser, [CHURCH_ROLES.TRUSTEE, CHURCH_ROLES.OFFICER])).toBe(false);
  });

  test('returns false for empty roles array', () => {
    expect(hasAnyRole(adminUser, [])).toBe(false);
  });
});

describe('hasAllRoles', () => {
  test('returns true when user has all required roles', () => {
    const multiRole = makeUser({ roles: [CHURCH_ROLES.ADMINISTRATOR, CHURCH_ROLES.TRUSTEE] });
    expect(hasAllRoles(multiRole, [CHURCH_ROLES.ADMINISTRATOR, CHURCH_ROLES.TRUSTEE])).toBe(true);
  });

  test('returns false when user is missing one role', () => {
    expect(hasAllRoles(adminUser, [CHURCH_ROLES.ADMINISTRATOR, CHURCH_ROLES.TRUSTEE])).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  test('returns true when user has any permission', () => {
    expect(hasAnyPermission(adminUser, [PERMISSIONS.USER_DELETE, PERMISSIONS.SYSTEM_BACKUP])).toBe(true);
  });

  test('returns true for empty permissions array', () => {
    expect(hasAnyPermission(memberUser, [])).toBe(true);
  });
});

describe('hasAllPermissions', () => {
  test('returns true when user has all permissions', () => {
    expect(hasAllPermissions(adminUser, [PERMISSIONS.USER_CREATE, PERMISSIONS.USER_DELETE])).toBe(true);
  });

  test('returns false when user is missing a permission', () => {
    expect(hasAllPermissions(memberUser, [PERMISSIONS.USER_CREATE])).toBe(false);
  });

  test('returns true for empty permissions array', () => {
    expect(hasAllPermissions(memberUser, [])).toBe(true);
  });
});
